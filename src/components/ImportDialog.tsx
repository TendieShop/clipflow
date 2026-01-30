import { useState, useCallback, useRef, useEffect } from 'react';

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  duration: number;
  thumbnail?: string;
  status: 'importing' | 'ready' | 'processing' | 'done';
  size?: number;
  format?: string;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (videos: VideoFile[]) => void;
}

const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'M4V'];

function isValidVideoFormat(filename: string): boolean {
  const ext = filename.split('.').pop() || '';
  return SUPPORTED_FORMATS.includes(ext);
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setError(null);
      setImportProgress(null);
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setIsLoading(false);
      return;
    }

    setError(null);
    setImportProgress({ current: 0, total: files.length });
    const filesArray = Array.from(files);
    const newVideos: VideoFile[] = [];

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setImportProgress({ current: i + 1, total: filesArray.length });

        const fileName = file.name || 'Unknown';
        
        if (!isValidVideoFormat(fileName)) {
          console.warn(`[ImportDialog] Skipping unsupported format: ${fileName}`);
          continue;
        }

        let filePath: string;
        if ((file as any).path) {
          filePath = (file as any).path;
        } else if (file.webkitRelativePath) {
          filePath = file.webkitRelativePath;
        } else {
          filePath = file.name;
        }

        console.log(`[ImportDialog] Processing file: ${fileName}`);

        newVideos.push({
          id: crypto.randomUUID(),
          name: fileName,
          path: filePath,
          duration: 0,
          size: file.size,
          format: fileName.split('.').pop()?.toLowerCase() || 'unknown',
          status: 'ready'
        });
      }

      if (newVideos.length === 0) {
        setError('No valid video files found. Supported formats: MP4, MOV, AVI, MKV, WebM, M4V');
        setImportProgress(null);
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      onImport(newVideos);
      onClose();
    } catch (err) {
      console.error('[ImportDialog] Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import videos');
    } finally {
      setIsLoading(false);
      setImportProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onClose, onImport]);

  const handleOptionClick = useCallback(() => {
    setError(null);
    fileInputRef.current?.click();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.map(f => `.${f}`).join(',')}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="file-input"
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

            {importProgress && (
              <div className="import-progress">
                <div className="progress-text">
                  Processing {importProgress.current} of {importProgress.total} files...
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} 
                  />
                </div>
              </div>
            )}

            <div className="import-options">
              <div 
                className={`import-option ${isLoading ? 'disabled' : ''}`}
                onClick={isLoading ? undefined : handleOptionClick}
                data-testid="select-files-option"
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
              <p className="max-size">Maximum file size: 10 GB</p>
            </div>
          </div>

          <div className="dialog-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
              data-testid="cancel-button"
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
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
          }

          .dialog {
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.5);
            animation: scaleIn 0.2s ease;
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

          .import-progress {
            background: var(--bg-tertiary);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .progress-text {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
          }

          .progress-bar {
            height: 6px;
            background: var(--bg-secondary);
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: var(--accent);
            transition: width 0.3s ease;
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

          .max-size {
            margin-top: 0.25rem;
            opacity: 0.7;
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
    </>
  );
}
