import { useState, useCallback } from 'react';
import type { Project } from '../lib/project';

interface OpenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  projects: Project[];
}

export function OpenDialog({ isOpen, onClose, onOpen, onDelete, projects }: OpenDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpen = useCallback((projectId: string) => {
    onOpen(projectId);
    onClose();
  }, [onOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog open-dialog" onClick={e => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>Open Project</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="dialog-content">
            <div className="search-bar">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                data-testid="search-input"
              />
            </div>

            <div className="sort-controls">
              <label>
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'date'}
                  onChange={() => setSortBy('date')}
                />
                By Date
              </label>
              <label>
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'name'}
                  onChange={() => setSortBy('name')}
                />
                By Name
              </label>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                {searchQuery ? (
                  <>
                    <p>No projects found matching "{searchQuery}"</p>
                  </>
                ) : (
                  <>
                    <p>No saved projects yet</p>
                    <p className="hint">Save a project to see it here</p>
                  </>
                )}
              </div>
            ) : (
              <div className="project-list" data-testid="project-list">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    className="project-item"
                    onClick={() => handleOpen(project.id)}
                    data-testid={`project-${project.id}`}
                  >
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <p className="project-meta">
                        {project.videos.length} video{project.videos.length !== 1 ? 's' : ''}
                        {' · '}
                        Updated {formatDate(project.updatedAt)}
                      </p>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete "${project.name}"?`)) {
                          onDelete(project.id);
                        }
                      }}
                      data-testid={`delete-${project.id}`}
                      title="Delete project"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
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
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--bg-tertiary);
          flex-shrink: 0;
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
          flex: 1;
          padding: 1rem 1.5rem;
          overflow-y: auto;
        }

        .search-bar {
          margin-bottom: 1rem;
        }

        .search-bar input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9375rem;
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .sort-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .sort-controls label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .project-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .project-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .project-item:hover {
          background: #353535;
        }

        .project-info {
          flex: 1;
          min-width: 0;
        }

        .project-name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .delete-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          opacity: 0;
          transition: all 0.2s;
        }

        .project-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: var(--error);
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }

        .empty-state p {
          margin: 0;
        }

        .empty-state .hint {
          font-size: 0.875rem;
          opacity: 0.7;
          margin-top: 0.5rem;
        }

        .dialog-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--bg-tertiary);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-shrink: 0;
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
          background: #353335;
        }
      `}</style>
    </>
  );
}
