import { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

export interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  color: string;
  thumbnail?: string;
}

interface TimelineReorderingProps {
  clips: TimelineClip[];
  onReorder: (clips: TimelineClip[]) => void;
  onClipSelect: (clipId: string) => void;
  selectedClipId?: string;
}

export function TimelineReordering({
  clips,
  onReorder,
  onClipSelect,
  selectedClipId,
}: TimelineReorderingProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Calculate total duration
  const totalDuration = clips.reduce((max, clip) => Math.max(max, clip.endTime), 0) + 2;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate time markers
  const timeMarkers = [];
  const interval = zoom > 1 ? 1 : zoom > 0.5 ? 5 : 10;
  for (let t = 0; t <= totalDuration; t += interval) {
    timeMarkers.push(t);
  }

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newClips = [...clips];
    const [draggedClip] = newClips.splice(draggedIndex, 1);
    newClips.splice(targetIndex, 0, draggedClip);

    // Recalculate timestamps based on order
    let currentTime = 0;
    const reorderedClips = newClips.map((clip) => {
      const newClip = {
        ...clip,
        startTime: currentTime,
        endTime: currentTime + clip.duration,
      };
      currentTime += clip.duration + 0.1; // 100ms gap between clips
      return newClip;
    });

    onReorder(reorderedClips);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, clips, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, 0.25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Keyboard reordering (Alt + Arrow)
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        const newClips = [...clips];
        [newClips[index - 1], newClips[index]] = [newClips[index], newClips[index - 1]];
        // Recalculate timestamps
        let currentTime = 0;
        const reorderedClips = newClips.map((clip) => {
          const newClip = { ...clip, startTime: currentTime, endTime: currentTime + clip.duration };
          currentTime += clip.duration + 0.1;
          return newClip;
        });
        onReorder(reorderedClips);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < clips.length - 1) {
        const newClips = [...clips];
        [newClips[index], newClips[index + 1]] = [newClips[index + 1], newClips[index]];
        // Recalculate timestamps
        let currentTime = 0;
        const reorderedClips = newClips.map((clip) => {
          const newClip = { ...clip, startTime: currentTime, endTime: currentTime + clip.duration };
          currentTime += clip.duration + 0.1;
          return newClip;
        });
        onReorder(reorderedClips);
      }
    }
  }, [clips, onReorder]);

  // Scroll handling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // Get clip color based on selection
  const getClipStyle = (clip: TimelineClip, index: number) => {
    const isSelected = clip.id === selectedClipId;
    const isDragging = draggedIndex === index;
    const isDropTarget = dragOverIndex === index;

    let backgroundColor = clip.color;
    if (isDragging) {
      backgroundColor = `${clip.color}80`; // 50% opacity
    } else if (isDropTarget) {
      backgroundColor = '#22c55e'; // Green for drop target
    }

    return {
      backgroundColor,
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      border: isSelected ? '2px solid #fff' : isDropTarget ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
      boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
    };
  };

  // Calculate clip position and width in pixels
  const pixelsPerSecond = 50 * zoom;
  const getClipPosition = (clip: TimelineClip) => ({
    left: clip.startTime * pixelsPerSecond,
    width: clip.duration * pixelsPerSecond,
  });

  // Handle seek on timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    void (x / pixelsPerSecond); // Could emit seek event here (e.g., onSeek(time))
  }, [scrollLeft, pixelsPerSecond]);

  // Total width for the timeline
  const timelineWidth = totalDuration * pixelsPerSecond;

  return (
    <div className="timeline-reordering">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Timeline Reordering</CardTitle>
              <CardDescription>
                Drag clips to reorder. Use Alt+Arrow keys for keyboard navigation.
              </CardDescription>
            </div>
            <div className="zoom-controls">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                −
              </Button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                +
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetZoom}>
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-value">{clips.length}</span>
              <span className="stat-label">Clips</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatTime(totalDuration)}</span>
              <span className="stat-label">Total Duration</span>
            </div>
            <div className="stat">
              <span className="stat-value">{clips.length > 0 ? formatTime(clips.reduce((sum, c) => sum + c.duration, 0)) : '0:00'}</span>
              <span className="stat-label">Content</span>
            </div>
            <div className="stat">
              <span className="stat-value">{clips.length > 0 ? formatTime(totalDuration - clips.reduce((sum, c) => sum + c.duration, 0)) : '0:00'}</span>
              <span className="stat-label">Gaps</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline-container" ref={timelineRef} onScroll={handleScroll}>
            {/* Time ruler */}
            <div className="time-ruler" style={{ width: timelineWidth }}>
              {timeMarkers.map((_time) => (
                <div
                  key={_time}
                  className="time-marker"
                  style={{ left: _time * pixelsPerSecond }}
                >
                  <span className="time-label">{formatTime(_time)}</span>
                </div>
              ))}
            </div>

            {/* Clips track */}
            <div className="clips-track" onClick={handleTimelineClick}>
              {/* Grid lines */}
              <div className="grid-lines" style={{ width: timelineWidth }}>
                {timeMarkers.map((time) => (
                  <div
                    key={time}
                    className="grid-line"
                    style={{ left: time * pixelsPerSecond }}
                  />
                ))}
              </div>

              {/* Clips */}
              {clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className={`timeline-clip ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drop-target' : ''}`}
                  style={{
                    ...getClipStyle(clip, index),
                    ...getClipPosition(clip),
                  }}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onClipSelect(clip.id)}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  <div className="clip-handle left" />
                  <div className="clip-content">
                    <span className="clip-name">{clip.name}</span>
                    <span className="clip-duration">{formatTime(clip.duration)}</span>
                  </div>
                  <div className="clip-handle right" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions">
            <h4>Keyboard Shortcuts</h4>
            <ul>
              <li><kbd>Alt</kbd> + <kbd>↑</kbd> / <kbd>←</kbd> — Move clip up</li>
              <li><kbd>Alt</kbd> + <kbd>↓</kbd> / <kbd>→</kbd> — Move clip down</li>
              <li><kbd>Click</kbd> — Select clip</li>
              <li><kbd>Drag</kbd> — Reorder clips</li>
            </ul>
          </div>

          {/* Empty state */}
          {clips.length === 0 && (
            <div className="empty-state">
              <p>Import video clips to start editing</p>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .timeline-reordering {
          width: 100%;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .zoom-label {
          font-size: 0.875rem;
          min-width: 3rem;
          text-align: center;
        }

        .stats-bar {
          display: flex;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .timeline-container {
          position: relative;
          overflow-x: auto;
          overflow-y: hidden;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: '1rem 0';
          min-height: 200px;
        }

        .time-ruler {
          position: sticky;
          top: 0;
          height: 2rem;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          z-index: 10;
        }

        .time-marker {
          position: absolute;
          top: 0;
          height: 100%;
          border-left: 1px solid var(--border);
        }

        .time-label {
          position: absolute;
          top: 0.25rem;
          left: 0.25rem;
          font-size: 0.625rem;
          color: var(--text-secondary);
          font-family: monospace;
        }

        .clips-track {
          position: relative;
          min-height: 150px;
          padding: 1rem 0;
        }

        .grid-lines {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          pointer-events: none;
        }

        .grid-line {
          position: absolute;
          top: 0;
          bottom: 0;
          border-left: 1px solid var(--border);
        }

        .timeline-clip {
          position: absolute;
          top: 2rem;
          height: 80px;
          border-radius: 6px;
          cursor: grab;
          display: flex;
          align-items: center;
          transition: all 0.15s ease;
          user-select: none;
        }

        .timeline-clip:hover {
          z-index: 5;
        }

        .timeline-clip.dragging {
          cursor: grabbing;
          z-index: 10;
        }

        .timeline-clip.drop-target {
          border: 2px dashed #22c55e;
        }

        .timeline-clip:focus {
          outline: none;
        }

        .timeline-clip:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .clip-handle {
          width: 8px;
          height: 100%;
          cursor: ew-resize;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .timeline-clip:hover .clip-handle {
          opacity: 1;
        }

        .clip-handle.left {
          border-radius: 6px 0 0 6px;
          background: rgba(255, 255, 255, 0.2);
        }

        .clip-handle.right {
          border-radius: 0 6px 6px 0;
          background: rgba(255, 255, 255, 0.2);
        }

        .clip-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          overflow: hidden;
        }

        .clip-name {
          font-size: 0.8125rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .clip-duration {
          font-size: 0.75rem;
          opacity: 0.8;
          font-family: monospace;
          margin-top: 0.25rem;
        }

        .instructions {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .instructions h4 {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .instructions ul {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .instructions li {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .instructions kbd {
          display: inline-block;
          padding: 0.125rem 0.375rem;
          font-size: 0.75rem;
          font-family: monospace;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          margin-right: 0.25rem;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
