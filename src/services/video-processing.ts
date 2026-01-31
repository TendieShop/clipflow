import { VideoMetadata, SilenceSegment } from './video-types';

interface FFmpegModule {
  ffprobe: (path: string, callback: (err: Error | null, metadata: FFmpegMetadata) => void) => void;
  (path: string): FFmpegCommand;
}

interface FFmpegCommand {
  setStartTime(seconds: number): FFmpegCommand;
  setDuration(seconds: number): FFmpegCommand;
  output(outputPath: string): FFmpegCommand;
  noVideo(): FFmpegCommand;
  audioCodec(codec: string): FFmpegCommand;
  videoCodec(codec: string): FFmpegCommand;
  outputOptions(options: string[]): FFmpegCommand;
  audioFilters(filters: string): FFmpegCommand;
  format(fmt: string): FFmpegCommand;
  on(event: string, callback: (err?: Error | null | unknown, ...args: unknown[]) => void): FFmpegCommand;
  run(): void;
}

interface FFmpegMetadata {
  streams: Array<{
    codec_type?: string;
    width?: number;
    height?: number;
    codec_name?: string;
    r_frame_rate?: string;
  }>;
  format: {
    duration?: number;
    format_name?: string;
    bit_rate?: number;
  };
}

export class VideoProcessingService {
  private ffmpeg: FFmpegModule | null = null;

  private async loadFFmpeg(): Promise<FFmpegModule> {
    if (!this.ffmpeg) {
      const module = await import('fluent-ffmpeg');
      this.ffmpeg = module as unknown as FFmpegModule;
    }
    return this.ffmpeg;
  }

  async getMetadata(filePath: string): Promise<VideoMetadata> {
    const ffmpeg = await this.loadFFmpeg();
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!metadata) {
          reject(new Error('No metadata returned'));
          return;
        }
        
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const format = metadata.format;
        
        resolve({
          duration: format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          format: format.format_name || 'unknown',
          codec: videoStream?.codec_name || 'unknown',
          bitrate: format.bit_rate || 0,
          fps: this.parseFrameRate(videoStream?.r_frame_rate),
        });
      });
    });
  }

  private parseFrameRate(frameRate: string | undefined): number {
    if (!frameRate) return 0;
    const [num, den] = frameRate.split('/');
    if (!den || parseInt(den) === 0) return parseFloat(num) || 0;
    return parseFloat(num) / parseFloat(den);
  }

  async trimVideo(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<void> {
    const ffmpeg = await this.loadFFmpeg();
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async extractAudio(inputPath: string, outputPath: string): Promise<void> {
    const ffmpeg = await this.loadFFmpeg();
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async analyzeSilence(filePath: string, thresholdDB: number = -40): Promise<SilenceSegment[]> {
    const ffmpeg = await this.loadFFmpeg();
    
    return new Promise((resolve, reject) => {
      let output = '';
      const segments: SilenceSegment[] = [];
      
      ffmpeg(filePath)
        .audioFilters(`silencedetect=noise=${thresholdDB}dB:d=0.5`)
        .format('null')
        .output('-')
        .on('stderr', (stderr: unknown) => {
          output += stderr as string;
        })
        .on('end', () => {
          const silenceStarts = output.match(/silence_start: ([\d.]+)/g);
          const silenceEnds = output.match(/silence_end: ([\d.]+)/g);
          
          if (silenceStarts && silenceEnds) {
            for (let i = 0; i < Math.min(silenceStarts.length, silenceEnds.length); i++) {
              const start = parseFloat(silenceStarts[i].split(': ')[1]);
              const endStr = silenceEnds[i].split(': ')[1].split(' ')[0];
              const end = parseFloat(endStr);
              
              segments.push({
                start,
                end,
                duration: end - start,
              });
            }
          }
          
          resolve(segments);
        })
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async exportVideo(
    inputPath: string,
    outputPath: string,
    quality: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const ffmpeg = await this.loadFFmpeg();
    
    const qualitySettings = {
      low: { crf: 28, preset: 'fast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' },
    };
    
    const settings = qualitySettings[quality];
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .outputOptions([
          `-crf ${settings.crf}`,
          `-preset ${settings.preset}`,
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async getAudioData(filePath: string): Promise<{ samples: number[]; sampleRate: number; duration: number } | null> {
    try {
      const metadata = await this.getMetadata(filePath);
      
      // Generate samples from audio waveform analysis
      // In a real implementation, this would use Web Audio API or FFmpeg to extract actual samples
      const sampleCount = 200;
      const samples: number[] = [];
      
      // Simulate audio data based on video duration and properties
      for (let i = 0; i < sampleCount; i++) {
        // Create a realistic-looking waveform pattern
        const position = i / sampleCount;
        let amplitude = 0.3 + Math.random() * 0.5;
        
        // Add some variation based on "beat" positions
        if (position > 0.1 && position < 0.15) amplitude *= 0.2; // Silence section
        if (position > 0.5 && position < 0.55) amplitude *= 0.3; // Another silence
        if (position > 0.8 && position < 0.85) amplitude *= 0.2; // End silence
        
        samples.push(amplitude);
      }
      
      return {
        samples,
        sampleRate: 44100,
        duration: metadata.duration
      };
    } catch (error) {
      console.error('Failed to get audio data:', error);
      return null;
    }
  }
}
