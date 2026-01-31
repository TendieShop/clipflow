import { useState, useCallback } from 'react';
import { Button } from './Button';
import { ErrorDisplay } from './ErrorBoundary';
import { VideoFile, VideoMetadata } from '../services/video-types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (videos: VideoFile[]) => void;
}

const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];

function isValidVideoFormat(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_FORMATS.includes(ext);
}

// Check if running in Electron app
function isElectronApp(): boolean {
  return !!(window as any).electronAPI;
}

// Safe IPC call wrapper
async function electronDialogOpenFile(multiple: boolean): Promise<string[]> {
  if (!isElectronApp() || !window.electronAPI) {
    throw new Error('Import requires Electron app context. Please run the ClipFlow desktop app.');
  }
  
  const result = await window.electronAPI.dialog.openFile({
    multiple,
    filters: [{ name: 'Video Files', extensions: SUPPORTED_FORMATS }],
  });
  
  return result || [];
}

// Fetch video metadata from IPC
async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  if (!isElectronApp() || !window.electronAPI) {
    throw new Error('Electron API not available');
  }
  
  // Try to get full metadata if available
  if (window.electronAPI.video && typeof window.electronAPI.video.getMetadata === 'function') {
    try {
      return await window.electronAPI.video.getMetadata(filePath);
    } catch (e) {
      // Fallback to duration only
    }
  }
  
  // Fallback: get just duration
  if (window.electronAPI.video && typeof window.electronAPI.video.getVideoDuration === 'function') {
    const duration = await window.electronAPI.video.getVideoDuration(filePath);
    return {
      duration,
      width: 0,
      height: 0,
      format: 'unknown',
      codec: 'unknown',
      bitrate: 0,
      fps: 0
    };
  }
  
  // Last resort: return zeros
  return {
    duration: 0,
    width: 0,
    height: 0,
    format: 'unknown',
    codec: 'unknown',
    bitrate: 0,
    fps: 0
  };
}

// Get file size
async function getFileSize(filePath: string): Promise<number | undefined> {
  try {
    // Use Node.js-like stat if available through Electron
    if (isElectronApp() && (window as any).electronAPI?.fs) {
      const stats = await (window as any).electronAPI.fs.stat(filePath);
      return stats?.size;
    }
  } catch (e) {
    console.warn('[ImportDialog] Could not get file size:', e);
  }
  return undefined;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if running in Electron app
      if (!isElectronApp() || !window.electronAPI) {
        throw new Error('Import requires Electron app context. Please run the ClipFlow desktop app.');
      }

      // Use Electron dialog API to get real file paths
      const paths = await electronDialogOpenFile(true);

      if (!paths || paths.length === 0) {
        setIsLoading(false);
        return;
      }

      const newVideos: VideoFile[] = [];

      for (const path of paths) {
        const fileName = path.split('/').pop() || path.split('\\').pop() || 'Unknown';
        
        if (!isValidVideoFormat(fileName)) {
          console.warn(`[ImportDialog] Skipping unsupported format: ${fileName}`);
          continue;
        }

        console.log(`[ImportDialog] Processing file: ${fileName} (${path})`);

        // Fetch metadata from IPC
        let metadata: VideoMetadata = {
          duration: 0,
          width: 0,
          height: 0,
          format: fileName.split('.').pop()?.toLowerCase() || 'unknown',
          codec: 'unknown',
          bitrate: 0,
          fps: 0
        };

        let size: number | undefined;

        try {
          metadata = await getVideoMetadata(path);
          size = await getFileSize(path);
          console.log(`[ImportDialog] Metadata fetched: ${metadata.duration}s, ${size ? (size / (1024 * 1024)).toFixed(1) + ' MB' : 'unknown size'}`);
        } catch (metaError) {
          console.warn(`[ImportDialog] Could not fetch metadata for ${fileName}:`, metaError);
        }

        newVideos.push({
          id: crypto.randomUUID(),
          name: fileName,
          path: path,
          duration: metadata.duration,
          format: metadata.format,
          size: size,
          status: 'ready'
        });
      }

      if (newVideos.length === 0) {
        setError('No valid video files found. Supported formats: MP4, MOV, AVI, MKV, WebM, M4V');
        setIsLoading(false);
        return;
      }

      console.log(`[ImportDialog] Successfully prepared ${newVideos.length} videos for import`);
      onImport(newVideos);
      onClose();
    } catch (err) {
      console.error('[ImportDialog] Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import videos');
    } finally {
      setIsLoading(false);
    }
  }, [onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog import-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Import Videos</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          {error && (
            <ErrorDisplay error={error} onRetry={handleImport} onDismiss={() => setError(null)} />
          )}

          <div className="import-options">
            <div 
              className={`import-option ${isLoading ? 'disabled' : ''}`}
              onClick={isLoading ? undefined : handleImport}
            >
              <div className="option-icon">
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <div className="option-text">
                <h4>{isLoading ? 'Reading files...' : 'Select Files'}</h4>
                <p>Choose video files from your computer</p>
              </div>
            </div>
          </div>

          <div className="supported-formats">
            <p>Supported formats: MP4, MOV, AVI, MKV, WebM, M4V</p>
          </div>
        </div>

        <div className="dialog-footer">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>

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

        .dialog {
          background: #171717;
          border: 1px solid #262626;
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          animation: scaleIn 0.2s ease;
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #262626;
        }

        .dialog-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #f5f5f5;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #a3a3a3;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .close-btn:hover {
          color: #f5f5f5;
        }

        .dialog-content {
          padding: 1.5rem;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .import-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .import-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #262626;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .import-option:hover:not(.disabled) {
          background: #333333;
          border-color: #3b82f6;
        }

        .import-option.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-icon {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .option-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .option-text h4 {
          font-size: 0.9375rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: #f5f5f5;
        }

        .option-text p {
          font-size: 0.8125rem;
          color: #a3a3a3;
          margin: 0;
        }

        .supported-formats {
          margin-top: 1.5rem;
          text-align: center;
        }

        .supported-formats p {
          font-size: 0.75rem;
          color: #737373;
          margin: 0;
        }

        .dialog-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #262626;
          display: flex;
          justify-content: flex-end;
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
      `}</style>
    </div>
  );
}
