// Simple localStorage-based config for AI settings
// No Tauri/Rust changes required

interface AIConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const CONFIG_KEY = 'clipflow-ai-config';

const DEFAULTS: AIConfig = {
  endpoint: '',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
};

export async function getAIConfig(): Promise<AIConfig> {
  if (typeof window === 'undefined') {
    return DEFAULTS;
  }
  
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULTS, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error('Failed to load AI config:', err);
  }
  return DEFAULTS;
}

export async function saveAIConfig(config: Partial<AIConfig>): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  
  const current = await getAIConfig();
  const merged = { ...current, ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
}

export async function clearAIConfig(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(CONFIG_KEY);
}

export async function isAIConfigured(): Promise<boolean> {
  const config = await getAIConfig();
  return Boolean(config.endpoint && config.apiKey);
}

export function validateConfig(config: AIConfig): string[] {
  const errors: string[] = [];
  
  if (!config.endpoint) {
    errors.push('Endpoint is required');
  }
  
  if (!config.apiKey) {
    errors.push('API key is required');
  }
  
  if (!config.model) {
    errors.push('Model is required');
  }
  
  // Basic URL validation
  if (config.endpoint) {
    try {
      new URL(config.endpoint);
    } catch {
      errors.push('Endpoint must be a valid URL');
    }
  }
  
  return errors;
}
