import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,  // Run tests sequentially to avoid resource issues
  forbidOnly: !!process.env.CI,
  retries: 0,  // No retries in dev to avoid hanging
  workers: 1,  // Single worker to prevent resource exhaustion
  reporter: 'line',  // Use line reporter for cleaner output
  
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'off',
    screenshot: 'off',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: true,  // Always reuse existing server
    timeout: 30000,
  },
  
  timeout: 30000,  // 30 second timeout per test
});
