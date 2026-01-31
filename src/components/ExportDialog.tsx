import { useState } from 'react';
import { VideoFile } from '../services/video-types';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  video: VideoFile;
  onClose: () => void;
  onExport: (outputPath: string, quality: string) => void;
}

type ExportQuality = 'high' | 'medium' | 'low';

export function ExportDialog({ isOpen, video, onClose, onExport }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [quality, setQuality] = useState<ExportQuality>('medium');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Simulate export - in real app, this would use electronAPI
      await new Promise(resolve => setTimeout(resolve, 2000));
      onExport('/output/video.mp4', quality);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Export Video</h2>
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
            <label className="text-sm font-medium text-[#f5f5f5]">Quality</label>
            <div className="flex gap-2 mt-1">
              {(['low', 'medium', 'high'] as ExportQuality[]).map(q => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-3 py-1 rounded text-sm capitalize ${
                    quality === q
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#333333]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 bg-[#ef4444]/10 border border-[#ef4444] rounded text-sm text-[#ef4444]">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </div>
  );
}
