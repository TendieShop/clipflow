import { test, expect, describe } from '@playwright/test';

describe('Export - IPC Connection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock IPC with realistic export behavior
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => '/Users/test/exported-video.mp4'
        },
        video: {
          exportVideo: async (args: { inputPath: string; outputPath: string; quality: string }) => {
            // Simulate export progress
            return undefined;
          }
        }
      };
    });
  });

  test('export shows real progress during export', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Export panel
    await page.click('[data-testid="export-button"]');
    
    // Verify panel opens
    const panel = page.locator('.bg-white.rounded-lg >> text=Export Video');
    await expect(panel.first()).toBeVisible();
    
    // Select quality
    await page.click('button:has-text("High")');
    
    // Click export
    await page.click('button:has-text("Export")');
    
    // Verify progress indicator appears
    const progress = page.locator('.export-progress');
    await expect(progress).toBeVisible();
    
    // Should show percentage
    await expect(progress).toContainText('%');
  });

  test('export completes and shows success', async ({ page }) => {
    // Mock quick export completion
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => '/test/video.mp4'
        },
        video: {
          exportVideo: async (args: any) => {
            // Quick completion
            return undefined;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');
    
    // Wait for completion
    await page.waitForTimeout(500);
    
    // Should show success message
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('export handles IPC error gracefully', async ({ page }) => {
    // Mock IPC failure
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => null
        },
        video: {
          exportVideo: async (args: any) => {
            throw new Error('FFmpeg export failed - invalid codec');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');
    
    // Should show error, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('export quality presets work', async ({ page }) => {
    let selectedQuality: string | null = null;
    
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => '/test/video.mp4'
        },
        video: {
          exportVideo: async (args: any) => {
            selectedQuality = args.quality;
            return undefined;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    
    // Select Medium quality
    await page.click('button:has-text("Medium")');
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(300);
    
    // Verify correct quality sent
    expect(selectedQuality).toBe('medium');
  });

  test('export shows loading state during processing', async ({ page }) => {
    // Slow mock response
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => '/test/video.mp4'
        },
        video: {
          exportVideo: async (args: any) => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return undefined;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');
    
    // Export button should be disabled during export
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeDisabled();
    await expect(exportBtn).toContainText('Exporting...');
    
    // Wait for complete
    await page.waitForTimeout(500);
  });

  test('export can be cancelled', async ({ page }) => {
    // Mock cancellable export
    let cancelled = false;
    
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          saveFile: async (options: any) => '/test/video.mp4'
        },
        video: {
          exportVideo: async (args: any) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return undefined;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');
    
    // Should show cancel button during export
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    
    // Click cancel
    await cancelBtn.click();
    
    // Export should stop, button should re-enable
    await expect(page.locator('button:has-text("Export")')).toBeEnabled();
  });
});

describe('Export - UI Polish', () => {
  
  test('export dialog layout is clean', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    
    // Verify all controls present
    await expect(page.locator('text=Quality')).toBeVisible();
    await expect(page.locator('button:has-text("Low")')).toBeVisible();
    await expect(page.locator('button:has-text("Medium")')).toBeVisible();
    await expect(page.locator('button:has-text("High")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('export shows file info', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="export-button"]');
    
    // Should show source video info
    await expect(page.locator('.export-video-info')).toBeVisible();
  });
});
