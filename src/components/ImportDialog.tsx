import { useState, useCallback, useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const newVideos: VideoFile[] = [];

      for (const file of Array.from(files)) {
        // In Tauri, use file.path. In web, use file.name or file.webkitRelativePath
        const filePath = (file as any).path || file.webkitRelativePath || file.name;
        
        newVideos.push({
          id: crypto.randomUUID(),
          name: file.name,
          path: filePath,
          duration: 0,
          status: 'ready'
        });
      }

      onImport(newVideos);
      onClose();
    } catch (err) {
      console.error('[ImportDialog] Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import videos');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onClose, onImport]);

  const handleOptionClick = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    
    // Trigger hidden file input
    fileInputRef.current?.click();
  }, [isLoading]);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.map(f => `.${f}`).join(',')}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

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
              <div 
                className={`import-option ${isLoading ? 'disabled' : ''}`}
                onClick={isLoading ? undefined : handleOptionClick}
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
              <p>Supported formats: {supportedFormats.join(', ').toUpperCase()}</p>
            </div>
          </div>

          <div className="dialog-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
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
            color: var(--text-primary);
            margin: 0;
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
            border: 2px solid transparent;
          }

          .import-option:hover:not(.disabled) {
            background: #353535;
            border-color: var(--accent);
          }

          .import-option.disabled {
            opacity: 0.6;
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
            color: var(--text-primary);
          }

          .option-text p {
            font-size: 0.8125rem;
            color: var(--text-secondary);
            margin: 0;
          }

          .supported-formats {
            margin-top: 1.5rem;
            text-align: center;
          }

          .supported-formats p {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin: 0;
          }

          .dialog-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--bg-tertiary);
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
          }

          .btn {
            padding: 0.625rem 1.25rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }

          .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-primary);
          }

          .btn-secondary:hover:not(:disabled) {
            background: #353535;
          }

          .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </>
  );
}
