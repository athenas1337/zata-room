import { LLMRequestOptions, LLMResponse, ProviderAdapter } from './adapter';

export class GeminiAdapter implements ProviderAdapter {
  private defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    const rawModel = options.modelName || 'gemini-2.5-flash';
    const model = rawModel.replace(/^models\//, '');
    const baseUrl = (options.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
    const url = `${baseUrl}/models/${model}:generateContent?key=${options.apiKey}`;

    let systemInstruction = '';
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const m of options.messages) {
      if (m.role === 'system') {
        systemInstruction += (systemInstruction ? '\n\n' : '') + m.content;
      } else {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Begin task' }] });
    }

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1500,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = [
        {
          functionDeclarations: options.tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown Gemini error');
      throw new Error(`Google Gemini error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let content = '';
    const toolCalls: any[] = [];

    for (const p of parts) {
      if (p.text) {
        content += p.text;
      } else if (p.functionCall) {
        toolCalls.push({
          id: `gemini-call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: p.functionCall.name,
          args: p.functionCall.args || {},
        });
      }
    }

    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      modelUsed: model,
    };
  }

  async validateKey(apiKey: string, baseUrl?: string | null, modelName?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const model = (modelName || 'gemini-2.5-flash').replace(/^models\//, '');
      const baseUrlClean = (baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
      const url = `${baseUrlClean}/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return { valid: false, error: `Gemini validation failed (${res.status}): ${errText}` };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to Google Gemini' };
    }
  }
}
