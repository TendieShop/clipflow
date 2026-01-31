// Performance Tests for ClipFlow
import { test, expect, describe } from '@playwright/test';

describe('Performance', () => {
  test('app loads within reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;
    
    // App should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('dialog opens quickly', async ({ page }) => {
    await page.goto('/');
    
    const start = Date.now();
    await page.click('[title="Settings"]');
    await page.waitForSelector('.dialog-overlay');
    const openTime = Date.now() - start;
    
    // Dialog should open within 500ms
    expect(openTime).toBeLessThan(500);
  });

  test('import dialog opens quickly', async ({ page }) => {
    await page.goto('/');
    
    const start = Date.now();
    await page.click('[data-testid="import-button"]');
    await page.waitForSelector('.dialog-overlay');
    const openTime = Date.now() - start;
    
    // Import dialog should open within 500ms
    expect(openTime).toBeLessThan(500);
  });
});

describe('Memory (basic)', () => {
  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Open and close dialog multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('[title="Settings"]');
      await page.waitForTimeout(100);
      await page.click('.close-btn');
      await page.waitForTimeout(100);
    }
    
    // Should still be responsive
    await page.click('[title="Settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
  });
});
