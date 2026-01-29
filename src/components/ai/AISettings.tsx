import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  validateConfig,
  isAIConfigured,
} from '../../lib/ai/config';
import { healthCheck, listModels } from '../../lib/ai/openai-client';
import { claudeHealthCheck, CLAUDE_MODELS } from '../../lib/providers/claude';

type ProviderType = 'openai' | 'claude' | 'custom';

interface AISettingsProps {
  onSave?: () => void;
}

export function AISettings({ onSave }: AISettingsProps) {
  const [provider, setProvider] = useState<ProviderType>('openai');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load saved config
  useEffect(() => {
    getAIConfig().then((config) => {
      setEndpoint(config.endpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
      setTemperature(config.temperature);
      setMaxTokens(config.maxTokens);

      // Detect provider type
      if (config.endpoint.includes('anthropic')) {
        setProvider('claude');
        setModel('claude-sonnet-4-20250514');
      } else if (config.endpoint && !config.endpoint.includes('openai')) {
        setProvider('custom');
      } else {
        setProvider('openai');
      }
    });
  }, []);

  // Load models when endpoint changes
  useEffect(() => {
    if (endpoint && apiKey) {
      loadModels();
    }
  }, [endpoint, apiKey]);

  const loadModels = useCallback(async () => {
    const models = await listModels();
    setAvailableModels(models);
  }, [endpoint, apiKey]);

  const handleTest = async () => {
    setStatus('testing');
    setStatusMessage('Testing connection...');

    const configured = await isAIConfigured();
    if (!configured) {
      setStatus('error');
      setStatusMessage('Please enter endpoint and API key');
      return;
    }

    let success = false;
    let message = '';

    if (provider === 'claude') {
      success = await claudeHealthCheck();
      message = success ? 'Claude API connected' : 'Claude API connection failed';
    } else {
      success = await healthCheck();
      message = success ? 'API connected' : 'Connection failed';
    }

    setStatus(success ? 'success' : 'error');
    setStatusMessage(message);
  };

  const handleSave = async () => {
    const config = {
      endpoint,
      apiKey,
      model,
      temperature,
      maxTokens,
    };

    const errors = validateConfig(config);
    if (errors.length > 0) {
      setStatus('error');
      setStatusMessage(errors.join(', '));
      return;
    }

    await saveAIConfig(config);
    setStatus('success');
    setStatusMessage('Settings saved');
    onSave?.();
  };

  const handleClear = async () => {
    await clearAIConfig();
    setEndpoint('');
    setApiKey('');
    setModel('');
    setStatus('idle');
    setStatusMessage('');
  };

  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider);
    
    if (newProvider === 'openai') {
      setEndpoint('https://api.openai.com/v1');
      setModel('gpt-4o');
    } else if (newProvider === 'claude') {
      setEndpoint('https://api.anthropic.com');
      setModel('claude-sonnet-4-20250514');
    } else {
      setEndpoint('');
      setModel('');
    }
  };

  const getModelsForProvider = () => {
    if (provider === 'claude') {
      return CLAUDE_MODELS.map((m) => m.id);
    }
    return availableModels.length > 0 ? availableModels : ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  };

  return (
    <Card className="ai-settings">
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>
          Connect to any OpenAI-compatible API or Anthropic Claude
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="settings-form">
          {/* Provider Selection */}
          <div className="form-section">
            <label>AI Provider</label>
            <div className="provider-buttons">
              <button
                type="button"
                className={`provider-btn ${provider === 'openai' ? 'active' : ''}`}
                onClick={() => handleProviderChange('openai')}
              >
                <span className="provider-icon">◉</span>
                OpenAI
              </button>
              <button
                type="button"
                className={`provider-btn ${provider === 'claude' ? 'active' : ''}`}
                onClick={() => handleProviderChange('claude')}
              >
                <span className="provider-icon">A</span>
                Claude
              </button>
              <button
                type="button"
                className={`provider-btn ${provider === 'custom' ? 'active' : ''}`}
                onClick={() => handleProviderChange('custom')}
              >
                <span className="provider-icon">◎</span>
                Custom
              </button>
            </div>
          </div>

          {/* Endpoint */}
          <div className="form-section">
            <label htmlFor="endpoint">API Endpoint</label>
            <input
              id="endpoint"
              type="url"
              placeholder={
                provider === 'openai'
                  ? 'https://api.openai.com/v1'
                  : provider === 'claude'
                  ? 'https://api.anthropic.com'
                  : 'https://your-api.com/v1'
              }
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="form-input"
            />
            <small>
              {provider === 'openai'
                ? 'OpenAI, Groq, Together AI, OpenRouter, lm-studio'
                : provider === 'claude'
                ? 'Anthropic Claude API'
                : 'Any OpenAI-compatible API endpoint'}
            </small>
          </div>

          {/* API Key */}
          <div className="form-section">
            <label htmlFor="apiKey">API Key</label>
            <div className="api-key-input">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="form-section">
            <label htmlFor="model">Model</label>
            <input
              id="model"
              type="text"
              placeholder="gpt-4o"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="form-input"
              list="models-list"
            />
            <datalist id="models-list">
              {getModelsForProvider().map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* Advanced Settings */}
          <details className="advanced-settings">
            <summary>Advanced Settings</summary>
            <div className="advanced-content">
              <div className="form-row">
                <div className="form-section half">
                  <label htmlFor="temperature">Temperature: {temperature}</label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-section half">
                  <label htmlFor="maxTokens">Max Tokens: {maxTokens}</label>
                  <input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="128000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Status */}
          {statusMessage && (
            <div className={`status-message ${status}`}>
              {status === 'testing' && '⏳ Testing connection...'}
              {status === 'success' && '✅ ' + statusMessage}
              {status === 'error' && '❌ ' + statusMessage}
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <Button variant="outline" onClick={handleTest}>
              Test Connection
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </CardContent>

      <style>{`
        .ai-settings {
          max-width: 600px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-section label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-section small {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .form-input {
          padding: 0.625rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .provider-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .provider-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .provider-btn:hover {
          border-color: var(--accent);
        }

        .provider-btn.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--accent);
        }

        .provider-icon {
          font-size: 1rem;
        }

        .api-key-input {
          display: flex;
          gap: 0.5rem;
        }

        .api-key-input .form-input {
          flex: 1;
        }

        .toggle-visibility {
          padding: 0 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          cursor: pointer;
          font-size: 0.75rem;
        }

        .advanced-settings {
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .advanced-settings summary {
          padding: 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
          background: var(--bg-secondary);
        }

        .advanced-content {
          padding: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-section.half {
          flex: 1;
        }

        .status-message {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .status-message.testing {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .status-message.success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </Card>
  );
}
