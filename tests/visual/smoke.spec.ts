import { test, expect } from '@playwright/test';

test.describe('ClipFlow Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('Homepage', () => {
    test('homepage empty state', async ({ page }) => {
      await expect(page.locator('.app, [data-testid="app"]').first()).toHaveScreenshot('homepage-empty.png');
    });
  });

  test.describe('Import Dialog', () => {
    test('import dialog default state', async ({ page }) => {
      await page.click('button:has-text("Import"), button:has-text("+ Import"), [data-testid="import-button"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('import-dialog.png');
    });
  });

  test.describe('Settings Dialog', () => {
    test('settings dialog default', async ({ page }) => {
      await page.click('button[title="Settings"], [aria-label*="Settings"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.settings-overlay, .dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('settings-dialog.png');
    });
  });

  test.describe('Video Player', () => {
    test('video player empty state', async ({ page }) => {
      // Video player should show empty state when no video selected
      await expect(page.locator('[data-testid="video-player"]').first()).toBeVisible();
    });
  });
});
