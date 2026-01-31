import { useState, useEffect, useRef } from 'react';
import { VideoFile } from '../services/video-types';
import { Button } from './Button';
import { X, Scissors } from 'lucide-react';

interface TrimDialogProps {
  isOpen: boolean;
  video: VideoFile;
  onClose: () => void;
  onTrim: (inputPath: string, outputPath: string, startTime: number, endTime: number) => void;
}

export function TrimDialog({ isOpen, video, onClose, onTrim }: TrimDialogProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(video.duration || 60);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && video.duration) {
      setEndTime(video.duration);
    }
  }, [isOpen, video.duration]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setStartTime(value);
    if (value >= endTime) {
      setEndTime(value + 1);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setEndTime(value);
    if (value <= startTime) {
      setStartTime(Math.max(0, value - 1));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrim = async () => {
    setIsProcessing(true);
    try {
      const outputPath = video.path.replace(/\.[^.]+$/, '_trimmed.mp4');
      onTrim(video.path, outputPath, startTime, endTime);
      onClose();
    } catch (error) {
      console.error('Trim failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const videoSrc = video.path.startsWith('file://') 
    ? video.path 
    : `file://${video.path.replace(/\\/g, '/')}`;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog trim-dialog" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5] flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Trim Video
          </h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#f5f5f5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="aspect-video bg-[#000] rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full"
            controls={false}
          />
        </div>

        {/* Trim Controls */}
        <div className="space-y-4">
          {/* Start Time */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#a3a3a3]">Start Time</span>
              <span className="text-[#f5f5f5]">{formatTime(startTime)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={endTime - 1}
              value={startTime}
              onChange={handleStartChange}
              className="w-full"
            />
          </div>

          {/* End Time */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#a3a3a3]">End Time</span>
              <span className="text-[#f5f5f5]">{formatTime(endTime)}</span>
            </div>
            <input
              type="range"
              min={startTime + 1}
              max={video.duration || 100}
              value={endTime}
              onChange={handleEndChange}
              className="w-full"
            />
          </div>

          {/* Duration Info */}
          <div className="flex justify-between text-sm p-2 bg-[#262626] rounded">
            <span className="text-[#a3a3a3]">Duration:</span>
            <span className="text-[#f5f5f5]">{formatTime(endTime - startTime)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleTrim}
            disabled={isProcessing || startTime >= endTime}
          >
            {isProcessing ? 'Processing...' : 'Trim Video'}
          </Button>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog {
          background: #171717;
          border: 1px solid #262626;
          border-radius: 12px;
          width: 100%;
          max-width: 640px;
          padding: 1.5rem;
        }

        input[type="range"] {
          -webkit-appearance: none;
          height: 6px;
          background: #262626;
          border-radius: 3px;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
