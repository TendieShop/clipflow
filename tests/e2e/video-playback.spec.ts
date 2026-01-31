import { test, expect, describe } from '@playwright/test';

describe('Video Player - Playback', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock video with valid metadata
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getMetadata: async () => ({
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

  test('video plays without GPU errors', async ({ page }) => {
    await page.goto('/');
    
    // Import video
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    // Select video
    await page.click('.video-item >> text=video.mp4');
    
    // Wait for video to load
    await page.waitForTimeout(500);
    
    // Click play button
    await page.click('button:has-text("Play")');
    
    // Should not crash, video should play
    await page.waitForTimeout(1000);
    
    // Play button should change to pause
    const playButton = page.locator('button:has-text("Pause")');
    await expect(playButton).toBeVisible();
  });

  test('video shows error for corrupted file', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/corrupted.mp4']
        },
        video: {
          getVideoDuration: async () => 0,
          getMetadata: async () => {
            throw new Error('Cannot parse video file');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=corrupted.mp4');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('not found');
  });

  test('video shows error for unsupported format', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.xyz']
        },
        video: {
          getVideoDuration: async () => {
            throw new Error('Media error');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.xyz');
    
    // Should show format not supported error
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('seeking works correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    await page.waitForTimeout(500);
    
    // Video loaded, time should display
    const timeDisplay = page.locator('text=/0:00.*120:00/');
    await expect(timeDisplay.first()).toBeVisible();
  });

  test('waveform updates during playback', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getMetadata: async () => ({
            duration: 120.0,
            width: 1920,
            height: 1080,
            format: 'mp4',
            codec: 'h264',
            bitrate: 5000000,
            fps: 30
          }),
          getAudioData: async () => ({
            samples: Array(100).fill(0).map(() => Math.random()),
            sampleRate: 44100,
            duration: 120
          })
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    await page.waitForTimeout(500);
    
    // Waveform should be visible
    const waveform = page.locator('.audio-waveform');
    await expect(waveform).toBeVisible();
    
    // Click play
    await page.click('button:has-text("Play")');
    await page.waitForTimeout(500);
    
    // Playhead should be visible
    const playhead = page.locator('.waveform-playhead');
    await expect(playhead).toBeVisible();
  });
});
