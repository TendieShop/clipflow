import { test, expect } from '@playwright/test';
const { describe, beforeEach } = test;

describe('Import Dialog', () => {
  beforeEach(async ({ page }) => {
    // Safely clear localStorage if available
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // localStorage may not be available in headless mode
        console.log('localStorage not available');
      }
    });
    await page.goto('/');
  });

  test('opens import dialog when clicking import button', async ({ page }) => {
    // Click import button
    await page.click('button:has-text("Import")');
    
    // Verify dialog opens
    await expect(page.locator('.import-dialog')).toBeVisible();
    await expect(page.locator('h3:has-text("Import Videos")')).toBeVisible();
  });

  test('shows error for invalid file format', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Mock file input with invalid format
    await page.evaluate(() => {
      const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (fileInput) {
        // Create mock files with invalid extension
        const mockFiles = [
          new File(['content'], 'document.pdf', { type: 'application/pdf' }),
          new File(['content'], 'image.jpg', { type: 'image/jpeg' }),
          new File(['content'], 'audio.mp3', { type: 'audio/mpeg' }),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: mockFiles,
          writable: false
        });
        
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // Wait for error message
    await expect(page.locator('.error-message')).toContainText('No valid video files found');
  });

  test('handles video file with spaces in path', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Mock file input with spaces in filename
    await page.evaluate(() => {
      const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (fileInput) {
        const mockFiles = [
          new File(['content'], 'my vacation video.mp4', { type: 'video/mp4' }),
          new File(['content'], 'summer trip 2024.mov', { type: 'video/quicktime' }),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: mockFiles,
          writable: false
        });
        
        // Add path property for testing
        Object.defineProperty(mockFiles[0], 'path', {
          value: '/Users/test/Videos/my vacation video.mp4',
          writable: false
        });
        Object.defineProperty(mockFiles[1], 'path', {
          value: '/Users/test/Videos/summer trip 2024.mov',
          writable: false
        });
        
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // Verify videos are imported despite spaces in path
    await expect(page.locator('.video-preview')).toContainText('my vacation video.mp4');
    await expect(page.locator('.video-preview')).toContainText('summer trip 2024.mov');
  });

  test('handles large file gracefully', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Mock large file (simulate file > 2GB)
    await page.evaluate(() => {
      const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (fileInput) {
        // Large file simulation (5GB)
        const largeFile = {
          name: 'large_video_4k.mp4',
          size: 5 * 1024 * 1024 * 1024, // 5GB
          type: 'video/mp4',
          path: '/Users/test/Videos/large_video_4k.mp4'
        };
        
        Object.defineProperty(fileInput, 'files', {
          value: [largeFile],
          writable: false
        });
        
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // Verify large file is handled (shows in video list)
    await expect(page.locator('.video-preview')).toContainText('large_video_4k.mp4');
  });

  test('shows supported formats in import dialog', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Verify supported formats text is visible
    await expect(page.locator('.supported-formats')).toContainText('MP4, MOV, AVI, MKV, WebM, M4V');
  });

  test('can close import dialog', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Click cancel button
    await page.click('[data-testid="cancel-button"]');
    
    // Verify dialog is closed
    await expect(page.locator('.import-dialog')).toBeHidden();
  });

  test('shows progress during import', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Mock multiple files to trigger progress
    await page.evaluate(() => {
      const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (fileInput) {
        const mockFiles = [
          new File(['content'], 'video1.mp4', { type: 'video/mp4' }),
          new File(['content'], 'video2.mp4', { type: 'video/mp4' }),
          new File(['content'], 'video3.mp4', { type: 'video/mp4' }),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: mockFiles,
          writable: false
        });
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // Progress should show during import
    await expect(page.locator('.import-progress')).toBeVisible();
    await expect(page.locator('.progress-text')).toContainText('Processing');
  });
});

describe('Import with Different Formats', () => {
  beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // localStorage may not be available in headless mode
        console.log('localStorage not available');
      }
    });
    await page.goto('/');
  });

  test('imports all supported video formats', async ({ page }) => {
    // Open import dialog
    await page.click('button:has-text("Import")');
    await expect(page.locator('.import-dialog')).toBeVisible();

    // Mock files with all supported formats
    await page.evaluate(() => {
      const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (fileInput) {
        const mockFiles = [
          new File(['content'], 'video.mp4', { type: 'video/mp4' }),
          new File(['content'], 'video.mov', { type: 'video/quicktime' }),
          new File(['content'], 'video.avi', { type: 'video/x-msvideo' }),
          new File(['content'], 'video.mkv', { type: 'video/x-matroska' }),
          new File(['content'], 'video.webm', { type: 'video/webm' }),
          new File(['content'], 'video.m4v', { type: 'video/x-m4v' }),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: mockFiles,
          writable: false
        });
        
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // All videos should be imported
    await expect(page.locator('.video-preview')).toHaveCount(6);
  });
});
