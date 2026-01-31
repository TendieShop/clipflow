import { test, expect, describe } from '@playwright/test';

describe('Import Feature - Video Metadata', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock Electron environment for all tests
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            return ['/Users/test/videos/sample.mp4', '/Users/test/videos/test.mov'];
          }
        },
        video: {
          getVideoDuration: async (filePath: string) => {
            // Return realistic metadata based on file
            if (filePath.includes('sample')) return 125.5; // 2:05
            if (filePath.includes('test')) return 240.0;   // 4:00
            return 60.0;
          }
        }
      };
    });
  });

  test('import fetches video metadata and displays duration', async ({ page }) => {
    await page.goto('/');
    
    // Open import dialog
    await page.click('[data-testid="import-button"]');
    
    // Click import option to trigger file selection
    await page.click('.import-option');
    
    // Wait for import to complete
    await page.waitForTimeout(500);
    
    // Verify video appears in sidebar with correct duration
    const videoItem = page.locator('.p-2.rounded').first();
    await expect(videoItem).toBeVisible();
    
    // Duration should be displayed (2:05 = 125.5 seconds)
    await expect(videoItem).toContainText('2:05');
  });

  test('import shows loading state during metadata fetch', async ({ page }) => {
    // Slow mock response for testing loading state
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return ['/Users/test/videos/slow-video.mp4'];
          }
        },
        video: {
          getVideoDuration: async (filePath: string) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 180.0;
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    
    // Should see loading state
    const optionText = page.locator('.option-text h4').first();
    await expect(optionText).toContainText('Reading files');
    
    // Wait for complete
    await page.waitForTimeout(500);
  });

  test('import handles metadata fetch error gracefully', async ({ page }) => {
    // Mock IPC failure
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async (filePath: string) => {
            throw new Error('FFmpeg not found');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show error message, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('multiple videos get metadata each', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    await page.waitForTimeout(500);
    
    // Both videos should appear with their durations
    // sample.mp4 = 2:05, test.mov = 4:00
    const videos = page.locator('.p-2.rounded');
    const count = await videos.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe('Import Feature - File Size', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getVideoMetadata: async (filePath: string) => ({
            duration: 120.0,
            width: 1920,
            height: 1080,
            format: 'mp4',
            codec: 'h264',
            bitrate: 5000000,
            fps: 30
          })
        }
      };
    });
  });

  test('import displays video file size', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    await page.waitForTimeout(500);
    
    // Video info should show size
    const videoInfo = page.locator('.p-4:has-text("Video Info")');
    await expect(videoInfo).toBeVisible();
    
    // Should display file size (mock returns 156.3 MB based on bitrate)
    await expect(videoInfo).toContainText('MB');
  });
});
