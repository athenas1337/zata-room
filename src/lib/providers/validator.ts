import { ProviderType } from '@/types';
import { ProviderAdapter } from './adapter';
import { OpenAIAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import { GeminiAdapter } from './gemini';
import { SimulatedAdapter } from './simulated';

const openaiAdapter = new OpenAIAdapter();
const anthropicAdapter = new AnthropicAdapter();
const geminiAdapter = new GeminiAdapter();
const simulatedAdapter = new SimulatedAdapter();

export function getProviderAdapter(provider: ProviderType): ProviderAdapter {
  switch (provider) {
    case 'OPENAI':
      return openaiAdapter;
    case 'ANTHROPIC':
      return anthropicAdapter;
    case 'GOOGLE':
      return geminiAdapter;
    case 'CUSTOM_GATEWAY':
      return openaiAdapter;
    case 'SIMULATED':
      return simulatedAdapter;
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
  if (provider === 'SIMULATED' || apiKey?.startsWith('demo-') || apiKey?.startsWith('mock-')) {
    return { valid: true };
  }
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, error: 'API Key is empty' };
  }
  const adapter = getProviderAdapter(provider);
  return adapter.validateKey(apiKey, baseUrl, modelName);
}
