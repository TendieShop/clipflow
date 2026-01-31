import { useState, useCallback } from 'react';
import { VideoFile } from '../services/video-types';
import { Button } from './Button';
import { X } from 'lucide-react';

interface SilenceDetectionPanelProps {
  video: VideoFile;
  onClose: () => void;
}

export function SilenceDetectionPanel({ video, onClose }: SilenceDetectionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threshold, setThreshold] = useState(-50);
  const [segments, setSegments] = useState<{ start: number; end: number; duration: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate analysis - in real app, this would use electronAPI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock silence segments
      const mockSegments = [
        { start: 5.2, end: 8.7, duration: 3.5 },
        { start: 45.3, end: 52.1, duration: 6.8 },
      ];
      setSegments(mockSegments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze silence');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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
              className="w-full mt-1"
            />
          </div>

          <Button
            variant="default"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Detect Silence'}
          </Button>

          {error && (
            <div className="p-2 bg-[#ef4444]/10 border border-[#ef4444] rounded text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          {segments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">
                Silence Segments ({segments.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-[#262626] rounded"
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
