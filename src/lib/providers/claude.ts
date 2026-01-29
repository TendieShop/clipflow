import { getAIConfig } from '../ai/config';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
}

export interface ClaudeResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
}

// Claude API versions
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Send a completion request to Anthropic Claude
 * Note: Claude uses a different API format than OpenAI
 */
export async function claudeCompletion(
  messages: { role: string; content: string }[],
  options?: ClaudeOptions
): Promise<ClaudeResult> {
  const config = await getAIConfig();
  const model = options?.model || 'claude-sonnet-4-20250514';
  const maxTokens = options?.maxTokens || 4096;
  
  const startTime = Date.now();
  
  // Convert messages format for Claude
  // Claude expects: { role: 'user' | 'assistant', content: '...' }
  // System messages are handled separately
  let systemMessage = '';
  const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [];
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemMessage = msg.content;
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      claudeMessages.push({ role: msg.role, content: msg.content });
    }
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      messages: claudeMessages,
      system: systemMessage,
      max_tokens: maxTokens,
      stream: false,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  const latencyMs = Date.now() - startTime;
  
  const content = data.content?.[0]?.text || '';
  
  return {
    content,
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    },
    latencyMs,
  };
}

/**
 * Claude health check
 */
export async function claudeHealthCheck(): Promise<boolean> {
  try {
    const config = await getAIConfig();
    if (!config.apiKey) {
      return false;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    
    return response.ok || response.status === 400; // 400 means API key valid but bad request
  } catch {
    return false;
  }
}

/**
 * Available Claude models
 */
export const CLAUDE_MODELS = [
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-haiku-3-20250514', name: 'Claude Haiku 3' },
  { id: 'claude-opus-3-20250529', name: 'Claude Opus 3' },
  { id: 'claude-sonnet-3-20250520', name: 'Claude Sonnet 3' },
];
