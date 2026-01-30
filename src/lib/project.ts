import { useState, useCallback, useEffect, useRef } from 'react';
import type { VideoFile } from '../components/VideoPreview';

export interface Project {
  id: string;
  name: string;
  videos: VideoFile[];
  createdAt: string; // ISO string for serialization
  updatedAt: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoSaveInterval: number; // seconds
  showAdvancedOptions: boolean;
  ffmpegPath: string;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

export interface AppState {
  currentProject: Project | null;
  projects: Project[];
  settings: AppSettings;
}

const STORAGE_KEY = 'clipflow-state';
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  autoSaveInterval: 30,
  showAdvancedOptions: false,
  ffmpegPath: 'ffmpeg',
  whisperModel: 'base',
};

const DEFAULT_STATE: AppState = {
  currentProject: null,
  projects: [],
  settings: DEFAULT_SETTINGS,
};

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
      };
    }
  } catch (error) {
    console.error('[project] Failed to load state:', error);
  }
  
  return DEFAULT_STATE;
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[project] Failed to save state:', error);
  }
}

export function useProject() {
  const [state, setState] = useState<AppState>(() => loadState());
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStateRef = useRef(state);

  // Auto-save effect
  useEffect(() => {
    // Only auto-save if current project has videos
    if (state.currentProject?.videos.length && state.currentProject.videos.length > 0) {
      // Check if state actually changed
      if (JSON.stringify(previousStateRef.current) !== JSON.stringify(state)) {
        saveState(state);
        previousStateRef.current = state;
      }
    }
  }, [state]);

  // Scheduled auto-save every 30 seconds
  useEffect(() => {
    if (state.settings.autoSaveInterval > 0) {
      autoSaveRef.current = setInterval(() => {
        if (state.currentProject?.videos.length) {
          saveState(state);
        }
      }, state.settings.autoSaveInterval * 1000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [state.settings.autoSaveInterval, state.currentProject, state]);

  const createProject = useCallback((name: string, videos: VideoFile[] = []): Project => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name,
      videos,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const saveProject = useCallback((name: string): Project | null => {
    const project = state.currentProject
      ? { ...state.currentProject, name, updatedAt: new Date().toISOString() }
      : createProject(name, []);

    const newState = {
      ...state,
      currentProject: project,
      projects: state.currentProject
        ? state.projects.map(p => p.id === project.id ? project : p)
        : [...state.projects, project],
    };

    setState(newState);
    saveState(newState);
    return project;
  }, [state, createProject]);

  const loadProject = useCallback((id: string): boolean => {
    const project = state.projects.find(p => p.id === id);
    if (project) {
      setState(prev => ({ ...prev, currentProject: project }));
      return true;
    }
    return false;
  }, [state.projects]);

  const deleteProject = useCallback((id: string): void => {
    const newState = {
      ...state,
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    };
    setState(newState);
    saveState(newState);
  }, [state]);

  const updateProjectVideos = useCallback((videos: VideoFile[]): void => {
    if (!state.currentProject) return;

    const updated = {
      ...state.currentProject,
      videos,
      updatedAt: new Date().toISOString(),
    };

    const newState = {
      ...state,
      currentProject: updated,
      projects: state.projects.map(p => p.id === updated.id ? updated : p),
    };

    setState(newState);
    saveState(newState);
  }, [state.currentProject, state.projects]);

  const addVideoToProject = useCallback((video: VideoFile): void => {
    if (!state.currentProject) return;
    updateProjectVideos([...state.currentProject.videos, video]);
  }, [state.currentProject, updateProjectVideos]);

  const removeVideoFromProject = useCallback((videoId: string): void => {
    if (!state.currentProject) return;
    updateProjectVideos(state.currentProject.videos.filter(v => v.id !== videoId));
  }, [state.currentProject, updateProjectVideos]);

  const updateSettings = useCallback((settings: Partial<AppSettings>): void => {
    const newState = {
      ...state,
      settings: { ...state.settings, ...settings },
    };
    setState(newState);
    saveState(newState);
  }, [state]);

  const clearCurrentProject = useCallback((): void => {
    setState(prev => ({ ...prev, currentProject: null }));
  }, []);

  const exportProjectData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importProjectData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data) as AppState;
      // Validate structure
      if (!parsed.projects || !Array.isArray(parsed.projects)) {
        return false;
      }
      
      setState(parsed);
      saveState(parsed);
      return true;
    } catch (error) {
      console.error('[project] Failed to import project data:', error);
      return false;
    }
  }, []);

  return {
    state,
    setState,
    createProject,
    saveProject,
    loadProject,
    deleteProject,
    updateProjectVideos,
    addVideoToProject,
    removeVideoFromProject,
    updateSettings,
    clearCurrentProject,
    exportProjectData,
    importProjectData,
  };
}
