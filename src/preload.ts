import { contextBridge, ipcRenderer } from 'electron';

// Type-safe bridge for Electron IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // Video processing
  video: {
    getVideoDuration: (filePath: string) => ipcRenderer.invoke('get-video-duration', filePath),
    trimVideo: (args: { inputPath: string; outputPath: string; startTime: number; endTime: number }) =>
      ipcRenderer.invoke('trim-video', args),
    extractAudio: (args: { inputPath: string; outputPath: string }) =>
      ipcRenderer.invoke('extract-audio', args),
    analyzeSilence: (args: { filePath: string; thresholdDB: number }) =>
      ipcRenderer.invoke('analyze-silence', args),
    exportVideo: (args: { inputPath: string; outputPath: string; quality: string }) =>
      ipcRenderer.invoke('export-video', args),
  },
  // File dialogs
  dialog: {
    openFile: (options: { filters: Array<{ name: string; extensions: string[] }>; multiple: boolean }) =>
      ipcRenderer.invoke('show-open-dialog', options),
    saveFile: (options: { filters: Array<{ name: string; extensions: string[] }> }) =>
      ipcRenderer.invoke('show-save-dialog', options),
  },
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  // Auto-updates
  updates: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    restartAndUpdate: () => ipcRenderer.invoke('restart-and-update'),
  },
});
