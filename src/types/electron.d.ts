/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

interface ElectronVideoAPI {
  getVideoDuration(filePath: string): Promise<number>;
  trimVideo(args: { inputPath: string; outputPath: string; startTime: number; endTime: number }): Promise<void>;
  extractAudio(args: { inputPath: string; outputPath: string }): Promise<void>;
  analyzeSilence(args: { filePath: string; thresholdDB: number }): Promise<Array<{ start: number; end: number; duration: number }>>;
  exportVideo(args: { inputPath: string; outputPath: string; quality: string }): Promise<void>;
}

interface ElectronDialogAPI {
  openFile(options: { filters: Array<{ name: string; extensions: string[] }>; multiple: boolean }): Promise<string[]>;
  saveFile(options: { filters: Array<{ name: string; extensions: string[] }> }): Promise<string | null>;
}

interface ElectronUpdatesAPI {
  checkForUpdates(): Promise<{ available: boolean; version?: string; reason?: string }>;
  restartAndUpdate(): Promise<void>;
}

interface ElectronAPI {
  video: ElectronVideoAPI;
  dialog: ElectronDialogAPI;
  openExternal(url: string): Promise<void>;
  updates: ElectronUpdatesAPI;
}

interface Window {
  electronAPI: ElectronAPI;
}
