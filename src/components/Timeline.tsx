import { useRef } from 'react';
import { clsx } from 'clsx';
import { VideoClip } from '../services/video-types';

interface TimelineProps {
  clips: VideoClip[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function Timeline({
  clips,
  currentTime,
  duration,
  onSeek,
  className,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {/* Time display */}
      <div className="flex justify-between text-xs text-[#a3a3a3]">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={timelineRef}
        className="relative h-12 bg-[#262626] rounded-lg cursor-pointer overflow-hidden"
        onClick={handleClick}
      >
        {/* Progress */}
        <div
          className="absolute inset-y-0 left-0 bg-[#3b82f6] opacity-20"
          style={{ width: `${progress}%` }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#3b82f6]"
          style={{ left: `${progress}%` }}
        />

        {/* Clips */}
        {clips.map((clip, index) => {
          const clipStart = (clip.startTime / duration) * 100;
          const clipWidth = ((clip.endTime - clip.startTime) / duration) * 100;

          return (
            <div
              key={index}
              className="absolute top-1 bottom-1 bg-[#3b82f6] rounded"
              style={{
                left: `${clipStart}%`,
                width: `${clipWidth}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
