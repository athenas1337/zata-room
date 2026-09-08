import { LLMRequestOptions, LLMResponse, ProviderAdapter } from './adapter';

export class OpenAIAdapter implements ProviderAdapter {
  private defaultBaseUrl: string;

  constructor(defaultBaseUrl = 'https://api.openai.com/v1') {
    this.defaultBaseUrl = defaultBaseUrl;
  }

  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    const baseUrl = (options.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    const requestBody: Record<string, unknown> = {
      model: options.modelName || 'gpt-4o',
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1500,
    };

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    };

    // OpenRouter requires HTTP-Referer and X-Title headers
    if (baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://zata-agentic-room.vercel.app';
      headers['X-Title'] = 'ZATA Agentic Room';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown upstream error');
      throw new Error(`OpenAI/Gateway error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    let content = message?.content || '';
    const toolCalls = message?.tool_calls?.map((tc: any) => {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || '{}');
      } catch {
        parsedArgs = { raw: tc.function.arguments };
      }
      return {
        id: tc.id,
        name: tc.function.name,
        args: parsedArgs,
      };
    });

    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      toolCalls,
      modelUsed: data.model || options.modelName,
    };
  }

  async validateKey(apiKey: string, baseUrl?: string | null, modelName?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const urlBase = (baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
      const testModel = modelName || (urlBase.includes('openrouter') ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

      const res = await fetch(`${urlBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return { valid: false, error: `Validation failed (${res.status}): ${errText}` };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to API gateway' };
    }
  }
}
