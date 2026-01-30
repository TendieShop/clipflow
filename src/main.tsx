import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { info, warn } from './lib/logger';
import { restoreFromBackup, clearBackup } from './lib/project-store';

// Check for crash recovery on startup
function initCrashRecovery(): void {
  if (typeof window === 'undefined') return;
  
  const backup = restoreFromBackup();
  if (backup) {
    warn('crash.recovery_available', { 
      project: backup.name,
      videos: backup.videos?.length || 0,
    });
    
    // Show recovery dialog (simplified - would normally show UI)
    const confirmed = window.confirm(
      `A backup was found from ${new Date(backup.lastModified).toLocaleString()}.\n` +
      `Would you like to restore your project "${backup.name}"?`
    );
    
    if (confirmed) {
      // Store backup for App to consume
      sessionStorage.setItem('clipflow-recovery', JSON.stringify(backup));
      info('crash.recovery_started', { project: backup.name });
    }
    
    clearBackup();
  }
}

// Initialize
initCrashRecovery();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
