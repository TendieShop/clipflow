import { test, expect } from '@playwright/test';

test.describe('ClipFlow Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a fresh page for each test
    await page.goto('/');
    // Wait for the app to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('Empty State - Homepage', () => {
    test('homepage with no video should match baseline', async ({ page }) => {
      // Homepage loads with empty state (no videos imported)
      await expect(page.locator('.app')).toHaveScreenshot('homepage-empty.png');
    });
  });

  test.describe('Empty State - Dialogs', () => {
    test('import dialog (empty state) should match baseline', async ({ page }) => {
      // Open import dialog with no files selected
      await page.click('button:has-text("+ Import")');
      await page.waitForTimeout(500);
      await expect(page.locator('.import-overlay, .import-dialog').first()).toHaveScreenshot('import-dialog-empty.png');
    });

    test('export dialog (empty state) should match baseline', async ({ page }) => {
      // Export button is disabled when no video selected, screenshot the header with disabled state
      await page.waitForTimeout(300);
      await expect(page.locator('.header')).toHaveScreenshot('export-button-disabled.png');
    });

    test('settings dialog should match baseline', async ({ page }) => {
      // Open settings dialog
      await page.click('button[title="Settings"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.settings-overlay, .settings-dialog').first()).toHaveScreenshot('settings-dialog.png');
    });
  });

  test.describe('Empty State - Panels', () => {
    test('silence detection panel (empty state) should match baseline', async ({ page }) => {
      // Silence detection panel with no video selected
      await expect(page.locator('.sidebar.right-sidebar')).toHaveScreenshot('silence-detection-empty.png');
    });
  });

  test.describe('Dark Mode States', () => {
    test('homepage dark mode should match baseline', async ({ page }) => {
      // Toggle to dark mode
      await page.click('button[title="Toggle theme"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.app')).toHaveScreenshot('homepage-empty-dark.png');
    });

    test('settings dialog dark mode should match baseline', async ({ page }) => {
      // Toggle to dark mode
      await page.click('button[title="Toggle theme"]');
      await page.waitForTimeout(300);
      
      // Open settings dialog
      await page.click('button[title="Settings"]');
      await page.waitForTimeout(500);
      await expect(page.locator('.settings-overlay, .settings-dialog').first()).toHaveScreenshot('settings-dialog-dark.png');
    });
  });
});
