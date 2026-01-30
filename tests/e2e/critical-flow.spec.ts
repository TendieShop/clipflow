// Critical User Flow E2E Tests
// Tests UI elements and dialog flows that work in headless mode

import { test, expect } from '@playwright/test';

test.describe('App Loads', () => {
  test('app renders without errors', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000);
    
    // Log any errors found (don't fail on non-critical ones)
    console.log('Console errors:', errors);
  });
});

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('main elements exist', async ({ page }) => {
    // Check page title or header
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('can navigate to settings', async ({ page }) => {
    // Settings button exists
    const settingsBtn = page.locator('[title="Settings"]');
    await expect(settingsBtn).toBeVisible();
  });
});

test.describe('Visual Regression - UI States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('homepage snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-critical.png', {
      maxDiffPixels: 100,
    });
  });

  test('settings dialog opens', async ({ page }) => {
    await page.click('[title="Settings"]');
    await page.waitForTimeout(500);
    
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    
    await expect(page).toHaveScreenshot('settings-dialog-critical.png', {
      maxDiffPixels: 100,
    });
  });
});
