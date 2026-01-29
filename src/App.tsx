import { useState, useCallback } from 'react';
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
  // silenceSegments reserved for future timeline integration
  const [_silenceSegments] = useState<SilenceSegment[]>([]);

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
        }

        .header h1 span {
          color: var(--accent);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
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
          overflow: hidden;
        }

        .sidebar {
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .right-sidebar {
          border-left: 1px solid var(--bg-tertiary);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--bg-tertiary);
          flex-shrink: 0;
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
          font-weight: 500;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .preview-area {
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .video-grid-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          padding: 2rem;
          text-align: center;
        }

        .video-grid-empty .hint {
          font-size: 0.8125rem;
          margin-top: 0.5rem;
          opacity: 0.7;
        }

        .timeline-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          padding: 2rem;
          text-align: center;
        }

        .timeline-placeholder .hint {
          font-size: 0.8125rem;
          margin-top: 0.5rem;
          opacity: 0.7;
        }

        .tools-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .video-preview {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid var(--bg-tertiary);
          transition: background 0.2s;
        }

        .video-preview:hover {
          background: var(--bg-tertiary);
        }

        .video-preview.selected {
          background: rgba(59, 130, 246, 0.1);
          border-left: 2px solid var(--accent);
        }

        .video-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .video-name {
          font-size: 0.8125rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .video-status {
          font-size: 0.6875rem;
          color: var(--text-secondary);
        }

        .video-status.importing {
          color: var(--warning);
        }

        .video-status.ready {
          color: var(--success);
        }

        .video-status.processing {
          color: var(--accent);
        }

        .video-status.done {
          color: var(--success);
        }

        .video-player {
          width: 100%;
          max-width: 900px;
          aspect-ratio: 16/9;
          background: var(--bg-secondary);
          border-radius: 8px;
          overflow: hidden;
        }

        .video-player.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .video-player.empty svg {
          width: 64px;
          height: 64px;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .video-player video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}

export default App;
