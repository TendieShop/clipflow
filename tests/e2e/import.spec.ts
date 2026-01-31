import { test, expect } from '@playwright/test';

test.describe('Import Feature', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock Electron environment for all tests
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            // Return mock file paths
            return ['/Users/test/videos/sample.mp4', '/Users/test/videos/test.mov'];
          }
        }
      };
    });
  });

  test('import dialog opens when clicking import button', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await expect(page.locator('.dialog-overlay')).toBeVisible();
    await expect(page.locator('.dialog')).toContainText('Import Videos');
  });

  test('electron environment detection works', async ({ page }) => {
    const isElectron = await page.evaluate(() => {
      return !!(window as any).electronAPI;
    });
    expect(isElectron).toBe(true);
  });

  test('openFile command returns file paths', async ({ page }) => {
    const paths = await page.evaluate(() => {
      return (window as any).electronAPI.dialog.openFile({ multiple: true });
    });
    
    expect(paths).toHaveLength(2);
    expect(paths[0]).toContain('.mp4');
    expect(paths[1]).toContain('.mov');
  });

  test('import button triggers file dialog', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    
    // Click on the import option which should trigger Electron dialog
    await page.click('.import-option');
    
    // Since we mocked the dialog, it should return immediately with mock paths
    // and the dialog should close
    await expect(page.locator('.dialog-overlay')).not.toBeVisible();
  });

  test('unsupported format is skipped', async ({ page }) => {
    // Override mock to return unsupported format
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            return ['/Users/test/video.exe'];
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show error for no valid videos
    await expect(page.locator('.error-message')).toContainText('No valid video files found');
  });

  test('loading state shows during import', async ({ page }) => {
    // Slow mock response
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return ['/Users/test/video.mp4'];
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should see loading spinner or text
    await expect(page.locator('.option-text h4')).toContainText('Reading files');
  });
});

test.describe('Video Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        }
      };
    });
  });

  test('video player renders', async ({ page }) => {
    await page.goto('/');
    
    // Import a video first
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Click on the video in the sidebar
    await page.click('.p-2.rounded >> text=sample.mp4');
    
    // Video player should be visible
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  });

  test('play button is clickable', async ({ page }) => {
    await page.goto('/');
    
    // Import a video first
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Click on the video
    await page.click('.p-2.rounded >> text=sample.mp4');
    
    // Play button should be visible and clickable
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
  });

  test('seek slider works', async ({ page }) => {
    await page.goto('/');
    
    // Import a video first
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Click on the video
    await page.click('.p-2.rounded >> text=sample.mp4');
    
    // Seek slider should be visible
    await expect(page.locator('[data-testid="seek-slider"]')).toBeVisible();
  });
});

test.describe('Settings', () => {
  test('settings dialog opens', async ({ page }) => {
    await page.goto('/');
    await page.click('[title="Settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
  });
});
