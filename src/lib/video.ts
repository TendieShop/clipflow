import { invoke } from "@tauri-apps/api/core";

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
    console.error("Failed to get video duration:", error);
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
    console.error("Failed to trim video:", error);
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
    console.error("Failed to extract audio:", error);
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
    console.error("Failed to analyze silence:", error);
    throw error;
  }
}

export async function exportVideo(
  inputPath: string,
  outputPath: string,
  quality: "high" | "medium" | "low" = "medium"
): Promise<boolean> {
  try {
    const result = await invoke<boolean>("export_video", {
      inputPath,
      outputPath,
      quality,
    });
    return result;
  } catch (error) {
    console.error("Failed to export video:", error);
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
