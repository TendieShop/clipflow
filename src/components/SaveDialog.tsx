import { useState, useCallback } from 'react';
import type { Project } from '../lib/project';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentProject: Project | null;
}

export function SaveDialog({ isOpen, onClose, onSave, currentProject }: SaveDialogProps) {
  const [name, setName] = useState(currentProject?.name || '');

  const handleSave = useCallback(() => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
  }, [name, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog save-dialog" onClick={e => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>{currentProject ? 'Save Project As' : 'Save Project'}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="dialog-content">
            <div className="form-group">
              <label htmlFor="project-name">Project Name</label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter project name"
                autoFocus
                data-testid="project-name-input"
              />
            </div>
          </div>

          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!name.trim()}
              data-testid="save-button"
            >
              Save
            </button>
          </div>
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
          max-width: 400px;
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

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9375rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent);
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

        .btn-secondary:hover {
          background: #353535;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
