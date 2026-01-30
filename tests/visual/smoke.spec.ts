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

    test('homepage dark mode', async ({ page }) => {
      await page.click('button[title="Toggle theme"], button[aria-label*="theme"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.app, [data-testid="app"]').first()).toHaveScreenshot('homepage-empty-dark.png');
    });
  });

  test.describe('Import Dialog', () => {
    test('import dialog default state', async ({ page }) => {
      await page.click('button:has-text("Import"), button:has-text("+ Import"), [data-testid="import-button"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('import-dialog.png');
    });

    test('import dialog dark mode', async ({ page }) => {
      await page.click('button[title="Toggle theme"], button[aria-label*="theme"]');
      await page.waitForTimeout(300);
      await page.click('button:has-text("Import"), button:has-text("+ Import")');
      await page.waitForTimeout(500);
      await expect(page.locator('.dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('import-dialog-dark.png');
    });
  });

  test.describe('Settings Dialog', () => {
    test('settings dialog default', async ({ page }) => {
      await page.click('button[title="Settings"], [aria-label*="Settings"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.settings-overlay, .dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('settings-dialog.png');
    });

    test('settings dialog dark mode', async ({ page }) => {
      await page.click('button[title="Toggle theme"], button[aria-label*="theme"]');
      await page.waitForTimeout(300);
      await page.click('button[title="Settings"], [aria-label*="Settings"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.settings-overlay, .dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('settings-dialog-dark.png');
    });
  });

  test.describe('Export Dialog', () => {
    test('export dialog', async ({ page }) => {
      await page.click('button[title="Export"], button:has-text("Export")');
      await page.waitForTimeout(500);
      await expect(page.locator('.dialog-overlay, [class*="dialog"], [role="dialog"]').first()).toHaveScreenshot('export-dialog.png');
    });
  });

  test.describe('Components', () => {
    test('silence detection panel', async ({ page }) => {
      await expect(page.locator('.silence-detection-panel, [data-testid="silence-detection"]').first()).toHaveScreenshot('silence-detection-panel.png');
    });

    test('buttons component', async ({ page }) => {
      await expect(page.locator('.button-showcase, [data-testid="buttons"]').first()).toHaveScreenshot('buttons-component.png');
    });
  });
});
