import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVideoDuration, trimVideo, analyzeSilence } from "./video";

// Use vi.hoisted to define mock before vi.mock is hoisted
const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("video processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVideoDuration", () => {
    it("should return video duration from FFprobe", async () => {
      invokeMock.mockResolvedValue(125.5);

      const duration = await getVideoDuration("/path/to/video.mp4");

      expect(duration).toBe(125.5);
      expect(invokeMock).toHaveBeenCalledWith("get_video_duration", {
        filePath: "/path/to/video.mp4",
      });
    });

    it("should throw error on failure", async () => {
      invokeMock.mockRejectedValue(new Error("ffprobe failed"));

      await expect(getVideoDuration("/path/to/video.mp4")).rejects.toThrow();
    });
  });

  describe("trimVideo", () => {
    it("should call trim_video command with correct args", async () => {
      invokeMock.mockResolvedValue(true);

      const result = await trimVideo(
        "/path/to/input.mp4",
        "/path/to/output.mp4",
        10.5,
        60.0
      );

      expect(result).toBe(true);
      expect(invokeMock).toHaveBeenCalledWith("trim_video", {
        inputPath: "/path/to/input.mp4",
        outputPath: "/path/to/output.mp4",
        startTime: 10.5,
        endTime: 60.0,
      });
    });
  });

  describe("analyzeSilence", () => {
    it("should return silence segments", async () => {
      const mockSegments = [
        { start: 5.0, end: 7.5, duration: 2.5 },
        { start: 15.0, end: 16.0, duration: 1.0 },
      ];
      invokeMock.mockResolvedValue(mockSegments);

      const segments = await analyzeSilence("/path/to/video.mp4", -50);

      expect(segments).toEqual(mockSegments);
      expect(invokeMock).toHaveBeenCalledWith("analyze_silence", {
        filePath: "/path/to/video.mp4",
        thresholdDb: -50,
      });
    });
  });
});
