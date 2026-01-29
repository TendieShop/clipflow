import { useState, useCallback } from 'react';
import { analyzeSilence, type SilenceSegment } from '../lib/video';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SilenceDetectionPanelProps {
  videoPath: string | null;
  onSilenceDetected: (segments: SilenceSegment[]) => void;
}

export function SilenceDetectionPanel({ videoPath, onSilenceDetected }: SilenceDetectionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threshold, setThreshold] = useState(-50);
  const [segments, setSegments] = useState<SilenceSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!videoPath) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const detectedSegments = await analyzeSilence(videoPath, threshold);
      setSegments(detectedSegments);
      onSilenceDetected(detectedSegments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze silence');
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoPath, threshold, onSilenceDetected]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const totalSilenceDuration = segments.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="silence-detection-panel">
      <Card>
        <CardHeader>
          <CardTitle>Silence Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="controls">
            <div className="threshold-control">
              <label htmlFor="threshold">Threshold (dB): {threshold}</label>
              <input
                id="threshold"
                type="range"
                min="-80"
                max="0"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                disabled={isAnalyzing || !videoPath}
              />
              <span className="threshold-hint">Lower = more sensitive</span>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !videoPath}
            >
              {isAnalyzing ? 'Analyzing...' : 'Detect Silence'}
            </Button>
          </div>

          {error && <div className="error">{error}</div>}

          {segments.length > 0 && (
            <div className="results">
              <div className="summary">
                <span>{segments.length} silent segments</span>
                <span>Total: {formatTime(totalSilenceDuration)}</span>
              </div>

              <div className="segments-list">
                {segments.map((segment, index) => (
                  <div key={index} className="segment-item">
                    <span className="segment-index">{index + 1}</span>
                    <span className="segment-time">
                      {formatTime(segment.start)} → {formatTime(segment.end)}
                    </span>
                    <span className="segment-duration">
                      {segment.duration.toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {segments.length === 0 && !isAnalyzing && !error && (
            <div className="empty-state">
              Click "Detect Silence" to find silent segments in your video
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .silence-detection-panel {
          width: 100%;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .threshold-control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .threshold-control input[type="range"] {
          width: 100%;
          cursor: pointer;
        }

        .threshold-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .results {
          margin-top: 1rem;
        }

        .summary {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .segments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .segment-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 0.8125rem;
        }

        .segment-index {
          background: var(--accent);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .segment-time {
          flex: 1;
          font-family: monospace;
        }

        .segment-duration {
          color: var(--text-secondary);
        }

        .error {
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
      `}</style>
    </div>
  );
}
