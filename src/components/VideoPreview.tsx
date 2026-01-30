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
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

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
        <div className="video-overlay">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
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

interface VideoPlayerProps {
  src: string | null;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert local file path to URL for video element
  const videoSrc = useCallback((path: string | null): string | null => {
    if (!path) return null;
    
    // Check if it's already a URL
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    
    // In Tauri context, use convertFileSrc for local files
    // This handles special characters and spaces in paths
    try {
      // For local files, we need to encode the path properly
      const encodedPath = encodeURIComponent(path);
      return `http://localhost:1420/assets/${encodedPath}`;
    } catch (e) {
      console.error('[VideoPlayer] Failed to convert file path:', e);
      return path;
    }
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

    const convertedSrc = videoSrc(src);
    console.log('[VideoPlayer] Loading video:', {
      original: src,
      converted: convertedSrc
    });

    const handleLoadedMetadata = () => {
      console.log('[VideoPlayer] Video loaded successfully');
      setIsLoading(false);
    };

    const handleError = () => {
      console.error('[VideoPlayer] Video error:', video.error);
      setError(video.error?.message || 'Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // Set the source
    if (convertedSrc) {
      video.src = convertedSrc;
      video.load();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [src, videoSrc]);

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
    <div className="video-player">
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
        controls
        style={{ display: error || isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}
