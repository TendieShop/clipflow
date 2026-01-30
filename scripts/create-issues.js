#!/usr/bin/env node

/**
 * Create GitHub issues for ClipFlow production readiness
 * Run from: /Users/bilal/clawd/dev/clipflow
 */

const issues = [
  {
    title: "Critical: Implement state persistence for projects",
    body: `## Summary
Implement state persistence so videos and projects are saved between app sessions.

## Problem
Currently videos are stored in React state only (\`useState<VideoFile[]>([])\`). All imported videos are lost when the app restarts.

## Requirements
1. **LocalStorage persistence** for project metadata
2. **File-based project save/load** functionality  
3. **Auto-save** every 30 seconds
4. **Save As** and **Open Project** dialogs

## Technical Approach

### 1. Project Interface
\`\`\`typescript
// src/lib/project.ts
interface Project {
  id: string;
  name: string;
  videos: VideoFile[];
  createdAt: Date;
  updatedAt: Date;
}

interface AppState {
  currentProject: Project | null;
  projects: Project[];
  settings: AppSettings;
}
\`\`\`

### 2. Persistence Hook
\`\`\`typescript
export function useProject() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('clipflow-state');
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('clipflow-state', JSON.stringify(state));
  }, [state]);

  const saveProject = useCallback((name: string) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      videos: state.currentProject?.videos || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      currentProject: project,
    }));
  }, [state]);

  return { state, saveProject, loadProject, setState };
}
\`\`\`

### 3. UI Components Needed
- **Save Project Dialog**: Name input, save button
- **Open Project Dialog**: List projects with thumbnails
- **Project List in Sidebar**: Show saved projects

## Files to Modify
- \`src/lib/project.ts\` (new)
- \`src/lib/hooks/useProject.ts\` (new)
- \`src/App.tsx\` (integrate useProject)
- \`src/components/SaveDialog.tsx\` (new)
- \`src/components/OpenDialog.tsx\` (new)

## Definition of Done
- [ ] Videos persist after app restart
- [ ] Can save named projects
- [ ] Can open saved projects
- [ ] Auto-save works every 30 seconds
- [ ] Project list shows in sidebar
- [ ] E2E tests pass for save/load flow

## Related
- See: \`dev/clipflow/PRODUCTION_READINESS.md\` for full context

---
**Labels:** priority/critical, type/feature`,
    labels: "priority/critical,type/feature"
  },
  {
    title: "Critical: Implement crash recovery system",
    body: `## Summary
Implement crash recovery so user work is not lost when the app crashes or closes unexpectedly.

## Problem
Currently if the app crashes or closes unexpectedly, all work is lost with no way to recover.

## Requirements
1. **Auto-backup** every minute
2. **Restore from backup** on startup
3. **Manual backup** option
4. **Clear backup** option

## Technical Approach

### 1. CrashRecovery Class
\`\`\`typescript
// src/lib/crash-recovery.ts
class CrashRecovery {
  static backupState(state: AppState): void {
    const backup = {
      state,
      timestamp: Date.now(),
      version: APP_VERSION,
    };
    localStorage.setItem('clipflow-backup', JSON.stringify(backup));
  }

  static restoreState(): AppState | null {
    const backup = localStorage.getItem('clipflow-backup');
    if (!backup) return null;
    
    const data = JSON.parse(backup);
    // Check if backup is less than 24 hours old
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return data.state;
  }

  static clearBackup(): void {
    localStorage.removeItem('clipflow-backup');
  }
}
\`\`\`

### 2. Integration in App.tsx
\`\`\`typescript
// In App.tsx
const [state] = useState(() => 
  CrashRecovery.restoreState() || initialState
);

useEffect(() => {
  const interval = setInterval(() => {
    CrashRecovery.backupState(currentState);
  }, 60000);
  return () => clearInterval(interval);
}, [currentState]);
\`\`\`

### 3. Recovery Dialog
Show dialog on startup if backup exists:
- "We found an unsaved project from [timestamp]"
- "Restore" / "Start Fresh" buttons

## Files to Create/Modify
- \`src/lib/crash-recovery.ts\` (new)
- \`src/App.tsx\` (integrate)
- \`src/components/RecoveryDialog.tsx\` (new)

## Definition of Done
- [ ] Auto-backup every minute
- [ ] Backup persists across restarts
- [ ] Recovery dialog shows on startup with backup
- [ ] "Clear Backup" button works
- [ ] E2E tests pass for crash recovery

## Testing
1. Import videos, close app, reopen - verify recovery dialog
2. Clear backup, reopen - no dialog
3. Backup older than 24h - ignored

## Related
- See: \`dev/clipflow/PRODUCTION_READINESS.md\` for full context

---
**Labels:** priority/critical,type/feature`,
    labels: "priority/critical,type/feature"
  },
  {
    title: "Critical: Implement structured error handling",
    body: `## Summary
Replace string-based error handling with structured error types that include codes, recovery suggestions, and severity levels.

## Problem
Currently all errors are strings:
\`\`\`rust
Err(format!("ffmpeg failed: {}", error))
\`\`\`
This makes it impossible for the frontend to provide helpful recovery suggestions.

## Requirements
1. **Structured error enum** with error codes
2. **Recovery suggestions** for each error
3. **TypeScript error types** matching Rust errors
4. **Helpful error UI** in the frontend

## Technical Approach

### 1. Rust Error Types
\`\`\`rust
// src-tauri/src/errors.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ClipFlowError {
    #[error("Video not found: {path}")]
    VideoNotFound { path: String },
    
    #[error("FFmpeg failed: {message}")]
    FFmpegError { message: String, exit_code: i32 },
    
    #[error("Insufficient disk space: {required}MB required, {available}MB available")]
    InsufficientDiskSpace { required: u64, available: u64 },
    
    #[error("Unsupported format: {format}")]
    UnsupportedFormat { format: String },
    
    #[error("Transcription failed: {message}")]
    TranscriptionError { message: String, model: String },
    
    #[error("File access denied: {path}")]
    PermissionDenied { path: String },
}

impl ClipFlowError {
    pub fn recovery_suggestion(&self) -> &str {
        match self {
            Self::VideoNotFound { .. } => "The file may have been moved or deleted. Try re-importing.",
            Self::FFmpegError { .. } => "Check that FFmpeg is installed and the file is not corrupted.",
            Self::InsufficientDiskSpace { .. } => "Free up disk space or choose a different output location.",
            Self::UnsupportedFormat { .. } => "Supported formats: MP4, MOV, AVI, MKV, WebM, M4V",
            Self::TranscriptionError { .. } => "Check that Whisper is installed and you have enough RAM.",
            Self::PermissionDenied { .. } => "Check file permissions or choose a different location.",
        }
    }
    
    pub fn error_code(&self) -> i32 {
        match self {
            Self::VideoNotFound { .. } => 1001,
            Self::FFmpegError { .. } => 2001,
            Self::InsufficientDiskSpace { .. } => 3001,
            Self::UnsupportedFormat { .. } => 4001,
            Self::TranscriptionError { .. } => 5001,
            Self::PermissionDenied { .. } => 6001,
        }
    }
}
\`\`\`

### 2. TypeScript Error Types
\`\`\`typescript
// src/lib/errors.ts
export interface ClipFlowError {
  code: number;
  message: string;
  suggestion: string;
  details?: Record<string, any>;
}

export const ERROR_CODES = {
  VIDEO_NOT_FOUND: 1001,
  FFMPEG_ERROR: 2001,
  INSUFFICIENT_DISK_SPACE: 3001,
  UNSUPPORTED_FORMAT: 4001,
  TRANSCRIPTION_ERROR: 5001,
  PERMISSION_DENIED: 6001,
} as const;
\`\`\`

### 3. Error Display Component
\`\`\`typescript
function ErrorDisplay({ error }: { error: ClipFlowError }) {
  return (
    <div className="error-message">
      <p className="error-title">Error {error.code}: {error.message}</p>
      <p className="error-suggestion">Suggestion: {error.suggestion}</p>
    </div>
  );
}
\`\`\`

## Files to Create/Modify
- \`src-tauri/src/errors.rs\` (new)
- \`src/lib/errors.ts\` (new)
- \`src/lib/types.ts\` (update VideoFile types)
- \`src-tauri/src/main.rs\` (refactor all commands)
- \`src/components/ErrorDisplay.tsx\` (new)

## Definition of Done
- [ ] All Tauri commands return structured errors
- [ ] Frontend shows error codes and suggestions
- [ ] Error recovery suggestions are helpful
- [ ] All error paths tested

## Testing
1. Test each error path in Tauri commands
2. Verify frontend displays error correctly
3. Verify recovery suggestions are shown

## Related
- See: \`dev/clipflow/PRODUCTION_READINESS.md\` for full context

---
**Labels:** priority/critical,type/improvement`,
    labels: "priority/critical,type/improvement"
  },
  {
    title: "Critical: Implement structured logging system",
    body: `## Summary
Replace console.log statements with structured logging that includes timestamps, levels, actions, and context.

## Problem
Currently only \`console.log\` is used for logging with no structure, making debugging difficult.

## Requirements
1. **Structured logging** (timestamp, level, action, data)
2. **Log levels** (debug, info, warn, error)
3. **Log storage** for debugging
4. **Export logs** feature

## Technical Approach

### 1. Rust Logging with structlog
\`\`\`rust
// src-tauri/src/main.rs
use structlog::{info, warn, error};

info!(action = "import_video", path = file_path, "Starting import");
warn!(action = "ffmpeg_warning", message = output);
error!(action = "transcription_failed", error = e);
\`\`\`

### 2. Frontend Logging Hook
\`\`\`typescript
// src/lib/logging.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  action: string;
  data: Record<string, any>;
  version: string;
  platform: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogLevel, action: string, data: Record<string, any> = {}) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      action,
      data,
      version: APP_VERSION,
      platform: navigator.platform,
    };
    
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console[level](`[${level.toUpperCase()}] ${action}`, entry);
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}

export const log = new Logger();
\`\`\`

### 3. Log Viewer (Dev Mode)
\`\`\`typescript
// Dev-only log viewer panel
if (import.meta.env.DEV) {
  (window as any).clipflowLogs = log;
}
\`\`\`

## Files to Create/Modify
- \`src/lib/logging.ts\` (new)
- \`src-tauri/Cargo.toml\` (add structlog)
- \`src-tauri/src/main.rs\` (add logging)
- \`src/components/LogViewer.tsx\` (new, dev only)

## Definition of Done
- [ ] All Tauri commands log actions
- [ ] Frontend logs user actions
- [ ] Logs are stored in memory
- [ ] Export logs works
- [ ] Dev mode log viewer works

## Testing
1. Verify logs are created for all actions
2. Verify export produces valid JSON
3. Verify log viewer shows all logs in dev mode

## Related
- See: \`dev/clipflow/PRODUCTION_READINESS.md\` for full context

---
**Labels:** priority/critical,type/improvement`,
    labels: "priority/critical,type/improvement"
  }
];

console.log('Issues defined:', issues.length);
console.log(JSON.stringify(issues, null, 2));
