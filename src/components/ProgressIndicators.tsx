// Progress Indicators - UI components for long-running operations
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ProgressInfo } from '../lib/performance';

interface ProgressIndicatorProps {
  operation: string;
  progress: ProgressInfo | null;
  onCancel?: () => void;
}

export function ProgressIndicator({
  operation,
  progress,
  onCancel,
}: ProgressIndicatorProps) {
  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{operation}</CardTitle>
          <CardDescription>Waiting to start...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatTime = (ms: number | undefined): string => {
    if (ms === undefined || ms === null) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (mbps: number | undefined): string => {
    if (mbps === undefined || mbps === null) return '-- MB/s';
    return `${mbps.toFixed(1)} MB/s`;
  };

  const getStatusColor = (stage: ProgressInfo['stage']): string => {
    switch (stage) {
      case 'complete': return 'var(--success)';
      case 'error': return 'var(--error)';
      case 'processing': return 'var(--accent)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{operation}</CardTitle>
            <CardDescription style={{ color: getStatusColor(progress.stage) }}>
              {progress.stage === 'starting' && 'Starting...'}
              {progress.stage === 'processing' && 'Processing...'}
              {progress.stage === 'complete' && 'Complete!'}
              {progress.stage === 'error' && 'Error occurred'}
            </CardDescription>
          </div>
          {onCancel && progress.stage === 'processing' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: getStatusColor(progress.stage),
              }}
            />
          </div>
          <span className="progress-percent">{progress.percent.toFixed(1)}%</span>
        </div>

        {/* Stats grid */}
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-label">Processed</span>
            <span className="stat-value">{progress.mbProcessed.toFixed(1)} MB / {progress.mbTotal.toFixed(1)} MB</span>
          </div>
          
          <div className="stat">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{formatSpeed(progress.speedMBps)}</span>
          </div>
          
          <div className="stat">
            <span className="stat-label">Elapsed</span>
            <span className="stat-value">{formatTime(progress.elapsedMs)}</span>
          </div>
          
          <div className="stat">
            <span className="stat-label">Remaining</span>
            <span className="stat-value">{formatTime(progress.estimatedRemainingMs)}</span>
          </div>
        </div>

        <style>{`
          .progress-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .progress-bar {
            flex: 1;
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
          }
          
          .progress-percent {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            min-width: 50px;
            text-align: right;
          }
          
          .progress-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .stat {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: var(--text-muted);
          }
          
          .stat-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
          }
          
          .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}

// Memory Monitor Component
interface MemoryMonitorProps {
  warningThreshold?: number;
  criticalThreshold?: number;
}

export function MemoryMonitor({
  warningThreshold = 80,
  criticalThreshold = 95,
}: MemoryMonitorProps) {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    limit: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  } | null>(null);

  useEffect(() => {
    const updateMemory = () => {
      // performance.memory is Chrome-only
      const perf = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (!perf) {
        setMemoryInfo(null);
        return;
      }

      const used = perf.usedJSHeapSize / (1024 * 1024); // MB
      const limit = perf.jsHeapSizeLimit / (1024 * 1024); // MB
      const percentage = (perf.usedJSHeapSize / perf.jsHeapSizeLimit) * 100;

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (percentage >= criticalThreshold) status = 'critical';
      else if (percentage >= warningThreshold) status = 'warning';

      setMemoryInfo({ used, limit, percentage, status });
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [warningThreshold, criticalThreshold]);

  if (!memoryInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
          <CardDescription>Not available in this browser</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'critical': return 'var(--error)';
      case 'warning': return 'var(--warning)';
      default: return 'var(--success)';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Memory Usage</CardTitle>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(memoryInfo.status) }}
          >
            {memoryInfo.status.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="memory-bar-container">
          <div className="memory-bar">
            <div
              className="memory-fill"
              style={{
                width: `${memoryInfo.percentage}%`,
                backgroundColor: getStatusColor(memoryInfo.status),
              }}
            />
            {/* Threshold markers */}
            <div
              className="threshold-marker"
              style={{ left: `${warningThreshold}%` }}
              title={`Warning threshold: ${warningThreshold}%`}
            />
            <div
              className="threshold-marker critical"
              style={{ left: `${criticalThreshold}%` }}
              title={`Critical threshold: ${criticalThreshold}%`}
            />
          </div>
          <span className="memory-percent">{memoryInfo.percentage.toFixed(1)}%</span>
        </div>

        <div className="memory-stats">
          <div className="stat">
            <span className="stat-label">Used</span>
            <span className="stat-value">{memoryInfo.used.toFixed(0)} MB</span>
          </div>
          <div className="stat">
            <span className="stat-label">Available</span>
            <span className="stat-value">{(memoryInfo.limit - memoryInfo.used).toFixed(0)} MB</span>
          </div>
          <div className="stat">
            <span className="stat-label">Limit</span>
            <span className="stat-value">{memoryInfo.limit.toFixed(0)} MB</span>
          </div>
        </div>

        <style>{`
          .memory-bar-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .memory-bar {
            flex: 1;
            height: 12px;
            background: var(--bg-tertiary);
            border-radius: 6px;
            overflow: hidden;
            position: relative;
          }
          
          .memory-fill {
            height: 100%;
            transition: width 0.3s ease;
          }
          
          .threshold-marker {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--warning);
            z-index: 1;
          }
          
          .threshold-marker.critical {
            background: var(--error);
          }
          
          .memory-percent {
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 50px;
          }
          
          .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.625rem;
            font-weight: 600;
            color: white;
          }
          
          .memory-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
          
          .stat {
            text-align: center;
            padding: 0.5rem;
            background: var(--bg-secondary);
            border-radius: 6px;
          }
          
          .stat-label {
            display: block;
            font-size: 0.625rem;
            color: var(--text-muted);
            margin-bottom: 0.25rem;
          }
          
          .stat-value {
            font-size: 0.875rem;
            font-weight: 500;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
