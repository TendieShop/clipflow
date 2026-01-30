import { test, expect } from '@playwright/test';
const { describe, beforeEach } = test;

describe('Export Dialog', () => {
  beforeEach(async ({ page }) => {
    // Safely set up state if localStorage is available
    await page.evaluate(() => {
      try {
        localStorage.clear();
        // Setup a project with a video for export testing
        localStorage.setItem('clipflow-state', JSON.stringify({
          currentProject: {
            id: '1',
            name: 'Test Project',
            videos: [{ 
              id: '1', 
              name: 'test-video.mp4', 
              path: '/test-videos/test-video.mp4', 
              duration: 120, 
              status: 'ready' 
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          projects: [],
          settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
        }));
      } catch (e) {
        // localStorage may not be available in headless mode
        console.log('localStorage not available');
      }
    });
    await page.reload();
  });

  test('opens export dialog when clicking export button', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Verify dialog opens
    await expect(page.locator('.dialog-overlay')).toBeVisible();
    await expect(page.locator('text=Export Video')).toBeVisible();
  });

  test('export button is disabled when no videos', async ({ page }) => {
    // Clear state
    await page.evaluate(() => {
      try {
        localStorage.clear();
        localStorage.setItem('clipflow-state', JSON.stringify({
          currentProject: {
            id: '1',
            name: 'Empty Project',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          projects: [],
          settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
        }));
      } catch (e) {
        console.log('localStorage not available');
      }
    });
    await page.reload();

    // Export button should be disabled
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeDisabled();
  });

  test('shows quality settings', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Verify quality options are visible
    await expect(page.locator('text=High')).toBeVisible();
    await expect(page.locator('text=Medium')).toBeVisible();
    await expect(page.locator('text=Low')).toBeVisible();
    await expect(page.locator('text=Balanced size/quality')).toBeVisible();
  });

  test('can select high quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click high quality button
    await page.click('button:has-text("High")');

    // Verify high quality is selected
    await expect(page.locator('button:has-text("High")')).toHaveClass(/selected/);
  });

  test('can select medium quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click medium quality button
    await page.click('button:has-text("Medium")');

    // Verify medium quality is selected
    await expect(page.locator('button:has-text("Medium")')).toHaveClass(/selected/);
  });

  test('can select low quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click low quality button
    await page.click('button:has-text("Low")');

    // Verify low quality is selected
    await expect(page.locator('button:has-text("Low")')).toHaveClass(/selected/);
  });

  test('shows format options', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Verify format options are visible
    await expect(page.locator('button:has-text("MP4")')).toBeVisible();
    await expect(page.locator('button:has-text("WebM")')).toBeVisible();
  });

  test('can select MP4 format', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click MP4 format button
    await page.click('button:has-text("MP4")');

    // Verify MP4 is selected
    await expect(page.locator('button:has-text("MP4")')).toHaveClass(/selected/);
  });

  test('can select WebM format', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click WebM format button
    await page.click('button:has-text("WebM")');

    // Verify WebM is selected
    await expect(page.locator('button:has-text("WebM")')).toHaveClass(/selected/);
  });

  test('shows progress during export', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Mock the export function to simulate progress
    await page.evaluate(() => {
      // Click export button
      const exportBtn = document.querySelector('button:has-text("Export")');
      if (exportBtn instanceof HTMLElement) {
        exportBtn.click();
      }
    });

    // Progress bar should be visible
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('.progress-text')).toContainText('Exporting');
  });

  test('progress updates during export', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click export button
    await page.click('button:has-text("Export")');

    // Progress should show percentage
    await expect(page.locator('.progress-text')).toContainText('%');
  });

  test('export button disabled during export', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click export button
    await page.click('button:has-text("Export")');

    // Export button should now show "Exporting..." and be disabled
    const exportButton = page.locator('button:has-text("Exporting...")');
    await expect(exportButton).toBeDisabled();
  });

  test('quality buttons disabled during export', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click export button
    await page.click('button:has-text("Export")');

    // Quality buttons should be disabled
    await expect(page.locator('button:has-text("High")')).toBeDisabled();
    await expect(page.locator('button:has-text("Medium")')).toBeDisabled();
    await expect(page.locator('button:has-text("Low")')).toBeDisabled();
  });

  test('format buttons disabled during export', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click export button
    await page.click('button:has-text("Export")');

    // Format buttons should be disabled
    await expect(page.locator('button:has-text("MP4")')).toBeDisabled();
    await expect(page.locator('button:has-text("WebM")')).toBeDisabled();
  });

  test('can close export dialog', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click outside the dialog to close
    await page.click('.dialog-overlay', { position: { x: 10, y: 10 } });
    
    // Verify dialog is closed
    await expect(page.locator('.dialog-overlay')).toBeHidden();
  });
});

describe('Export Quality Descriptions', () => {
  beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        localStorage.setItem('clipflow-state', JSON.stringify({
          currentProject: {
            id: '1',
            name: 'Test Project',
            videos: [{ 
              id: '1', 
              name: 'test-video.mp4', 
              path: '/test-videos/test-video.mp4', 
              duration: 120, 
              status: 'ready' 
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          projects: [],
          settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
        }));
      } catch (e) {
        console.log('localStorage not available');
      }
    });
    await page.reload();
  });

  test('shows correct description for high quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click high quality
    await page.click('button:has-text("High")');

    // Verify description
    await expect(page.locator('.quality-desc')).toContainText('Larger file, best quality');
  });

  test('shows correct description for medium quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click medium quality
    await page.click('button:has-text("Medium")');

    // Verify description
    await expect(page.locator('.quality-desc')).toContainText('Balanced size/quality');
  });

  test('shows correct description for low quality', async ({ page }) => {
    // Open export dialog
    await page.click('button:has-text("Export")');
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // Click low quality
    await page.click('button:has-text("Low")');

    // Verify description
    await expect(page.locator('.quality-desc')).toContainText('Smaller file, lower quality');
  });
});
