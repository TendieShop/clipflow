// Structured error types for ClipFlow
// Provides error codes, messages, and recovery suggestions

export class ClipFlowError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly suggestion?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ClipFlowError';
  }
}

export enum ErrorCode {
  // Video errors (1000-1999)
  VIDEO_NOT_FOUND = 1001,
  VIDEO_READ_ERROR = 1002,
  VIDEO_CORRUPTED = 1003,
  UNSUPPORTED_FORMAT = 1004,
  VIDEO_TOO_LARGE = 1005,
  
  // FFmpeg errors (2000-2999)
  FFMPEG_NOT_FOUND = 2001,
  FFMPEG_FAILED = 2002,
  FFMPEG_TIMEOUT = 2003,
  FFMPEG_PERMISSION_DENIED = 2004,
  
  // Export errors (3000-3999)
  EXPORT_FAILED = 3001,
  EXPORT_DISK_FULL = 3002,
  EXPORT_INVALID_FORMAT = 3003,
  
  // Transcription errors (4000-4999)
  TRANSCRIPTION_FAILED = 4001,
  TRANSCRIPTION_MODEL_MISSING = 4002,
  TRANSCRIPTION_OUT_OF_MEMORY = 4003,
  
  // Storage errors (5000-5999)
  STORAGE_FULL = 5001,
  STORAGE_PERMISSION_DENIED = 5002,
  STORAGE_CORRUPTED = 5003,
  
  // System errors (6000-6999)
  UNKNOWN = 6001,
  NOT_IMPLEMENTED = 6002,
  INVALID_STATE = 6003,
}

const ERROR_MESSAGES: Record<ErrorCode, { message: string; suggestion: string }> = {
  [ErrorCode.VIDEO_NOT_FOUND]: {
    message: 'Video file not found',
    suggestion: 'The file may have been moved or deleted. Try re-importing the video.',
  },
  [ErrorCode.VIDEO_READ_ERROR]: {
    message: 'Could not read video file',
    suggestion: 'Check that the file is not corrupted and you have read permissions.',
  },
  [ErrorCode.VIDEO_CORRUPTED]: {
    message: 'Video file is corrupted',
    suggestion: 'Try re-encoding the video or use a different source file.',
  },
  [ErrorCode.UNSUPPORTED_FORMAT]: {
    message: 'Unsupported video format',
    suggestion: 'Supported formats: MP4, MOV, AVI, MKV, WebM, M4V. Convert to a supported format.',
  },
  [ErrorCode.VIDEO_TOO_LARGE]: {
    message: 'Video file is too large',
    suggestion: 'Try splitting the video into smaller segments or use a lower resolution.',
  },
  [ErrorCode.FFMPEG_NOT_FOUND]: {
    message: 'FFmpeg not found',
    suggestion: 'Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)',
  },
  [ErrorCode.FFMPEG_FAILED]: {
    message: 'FFmpeg processing failed',
    suggestion: 'Check the video format is supported and try again.',
  },
  [ErrorCode.FFMPEG_TIMEOUT]: {
    message: 'FFmpeg processing timed out',
    suggestion: 'The video may be too long or complex. Try a shorter video.',
  },
  [ErrorCode.FFMPEG_PERMISSION_DENIED]: {
    message: 'FFmpeg permission denied',
    suggestion: 'Check file permissions or try running with elevated privileges.',
  },
  [ErrorCode.EXPORT_FAILED]: {
    message: 'Export failed',
    suggestion: 'Check available disk space and try again.',
  },
  [ErrorCode.EXPORT_DISK_FULL]: {
    message: 'Not enough disk space',
    suggestion: 'Free up space or choose a different output location.',
  },
  [ErrorCode.EXPORT_INVALID_FORMAT]: {
    message: 'Invalid export format',
    suggestion: 'Choose a supported format: MP4, MOV, WebM.',
  },
  [ErrorCode.TRANSCRIPTION_FAILED]: {
    message: 'Transcription failed',
    suggestion: 'Check Whisper is installed and you have enough RAM.',
  },
  [ErrorCode.TRANSCRIPTION_MODEL_MISSING]: {
    message: 'Whisper model not found',
    suggestion: 'Download the model: whisper --model base --output_format srt input.mp4',
  },
  [ErrorCode.TRANSCRIPTION_OUT_OF_MEMORY]: {
    message: 'Out of memory during transcription',
    suggestion: 'Try a smaller Whisper model (tiny instead of base) or close other apps.',
  },
  [ErrorCode.STORAGE_FULL]: {
    message: 'Storage full',
    suggestion: 'Free up disk space to continue.',
  },
  [ErrorCode.STORAGE_PERMISSION_DENIED]: {
    message: 'Permission denied',
    suggestion: 'Check folder permissions or choose a different location.',
  },
  [ErrorCode.STORAGE_CORRUPTED]: {
    message: 'Storage corrupted',
    suggestion: 'Try clearing cache or resetting the application.',
  },
  [ErrorCode.UNKNOWN]: {
    message: 'An unknown error occurred',
    suggestion: 'Please try again. If the problem persists, report this issue.',
  },
  [ErrorCode.NOT_IMPLEMENTED]: {
    message: 'Feature not implemented',
    suggestion: 'This feature is coming soon!',
  },
  [ErrorCode.INVALID_STATE]: {
    message: 'Invalid application state',
    suggestion: 'Try restarting the application.',
  },
};

