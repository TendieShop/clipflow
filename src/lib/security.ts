// Security utilities for ClipFlow
// Input validation, sanitization, and security helpers

/**
 * Validates a file path for security
 * - Prevents path traversal attacks
 * - Blocks dangerous characters
 * - Returns false for invalid paths
 */
export function validateFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // Check for path traversal attempts
  const dangerousPatterns = [
    /\.\./,           // Double dots (parent directory)
    /~/,              // Home directory
    /\0/,             // Null bytes
    /;/,              // Command separator
    /\|/,             // Pipe
    /&/,              // Ampersand
    /\$/,             // Dollar sign (variable expansion)
    /`/,              // Backtick (command substitution)
    /\(/,             // Open paren
    /\)/,             // Close paren
    /\{/,             // Open brace
    /\}/,             // Close brace
    /\[/,             // Open bracket
    /\]/,             // Close bracket
    /</,              // Less than (redirection)
    />/,              // Greater than (redirection)
    /'/g,             // Single quotes (shell escape)
    /"/g,             // Double quotes (shell escape)
    /\n/,             // Newlines
    /\r/,             // Carriage returns
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(path)) {
      return false;
    }
  }

  // Must be an absolute path or relative to a known directory
  if (path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
    return true;
  }

  // Allow relative paths that don't escape
  return !path.startsWith('..') && !path.includes('../');
}

/**
 * Sanitizes user input to prevent XSS
 * Escapes HTML special characters
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes text for safe display
 * Removes control characters
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validates project name
 * - Allows alphanumeric, spaces, dashes, underscores
 * - Max length 100 characters
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Project name is required' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Project name must be 100 characters or less' };
  }

  // Allow letters, numbers, spaces, dashes, underscores, and periods
  if (!/^[a-zA-Z0-9 _\-\.]+$/.test(name)) {
    return { valid: false, error: 'Project name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validates video format
 * Returns true if format is supported
 */
export function isValidVideoFormat(format: string): boolean {
  if (!format || typeof format !== 'string') {
    return false;
  }

  const supportedFormats = [
    'mp4',
    'mov',
    'avi',
    'mkv',
    'webm',
    'm4v',
  ];

  return supportedFormats.includes(format.toLowerCase());
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Checks if file is a video based on extension
 */
export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return isValidVideoFormat(ext);
}

/**
 * Rate limiter for API calls
 * Tracks call counts per time window
 */
export class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 10, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed
   * Returns true if allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing calls for this key
    const calls = this.calls.get(key) || [];
    const recentCalls = calls.filter((time: number) => time > windowStart);

    if (recentCalls.length >= this.maxCalls) {
      return false;
    }

    // Add this call
    recentCalls.push(now);
    this.calls.set(key, recentCalls);

    return true;
  }

  /**
   * Get remaining calls for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const calls = this.calls.get(key) || [];
    const recentCalls = calls.filter((time: number) => time > windowStart);

    return Math.max(0, this.maxCalls - recentCalls.length);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.calls.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.calls.clear();
  }
}

/**
 * Sanitizes file metadata for logging
 * Removes sensitive information
 */
export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    'password',
    'token',
    'key',
    'secret',
    'auth',
    'credential',
    'private',
    'path',
    'filepath',
  ];

  for (const [key, value] of Object.entries(data)) {
    const isSensitive = sensitiveKeys.some((sk) =>
      key.toLowerCase().includes(sk)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generates a secure random ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Debounce for security-sensitive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
