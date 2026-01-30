// Undo Manager - Track and reverse user actions
// Supports undo/redo for import, export, and settings changes

import { info, warn } from './logger';

// Action types that can be undone
export type UndoableAction =
  | { type: 'import'; videos: VideoFileData[] }
  | { type: 'export'; videos: VideoFileData[]; settings: ExportSettings }
  | { type: 'settings'; oldSettings: AppSettings; newSettings: AppSettings }
  | { type: 'silence-detection'; videoId: string; originalState: VideoFileData }
  | { type: 'filler-removal'; videoId: string; originalState: VideoFileData };

// Simplified video data for history
export interface VideoFileData {
  id: string;
  name: string;
  path: string;
  duration: number;
  size?: number;
  format?: string;
  status: 'importing' | 'ready' | 'processing' | 'done';
}

// Export settings for history
export interface ExportSettings {
  quality: 'low' | 'medium' | 'high';
  format: string;
}

// App settings for history
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  ffmpegPath: string;
  whisperPath: string;
  autoSaveInterval: number;
  defaultQuality: string;
}

// Undo Manager State
export interface UndoState {
  actions: UndoableAction[];
  currentIndex: number;
  maxSize: number;
}

const INITIAL_STATE: UndoState = {
  actions: [],
  currentIndex: -1,
  maxSize: 50,
};

export class UndoManager {
  private state: UndoState;

  constructor() {
    this.state = { ...INITIAL_STATE };
    info('undo_manager_initialized');
  }

  /**
   * Push a new action to history
   */
  push(action: UndoableAction): void {
    // Remove any redo history
    this.state.actions = this.state.actions.slice(0, this.state.currentIndex + 1);
    
    // Add new action
    this.state.actions.push(action);
    this.state.currentIndex++;
    
    // Limit history size
    if (this.state.actions.length > this.state.maxSize) {
      this.state.actions.shift();
      this.state.currentIndex--;
    }
    
    info('action_pushed', { type: action.type, index: this.state.currentIndex });
  }

  /**
   * Perform undo and return the action to reverse
   */
  undo(): UndoableAction | null {
    if (!this.canUndo()) {
      warn('undo_called_but_none_available');
      return null;
    }

    this.state.currentIndex--;
    const action = this.state.actions[this.state.currentIndex];
    
    info('undo_performed', { type: action.type, index: this.state.currentIndex });

    return action;
  }

  /**
   * Perform redo and return the action to re-apply
   */
  redo(): UndoableAction | null {
    if (!this.canRedo()) {
      warn('redo_called_but_none_available');
      return null;
    }

    this.state.currentIndex++;
    const action = this.state.actions[this.state.currentIndex];
    
    info('redo_performed', { type: action.type, index: this.state.currentIndex });

    return action;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.currentIndex < this.state.actions.length - 1;
  }

  /**
   * Get current undo state for UI
   */
  getState(): { canUndo: boolean; canRedo: boolean; historySize: number } {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.state.actions.length,
    };
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.state = { ...INITIAL_STATE };
    info('undo_history_cleared');
  }

  /**
   * Get action at specific index (for debugging)
   */
  getAction(index: number): UndoableAction | null {
    if (index < 0 || index >= this.state.actions.length) {
      return null;
    }
    return this.state.actions[index];
  }

  /**
   * Get total actions in history
   */
  getHistorySize(): number {
    return this.state.actions.length;
  }

  /**
   * Get current position in history
   */
  getCurrentIndex(): number {
    return this.state.currentIndex;
  }
}

// Singleton instance for app-wide use
let undoManagerInstance: UndoManager | null = null;

export function getUndoManager(): UndoManager {
  if (!undoManagerInstance) {
    undoManagerInstance = new UndoManager();
  }
  return undoManagerInstance;
}

export function resetUndoManager(): void {
  undoManagerInstance = null;
}
