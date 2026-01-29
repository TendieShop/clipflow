import { getAIConfig } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
}

export interface CompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

/**
 * Send a chat completion request to any OpenAI-compatible API
 */
export async function completion(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<CompletionResult> {
  const config = await getAIConfig();
  const model = options?.model || config.model;
  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens || config.maxTokens;
  
  const startTime = Date.now();
  
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  const latencyMs = Date.now() - startTime;
  
  const content = data.choices?.[0]?.message?.content || '';
  
  return {
    content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    latencyMs,
  };
}

/**
 * Stream a chat completion (for real-time feedback)
 * Returns an async generator that yields tokens
 */
export async function* streamCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): AsyncGenerator<string> {
  const config = await getAIConfig();
  const model = options?.model || config.model;
  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens || config.maxTokens;
  
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let completionTokens = 0;
  
  if (!reader) {
    throw new Error('Failed to read stream');
  }
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            completionTokens++;
            if (options?.onToken) {
              options.onToken(token);
            }
            yield token;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Stream and get final result
 */
export async function streamWithResult(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<CompletionResult> {
  const config = await getAIConfig();
  const model = options?.model || config.model;
  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens || config.maxTokens;
  
  const startTime = Date.now();
  
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let promptTokens = 0;
  let completionTokens = 0;
  
  if (!reader) {
    throw new Error('Failed to read stream');
  }
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          break;
        }
        
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            content += token;
            completionTokens++;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
  
  const latencyMs = Date.now() - startTime;
  
  return {
    content,
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    latencyMs,
  };
}

/**
 * List available models from the API
 */
export async function listModels(): Promise<string[]> {
  const config = await getAIConfig();
  
  // Try /models endpoint first
  try {
    const response = await fetch(`${config.endpoint}/models`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.map((m: { id: string }) => m.id) || [];
    }
  } catch {
    // Fall through to default models
  }
  
  // Return common models as fallback
  return [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];
}

/**
 * Quick health check for the AI endpoint
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const config = await getAIConfig();
    if (!config.endpoint || !config.apiKey) {
      return false;
    }
    
    const response = await fetch(`${config.endpoint}/models`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
