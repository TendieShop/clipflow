import { useRef } from 'react';

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  duration: number;
  thumbnail?: string;
  status: 'importing' | 'ready' | 'processing' | 'done';
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
        <div className="video-duration">{formatDuration(video.duration)}</div>
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

  if (!src) {
    return (
      <div className="video-player empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Select a video to preview</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      <video ref={videoRef} src={src} controls />
    </div>
  );
}
