// Performance Monitor - Track metrics for large file operations
// Supports memory monitoring, progress tracking, and benchmarks

import { info, warn, error } from './logger';

// Performance benchmarks
export interface PerformanceBenchmarks {
  import1GB: number;      // max ms for 1GB file
  import10GB: number;     // max ms for 10GB file
  import13GB: number;     // max ms for 13GB file
  exportSpeed: number;    // min multiplier of real-time
  memoryMax: number;      // max bytes
}

export const DEFAULT_BENCHMARKS: PerformanceBenchmarks = {
  import1GB: 10000,       // 10 seconds
  import10GB: 60000,      // 60 seconds
  import13GB: 90000,      // 90 seconds
  exportSpeed: 2.0,       // 2x real-time minimum
  memoryMax: 4 * 1024 * 1024 * 1024, // 4GB
};

// Progress callback type
export type ProgressCallback = (progress: ProgressInfo) => void;

export interface ProgressInfo {
  stage: 'starting' | 'processing' | 'complete' | 'error';
  operation: string;
  percent: number;           // 0-100
  mbProcessed: number;
  mbTotal: number;
  elapsedMs: number;
  estimatedRemainingMs?: number;
  speedMBps?: number;
}

// Memory info
export interface MemoryInfo {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
  isWarning: boolean;
  isCritical: boolean;
}

// Performance result
export interface PerformanceResult {
  operation: string;
  success: boolean;
  durationMs: number;
  memoryPeak: number;
  memoryAverage: number;
  benchmarkMet: boolean;
  benchmarkTarget?: number;
  error?: string;
}

class PerformanceMonitor {
  private benchmarks: PerformanceBenchmarks;
  private memorySamples: number[];
  private startTime: number;
  private operationName: string;
  private progressCallbacks: Set<ProgressCallback>;
  private memoryWarningSent: boolean;
  private memoryCriticalSent: boolean;

  constructor(benchmarks: PerformanceBenchmarks = DEFAULT_BENCHMARKS) {
    this.benchmarks = benchmarks;
    this.memorySamples = [];
    this.startTime = 0;
    this.operationName = '';
    this.progressCallbacks = new Set();
    this.memoryWarningSent = false;
    this.memoryCriticalSent = false;
  }

  /**
   * Start monitoring an operation
   */
  start(operation: string): void {
    this.operationName = operation;
    this.startTime = Date.now();
    this.memorySamples = [];
    this.memoryWarningSent = false;
    this.memoryCriticalSent = false;
    
    this.recordMemory();
    info('performance_operation_started', { operation });
  }

  /**
   * Stop monitoring and return results
   */
  stop(success: boolean = true, benchmarkTarget?: number): PerformanceResult {
    const durationMs = Date.now() - this.startTime;
    const memoryPeak = Math.max(...this.memorySamples);
    const memoryAverage = this.memorySamples.reduce((a, b) => a + b, 0) / this.memorySamples.length;
    
    const result: PerformanceResult = {
      operation: this.operationName,
      success,
      durationMs,
      memoryPeak,
      memoryAverage,
      benchmarkMet: true,
    };

    if (benchmarkTarget !== undefined) {
      result.benchmarkTarget = benchmarkTarget;
      result.benchmarkMet = durationMs <= benchmarkTarget;
    }

    if (!success) {
      result.error = 'Operation failed';
    }

    info('performance_operation_completed', {
      operation: this.operationName,
      success,
      durationMs,
      memoryPeak,
      benchmarkMet: result.benchmarkMet,
    });

    return result;
  }

  /**
   * Record current memory usage
   */
  recordMemory(): void {
    const mem = this.getMemoryInfo();
    if (mem) {
      this.memorySamples.push(mem.usedJSHeapSize);
      
      // Send warnings
      if (mem.isCritical && !this.memoryCriticalSent) {
        error('memory_critical', { used: mem.usedJSHeapSize, limit: mem.jsHeapSizeLimit });
        this.memoryCriticalSent = true;
      } else if (mem.isWarning && !this.memoryWarningSent) {
        warn('memory_warning', { used: mem.usedJSHeapSize, limit: mem.jsHeapSizeLimit });
        this.memoryWarningSent = true;
      }
    }
  }

  /**
   * Get current memory info
   */
  getMemoryInfo(): MemoryInfo | null {
    // performance.memory is Chrome-only, use type assertion
    const perf = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!perf) {
      return null; // Not supported in this browser
    }

    const used = perf.usedJSHeapSize;
    const limit = perf.jsHeapSizeLimit;
    const usedPercentage = (used / limit) * 100;

    return {
      usedJSHeapSize: used,
      jsHeapSizeLimit: limit,
      usedPercentage,
      isWarning: usedPercentage > 80,
      isCritical: usedPercentage > 95,
    };
  }

  /**
   * Check if memory is within limits
   */
  isMemoryOk(): boolean {
    const mem = this.getMemoryInfo();
    if (!mem) return true;
    return !mem.isCritical;
  }

  /**
   * Calculate time remaining based on progress
   */
  calculateRemaining(progress: ProgressInfo): number | undefined {
    if (progress.percent <= 0) return undefined;
    
    const elapsedMs = Date.now() - this.startTime;
    const totalEstimated = elapsedMs / (progress.percent / 100);
    const remaining = totalEstimated - elapsedMs;
    
    return Math.max(0, remaining);
  }

  /**
   * Calculate speed in MB/s
   */
  calculateSpeed(progress: ProgressInfo): number {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    if (elapsedSeconds <= 0) return 0;
    return progress.mbProcessed / elapsedSeconds;
  }

  /**
   * Create a progress callback handler
   */
  createProgressHandler(
    operation: string,
    _totalBytes: number,
    onProgress?: (progress: ProgressInfo) => void
  ): ProgressCallback {
    return (progress: ProgressInfo) => {
      this.recordMemory();
      
      // Add calculated fields
      const enhanced: ProgressInfo = {
        ...progress,
        estimatedRemainingMs: this.calculateRemaining(progress),
        speedMBps: this.calculateSpeed(progress),
      };

      // Call registered callbacks
      this.progressCallbacks.forEach(cb => cb(enhanced));
      
      // Call optional direct callback
      onProgress?.(enhanced);

      info('progress', { 
        operation, 
        percent: enhanced.percent,
        speedMBps: enhanced.speedMBps,
      });
    };
  }

  /**
   * Register a progress callback
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Get current benchmarks
   */
  getBenchmarks(): PerformanceBenchmarks {
    return { ...this.benchmarks };
  }

  /**
   * Check if benchmark is met
   */
  checkBenchmark(durationMs: number, benchmark: keyof PerformanceBenchmarks): boolean {
    return durationMs <= this.benchmarks[benchmark];
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    memoryCurrent: MemoryInfo | null;
    memoryPeak: number;
    memoryAverage: number;
    duration: number;
    benchmarks: PerformanceBenchmarks;
  } {
    const mem = this.getMemoryInfo();
    const peak = this.memorySamples.length > 0 ? Math.max(...this.memorySamples) : 0;
    const avg = this.memorySamples.length > 0 
      ? this.memorySamples.reduce((a, b) => a + b, 0) / this.memorySamples.length 
      : 0;

    return {
      memoryCurrent: mem,
      memoryPeak: peak,
      memoryAverage: avg,
      duration: this.startTime > 0 ? Date.now() - this.startTime : 0,
      benchmarks: this.benchmarks,
    };
  }
}

// Singleton for app-wide use
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

export { PerformanceMonitor };
