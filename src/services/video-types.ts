export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
  codec: string;
  bitrate: number;
  fps: number;
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

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

export interface ExportSettings {
  quality: 'low' | 'medium' | 'high';
  format: string;
}
