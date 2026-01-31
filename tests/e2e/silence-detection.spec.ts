import { test, expect, describe } from '@playwright/test';

describe('Silence Detection - IPC Connection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock IPC with realistic silence segments
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          analyzeSilence: async (args: { filePath: string; thresholdDB: number }) => {
            // Return realistic silence segments based on video
            if (args.thresholdDB === -30) {
              return [
                { start: 5.2, end: 8.7, duration: 3.5 },
                { start: 45.3, end: 52.1, duration: 6.8 },
                { start: 120.5, end: 125.0, duration: 4.5 }
              ];
            } else if (args.thresholdDB === -50) {
              return [
                { start: 5.2, end: 8.7, duration: 3.5 },
                { start: 45.3, end: 52.1, duration: 6.8 },
                { start: 67.2, end: 70.5, duration: 3.3 },
                { start: 120.5, end: 125.0, duration: 4.5 }
              ];
            }
            return [];
          }
        }
      };
    });
  });

  test('silence detection returns real segments from IPC', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Silence Detection panel
    await page.click('[data-testid="silence-detection-button"]');
    
    // Verify panel opens
    const panel = page.locator('.bg-white.rounded-lg >> text=Silence Detection');
    await expect(panel.first()).toBeVisible();
    
    // Click detect button
    await page.click('button:has-text("Detect Silence")');
    
    // Wait for IPC response
    await page.waitForTimeout(500);
    
    // Verify real segments shown
    const segments = page.locator('.silence-segment');
    await expect(segments).toHaveCount(3);
    
    // Verify segment details
    await expect(page.locator('.silence-segment').first()).toContainText('5.2s');
    await expect(page.locator('.silence-segment').first()).toContainText('8.7s');
  });

  test('silence detection shows loading state', async ({ page }) => {
    // Slow mock response
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          analyzeSilence: async (args: { filePath: string; thresholdDB: number }) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return [{ start: 10.0, end: 15.0, duration: 5.0 }];
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="silence-detection-button"]');
    
    // Click detect
    await page.click('button:has-text("Detect Silence")');
    
    // Should show loading state
    const button = page.locator('button:has-text("Detect Silence")');
    await expect(button).toBeDisabled();
    await expect(button).toContainText('Detecting...');
    
    // Wait for complete
    await page.waitForTimeout(500);
    
    // Should re-enable
    await expect(button).toBeEnabled();
    await expect(button).toContainText('Detect Silence');
  });

  test('silence detection handles IPC error gracefully', async ({ page }) => {
    // Mock IPC failure
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          analyzeSilence: async (args: { filePath: string; thresholdDB: number }) => {
            throw new Error('FFmpeg analysis failed');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="silence-detection-button"]');
    await page.click('button:has-text("Detect Silence")');
    
    // Should show error, not crash
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('silence detection threshold slider works', async ({ page }) => {
    let receivedThreshold: number | null = null;
    
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          analyzeSilence: async (args: { filePath: string; thresholdDB: number }) => {
            receivedThreshold = args.thresholdDB;
            return [{ start: 10.0, end: 15.0, duration: 5.0 }];
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="silence-detection-button"]');
    
    // Adjust threshold slider
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('-50');
    
    // Click detect
    await page.click('button:has-text("Detect Silence")');
    await page.waitForTimeout(300);
    
    // Verify correct threshold sent
    expect(receivedThreshold).toBe(-50);
  });

  test('silence segments show duration calculations', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="silence-detection-button"]');
    await page.click('button:has-text("Detect Silence")');
    await page.waitForTimeout(500);
    
    // Verify segments show start/end/duration
    const segment = page.locator('.silence-segment').first();
    await expect(segment).toBeVisible();
    
    // Should show formatted times
    await expect(segment).toContainText('s');
  });
});

describe('Silence Detection - UI Polish', () => {
  
  test('panel layout is clean and accessible', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="silence-detection-button"]');
    
    // Verify all controls present
    await expect(page.locator('text=Intensity')).toBeVisible();
    await expect(page.locator('text=Threshold')).toBeVisible();
    await expect(page.locator('button:has-text("Detect Silence")')).toBeVisible();
    
    // Verify segments container exists
    await expect(page.locator('.silence-segments')).toBeVisible();
  });
});
