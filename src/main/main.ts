import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import { VideoProcessingService } from '../services/video-processing';

let mainWindow: BrowserWindow | null = null;
const videoService = new VideoProcessingService();

// Configure auto-updater
if (!process.env.VITE_DEV_SERVER_URL) {
  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
});

autoUpdater.on('update-not-available', () => {
  console.log('Update not available');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Download progress: ${progress.percent}%`);
});

autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
});

app.whenReady().then(() => {
  createMainWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090b',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Video Processing

ipcMain.handle('get-video-duration', async (_, filePath: string) => {
  try {
    const metadata = await videoService.getMetadata(filePath);
    return metadata.duration;
  } catch (error) {
    console.error('Failed to get video duration:', error);
    throw error;
  }
});

ipcMain.handle('trim-video', async (_, args: { inputPath: string; outputPath: string; startTime: number; endTime: number }) => {
  try {
    await videoService.trimVideo(args.inputPath, args.outputPath, args.startTime, args.endTime);
  } catch (error) {
    console.error('Failed to trim video:', error);
    throw error;
  }
});

ipcMain.handle('extract-audio', async (_, args: { inputPath: string; outputPath: string }) => {
  try {
    await videoService.extractAudio(args.inputPath, args.outputPath);
  } catch (error) {
    console.error('Failed to extract audio:', error);
    throw error;
  }
});

ipcMain.handle('analyze-silence', async (_, args: { filePath: string; thresholdDB: number }) => {
  try {
    return await videoService.analyzeSilence(args.filePath, args.thresholdDB);
  } catch (error) {
    console.error('Failed to analyze silence:', error);
    throw error;
  }
});

ipcMain.handle('export-video', async (_, args: { inputPath: string; outputPath: string; quality: string }) => {
  try {
    await videoService.exportVideo(args.inputPath, args.outputPath, args.quality as 'low' | 'medium' | 'high');
  } catch (error) {
    console.error('Failed to export video:', error);
    throw error;
  }
});

// File Dialog Handlers

ipcMain.handle('show-open-dialog', async (_, options: { filters: Array<{ name: string; extensions: string[] }>; multiple: boolean }) => {
  const result = await dialog.showOpenDialog({
    properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: options.filters,
  });
  
  if (result.canceled) {
    return [];
  }
  return result.filePaths;
});

ipcMain.handle('show-save-dialog', async (_, options: { filters: Array<{ name: string; extensions: string[] }> }) => {
  const result = await dialog.showSaveDialog({
    filters: options.filters,
  });
  
  if (result.canceled) {
    return null;
  }
  return result.filePath;
});

// External Link Handler

ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url);
});

// Auto-update handlers

ipcMain.handle('check-for-updates', async () => {
  if (process.env.VITE_DEV_SERVER_URL) {
    return { available: false, reason: 'Dev mode' };
  }
  
  try {
    await autoUpdater.checkForUpdates();
    return { available: true, version: autoUpdater.currentVersion?.version };
  } catch (error) {
    return { available: false, reason: String(error) };
  }
});

ipcMain.handle('restart-and-update', async () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
