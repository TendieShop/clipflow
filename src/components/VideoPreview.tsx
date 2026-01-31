import { useRef, useState, useEffect, useCallback } from 'react';

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

interface VideoPreviewProps {
  video: VideoFile;
  isSelected: boolean;
  onSelect: () => void;
}

export function VideoPreview({ video, isSelected, onSelect }: VideoPreviewProps) {
  return (
    <div
      data-testid="video-preview"
      className={`video-preview ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="video-thumbnail">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.name} />
        ) : (
          <div className="thumbnail-placeholder">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {video.duration > 0 && (
          <div className="video-duration">{formatDuration(video.duration)}</div>
        )}
      </div>
      <div className="video-info">
        <span className="video-name" title={video.name}>{video.name}</span>
        <span className={`video-status ${video.status}`}>
          {video.status === 'importing' && 'Importing...'}
          {video.status === 'ready' && 'Ready'}
          {video.status === 'processing' && 'Processing...'}
          {video.status === 'done' && 'Done'}
        </span>
        {video.size && (
          <span className="video-size">{formatFileSize(video.size)}</span>
        )}
      </div>
    </div>
  );
}

interface VideoPlayerProps {
  src: string | null;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  initialTime?: number;
}

export function VideoPlayer({ src, onTimeUpdate, onDurationChange, initialTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Convert local file path to URL for video element in Electron
  const videoSrc = useCallback((path: string | null): string | null => {
    if (!path) return null;
    
    // Check if it's already a URL
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    
    // For local files in Electron, use file:// protocol
    // This properly handles paths with spaces and special characters
    const normalizedPath = path.replace(/\\/g, '/');
    return `file://${normalizedPath}`;
  }, []);

  useEffect(() => {
    if (!src) {
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('[VideoPlayer] Video loaded successfully');
      setDuration(video.duration);
      if (onDurationChange) {
        onDurationChange(video.duration);
      }
      setIsLoading(false);
    };

    const handleError = () => {
      console.error('[VideoPlayer] Video error:', video.error);
      setError(video.error?.message || 'Failed to load video');
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Set the source
    const convertedSrc = videoSrc(src);
    if (convertedSrc) {
      video.src = convertedSrc;
      video.load();
      // Set initial time if provided
      if (initialTime > 0 && video.duration > initialTime) {
        video.currentTime = initialTime;
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, videoSrc, onTimeUpdate, onDurationChange, initialTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.error('[VideoPlayer] Play error:', err);
        setError('Failed to play video');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <div className="video-player empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Select a video to preview</p>
        <p className="hint">Import videos from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="video-player" data-testid="video-player">
      {error && (
        <div className="video-error">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="error-title">Failed to load video</p>
          <p className="error-message">{error}</p>
          <p className="error-hint">
            The file may have been moved or deleted.
            Try re-importing the video.
          </p>
        </div>
      )}
      
      {isLoading && !error && (
        <div className="video-loading">
          <div className="spinner" />
          <p>Loading video...</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        data-testid="video-element"
        style={{ display: error || isLoading ? 'none' : 'block', width: '100%', height: '100%' }}
      />
      
      {/* Video Controls */}
      {!error && !isLoading && (
        <div className="video-controls" data-testid="video-controls">
          {/* Progress Bar */}
          <div className="progress-bar">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="seek-slider"
              data-testid="seek-slider"
            />
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="control-buttons">
            <button onClick={togglePlay} className="play-btn" data-testid="play-button">
              {isPlaying ? (
                <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <div className="volume-control">
              <button onClick={toggleMute} className="mute-btn" data-testid="mute-button">
                {isMuted ? (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                data-testid="volume-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface VideoPreviewGridProps {
  videos: VideoFile[];
  selectedId: string | null;
  onSelectVideo: (id: string) => void;
}

export function VideoPreviewGrid({ videos, selectedId, onSelectVideo }: VideoPreviewGridProps) {
  if (videos.length === 0) {
    return (
      <div className="video-grid-empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No videos imported yet</p>
        <p className="hint">Import videos to get started</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoPreview
          key={video.id}
          video={video}
          isSelected={selectedId === video.id}
          onSelect={() => onSelectVideo(video.id)}
        />
      ))}
    </div>
  );
}
