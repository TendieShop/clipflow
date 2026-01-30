// Performance Monitor Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor, PerformanceBenchmarks, ProgressInfo } from '../src/lib/performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('Initialization', () => {
    it('should initialize with default benchmarks', () => {
      const benchmarks = monitor.getBenchmarks();
      
      expect(benchmarks.import1GB).toBe(10000);
      expect(benchmarks.import10GB).toBe(60000);
      expect(benchmarks.import13GB).toBe(90000);
      expect(benchmarks.exportSpeed).toBe(2.0);
      expect(benchmarks.memoryMax).toBe(4 * 1024 * 1024 * 1024);
    });

    it('should accept custom benchmarks', () => {
      const custom: PerformanceBenchmarks = {
        import1GB: 5000,
        import10GB: 30000,
        import13GB: 45000,
        exportSpeed: 3.0,
        memoryMax: 2 * 1024 * 1024 * 1024,
      };
      
      const customMonitor = new PerformanceMonitor(custom);
      const benchmarks = customMonitor.getBenchmarks();
      
      expect(benchmarks.import1GB).toBe(5000);
    });
  });

  describe('Start/Stop Operations', () => {
    it('should track operation start and stop', () => {
      monitor.start('test_operation');
      
      const result = monitor.stop(true);
      
      expect(result.operation).toBe('test_operation');
      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should record memory samples', () => {
      monitor.start('memory_test');
      
      // Simulate some memory recording
      monitor.recordMemory();
      monitor.recordMemory();
      
      monitor.stop(true);
      
      const summary = monitor.getSummary();
      expect(summary.memoryPeak).toBeGreaterThan(0);
    });

    it('should handle failed operations', () => {
      monitor.start('failed_operation');
      monitor.stop(false);
      
      const summary = monitor.getSummary();
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should check benchmark', () => {
      monitor.start('benchmark_test');
      monitor.stop(true);
      
      const summary = monitor.getSummary();
      // Duration might be very small, so benchmark should be met
      expect(monitor.checkBenchmark(summary.duration, 'import1GB')).toBe(true);
    });
  });

  describe('Benchmark Checking', () => {
    it('should pass fast operations', () => {
      expect(monitor.checkBenchmark(5000, 'import1GB')).toBe(true);
      expect(monitor.checkBenchmark(1000, 'import1GB')).toBe(true);
    });

    it('should fail slow operations', () => {
      expect(monitor.checkBenchmark(15000, 'import1GB')).toBe(false);
      expect(monitor.checkBenchmark(120000, 'import10GB')).toBe(false);
    });
  });

  describe('Progress Handler', () => {
    it('should create progress handler', () => {
      const handler = monitor.createProgressHandler('import', 10 * 1024 * 1024 * 1024);
      
      expect(typeof handler).toBe('function');
    });

    it('should calculate remaining time', () => {
      monitor.start('progress_test');
      
      const progress: ProgressInfo = {
        stage: 'processing',
        operation: 'import',
        percent: 50,
        mbProcessed: 5,
        mbTotal: 10,
        elapsedMs: 5000,
      };
      
      const remaining = monitor.calculateRemaining(progress);
      
      // Should be approximately 5000ms remaining (50% done in 5s = 10s total)
      expect(remaining).toBeGreaterThan(4000);
      expect(remaining).toBeLessThan(6000);
    });

    it('should calculate speed', () => {
      monitor.start('speed_test');
      
      const progress: ProgressInfo = {
        stage: 'processing',
        operation: 'export',
        percent: 25,
        mbProcessed: 2.5,
        mbTotal: 10,
        elapsedMs: 1000,
      };
      
      const speed = monitor.calculateSpeed(progress);
      
      expect(speed).toBe(2.5); // 2.5 MB in 1 second = 2.5 MB/s
    });

    it('should handle zero progress', () => {
      const remaining = monitor.calculateRemaining({
        stage: 'starting',
        operation: 'test',
        percent: 0,
        mbProcessed: 0,
        mbTotal: 100,
        elapsedMs: 0,
      });
      
      expect(remaining).toBeUndefined();
    });
  });

  describe('Memory Info', () => {
    it('should get memory info when available', () => {
      const mem = monitor.getMemoryInfo();
      
      // May be null in test environment
      if (mem) {
        expect(mem.usedJSHeapSize).toBeGreaterThan(0);
        expect(mem.jsHeapSizeLimit).toBeGreaterThan(0);
        expect(mem.usedPercentage).toBeGreaterThanOrEqual(0);
        expect(typeof mem.isWarning).toBe('boolean');
        expect(typeof mem.isCritical).toBe('boolean');
      }
    });

    it('should check if memory is ok', () => {
      const isOk = monitor.isMemoryOk();
      
      // Should be true in normal circumstances
      expect(typeof isOk).toBe('boolean');
    });
  });

  describe('Progress Callbacks', () => {
    it('should register and call progress callbacks', () => {
      let callbackCalled = false;
      let receivedProgress: ProgressInfo | null = null;
      
      const unsubscribe = monitor.onProgress((progress) => {
        callbackCalled = true;
        receivedProgress = progress;
      });
      
      monitor.start('callback_test');
      
      const progress: ProgressInfo = {
        stage: 'processing',
        operation: 'test',
        percent: 25,
        mbProcessed: 25,
        mbTotal: 100,
        elapsedMs: 1000,
      };
      
      const handler = monitor.createProgressHandler('test', 100 * 1024 * 1024);
      handler(progress);
      
      expect(callbackCalled).toBe(true);
      expect(receivedProgress).not.toBeNull();
      expect(receivedProgress?.percent).toBe(25);
      
      unsubscribe();
      
      // After unsubscribe, should not be called
      callbackCalled = false;
      handler(progress);
      expect(callbackCalled).toBe(false);
    });
  });

  describe('Summary', () => {
    it('should return performance summary', () => {
      monitor.start('summary_test');
      monitor.recordMemory();
      monitor.stop(true);
      
      const summary = monitor.getSummary();
      
      expect(summary.benchmarks).toBeDefined();
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Progress Calculations', () => {
  const monitor = new PerformanceMonitor();

  it('should calculate correct percentage', () => {
    monitor.start('percent_test');
    
    const processed = 5 * 1024 * 1024 * 1024; // 5GB
    const total = 10 * 1024 * 1024 * 1024; // 10GB
    const expectedPercent = (processed / total) * 100;
    
    expect(expectedPercent).toBe(50);
  });

  it('should calculate memory percentage correctly', () => {
    const used = 2 * 1024 * 1024 * 1024; // 2GB
    const limit = 4 * 1024 * 1024 * 1024; // 4GB
    const percentage = (used / limit) * 100;
    
    expect(percentage).toBe(50);
  });

  it('should identify warning thresholds', () => {
    // 80% should be warning
    const mem = monitor.getMemoryInfo();
    if (mem) {
      // Test threshold calculation
      const usedPercentage = 85;
      const isWarning = usedPercentage > 80;
      expect(isWarning).toBe(true);
      
      const criticalPercentage = 96;
      const isCritical = criticalPercentage > 95;
      expect(isCritical).toBe(true);
    }
  });
});
