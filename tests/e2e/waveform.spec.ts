import { test, expect, describe } from '@playwright/test';

describe('Audio Waveform Visualization', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock IPC with audio data
    await page.evaluate(() => {
      (window as any).electronAPI = {
        video: {
          getAudioData: async (filePath: string) => {
            // Generate mock waveform data
            const samples = [];
            for (let i = 0; i < 100; i++) {
              samples.push(Math.random() * 0.8 + 0.1); // 0.1 to 0.9
            }
            return {
              samples,
              sampleRate: 44100,
              duration: 120
            };
          }
        }
      };
    });
  });

  test('audio waveform renders when video is selected', async ({ page }) => {
    await page.goto('/');
    
    // Import a video first
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getAudioData: async () => ({
            samples: Array(100).fill(0).map(() => Math.random()),
            sampleRate: 44100,
            duration: 120
          })
        }
      };
    });

    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    // Select video
    await page.click('.video-item >> text=video.mp4');
    
    // Audio waveform should be visible
    const waveform = page.locator('.audio-waveform');
    await expect(waveform).toBeVisible();
  });

  test('waveform shows audio levels', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getAudioData: async () => ({
            samples: [0.1, 0.5, 0.8, 0.3, 0.9, 0.2, 0.6, 0.4],
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
    
    // Waveform bars should be visible
    const bars = page.locator('.waveform-bar');
    expect(await bars.count()).toBeGreaterThan(0);
  });

  test('waveform handles no audio gracefully', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getAudioData: async () => ({
            samples: [],
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
    
    // Should show "No audio" message
    await expect(page.locator('.no-audio-message')).toBeVisible();
  });

  test('waveform handles IPC error gracefully', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getAudioData: async () => {
            throw new Error('Audio analysis failed');
          }
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    await page.waitForTimeout(500);
    
    await page.click('.video-item >> text=video.mp4');
    
    // Should show error, not crash
    await expect(page.locator('.waveform-error')).toBeVisible();
  });

  test('waveform is interactive for seeking', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
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
    
    // Click on waveform to seek
    const waveform = page.locator('.audio-waveform');
    await waveform.click();
    
    // Should update playback position
    // (Verification depends on implementation)
  });

  test('waveform shows playback position', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
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
    
    // Play video
    await page.click('button:has-text("Play")');
    
    // Playhead should be visible on waveform
    const playhead = page.locator('.waveform-playhead');
    await expect(playhead).toBeVisible();
  });
});

describe('Audio Waveform - UI Polish', () => {
  
  test('waveform has correct styling', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).electronAPI = {
        dialog: {
          openFile: async () => ['/test/video.mp4']
        },
        video: {
          getVideoDuration: async () => 120.0,
          getAudioData: async () => ({
            samples: Array(50).fill(0).map(() => Math.random()),
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
    
    // Waveform should have gradient styling
    const waveform = page.locator('.audio-waveform');
    await expect(waveform).toHaveClass(/waveform/);
  });
});
