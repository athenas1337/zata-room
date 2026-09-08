import { ProviderType } from '@/types';
import { ProviderAdapter } from './adapter';
import { OpenAIAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import { GeminiAdapter } from './gemini';

const openaiAdapter = new OpenAIAdapter();
const anthropicAdapter = new AnthropicAdapter();
const geminiAdapter = new GeminiAdapter();

export function getProviderAdapter(provider: ProviderType): ProviderAdapter {
  switch (provider) {
    case 'OPENAI':
      return openaiAdapter;
    case 'ANTHROPIC':
      return anthropicAdapter;
    case 'GOOGLE':
      return geminiAdapter;
    case 'CUSTOM_GATEWAY':
      return openaiAdapter; // Custom gateway uses OpenAI-compatible format
    default:
      return openaiAdapter;
  }
}

export async function validateApiKey(
  provider: ProviderType,
  apiKey: string,
  baseUrl?: string | null,
  modelName?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, error: 'API Key is empty' };
  }
  const adapter = getProviderAdapter(provider);
  return adapter.validateKey(apiKey, baseUrl, modelName);
}
