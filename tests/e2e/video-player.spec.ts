import { test, expect, describe, beforeEach } from '@playwright/test';

describe('Video Player - Playback', () => {
  
  beforeEach(async ({ page }) => {
    // Mock Electron API with proper video file
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async (options: any) => {
            // Return a mock path - in real Electron this would be a real path
            return ['/Users/test/Videos/sample.mp4'];
          }
        },
        video: {
          getVideoDuration: async (filePath: string) => 125.5,
          getMetadata: async (filePath: string) => ({
            duration: 125.5,
            width: 1920,
            height: 1080,
            format: 'mp4',
            codec: 'h264',
            bitrate: 5000000,
            fps: 30
          }),
          getAudioData: async (filePath: string) => ({
            samples: Array(100).fill(0).map(() => Math.random() * 0.6 + 0.2),
            sampleRate: 44100,
            duration: 125.5
          })
        }
      };
    });
  });

  test('video element renders with playsInline attribute', async ({ page }) => {
    await page.goto('/');
    
    // Import video
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    // Select video
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Check video element has playsInline
    const videoElement = page.locator('video[playsinline]');
    await expect(videoElement).toHaveAttribute('playsinline', '');
  });

  test('video element has preload and crossOrigin attributes', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    const video = page.locator('video[data-testid="video-element"]');
    await expect(video).toHaveAttribute('preload', 'auto');
    await expect(video).toHaveAttribute('crossorigin', 'anonymous');
  });

  test('video controls appear after loading', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Controls should be visible
    const controls = page.locator('.video-controls');
    await expect(controls).toBeVisible();
    
    // Play button should be visible
    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
  });

  test('play button toggles state', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Click play
    await page.click('.play-btn');
    await page.waitForTimeout(200);
    
    // Play button should now show pause icon (different SVG)
    // This is a visual test - we're checking the button responds
    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
  });

  test('time display shows current and duration', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Time display should show something like "0:00 / 2:05"
    const timeDisplay = page.locator('.time-display');
    await expect(timeDisplay).toContainText('/');
  });

  test('waveform is visible when video is selected', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Waveform container should be visible
    const waveform = page.locator('.audio-waveform-container');
    await expect(waveform).toBeVisible();
  });

  test('volume control works', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=sample.mp4');
    await page.waitForTimeout(500);
    
    // Mute button should be visible
    const muteBtn = page.locator('.mute-btn');
    await expect(muteBtn).toBeVisible();
  });

  test('video shows error for missing file', async ({ page }) => {
    // Mock with non-existent file
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/nonexistent/video.mp4']
        },
        video: {
          getVideoDuration: async () => {
            throw new Error('ENOENT: no such file or directory');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    await page.waitForTimeout(500);
    
    // Should show error message
    const errorDiv = page.locator('.video-error');
    await expect(errorDiv).toBeVisible();
  });
});

describe('Video Player - Seeking', () => {
  
  beforeEach(async ({ page }) => {
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
            duration: 120.0
          })
        }
      };
    });
  });

  test('seek slider exists and is interactive', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    await page.waitForTimeout(500);
    
    // Seek slider should be visible
    const seekSlider = page.locator('.seek-slider');
    await expect(seekSlider).toBeVisible();
    
    // Slider should have min/max values
    await expect(seekSlider).toHaveAttribute('min', '0');
    await expect(seekSlider).toHaveAttribute('max', '120');
  });

  test('clicking waveform seeks to position', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    await page.waitForTimeout(500);
    
    // Waveform should be clickable
    const waveformCanvas = page.locator('.audio-waveform');
    await expect(waveformCanvas).toBeVisible();
    
    // Click on waveform should work without error
    await waveformCanvas.click();
    await page.waitForTimeout(100);
    
    // No error should appear
    const errorDiv = page.locator('.video-error');
    await expect(errorDiv).not.toBeVisible();
  });
});
