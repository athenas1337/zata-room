import { LLMRequestOptions, LLMResponse, ProviderAdapter } from './adapter';

export class AnthropicAdapter implements ProviderAdapter {
  private defaultBaseUrl = 'https://api.anthropic.com/v1';

  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    const baseUrl = (options.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
    const url = `${baseUrl}/messages`;

    // Separate system message from conversation messages
    let systemPrompt = '';
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const m of options.messages) {
      if (m.role === 'system') {
        systemPrompt += (systemPrompt ? '\n\n' : '') + m.content;
      } else {
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        });
      }
    }

    // Ensure at least one user message
    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Begin task' });
    }

    const requestBody: Record<string, unknown> = {
      model: options.modelName || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens ?? 1500,
      temperature: options.temperature ?? 0.7,
      system: systemPrompt || undefined,
      messages,
    };

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': options.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown Anthropic error');
      throw new Error(`Anthropic error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let content = '';
    const toolCalls: any[] = [];

    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            args: block.input || {},
          });
        }
      }
    }

    const promptTokens = data.usage?.input_tokens || 0;
    const completionTokens = data.usage?.output_tokens || 0;

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      modelUsed: data.model || options.modelName,
    };
  }

  async validateKey(apiKey: string, baseUrl?: string | null, modelName?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const urlBase = (baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
      const testModel = modelName || 'claude-3-5-haiku-20241022';

      const res = await fetch(`${urlBase}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: testModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return { valid: false, error: `Anthropic validation failed (${res.status}): ${errText}` };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to Anthropic' };
    }
  }
}
