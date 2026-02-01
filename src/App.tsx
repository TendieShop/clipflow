import { useState, useCallback } from 'react';
import { VideoFile } from './services/video-types';
import { ImportDialog } from './components/ImportDialog';
import { ExportDialog } from './components/ExportDialog';
import { VideoPlayer } from './components/VideoPreview';
import { SilenceDetectionPanel } from './components/SilenceDetectionPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { TrimDialog } from './components/TrimDialog';
import { ExtractAudioDialog } from './components/ExtractAudioDialog';
import { ErrorBoundary, DesktopAppRequired } from './components/ErrorBoundary';
import { ThemeProvider, ThemeToggle } from './components/ThemeToggle';
import { AudioWaveform } from './components/AudioWaveform';
import { Button, IconButton } from './components/Button';
import { Input } from './components/Input';
import { Settings, Scissors, Music } from 'lucide-react';

// Check if running in Electron app
function isElectronApp(): boolean {
  return !!(window as any).electronAPI;
}

function AppContent() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSilencePanelOpen, setIsSilencePanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrimOpen, setIsTrimOpen] = useState(false);
  const [isExtractAudioOpen, setIsExtractAudioOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = useCallback((newVideos: VideoFile[]) => {
    setVideos(prev => [...prev, ...newVideos]);
    if (!selectedVideo && newVideos.length > 0) {
      setSelectedVideo(newVideos[0]);
    }
  }, [selectedVideo]);

  const handleExport = useCallback((outputPath: string, quality: string) => {
    console.log('Exporting to:', outputPath, 'Quality:', quality);
  }, []);

  const handleTrim = useCallback((inputPath: string, outputPath: string, startTime: number, endTime: number) => {
    console.log('Trimming video:', { inputPath, outputPath, startTime, endTime });
    // IPC call to trim-video would go here
  }, []);

  const handleExtractAudio = useCallback((inputPath: string, outputPath: string) => {
    console.log('Extracting audio:', { inputPath, outputPath });
    // IPC call to extract-audio would go here
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const filteredVideos = videos.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)] overflow-hidden">
        {/* Header - Draggable area for window moving */}
        <header 
          className="flex-none h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center px-4 select-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* App Title - Centered */}
          <h1 className="flex-1 text-center font-semibold text-[var(--color-text-primary)] text-lg pointer-events-none">ClipFlow</h1>
          
          {/* Header Actions - Must be no-drag for buttons to work */}
          <div 
            className="absolute right-4 flex items-center gap-2"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <ThemeToggle />
            <IconButton
              variant="ghost"
              size="icon"
              label="Settings"
              aria-label="Settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </IconButton>
          </div>
        </header>

        {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Video Library */}
        <aside className="w-64 bg-[var(--color-background)] border-r border-[var(--color-border)] flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Video List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredVideos.length === 0 ? (
              <div className="text-center text-[var(--color-text-muted)] py-8">
                No videos imported yet
              </div>
            ) : (
              filteredVideos.map(video => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`p-2 rounded cursor-pointer mb-1 ${
                    selectedVideo?.id === video.id
                      ? 'bg-[var(--color-hover)]'
                      : 'hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                    {video.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {formatTime(video.duration)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Import Button */}
          <div className="p-4 border-t border-[var(--color-border)]">
            <Button
              variant="default"
              className="w-full"
              onClick={() => setIsImportOpen(true)}
            >
              Import Video
            </Button>
          </div>
        </aside>

        {/* Center - Video Preview with Playback */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--color-background)]">
          <div className="flex-1 flex items-center justify-center p-4">
            {selectedVideo ? (
              <div className="w-full max-w-4xl aspect-video bg-[var(--color-surface)] rounded-lg overflow-hidden">
                <VideoPlayer
                  src={selectedVideo.path}
                  currentTime={currentTime}
                  onTimeUpdate={handleSeek}
                  onSeek={handleSeek}
                  initialTime={currentTime}
                />
              </div>
            ) : (
              <div className="text-center text-[var(--color-text-muted)]">
                <p>No video selected</p>
                <p className="text-sm mt-2">Import a video to get started</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {selectedVideo && (
            <div className="h-40 bg-[var(--color-background)] border-t border-[var(--color-border)] p-4">
              <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                Timeline - {formatTime(currentTime)} / {formatTime(selectedVideo.duration)}
              </div>
              
              {/* Audio Waveform Visualization */}
              <AudioWaveform
                video={selectedVideo}
                currentTime={currentTime}
                duration={selectedVideo.duration}
                onSeek={handleSeek}
              />
              
              <input
                type="range"
                min={0}
                max={selectedVideo.duration || 100}
                value={currentTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSeek(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          )}
        </main>

        {/* Right Sidebar - Info & Actions */}
        <aside className="w-72 bg-[var(--color-background)] border-l border-[var(--color-border)] flex flex-col">
          {/* Video Info */}
          {selectedVideo && (
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="font-medium text-[var(--color-text-primary)] mb-2">Video Info</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Name:</span>
                  <span className="text-[var(--color-text-primary)] truncate max-w-[150px]">
                    {selectedVideo.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Duration:</span>
                  <span className="text-[var(--color-text-primary)]">
                    {formatTime(selectedVideo.duration)}
                  </span>
                </div>
                {selectedVideo.size && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Size:</span>
                    <span className="text-[var(--color-text-primary)]">
                      {(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-b border-[var(--color-border)] space-y-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => setIsExportOpen(true)}
              disabled={!selectedVideo}
            >
              Export Video
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsSilencePanelOpen(true)}
              disabled={!selectedVideo}
            >
              Silence Detection
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsTrimOpen(true)}
                disabled={!selectedVideo}
              >
                <Scissors className="w-4 h-4 mr-1" />
                Trim
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsExtractAudioOpen(true)}
                disabled={!selectedVideo}
              >
                <Music className="w-4 h-4 mr-1" />
                Audio
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      {selectedVideo && (
        <ExportDialog
          isOpen={isExportOpen}
          video={selectedVideo}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
        />
      )}

      {selectedVideo && isSilencePanelOpen && (
        <SilenceDetectionPanel
          video={selectedVideo}
          onClose={() => setIsSilencePanelOpen(false)}
        />
      )}

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {selectedVideo && (
        <TrimDialog
          isOpen={isTrimOpen}
          video={selectedVideo}
          onClose={() => setIsTrimOpen(false)}
          onTrim={handleTrim}
        />
      )}

      {selectedVideo && (
        <ExtractAudioDialog
          isOpen={isExtractAudioOpen}
          video={selectedVideo}
          onClose={() => setIsExtractAudioOpen(false)}
          onExtract={handleExtractAudio}
        />
      )}
    </div>
  );
}

// Main App component with Error Boundary
function App() {
  // Show fallback if not in Electron app
  if (!isElectronApp()) {
    return <DesktopAppRequired />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary
        fallback={
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">Something went wrong loading the app</p>
            <Button variant="default" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        }
      >
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
