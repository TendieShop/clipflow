import { useState, useCallback } from 'react';
import { VideoFile } from '../services/video-types';
import { ErrorDisplay } from './ErrorBoundary';
import { Button } from './Button';
import { X } from 'lucide-react';

interface SilenceDetectionPanelProps {
  video: VideoFile;
  onClose: () => void;
}

// Check if running in Electron app
function isElectronApp(): boolean {
  return !!(window as any).electronAPI;
}

// Call IPC to analyze silence
async function analyzeSilenceIPC(
  filePath: string,
  thresholdDB: number
): Promise<Array<{ start: number; end: number; duration: number }>> {
  if (!isElectronApp() || !window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  const result = await window.electronAPI.video.analyzeSilence({
    filePath,
    thresholdDB
  });
  
  return result || [];
}

export function SilenceDetectionPanel({ video, onClose }: SilenceDetectionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threshold, setThreshold] = useState(-50);
  const [segments, setSegments] = useState<Array<{ start: number; end: number; duration: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Call IPC to analyze silence
      const results = await analyzeSilenceIPC(video.path, threshold);
      setSegments(results);
      console.log(`[SilenceDetection] Found ${results.length} silence segments`);
    } catch (err) {
      console.error('[SilenceDetection] Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze silence. Make sure FFmpeg is installed.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [video.path, threshold]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Silence Detection</h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#f5f5f5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#f5f5f5]">Video</label>
            <p className="text-sm text-[#a3a3a3]">{video.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#f5f5f5]">
              Silence Threshold: {threshold} dB
            </label>
            <input
              type="range"
              min="-80"
              max="0"
              value={threshold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreshold(Number(e.target.value))}
              className="w-full mt-1 accent-[#22c55e]"
            />
          </div>

          <Button
            variant="default"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Detecting...' : 'Detect Silence'}
          </Button>

          {error && (
            <ErrorDisplay error={error} onRetry={handleAnalyze} onDismiss={() => setError(null)} />
          )}

          {segments.length > 0 && (
            <div className="silence-segments">
              <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">
                Silence Segments ({segments.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className="silence-segment flex items-center justify-between p-2 bg-[#262626] rounded"
                  >
                    <span className="text-sm text-[#a3a3a3]">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </span>
                    <span className="text-xs text-[#737373]">
                      {segment.duration.toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
