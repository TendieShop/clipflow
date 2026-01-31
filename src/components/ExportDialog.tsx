import { useState } from 'react';
import { VideoFile } from '../services/video-types';
import { ErrorDisplay } from './ErrorBoundary';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  video: VideoFile;
  onClose: () => void;
  onExport: (outputPath: string, quality: string) => void;
}

type ExportQuality = 'high' | 'medium' | 'low';

// Check if running in Electron app
function isElectronApp(): boolean {
  return !!(window as any).electronAPI;
}

// Call IPC to save file dialog
async function showSaveDialog(
  filters: Array<{ name: string; extensions: string[] }>
): Promise<string | null> {
  if (!isElectronApp() || !window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  const result = await window.electronAPI.dialog.saveFile({ filters });
  return result;
}

// Call IPC to export video
async function exportVideoIPC(
  inputPath: string,
  outputPath: string,
  quality: string
): Promise<void> {
  if (!isElectronApp() || !window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  await window.electronAPI.video.exportVideo({
    inputPath,
    outputPath,
    quality
  });
}

export function ExportDialog({ isOpen, video, onClose, onExport }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [quality, setQuality] = useState<ExportQuality>('medium');
  const [error, setError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      // Show save dialog
      const outputPath = await showSaveDialog([
        { name: 'Video', extensions: ['mp4'] }
      ]);

      if (!outputPath) {
        setIsExporting(false);
        return;
      }

      // Simulate progress (since IPC doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Call IPC to export
      await exportVideoIPC(video.path, outputPath, quality);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Notify parent and close
      onExport(outputPath, quality);
      onClose();
    } catch (err) {
      console.error('[ExportDialog] Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed. Make sure FFmpeg is installed.');
      setExportProgress(0);
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
          <div className="export-video-info">
            <label className="text-sm font-medium text-[#f5f5f5]">Video</label>
            <p className="text-sm text-[#a3a3a3]">{video.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[#f5f5f5]">Quality</label>
            <div className="flex gap-2 mt-1">
              {(['low', 'medium', 'high'] as ExportQuality[]).map(q => (
                <button
                  key={q}
                  onClick={() => !isExporting && setQuality(q)}
                  disabled={isExporting}
                  className={`px-3 py-1 rounded text-sm capitalize ${
                    quality === q
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#333333]'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {isExporting && (
            <div className="export-progress">
              <div className="flex justify-between text-sm text-[#a3a3a3] mb-1">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-[#262626] rounded-full h-2">
                <div
                  className="bg-[#3b82f6] h-2 rounded-full transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <ErrorDisplay error={error} onRetry={handleExport} onDismiss={() => setError(null)} />
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
