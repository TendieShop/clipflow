import { useState, useCallback, useEffect } from 'react';
import { VideoPreviewGrid, VideoPlayer } from './components/VideoPreview';
import { ImportDialog } from './components/ImportDialog';
import { ExportDialog } from './components/ExportDialog';
import { SilenceDetectionPanel } from './components/SilenceDetectionPanel';
import type { VideoFile } from './components/VideoPreview';
import type { SilenceSegment } from './lib/video';
import { Button } from './components/ui/button';

function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clipflow-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // silenceSegments reserved for future timeline integration
  const [_silenceSegments] = useState<SilenceSegment[]>([]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('clipflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('clipflow-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null;

  const handleImport = useCallback((newVideos: VideoFile[]) => {
    setVideos((prev) => [...prev, ...newVideos]);
    if (!selectedVideoId && newVideos.length > 0) {
      setSelectedVideoId(newVideos[0].id);
    }
  }, [selectedVideoId]);

  const handleSilenceDetected = useCallback((segments: SilenceSegment[]) => {
    _silenceSegments; // Reserved for timeline integration
    console.log('Silence detected:', segments);
  }, []);

  const selectedVideoSrc = selectedVideo ? `file://${selectedVideo.path}` : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Clip<span>Flow</span></h1>
        </div>
        <div className="header-actions">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
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
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            + Import Videos
          </Button>
          <Button onClick={() => setShowExportDialog(true)} disabled={videos.length === 0}>
            Export
          </Button>
        </div>
      </header>

      <main className="main-content">
        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Videos</h2>
              <span className="video-count">{videos.length}</span>
            </div>
            <VideoPreviewGrid
              videos={videos}
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

        .header h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header h1 span {
          color: var(--accent);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
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
