import { useState } from 'react';
import { exportVideo } from '../lib/video';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoPath: string | null;
  videoName: string;
}

type ExportQuality = 'high' | 'medium' | 'low';
type ExportFormat = 'mp4' | 'webm';

export function ExportDialog({ isOpen, onClose, videoPath, videoName }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<ExportQuality>('medium');
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!videoPath) return;

    setIsExporting(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    // Simulate progress since FFmpeg doesn't provide progress via Tauri
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const outputPath = videoPath.replace(/\.[^/.]+$/, '') + '_exported.' + format;
      await exportVideo(videoPath, outputPath, quality);
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (quality: ExportQuality): string => {
    switch (quality) {
      case 'high': return 'Larger file, best quality';
      case 'medium': return 'Balanced size/quality';
      case 'low': return 'Smaller file, lower quality';
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardHeader>
            <CardTitle>Export Video</CardTitle>
            <CardDescription>Export {videoName || 'your video'} with custom settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="export-options">
              <div className="option-group">
                <label>Quality</label>
                <div className="quality-options">
                  {(['high', 'medium', 'low'] as ExportQuality[]).map((q) => (
                    <button
                      key={q}
                      className={`quality-btn ${quality === q ? 'selected' : ''}`}
                      onClick={() => setQuality(q)}
                      disabled={isExporting}
                    >
                      <span className="quality-label">{q.charAt(0).toUpperCase() + q.slice(1)}</span>
                      <span className="quality-desc">{formatFileSize(q)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>Format</label>
                <div className="format-options">
                  <button
                    className={`format-btn ${format === 'mp4' ? 'selected' : ''}`}
                    onClick={() => setFormat('mp4')}
                    disabled={isExporting}
                  >
                    MP4
                  </button>
                  <button
                    className={`format-btn ${format === 'webm' ? 'selected' : ''}`}
                    onClick={() => setFormat('webm')}
                    disabled={isExporting}
                  >
                    WebM
                  </button>
                </div>
              </div>

              {isExporting && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  <span className="progress-text">
                    {progress < 100 ? `Exporting... ${progress}%` : 'Complete!'}
                  </span>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">Video exported successfully!</div>}

              <div className="dialog-actions">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={isExporting || !videoPath}>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <style>{`
          .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
          }

          .dialog-content {
            width: 100%;
            max-width: 480px;
            margin: 1rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            box-shadow: var(--shadow-high);
            animation: scaleIn 0.2s ease;
          }

          .export-options {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .option-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .option-group > label {
            font-size: 0.875rem;
            font-weight: 500;
          }

          .quality-options, .format-options {
            display: flex;
            gap: 0.5rem;
          }

          .quality-btn {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--background);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }

          .quality-btn:hover:not(:disabled) {
            border-color: var(--accent);
          }

          .quality-btn.selected {
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.1);
          }

          .quality-btn:disabled, .format-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quality-label, .format-btn {
            font-weight: 500;
          }

          .quality-desc {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .format-btn {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--background);
            cursor: pointer;
            transition: all 0.2s;
          }

          .format-btn:hover:not(:disabled) {
            border-color: var(--accent);
          }

          .format-btn.selected {
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.1);
          }

          .progress-bar {
            height: 8px;
            background: var(--bg-secondary);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
          }

          .progress-fill {
            height: 100%;
            background: var(--accent);
            transition: width 0.3s;
          }

          .progress-text {
            position: absolute;
            width: 100%;
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-secondary);
            top: 50%;
            transform: translateY(-50%);
          }

          .error-message {
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-radius: 6px;
            font-size: 0.875rem;
          }

          .success-message {
            padding: 0.75rem;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border-radius: 6px;
            font-size: 0.875rem;
          }

          .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}
