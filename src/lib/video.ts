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
