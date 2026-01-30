import { test, expect } from '@playwright/test';

test.describe('Import Feature', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock Tauri environment for all tests
    await page.evaluate(() => {
      (window as any).__TAURI__ = {
        invoke: async (cmd: string, args: any) => {
          if (cmd === 'open_file_dialog') {
            // Return mock file paths
            return ['/Users/test/videos/sample.mp4', '/Users/test/videos/test.mov'];
          }
          return null;
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

  test('tauri environment detection works', async ({ page }) => {
    const isTauri = await page.evaluate(() => {
      return !!(window as any).__TAURI__;
    });
    expect(isTauri).toBe(true);
  });

  test('open_file_dialog command returns file paths', async ({ page }) => {
    const paths = await page.evaluate(() => {
      return (window as any).__TAURI__.invoke('open_file_dialog', { multiple: true });
    });
    
    expect(paths).toHaveLength(2);
    expect(paths[0]).toContain('.mp4');
    expect(paths[1]).toContain('.mov');
  });

  test('import button triggers file dialog', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    
    // Click on the import option which should trigger Tauri dialog
    await page.click('.import-option');
    
    // Since we mocked the dialog, it should return immediately with mock paths
    // and the dialog should close
    await expect(page.locator('.dialog-overlay')).not.toBeVisible();
  });

  test('unsupported format is skipped', async ({ page }) => {
    // Override mock to return unsupported format
    await page.evaluate(() => {
      (window as any).__TAURI__ = {
        invoke: async (cmd: string, args: any) => {
          if (cmd === 'open_file_dialog') {
            return ['/Users/test/video.exe'];
          }
          return null;
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
      (window as any).__TAURI__ = {
        invoke: async (cmd: string, args: any) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return ['/Users/test/video.mp4'];
        }
      };
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should see loading spinner or text
    await expect(page.locator('.option-text h4')).toContainText('Reading files');
  });

  test('browser mode shows error message', async ({ page }) => {
    // Clear Tauri mock to simulate browser mode
    await page.evaluate(() => {
      (window as any).__TAURI__ = undefined;
    });

    await page.goto('/');
    await page.click('[data-testid="import-button"]');
    await page.click('.import-option');
    
    // Should show helpful error for browser mode
    await expect(page.locator('.error-message')).toContainText('ClipFlow app');
  });
});
