import { invoke } from "@tauri-apps/api/core";
import { logExport, logError } from './logger';

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export interface VideoInfo {
  duration: number;
  exists: boolean;
}

export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const duration = await invoke<number>("get_video_duration", { filePath });
    return duration;
  } catch (error) {
    logError('video.get_duration_failed', { path: filePath, error: String(error) });
    throw error;
  }
}

export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<boolean> {
  try {
    const result = await invoke<boolean>("trim_video", {
      inputPath,
      outputPath,
      startTime,
      endTime,
    });
    return result;
  } catch (error) {
    logError('video.trim_failed', { inputPath, outputPath, error: String(error) });
    throw error;
  }
}

export async function extractAudio(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  try {
    const result = await invoke<boolean>("extract_audio", {
      inputPath,
      outputPath,
      format: "wav",
    });
    return result;
  } catch (error) {
    logError('video.extract_audio_failed', { inputPath, error: String(error) });
    throw error;
  }
}

export async function analyzeSilence(
  filePath: string,
  thresholdDb: number = -50
): Promise<SilenceSegment[]> {
  try {
    const segments = await invoke<SilenceSegment[]>("analyze_silence", {
      filePath,
      thresholdDb,
    });
    return segments;
  } catch (error) {
    logError('video.silence_analysis_failed', { filePath, error: String(error) });
    throw error;
  }
}

export async function exportVideo(
  inputPath: string,
  outputPath: string,
  quality: "high" | "medium" | "low" = "medium"
): Promise<boolean> {
  try {
    logExport.started('mp4', quality);
    const startTime = Date.now();
    const result = await invoke<boolean>("export_video", {
      inputPath,
      outputPath,
      quality,
    });
    logExport.completed(outputPath, Date.now() - startTime);
    return result;
  } catch (error) {
    logExport.failed(String(error));
    throw error;
  }
}

// Whisper Transcription - Local AI (no cloud API)

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export interface WhisperModel {
  name: string;
  size: string;
  vram: string;
  description: string;
}

export async function transcribeAudio(
  inputPath: string,
  model: string = "base"
): Promise<TranscriptionResult> {
  try {
    const result = await invoke<TranscriptionResult>("transcribe_audio", {
      inputPath,
      model,
    });
    return result;
  } catch (error) {
    console.error("Failed to transcribe audio:", error);
    throw error;
  }
}

export async function getAvailableWhisperModels(): Promise<WhisperModel[]> {
  try {
    const models = await invoke<WhisperModel[]>("get_available_whisper_models");
    return models;
  } catch (error) {
    console.error("Failed to get Whisper models:", error);
    throw error;
  }
}

// Helper to format time as MM:SS.ms
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
