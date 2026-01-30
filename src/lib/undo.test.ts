// Undo Manager Tests
import { describe, it, expect, beforeEach } from 'vitest';
import {
  UndoManager,
  UndoableAction,
} from './undo';

describe('UndoManager', () => {
  let undoManager: UndoManager;

  beforeEach(() => {
    undoManager = new UndoManager();
  });

  describe('Basic Operations', () => {
    it('should initialize with empty history', () => {
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getHistorySize()).toBe(0);
    });

    it('should push actions to history', () => {
      const action: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'test.mp4', path: '/test.mp4', duration: 0, status: 'ready' }],
      };

      undoManager.push(action);

      // After first action, can't undo (you're at the initial state)
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getHistorySize()).toBe(1);
      expect(undoManager.getCurrentIndex()).toBe(0);
    });

    it('should return null when undo called with no history', () => {
      const result = undoManager.undo();
      expect(result).toBe(null);
    });

    it('should return null when redo called with no history', () => {
      const result = undoManager.redo();
      expect(result).toBe(null);
    });
  });

  describe('Undo/Redo Flow', () => {
    it('should perform undo and redo correctly', () => {
      const action1: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'test1.mp4', path: '/test1.mp4', duration: 0, status: 'ready' }],
      };
      const action2: UndoableAction = {
        type: 'import',
        videos: [{ id: '2', name: 'test2.mp4', path: '/test2.mp4', duration: 0, status: 'ready' }],
      };

      undoManager.push(action1);
      undoManager.push(action2);

      // Now at index 1 (second action)
      expect(undoManager.getCurrentIndex()).toBe(1);
      expect(undoManager.canUndo()).toBe(true);  // Can undo action2
      expect(undoManager.canRedo()).toBe(false);

      // Undo returns the action we're going back TO (action1)
      const undone = undoManager.undo();
      expect(undone).toEqual(action1);  // Returns action1, not action2
      expect(undoManager.getCurrentIndex()).toBe(0);
      expect(undoManager.canUndo()).toBe(false);  // Can't undo action1 (initial state)
      expect(undoManager.canRedo()).toBe(true);

      // Undo should return null (at initial state)
      const undone2 = undoManager.undo();
      expect(undone2).toBe(null);  // Can't undo initial state

      // Redo returns the action at the new index
      const redone = undoManager.redo();
      expect(redone).toEqual(action2);  // Index goes 0 → 1, returns action2
      expect(undoManager.getCurrentIndex()).toBe(1);

      // Redo should return null (at end of history)
      const redone2 = undoManager.redo();
      expect(redone2).toBe(null);  // Can't redo past end
    });
  });

  describe('Action Types', () => {
    it('should track import actions', () => {
      const importAction1: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'video.mp4', path: '/video.mp4', duration: 120, status: 'ready' }],
      };
      const importAction2: UndoableAction = {
        type: 'import',
        videos: [{ id: '2', name: 'video2.mp4', path: '/video2.mp4', duration: 60, status: 'ready' }],
      };

      undoManager.push(importAction1);
      undoManager.push(importAction2);
      const undone = undoManager.undo();

      expect(undone?.type).toBe('import');
      expect(undone?.type).toEqual(importAction2.type);
    });

    it('should track settings changes', () => {
      const settingsAction1: UndoableAction = {
        type: 'settings',
        oldSettings: { theme: 'dark', ffmpegPath: '/old', whisperPath: '/old', autoSaveInterval: 30, defaultQuality: 'medium' },
        newSettings: { theme: 'light', ffmpegPath: '/new', whisperPath: '/new', autoSaveInterval: 60, defaultQuality: 'high' },
      };
      const settingsAction2: UndoableAction = {
        type: 'settings',
        oldSettings: { theme: 'light', ffmpegPath: '/new', whisperPath: '/new', autoSaveInterval: 60, defaultQuality: 'high' },
        newSettings: { theme: 'system', ffmpegPath: '/final', whisperPath: '/final', autoSaveInterval: 120, defaultQuality: 'low' },
      };

      undoManager.push(settingsAction1);
      undoManager.push(settingsAction2);
      const undone = undoManager.undo();

      expect(undone?.type).toBe('settings');
    });

    it('should track silence detection changes', () => {
      const silenceAction1: UndoableAction = {
        type: 'silence-detection',
        videoId: 'video-123',
        originalState: { id: 'video-123', name: 'test.mp4', path: '/test.mp4', duration: 120, status: 'ready' },
      };
      const silenceAction2: UndoableAction = {
        type: 'silence-detection',
        videoId: 'video-456',
        originalState: { id: 'video-456', name: 'test2.mp4', path: '/test2.mp4', duration: 60, status: 'ready' },
      };

      undoManager.push(silenceAction1);
      undoManager.push(silenceAction2);
      const undone = undoManager.undo();

      expect(undone?.type).toBe('silence-detection');
    });
  });

  describe('History Limits', () => {
    it('should limit history to maxSize (50)', () => {
      // Push 55 actions
      for (let i = 0; i < 55; i++) {
        const action: UndoableAction = {
          type: 'import',
          videos: [{ id: String(i), name: `test${i}.mp4`, path: `/test${i}.mp4`, duration: 0, status: 'ready' }],
        };
        undoManager.push(action);
      }

      // Should be limited to 50
      expect(undoManager.getHistorySize()).toBe(50);
      expect(undoManager.getCurrentIndex()).toBe(49);

      // First actions should be lost
      expect(undoManager.getAction(0)).not.toBeNull();
      expect(undoManager.getAction(49)).not.toBeNull();
    });
  });

  describe('Clear', () => {
    it('should clear all history', () => {
      const action: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'test.mp4', path: '/test.mp4', duration: 0, status: 'ready' }],
      };

      undoManager.push(action);
      undoManager.push(action);
      undoManager.push(action);

      expect(undoManager.getHistorySize()).toBe(3);

      undoManager.clear();

      expect(undoManager.getHistorySize()).toBe(0);
      expect(undoManager.getCurrentIndex()).toBe(-1);
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
    });
  });

  describe('New Action After Undo', () => {
    it('should remove redo history when new action is pushed', () => {
      const action1: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'test1.mp4', path: '/test1.mp4', duration: 0, status: 'ready' }],
      };
      const action2: UndoableAction = {
        type: 'import',
        videos: [{ id: '2', name: 'test2.mp4', path: '/test2.mp4', duration: 0, status: 'ready' }],
      };
      const action3: UndoableAction = {
        type: 'import',
        videos: [{ id: '3', name: 'test3.mp4', path: '/test3.mp4', duration: 0, status: 'ready' }],
      };

      undoManager.push(action1);
      undoManager.push(action2);

      // Undo action2
      undoManager.undo();

      // Now we have action1, and can redo to action2
      expect(undoManager.canRedo()).toBe(true);

      // Push new action - should remove redo history
      undoManager.push(action3);

      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getCurrentIndex()).toBe(1);
      expect(undoManager.getHistorySize()).toBe(2);
    });
  });

  describe('getState', () => {
    it('should return correct state for UI', () => {
      const action: UndoableAction = {
        type: 'import',
        videos: [{ id: '1', name: 'test.mp4', path: '/test.mp4', duration: 0, status: 'ready' }],
      };

      const state = undoManager.getState();
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
      expect(state.historySize).toBe(0);

      undoManager.push(action);

      const state2 = undoManager.getState();
      // After first action, can't undo (at initial state)
      expect(state2.canUndo).toBe(false);
      expect(state2.canRedo).toBe(false);
      expect(state2.historySize).toBe(1);

      // Add second action
      const action2: UndoableAction = {
        type: 'import',
        videos: [{ id: '2', name: 'test2.mp4', path: '/test2.mp4', duration: 0, status: 'ready' }],
      };
      undoManager.push(action2);

      const state3 = undoManager.getState();
      expect(state3.canUndo).toBe(true);
      expect(state3.canRedo).toBe(false);
      expect(state3.historySize).toBe(2);
    });
  });
});
