import { useState, useCallback } from 'react';
import { VideoFile } from './services/video-types';
import { ImportDialog } from './components/ImportDialog';
import { ExportDialog } from './components/ExportDialog';
import { VideoPreview } from './components/VideoPreview';
import { SilenceDetectionPanel } from './components/SilenceDetectionPanel';
import { Button, IconButton } from './components/Button';
import { Input } from './components/Input';
import { Settings } from 'lucide-react';

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

  const filteredVideos = videos.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <header className="flex-none h-12 bg-[#0a0a0a] border-b border-[#262626] flex items-center px-4">
        {/* App Title - Centered */}
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-[#f5f5f5] text-lg">ClipFlow</h1>
        
        {/* Header Actions */}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="icon"
            label="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </IconButton>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Video Library */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-[#262626]">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Video List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredVideos.length === 0 ? (
              <div className="text-center text-[#737373] py-8">
                No videos imported yet
              </div>
            ) : (
              filteredVideos.map(video => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`p-2 rounded cursor-pointer mb-1 ${
                    selectedVideo?.id === video.id
                      ? 'bg-[#262626]'
                      : 'hover:bg-[#171717]'
                  }`}
                >
                  <div className="font-medium text-sm text-[#f5f5f5] truncate">
                    {video.name}
                  </div>
                  <div className="text-xs text-[#737373]">
                    {formatTime(video.duration)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Import Button */}
          <div className="p-4 border-t border-[#262626]">
            <Button
              variant="default"
              className="w-full"
              onClick={() => setIsImportOpen(true)}
            >
              Import Video
            </Button>
          </div>
        </aside>

        {/* Center - Video Preview */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4">
            {selectedVideo ? (
              <div className="w-full max-w-4xl aspect-video bg-[#171717] rounded-lg flex items-center justify-center">
                <VideoPreview
                  video={selectedVideo}
                  isSelected={true}
                  onSelect={() => {}}
                />
              </div>
            ) : (
              <div className="text-center text-[#737373]">
                <p>No video selected</p>
                <p className="text-sm mt-2">Import a video to get started</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {selectedVideo && (
            <div className="h-32 bg-[#0a0a0a] border-t border-[#262626] p-4">
              <div className="text-xs text-[#a3a3a3] mb-2">
                Timeline - {formatTime(currentTime)} / {formatTime(selectedVideo.duration)}
              </div>
              <input
                type="range"
                min={0}
                max={selectedVideo.duration}
                value={currentTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSeek(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </main>

        {/* Right Sidebar - Info & Actions */}
        <aside className="w-72 bg-[#0a0a0a] border-l border-[#262626] flex flex-col">
          {/* Video Info */}
          {selectedVideo && (
            <div className="p-4 border-b border-[#262626]">
              <h2 className="font-medium text-[#f5f5f5] mb-2">Video Info</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Name:</span>
                  <span className="text-[#f5f5f5] truncate max-w-[150px]">
                    {selectedVideo.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Duration:</span>
                  <span className="text-[#f5f5f5]">
                    {formatTime(selectedVideo.duration)}
                  </span>
                </div>
                {selectedVideo.size && (
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Size:</span>
                    <span className="text-[#f5f5f5]">
                      {(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-b border-[#262626] space-y-2">
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
    </div>
  );
}

export default App;