// Error factory functions
export function videoNotFound(path: string): ClipFlowError {
  return new ClipFlowError(
    ErrorCode.VIDEO_NOT_FOUND,
    `Video not found: ${path}`,
    ERROR_MESSAGES[ErrorCode.VIDEO_NOT_FOUND].suggestion,
    { path }
  );
}

export function ffmpegFailed(exitCode: number, message: string): ClipFlowError {
  return new ClipFlowError(
    ErrorCode.FFMPEG_FAILED,
    `FFmpeg failed with exit code ${exitCode}: ${message}`,
    ERROR_MESSAGES[ErrorCode.FFMPEG_FAILED].suggestion,
    { exitCode, message }
  );
}

export function unsupportedFormat(format: string): ClipFlowError {
  return new ClipFlowError(
    ErrorCode.UNSUPPORTED_FORMAT,
    `Unsupported format: ${format}`,
    ERROR_MESSAGES[ErrorCode.UNSUPPORTED_FORMAT].suggestion,
    { format }
  );
}

export function exportFailed(error: string): ClipFlowError {
  return new ClipFlowError(
    ErrorCode.EXPORT_FAILED,
    `Export failed: ${error}`,
    ERROR_MESSAGES[ErrorCode.EXPORT_FAILED].suggestion,
    { error }
  );
}

export function storageFull(required: number, available: number): ClipFlowError {
  return new ClipFlowError(
    ErrorCode.EXPORT_DISK_FULL,
    `Not enough disk space. Required: ${required}MB, Available: ${available}MB`,
    ERROR_MESSAGES[ErrorCode.EXPORT_DISK_FULL].suggestion,
    { required, available }
  );
}

// Error handler for UI
export function handleError(error: unknown): { message: string; suggestion: string; code: number } {
  if (error instanceof ClipFlowError) {
    const info = ERROR_MESSAGES[error.code] || ERROR_MESSAGES[ErrorCode.UNKNOWN];
    return {
      message: error.message,
      suggestion: error.suggestion || info.suggestion,
      code: error.code,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      suggestion: ERROR_MESSAGES[ErrorCode.UNKNOWN].suggestion,
      code: ErrorCode.UNKNOWN,
    };
  }
  
  return {
    message: 'An unknown error occurred',
    suggestion: ERROR_MESSAGES[ErrorCode.UNKNOWN].suggestion,
    code: ErrorCode.UNKNOWN,
  };
}

// Is this error retryable?
export function isRetryable(error: unknown): boolean {
  if (error instanceof ClipFlowError) {
    const retryable = [
      ErrorCode.FFMPEG_TIMEOUT,
      ErrorCode.TRANSCRIPTION_OUT_OF_MEMORY,
      ErrorCode.STORAGE_FULL,
    ];
    return retryable.includes(error.code);
  }
  return false;
}
