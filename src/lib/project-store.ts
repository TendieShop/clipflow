// State persistence for ClipFlow
// Handles localStorage and crash recovery

export interface ProjectState {
  id: string;
  name: string;
  videos: VideoFile[];
  settings: AppSettings;
  lastModified: number;
}

export interface VideoFile {
  id: string;
  path: string;
  name: string;
  duration: number;
  status: 'ready' | 'processing' | 'error';
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoSaveInterval: number;
  showAdvancedOptions: boolean;
  ffmpegPath: string;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

const STORAGE_KEY = 'clipflow-projects';
const BACKUP_KEY = 'clipflow-backup';
const SETTINGS_KEY = 'clipflow-settings';

const getAppVersion = (): string => {
  try {
    // @ts-ignore - would be injected at build time
    return typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0';
  } catch {
    return '1.0.0';
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoSaveInterval: 30,
  showAdvancedOptions: false,
  ffmpegPath: 'ffmpeg',
  whisperModel: 'base',
};

// Project persistence
export function saveProject(state: ProjectState): void {
  const projects = loadAllProjects();
  const index = projects.findIndex(p => p.id === state.id);
  
  if (index >= 0) {
    projects[index] = state;
  } else {
    projects.push(state);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  console.log(`[storage] Saved project: ${state.name}`);
}

export function loadAllProjects(): ProjectState[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.error('[storage] Failed to load projects');
    return [];
  }
}

export function loadProject(id: string): ProjectState | null {
  const projects = loadAllProjects();
  return projects.find(p => p.id === id) || null;
}

export function deleteProject(id: string): void {
  const projects = loadAllProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// Settings persistence
export function saveSettings(settings: Partial<AppSettings>): void {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Crash recovery
export function createBackup(state: ProjectState): void {
  const backup = {
    state,
    timestamp: Date.now(),
    version: getAppVersion(),
  };
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

export function restoreFromBackup(): ProjectState | null {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return null;
    
    const data = JSON.parse(backup);
    // Backup expires after 24 hours
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return data.state;
  } catch {
    return null;
  }
}

export function clearBackup(): void {
  localStorage.removeItem(BACKUP_KEY);
}

// Auto-save hook
export function useAutoSave(state: ProjectState, intervalMs: number = 30000): () => void {
  let timer: ReturnType<typeof setInterval>;
  
  const start = () => {
    timer = setInterval(() => {
      saveProject(state);
    }, intervalMs);
  };
  
  const stop = () => {
    if (timer) clearInterval(timer);
  };
  
  // Start auto-save
  start();
  
  // Save on unmount
  return () => {
    stop();
    saveProject(state);
  };
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
