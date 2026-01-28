import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  duration: number;
  thumbnail?: string;
  status: 'importing' | 'ready' | 'processing' | 'done';
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (videos: VideoFile[]) => void;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = await open({
        multiple: true,
        filters: [
          { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'] },
        ],
      });

      if (!selected || (Array.isArray(selected) && selected.length === 0)) {
        onClose();
        return;
      }

      const filePaths = Array.isArray(selected) ? selected : [selected];
      const videos: VideoFile[] = [];

      for (const path of filePaths) {
        try {
          const duration = await invoke<number>('get_video_duration', { filePath: path });
          
          videos.push({
            id: crypto.randomUUID(),
            name: path.split('/').pop() || 'Unknown',
            path,
            duration: duration || 0,
            status: 'importing',
          });
        } catch (err) {
          console.error(`Failed to get duration for ${path}:`, err);
          videos.push({
            id: crypto.randomUUID(),
            name: path.split('/').pop() || 'Unknown',
            path,
            duration: 0,
            status: 'importing',
          });
        }
      }

      onImport(videos);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import videos');
    } finally {
      setIsLoading(false);
    }
  }, [onClose, onImport]);

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
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="import-options">
            <div className="import-option" onClick={handleImport}>
              <div className="option-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="option-text">
                <h4>Select Files</h4>
                <p>Choose video files from your computer</p>
              </div>
            </div>

            <div className="import-option disabled">
              <div className="option-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="option-text">
                <h4>Import from Folder</h4>
                <p>Import all videos from a folder (coming soon)</p>
              </div>
            </div>
          </div>

          <div className="supported-formats">
            <p>Supported formats: MP4, MOV, AVI, MKV, WebM, M4V</p>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog {
          background: var(--bg-secondary);
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--bg-tertiary);
        }

        .dialog-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .dialog-content {
          padding: 1.5rem;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error);
          color: var(--error);
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
          background: var(--bg-tertiary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-option:hover:not(.disabled) {
          background: #353535;
        }

        .import-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .option-icon {
          width: 48px;
          height: 48px;
          background: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .option-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .option-text h4 {
          font-size: 0.9375rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .option-text p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .supported-formats {
          margin-top: 1.5rem;
          text-align: center;
        }

        .supported-formats p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .dialog-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--bg-tertiary);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}
