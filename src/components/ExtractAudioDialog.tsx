import { useState } from 'react';
import { VideoFile } from '../services/video-types';
import { Button } from './Button';
import { X, Music } from 'lucide-react';

interface ExtractAudioDialogProps {
  isOpen: boolean;
  video: VideoFile;
  onClose: () => void;
  onExtract: (inputPath: string, outputPath: string) => void;
}

export function ExtractAudioDialog({ isOpen, video, onClose, onExtract }: ExtractAudioDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtract = async () => {
    setIsProcessing(true);
    try {
      const outputPath = video.path.replace(/\.[^.]+$/, '.wav');
      onExtract(video.path, outputPath);
      onClose();
    } catch (error) {
      console.error('Audio extraction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog extract-audio-dialog" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5] flex items-center gap-2">
            <Music className="w-5 h-5" />
            Extract Audio
          </h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#f5f5f5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Video Info */}
          <div className="p-3 bg-[#262626] rounded">
            <div className="flex justify-between text-sm">
              <span className="text-[#a3a3a3]">Video:</span>
              <span className="text-[#f5f5f5] truncate max-w-[200px]">{video.name}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#a3a3a3]">Duration:</span>
              <span className="text-[#f5f5f5]">{formatDuration(video.duration)}</span>
            </div>
          </div>

          {/* Output Info */}
          <div className="p-3 bg-[#262626] rounded">
            <div className="text-sm text-[#a3a3a3] mb-1">Output Format:</div>
            <div className="text-[#f5f5f5]">WAV (PCM 16-bit)</div>
            <div className="text-xs text-[#737373] mt-1">
              Output: {video.name.replace(/\.[^.]+$/, '.wav')}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded">
            <p className="text-sm text-[#a3a3a3]">
              This will extract the audio track from your video as a WAV file.
              The extracted audio will be in uncompressed PCM format.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleExtract}
            disabled={isProcessing}
          >
            {isProcessing ? 'Extracting...' : 'Extract Audio'}
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
          max-width: 480px;
          padding: 1.5rem;
        }
      `}</style>
    </div>
  );
}
