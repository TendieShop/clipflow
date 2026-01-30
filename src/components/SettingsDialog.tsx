// Settings Dialog Component
import { useState, useEffect } from 'react';
import { useProject } from '../lib/project';
import type { AppSettings } from '../lib/project';
import { loadSettings, saveSettings } from '../lib/project-store';
import { info } from '../lib/logger';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { state, updateSettings } = useProject();
  const defaultSettings: AppSettings = {
    theme: 'system',
    autoSaveInterval: 30,
    showAdvancedOptions: false,
    ffmpegPath: 'ffmpeg',
    whisperModel: 'base',
  };
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSettings();
      setSettings({ ...defaultSettings, ...state.settings, ...saved });
    }
  }, [isOpen, state.settings]);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSettings();
      setSettings(saved);
    }
  }, [isOpen]);

  const handleSave = () => {
    updateSettings(settings);
    saveSettings(settings);
    info('settings.saved', { theme: settings.theme, autoSave: settings.autoSaveInterval });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* General Section */}
          <section className="settings-section">
            <h3>General</h3>
            
            <div className="setting-row">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'dark' | 'light' | 'system' })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="autoSave">Auto-save interval (seconds)</label>
              <input
                id="autoSave"
                type="number"
                min="0"
                max="300"
                value={settings.autoSaveInterval}
                onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) || 30 })}
              />
            </div>
          </section>

          {/* FFmpeg Section */}
          <section className="settings-section">
            <h3>FFmpeg</h3>
            
            <div className="setting-row">
              <label htmlFor="ffmpegPath">FFmpeg Path</label>
              <input
                id="ffmpegPath"
                type="text"
                value={settings.ffmpegPath}
                onChange={(e) => setSettings({ ...settings, ffmpegPath: e.target.value })}
                placeholder="ffmpeg"
              />
              <span className="setting-hint">Path to FFmpeg executable</span>
            </div>
          </section>

          {/* Whisper Section */}
          <section className="settings-section">
            <h3>Whisper (Transcription)</h3>
            
            <div className="setting-row">
              <label htmlFor="whisperModel">Model</label>
              <select
                id="whisperModel"
                value={settings.whisperModel}
                onChange={(e) => setSettings({ ...settings, whisperModel: e.target.value as 'tiny' | 'base' | 'small' | 'medium' | 'large' })}
              >
                <option value="tiny">Tiny (39MB) - Fastest</option>
                <option value="base">Base (74MB) - Recommended</option>
                <option value="small">Small (244MB)</option>
                <option value="medium">Medium (769MB)</option>
                <option value="large">Large (1550MB) - Most accurate</option>
              </select>
            </div>
          </section>

          {/* Advanced Section */}
          <section className="settings-section">
            <h3>Advanced</h3>
            
            <div className="setting-row checkbox-row">
              <input
                id="advanced"
                type="checkbox"
                checked={settings.showAdvancedOptions}
                onChange={(e) => setSettings({ ...settings, showAdvancedOptions: e.target.checked })}
              />
              <label htmlFor="advanced">Show advanced options</label>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>

      <style>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .settings-dialog {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-high);
          animation: scaleIn 0.2s ease;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--bg-tertiary);

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        }

        .settings-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
        }

        .settings-section {
          margin-bottom: 1.5rem;
        }

        .settings-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin: 0 0 0.75rem 0;
        }

        .setting-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .setting-row.checkbox-row {
          flex-direction: row;
          align-items: center;
        }

        .setting-row.checkbox-row input {
          width: auto;
        }

        .setting-row label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .setting-row input[type="text"],
        .setting-row input[type="number"],
        .setting-row select {
          padding: 0.625rem 0.75rem;
          border: 1px solid var(--bg-tertiary);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .setting-row input:focus,
        .setting-row select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .setting-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .settings-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--bg-tertiary);
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: none;
        }

        .btn-secondary:hover {
          background: var(--bg-primary);
        }

        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
