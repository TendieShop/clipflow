import { useState, useEffect, useCallback } from 'react';
import {
  transcribeAudio,
  getAvailableWhisperModels,
  type TranscriptionResult,
  type WhisperModel,
  formatTime,
} from '../lib/video';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface TranscriptionPanelProps {
  videoPath: string | null;
  onTranscriptionComplete: (result: TranscriptionResult) => void;
}

export function TranscriptionPanel({
  videoPath,
  onTranscriptionComplete,
}: TranscriptionPanelProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [models, setModels] = useState<WhisperModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('base');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    getAvailableWhisperModels()
      .then(setModels)
      .catch(console.error);
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (!videoPath) return;

    setIsTranscribing(true);
    setError(null);
    setProgress('Extracting audio...');

    try {
      setProgress('Running Whisper transcription...');
      const result = await transcribeAudio(videoPath, selectedModel);
      setTranscription(result);
      onTranscriptionComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
      setProgress(null);
    }
  }, [videoPath, selectedModel, onTranscriptionComplete]);

  const selectedModelInfo = models.find((m) => m.name === selectedModel);

  return (
    <div className="transcription-panel">
      <Card>
        <CardHeader>
          <CardTitle>AI Transcription</CardTitle>
          <CardDescription>
            Local Whisper transcription — no cloud API, privacy-first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="controls">
            <div className="model-selector">
              <label>Whisper Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isTranscribing || !videoPath}
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name.toUpperCase()} ({model.size})
                  </option>
                ))}
              </select>
              {selectedModelInfo && (
                <span className="model-description">{selectedModelInfo.description}</span>
              )}
            </div>

            <Button
              onClick={handleTranscribe}
              disabled={isTranscribing || !videoPath}
            >
              {isTranscribing ? progress || 'Transcribing...' : 'Start Transcription'}
            </Button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {transcription && (
            <div className="transcription-result">
              <div className="transcription-meta">
                <span>Duration: {formatTime(transcription.duration)}</span>
                <span>Language: {transcription.language}</span>
                <span>{transcription.segments.length} segments</span>
              </div>

              <div className="transcription-text">
                {transcription.segments.map((segment) => (
                  <div key={segment.id} className="transcript-segment">
                    <span className="timestamp">[{formatTime(segment.start)}]</span>
                    <span className="text">{segment.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcription === null && !isTranscribing && !error && (
            <div className="empty-state">
              <p>Click &quot;Start Transcription&quot; to generate a local transcript</p>
              <p className="hint">
                Uses OpenAI Whisper ({selectedModel || 'base'} model) — runs entirely offline
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .transcription-panel {
          width: 100%;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .model-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .model-selector label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .model-selector select {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
        }

        .model-description {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .transcription-result {
          margin-top: 1rem;
        }

        .transcription-meta {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .transcription-text {
          max-height: 400px;
          overflow-y: auto;
          padding: 0.5rem;
          background: var(--bg-secondary);
          border-radius: 6px;
        }

        .transcript-segment {
          display: flex;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }

        .transcript-segment:last-child {
          border-bottom: none;
        }

        .timestamp {
          color: var(--accent);
          font-size: 0.75rem;
          font-family: monospace;
          flex-shrink: 0;
        }

        .text {
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-top: 0.75rem;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .empty-state .hint {
          font-size: 0.75rem;
          margin-top: 0.5rem;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
