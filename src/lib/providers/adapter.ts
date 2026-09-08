import { ProviderType } from '@/types';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCallResult {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LLMRequestOptions {
  provider: ProviderType;
  modelName: string;
  apiKey: string;
  baseUrl?: string | null;
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LLMResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCalls?: ToolCallResult[];
  modelUsed: string;
}

export interface ProviderAdapter {
  complete(options: LLMRequestOptions): Promise<LLMResponse>;
  validateKey(apiKey: string, baseUrl?: string | null, modelName?: string): Promise<{ valid: boolean; error?: string }>;
}
