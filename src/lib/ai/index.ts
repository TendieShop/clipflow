// AI Module - Minimal, OpenAI-compatible abstraction layer
// Supports OpenAI, Groq, Together AI, OpenRouter, lm-studio, and Claude (via adapter)

// Config
export {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  isAIConfigured,
  validateConfig,
} from './config';

// OpenAI-compatible client
export type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from './openai-client';

export {
  completion,
  listModels,
  healthCheck,
  streamWithResult,
} from './openai-client';

// Claude adapter (optional)
export type {
  ClaudeMessage,
  ClaudeOptions,
  ClaudeResult,
} from '../providers/claude';

export {
  claudeCompletion,
  claudeHealthCheck,
  CLAUDE_MODELS,
} from '../providers/claude';

// Main useAI hook
export { useAI, useAICompletion } from './useAI';
