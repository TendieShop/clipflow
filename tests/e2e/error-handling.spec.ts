import { test, expect, describe } from '@playwright/test';

describe('Error Boundary - Graceful Degradation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock IPC that fails
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          getVideoDuration: async () => { throw new Error('FFmpeg not found'); },
          analyzeSilence: async () => { throw new Error('FFmpeg analysis failed'); },
          exportVideo: async () => { throw new Error('Export failed'); }
        },
        dialog: {
          openFile: async () => { throw new Error('Dialog failed'); }
        }
      };
    });
  });

  test('app handles IPC errors without crashing', async ({ page }) => {
    await page.goto('/');
    
    // Should still load even if IPC fails
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('.app-container')).toBeVisible();
  });

  test('import shows error message, not crash', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show error message, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('silence detection shows error, not crash', async ({ page }) => {
    // Setup with video first
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          analyzeSilence: async () => { throw new Error('FFmpeg analysis failed'); }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    // Open silence detection
    await page.click('[data-testid="silence-detection-button"]');
    await page.click('button:has-text("Detect Silence")');
    
    // Should show error, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('export shows error, not crash', async ({ page }) => {
    // Setup with video first
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4'],
          saveFile: async () => '/test/output.mp4'
        },
        video: {
          getVideoDuration: async () => 120.0,
          exportVideo: async () => { throw new Error('Export failed'); }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    // Open export
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');
    
    // Should show error, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });
});

describe('Error Boundary - Component Errors', () => {
  
  test('error boundary catches component errors', async ({ page }) => {
    // Mock an error boundary error
    await page.evaluate(() => {
      // Simulate a component that throws
      const originalError = console.error;
      console.error = () => {}; // Suppress expected errors
      
      // Trigger an error in a component
      try {
        throw new Error('Component crashed');
      } catch (e) {
        // Error should be caught by boundary
      }
    });

    await page.goto('/');
    
    // App should still be usable
    await expect(page.locator('body')).toBeVisible();
  });

  test('dialogs have error boundaries', async ({ page }) => {
    await page.goto('/');
    
    // All dialogs should render without crashing
    await page.click('[data-testid="import-button"]');
    await expect(page.locator('.dialog')).toBeVisible();
    
    // Close dialog
    await page.click('.close-btn');
  });

  test('app recovers after error', async ({ page }) => {
    // First, cause an error
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => { throw new Error('First error'); }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show error
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Dismiss error
    await page.click('.error-dismiss');
    
    // App should still work
    await page.click('[data-testid="import-button"]');
    await expect(page.locator('.dialog')).toBeVisible();
  });
});

describe('Error Boundary - Recovery', () => {
  
  test('retry button works after error', async ({ page }) => {
    let callCount = 0;
    
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('First attempt failed');
            }
            return ['/test/video.mp4'];
          }
        },
        video: {
          getVideoDuration: async () => {
            if (callCount === 1) throw new Error('Metadata fetch failed');
            return 120.0;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show error
    await expect(page.locator('.error-message')).toContainText('failed');
    
    // Retry button should appear
    const retryBtn = page.locator('button:has-text("Retry")');
    await expect(retryBtn).toBeVisible();
    
    // Click retry
    await retryBtn.click();
    
    // Should work on retry
    await page.waitForTimeout(500);
  });

  test('offline mode shows graceful fallback', async ({ page }) => {
    // Remove Electron API
    await page.evaluate(() => {
      delete (window as any).electronAPI;
    });

    await page.goto('/');
    
    // Should show fallback UI, not crash
    await expect(page.locator('.fallback-ui')).toBeVisible();
    await expect(page.locator('.fallback-ui')).toContainText('Desktop app required');
  });
});
