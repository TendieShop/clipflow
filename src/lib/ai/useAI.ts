import { useState, useCallback } from 'react';
import {
  completion,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  listModels,
  healthCheck,
  streamWithResult,
} from './openai-client';
import { isAIConfigured } from './config';

interface UseAIOptions {
  onSuccess?: (result: CompletionResult) => void;
  onError?: (error: Error) => void;
}

interface UseAIState {
  loading: boolean;
  streaming: boolean;
  result: CompletionResult | null;
  error: Error | null;
}

export function useAI(options?: UseAIOptions) {
  const [state, setState] = useState<UseAIState>({
    loading: false,
    streaming: false,
    result: null,
    error: null,
  });

  const [streamingContent, setStreamingContent] = useState('');

  const runCompletion = useCallback(
    async (messages: ChatMessage[], opts?: CompletionOptions): Promise<CompletionResult | null> => {
      const configured = await isAIConfigured();
      if (!configured) {
        const error = new Error('AI not configured. Please set up your API endpoint and key.');
        setState((s) => ({ ...s, error }));
        options?.onError?.(error);
        return null;
      }

      setState((s) => ({ ...s, loading: true, error: null, result: null }));

      try {
        const result = await completion(messages, opts);
        setState((s) => ({ ...s, loading: false, result }));
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((s) => ({ ...s, loading: false, error }));
        options?.onError?.(error);
        return null;
      }
    },
    [options]
  );

  const runStream = useCallback(
    async (messages: ChatMessage[], opts?: CompletionOptions): Promise<string> => {
      const configured = await isAIConfigured();
      if (!configured) {
        const error = new Error('AI not configured. Please set up your API endpoint and key.');
        setState((s) => ({ ...s, error }));
        options?.onError?.(error);
        return '';
      }

      setState((s) => ({ ...s, streaming: true, error: null, result: null }));
      setStreamingContent('');

      try {
        // Use streaming API for real-time feedback
        const result = await streamWithResult(messages, opts);
        
        // The result contains the full content
        setStreamingContent(result.content);
        setState((s) => ({ ...s, streaming: false, result }));
        options?.onSuccess?.(result);
        return result.content;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((s) => ({ ...s, streaming: false, error }));
        options?.onError?.(error);
        return streamingContent;
      }
    },
    [options, streamingContent]
  );

  const testConnection = useCallback(async (): Promise<boolean> => {
    return healthCheck();
  }, []);

  const getModels = useCallback(async (): Promise<string[]> => {
    return listModels();
  }, []);

  const clearState = useCallback(() => {
    setState({ loading: false, streaming: false, result: null, error: null });
    setStreamingContent('');
  }, []);

  return {
    ...state,
    streamingContent,
    runCompletion,
    runStream,
    testConnection,
    getModels,
    clearState,
  };
}

// Convenience hook for simple AI tasks
export function useAICompletion(defaultSystemPrompt?: string) {
  const { runCompletion, loading, error, result } = useAI();

  const complete = useCallback(
    async (userMessage: string, systemPrompt?: string): Promise<CompletionResult | null> => {
      const messages: ChatMessage[] = [];
      const system = systemPrompt || defaultSystemPrompt || '';
      
      if (system) {
        messages.push({ role: 'system', content: system });
      }
      messages.push({ role: 'user', content: userMessage });
      
      return runCompletion(messages);
    },
    [runCompletion, defaultSystemPrompt]
  );

  return { complete, loading, error, result };
}
