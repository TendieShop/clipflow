import { useState, useCallback } from 'react';
import { VideoFile } from './services/video-types';
import { ImportDialog } from './components/ImportDialog';
import { ExportDialog } from './components/ExportDialog';
import { VideoPreview } from './components/VideoPreview';
import { SilenceDetectionPanel } from './components/SilenceDetectionPanel';
import { Timeline } from './components/Timeline';
import { Card, CardContent } from './components/Card';
import { Button, IconButton } from './components/Button';
import { Input } from './components/Input';

function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSilencePanelOpen, setIsSilencePanelOpen] = useState(false);
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header with macOS controls */}
      <header className="flex-none h-10 bg-background border-b border-border flex items-center px-4">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        
        {/* App Title */}
        <h1 className="font-semibold text-text-primary">ClipFlow</h1>
        
        {/* Header Actions */}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <IconButton label="Settings">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </IconButton>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content (Video Preview + Timeline) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="flex-none p-4">
            {selectedVideo ? (
              <VideoPreview
                filePath={selectedVideo.path}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <CardContent className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-text-secondary">No video selected</p>
                  <p className="text-sm text-text-muted mt-2">Import a video to get started</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timeline */}
          <div className="flex-1 p-4 overflow-hidden">
            <Timeline
              video={selectedVideo}
              currentTime={currentTime}
              onTimeSelect={setCurrentTime}
            />
          </div>

          {/* Time Display */}
          <div className="flex-none px-4 pb-2 text-sm text-text-muted">
            Current: {formatTime(currentTime)}
            {selectedVideo && ` / ${formatTime(selectedVideo.duration)}`}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-72 border-l border-border bg-background flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Video Info */}
            {selectedVideo && (
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="font-medium text-text-primary">Video Info</h3>
                  <div className="text-sm space-y-1">
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Name:</span> {selectedVideo.name}
                    </p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Duration:</span> {formatTime(selectedVideo.duration)}
                    </p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Format:</span> {(selectedVideo.format || 'Unknown').toUpperCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="space-y-2">
                <h3 className="font-medium text-text-primary mb-3">Actions</h3>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsImportOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Video
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={!selectedVideo}
                  onClick={() => setIsSilencePanelOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Silence Detect
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={!selectedVideo}
                  onClick={() => setIsExportOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </Button>
              </CardContent>
            </Card>

            {/* Video Library */}
            <div>
              <h3 className="font-medium text-text-primary mb-2">Library</h3>
              {videos.length === 0 ? (
                <p className="text-sm text-text-muted">No videos imported</p>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      hoverable
                      onClick={() => setSelectedVideo(video)}
                      className={`
                        p-3 transition-all
                        ${selectedVideo?.id === video.id 
                          ? 'border-accent bg-accent/10' 
                          : ''
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center
                          ${selectedVideo?.id === video.id ? 'bg-accent/20' : 'bg-surface'}
                        `}>
                          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-text-primary">{video.name}</div>
                          <div className="text-xs text-text-muted">{formatTime(video.duration)}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Player Bar */}
      <footer className="flex-none h-14 border-t border-border bg-surface flex items-center px-4 gap-4">
        {/* Timecode */}
        <div className="font-mono text-lg text-text-primary">
          {formatTime(currentTime)}
        </div>

        {/* Progress Bar */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={selectedVideo?.duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-accent
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Total Duration */}
        <div className="font-mono text-sm text-text-muted">
          {selectedVideo ? formatTime(selectedVideo.duration) : '0:00.000'}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <IconButton label="Settings">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </IconButton>
        </div>
      </footer>

      {/* Dialogs */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      {selectedVideo && (
        <ExportDialog
          isOpen={isExportOpen}
          filePath={selectedVideo.path}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
        />
      )}

      {selectedVideo && (
        <SilenceDetectionPanel
          isOpen={isSilencePanelOpen}
          filePath={selectedVideo.path}
          onClose={() => setIsSilencePanelOpen(false)}
          onTrim={(start, end) => {
            console.log('Trim from', start, 'to', end);
          }}
        />
      )}
    </div>
  );
}

export default App;
