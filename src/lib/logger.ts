// Structured logging for ClipFlow
// Replaces console.log with structured, storable logs

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  action: string;
  data: Record<string, unknown>;
  version: string;
  platform: string;
}

const LOG_KEY = 'clipflow-logs';
const MAX_LOGS = 1000;

// Get app version safely
const getAppVersion = (): string => {
  try {
    // @ts-ignore - APP_VERSION would be injected at build time
    return typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0';
  } catch {
    return '1.0.0';
  }
};

export function log(level: LogLevel, action: string, data: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    action,
    data: sanitizeData(data),
    version: getAppVersion(),
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  };
  
  // Console output with structured format
  console[level](`[${level.toUpperCase()}] ${action}`, entry);
  
  // Store logs
  storeLog(entry);
}

function storeLog(entry: LogEntry): void {
  try {
    const logs = getLogs();
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs.shift(); // Remove oldest
    }
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    // Storage full or disabled - silently fail
    console.warn('[logger] Failed to store log');
  }
}

export function getLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return getLogs().filter(entry => entry.level === level);
}

export function getLogsByAction(action: string): LogEntry[] {
  return getLogs().filter(entry => entry.action === action);
}

export function exportLogs(): string {
  return JSON.stringify(getLogs(), null, 2);
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_KEY);
}

// Filter out sensitive data
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
  
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = sensitiveKeys.some(sk => key.toLowerCase().includes(sk));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Convenience functions - use logError to avoid shadowing console.error
export const info = (action: string, data?: Record<string, unknown>) => log('info', action, data);
export const warn = (action: string, data?: Record<string, unknown>) => log('warn', action, data);
export const logError = (action: string, data?: Record<string, unknown>) => log('error', action, data);
export const debug = (action: string, data?: Record<string, unknown>) => log('debug', action, data);

// Backward compatibility alias
export const error = logError;

// Action-specific loggers
export const logImport = {
  started: (path: string) => info('import.started', { path }),
  completed: (path: string, duration: number) => info('import.completed', { path, duration }),
  failed: (path: string, errorMsg: string) => logError('import.failed', { path, error: errorMsg }),
};

export const logExport = {
  started: (format: string, quality: string) => info('export.started', { format, quality }),
  progress: (percent: number) => debug('export.progress', { percent }),
  completed: (path: string, duration: number) => info('export.completed', { path, duration }),
  failed: (errorMsg: string) => logError('export.failed', { error: errorMsg }),
};

export const logFFmpeg = {
  started: (command: string) => debug('ffmpeg.started', { command: command.slice(0, 100) }),
  completed: (duration: number) => debug('ffmpeg.completed', { duration }),
  error: (exitCode: number, message: string) => logError('ffmpeg.error', { exitCode, message }),
};

export const logCrash = {
  state: (state: string) => warn('crash.state_backup', { state }),
  recovery: (success: boolean) => info('crash.recovery', { success }),
};
