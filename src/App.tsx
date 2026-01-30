import { useState, useCallback, useEffect } from 'react';
import { VideoPreviewGrid, VideoPlayer } from './components/VideoPreview';
import { ImportDialog } from './components/ImportDialog';
import { ExportDialog } from './components/ExportDialog';
import { SilenceDetectionPanel } from './components/SilenceDetectionPanel';
import { SaveDialog } from './components/SaveDialog';
import { OpenDialog } from './components/OpenDialog';
import { useProject } from './lib/project';
import type { VideoFile } from './components/VideoPreview';
import type { SilenceSegment } from './lib/video';
import { Button } from './components/ui/button';

function App() {
  const {
    state,
    saveProject,
    loadProject,
    deleteProject,
    updateProjectVideos,
    updateSettings,
  } = useProject();

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  
  const isDark = state.settings.theme === 'dark' || 
    (state.settings.theme === 'system' && typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  // silenceSegments reserved for future timeline integration
  const [_silenceSegments] = useState<SilenceSegment[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = useCallback(() => {
    const themes: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
    const currentIndex = themes.indexOf(state.settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  }, [state.settings.theme, updateSettings]);

  const handleImport = useCallback((newVideos: VideoFile[]) => {
    // Add videos to current project
    const currentVideos = state.currentProject?.videos || [];
    const updatedVideos = [...currentVideos, ...newVideos];
    updateProjectVideos(updatedVideos);
    
    if (!selectedVideoId && newVideos.length > 0) {
      setSelectedVideoId(newVideos[0].id);
    }
  }, [state.currentProject, selectedVideoId, updateProjectVideos]);

  const handleSilenceDetected = useCallback((segments: SilenceSegment[]) => {
    _silenceSegments; // Reserved for timeline integration
    console.log('[App] Silence detected:', segments);
  }, []);

  const handleSave = useCallback((name: string) => {
    saveProject(name);
    setShowSaveDialog(false);
  }, [saveProject]);

  const handleOpen = useCallback((projectId: string) => {
    loadProject(projectId);
    // Clear selected video when switching projects
    setSelectedVideoId(null);
  }, [loadProject]);

  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
  }, [deleteProject]);

  const selectedVideo = state.currentProject?.videos.find((v) => v.id === selectedVideoId) || null;
  const selectedVideoSrc = selectedVideo ? `file://${selectedVideo.path}` : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Clip<span>Flow</span></h1>
          {state.currentProject && (
            <span className="project-name">{state.currentProject.name}</span>
          )}
        </div>
        <div className="header-actions">
          <Button variant="ghost" size="sm" onClick={handleToggleTheme} title="Toggle theme">
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowOpenDialog(true)} title="Open project">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={!state.currentProject?.videos.length} title="Save project">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </Button>
          
          <div className="divider" />
          
          <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(true)}>
            + Import
          </Button>
          
          <Button onClick={() => setShowExportDialog(true)} disabled={!state.currentProject?.videos.length}>
            Export
          </Button>
        </div>
      </header>

      <main className="main-content">
        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Videos</h2>
              <span className="video-count">{state.currentProject?.videos.length || 0}</span>
            </div>
            <VideoPreviewGrid
              videos={state.currentProject?.videos || []}
              selectedId={selectedVideoId}
              onSelectVideo={setSelectedVideoId}
            />
          </aside>

          <section className="preview-area">
            <VideoPlayer src={selectedVideoSrc} />
          </section>

          <aside className="sidebar right-sidebar">
            <div className="sidebar-header">
              <h2>Tools</h2>
            </div>
            <div className="tools-content">
              <SilenceDetectionPanel
                videoPath={selectedVideo?.path || null}
                onSilenceDetected={handleSilenceDetected}
              />
            </div>
          </aside>
        </div>

        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />

        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          videoPath={selectedVideo?.path || null}
          videoName={selectedVideo?.name || ''}
        />

        <SaveDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSave}
          currentProject={state.currentProject}
        />

        <OpenDialog
          isOpen={showOpenDialog}
          onClose={() => setShowOpenDialog(false)}
          onOpen={handleOpen}
          onDelete={handleDeleteProject}
          projects={state.projects}
        />
      </main>

      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background 0.2s, color 0.2s;
        }

        .header {
          background: var(--bg-secondary);
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid var(--bg-tertiary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .header h1 span {
          color: var(--accent);
        }

        .project-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding-left: 1rem;
          border-left: 1px solid var(--bg-tertiary);
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: var(--bg-tertiary);
          margin: 0 0.5rem;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .workspace {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr 280px;
          gap: 1px;
          background: var(--bg-tertiary);
        }

        .sidebar {
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid var(--bg-tertiary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h2 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .video-count {
          background: var(--accent);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .tools-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .preview-area {
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default App;
