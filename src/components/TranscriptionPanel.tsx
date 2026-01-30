// Transcription Panel - Simple Whisper transcription
import { useState, useCallback } from 'react';
import { transcribeAudio, formatTime } from '../lib/video';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface TranscriptionPanelProps {
  videoPath: string | null;
  onTranscriptionComplete: (result: { text: string; segments: { start: number; end: number; text: string }[] }) => void;
}

const WHISPER_MODELS: { value: string; label: string; description: string }[] = [
  { value: 'tiny', label: 'Tiny', description: '39MB - Fastest' },
  { value: 'base', label: 'Base', description: '74MB - Recommended' },
  { value: 'small', label: 'Small', description: '244MB' },
  { value: 'medium', label: 'Medium', description: '769MB' },
  { value: 'large', label: 'Large', description: '1550MB - Most accurate' },
];

export function TranscriptionPanel({
  videoPath,
  onTranscriptionComplete,
}: TranscriptionPanelProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('base');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [segments, setSegments] = useState<{ start: number; end: number; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const handleTranscribe = useCallback(async () => {
    if (!videoPath) return;

    setIsTranscribing(true);
    setError(null);
    setProgress('Extracting audio...');

    try {
      setProgress('Running Whisper...');
      const result = await transcribeAudio(videoPath, selectedModel);
      
      setTranscription(result.text);
      setSegments(result.segments);
      
      onTranscriptionComplete({
        text: result.text,
        segments: result.segments,
      });
      
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setProgress(null);
    } finally {
      setIsTranscribing(false);
    }
  }, [videoPath, selectedModel, onTranscriptionComplete]);

  return (
    <div className="transcription-panel">
      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>
            Generate a transcript using local Whisper AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Model selection */}
          <div className="model-select">
            <label htmlFor="model">Whisper Model</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isTranscribing}
            >
              {WHISPER_MODELS.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Transcribe button */}
          <Button
            onClick={handleTranscribe}
            disabled={!videoPath || isTranscribing}
            className="transcribe-btn"
          >
            {isTranscribing ? 'Transcribing...' : 'Generate Transcript'}
          </Button>

          {/* Progress */}
          {progress && (
            <div className="progress">{progress}</div>
          )}

          {/* Error */}
          {error && (
            <div className="error">{error}</div>
          )}

          {/* Result */}
          {transcription && (
            <div className="result">
              <div className="segments">
                {segments.map((segment, i) => (
                  <div key={i} className="segment">
                    <span className="timestamp">
                      {formatTime(segment.start)}
                    </span>
                    <span className="text">{segment.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>{`
            .model-select {
              margin-bottom: 1rem;
            }
            
            .model-select label {
              display: block;
              font-size: 0.875rem;
              font-weight: 500;
              margin-bottom: 0.5rem;
            }
            
            .model-select select {
              width: 100%;
              padding: 0.625rem 0.75rem;
              border: 1px solid var(--border);
              border-radius: 6px;
              background: var(--bg-primary);
              color: var(--text-primary);
              font-size: 0.875rem;
            }
            
            .transcribe-btn {
              width: 100%;
              margin-bottom: 1rem;
            }
            
            .progress {
              padding: 0.75rem;
              background: rgba(59, 130, 246, 0.1);
              color: var(--accent);
              border-radius: 6px;
              font-size: 0.875rem;
              margin-bottom: 1rem;
            }
            
            .error {
              padding: 0.75rem;
              background: rgba(239, 68, 68, 0.1);
              color: #ef4444;
              border-radius: 6px;
              font-size: 0.875rem;
              margin-bottom: 1rem;
            }
            
            .result {
              border-top: 1px solid var(--border);
              padding-top: 1rem;
            }
            
            .segments {
              max-height: 300px;
              overflow-y: auto;
            }
            
            .segment {
              display: flex;
              gap: 0.75rem;
              padding: 0.5rem 0;
              border-bottom: 1px solid var(--border);
            }
            
            .segment:last-child {
              border-bottom: none;
            }
            
            .timestamp {
              font-size: 0.75rem;
              font-family: monospace;
              color: var(--text-secondary);
              white-space: nowrap;
            }
            
            .text {
              font-size: 0.875rem;
              line-height: 1.5;
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  );
}
