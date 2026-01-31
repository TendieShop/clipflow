import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoFile } from '../services/video-types';

interface AudioWaveformProps {
  video: VideoFile;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

// Check if running in Electron app
function isElectronApp(): boolean {
  return !!(window as any).electronAPI;
}

// Fetch audio data from IPC
async function getAudioDataIPC(
  filePath: string
): Promise<{ samples: number[]; sampleRate: number; duration: number } | null> {
  if (!isElectronApp() || !window.electronAPI) {
    return null;
  }
  
  try {
    const result = await window.electronAPI.video.getAudioData(filePath);
    return result;
  } catch (error) {
    console.warn('[AudioWaveform] Could not fetch audio data:', error);
    return null;
  }
}

// Generate synthetic waveform data if IPC not available
function generateSyntheticData(duration: number, sampleCount: number = 100): number[] {
  const samples: number[] = [];
  // Use duration to scale the pattern appropriately
  const normalizedDuration = Math.min(duration, 300) / 300; // Cap at 5 minutes for normalization
  
  for (let i = 0; i < sampleCount; i++) {
    // Create a somewhat realistic pattern with some silence sections
    const position = i / sampleCount;
    let value = Math.random() * 0.5 + 0.2;
    
    // Add some "silence" sections based on duration
    if (position > 0.2 && position < 0.25) value *= 0.1;
    if (position > 0.6 && position < 0.65) value *= 0.1;
    if (normalizedDuration > 0.5 && position > 0.85 && position < 0.9) value *= 0.1;
    
    samples.push(value);
  }
  return samples;
}

export function AudioWaveform({
  video,
  currentTime,
  duration,
  onSeek
}: AudioWaveformProps) {
  const [audioData, setAudioData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load audio data
  useEffect(() => {
    let mounted = true;

    async function loadAudioData() {
      if (!video?.path) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAudioDataIPC(video.path);
        
        if (!mounted) return;

        if (data && data.samples.length > 0) {
          setAudioData(data.samples);
        } else {
          // Generate synthetic data for visualization
          const synthetic = generateSyntheticData(duration, 200);
          setAudioData(synthetic);
        }
      } catch (err) {
        console.warn('[AudioWaveform] Error loading audio:', err);
        // Fall back to synthetic data
        if (mounted) {
          const synthetic = generateSyntheticData(duration, 200);
          setAudioData(synthetic);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAudioData();

    return () => {
      mounted = false;
    };
  }, [video.path, duration]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || audioData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bar dimensions
    const padding = 2;
    const barGap = 1;
    const availableWidth = rect.width - padding * 2;
    const barWidth = (availableWidth - barGap * (audioData.length - 1)) / audioData.length;
    const centerY = rect.height / 2;

    // Draw bars
    audioData.forEach((amplitude, index) => {
      const barHeight = amplitude * (rect.height - padding * 2);
      const x = padding + index * (barWidth + barGap);
      const y = centerY - barHeight / 2;

      // Color based on playback position
      const progress = duration > 0 ? currentTime / duration : 0;
      const barProgress = index / audioData.length;
      
      const isPlayed = barProgress <= progress;
      
      // Gradient from green to gray
      ctx.fillStyle = isPlayed ? '#22c55e' : '#404040';
      
      // Round the top and bottom of bars
      const radius = Math.min(barWidth / 2, 2);
      
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    });

    // Draw playhead
    if (duration > 0) {
      const playheadX = padding + (currentTime / duration) * (availableWidth + barGap);
      
      ctx.strokeStyle = '#f5f5f5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, rect.height);
      ctx.stroke();
    }

  }, [audioData, currentTime, duration]);

  // Handle click to seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 2;
    const availableWidth = rect.width - padding * 2;
    
    const clickProgress = (x - padding) / availableWidth;
    const clampedProgress = Math.max(0, Math.min(1, clickProgress));
    
    const seekTime = clampedProgress * duration;
    onSeek(seekTime);
  }, [duration, onSeek]);

  if (isLoading) {
    return (
      <div className="audio-waveform h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#737373]">
          <div className="w-4 h-4 border-2 border-[#737373] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading audio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waveform-error audio-waveform h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <span className="text-sm text-[#ef4444]">{error}</span>
      </div>
    );
  }

  if (audioData.length === 0) {
    return (
      <div className="no-audio-message audio-waveform h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <span className="text-sm text-[#737373]">No audio data available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="audio-waveform-container w-full h-16 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="audio-waveform w-full h-full cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
}

/**
 * Simple waveform placeholder when no real data is needed
 */
export function WaveformPlaceholder() {
  const bars = Array(50).fill(0).map((_, i) => ({
    height: Math.random() * 60 + 20,
    delay: i * 20
  }));

  return (
    <div className="audio-waveform h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center gap-0.5 px-2">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="waveform-bar w-1 bg-[#404040] rounded-full animate-pulse"
          style={{
            height: `${bar.height}%`,
            animationDelay: `${bar.delay}ms`
          }}
        />
      ))}
    </div>
  );
}
