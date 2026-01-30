import { test, expect, describe, beforeEach } from '@playwright/test';

// Mock file for testing
const createMockVideoFile = (name: string = 'video.mp4') => {
  return {
    name,
    path: `/test-fixtures/${name}`,
    size: 1024 * 1024,
  };
};

describe('Save Project Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/');
  });

  test('shows save button disabled when no videos', async ({ page }) => {
    // Save button should be disabled when no project/videos
    const saveButton = page.locator('[title="Save project"]');
    await expect(saveButton).toBeDisabled();
  });

  test('can save a project', async ({ page }) => {
    // 1. Import a video first (mock the import)
    await page.evaluate(() => {
      const event = new CustomEvent('mockImport', { detail: { videos: [{ id: '1', name: 'test.mp4', path: '/test/test.mp4', duration: 120, status: 'ready' }] } });
      window.dispatchEvent(event);
    });

    // Wait for video to appear
    await expect(page.locator('.video-preview')).toContainText('test.mp4');

    // 2. Click save button
    await page.click('[title="Save project"]');

    // 3. Verify dialog opens
    await expect(page.locator('.save-dialog')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Save Project');

    // 4. Enter project name
    await page.fill('#project-name-input', 'My Test Project');

    // 5. Click save
    await page.click('[data-testid="save-button"]');

    // 6. Verify dialog closes
    await expect(page.locator('.save-dialog')).toBeHidden();

    // 7. Verify project name appears in header
    await expect(page.locator('.project-name')).toContainText('My Test Project');
  });

  test('can save as with new name', async ({ page }) => {
    // Setup existing project
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: {
          id: '1',
          name: 'Original',
          videos: [{ id: '1', name: 'test.mp4', path: '/test/test.mp4', duration: 120, status: 'ready' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        projects: [],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });
    await page.reload();

    // Click save
    await page.click('[title="Save project"]');
    await expect(page.locator('.save-dialog')).toBeVisible();

    // Verify it says "Save Project As"
    await expect(page.locator('h3')).toContainText('Save Project As');

    // Enter new name and save
    await page.fill('#project-name-input', 'Renamed Project');
    await page.click('[data-testid="save-button"]');

    // Verify new name
    await expect(page.locator('.project-name')).toContainText('Renamed Project');
  });
});

describe('Open Project Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/');
  });

  test('shows open dialog when clicking folder icon', async ({ page }) => {
    // Click open button
    await page.click('[title="Open project"]');

    // Verify dialog opens
    await expect(page.locator('.open-dialog')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Open Project');
  });

  test('shows empty state when no projects', async ({ page }) => {
    await page.click('[title="Open project"]');
    await expect(page.locator('.empty-state')).toContainText('No saved projects yet');
  });

  test('lists saved projects', async ({ page }) => {
    // Setup saved projects
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: null,
        projects: [
          {
            id: '1',
            name: 'Project One',
            videos: [{ id: '1', name: 'video1.mp4', path: '/videos/video1.mp4', duration: 60, status: 'ready' }],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '2',
            name: 'Project Two',
            videos: [{ id: '2', name: 'video2.mov', path: '/videos/video2.mov', duration: 120, status: 'ready' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });
    await page.reload();

    // Open dialog
    await page.click('[title="Open project"]');

    // Verify projects are listed
    await expect(page.locator('.project-item')).toHaveCount(2);
    await expect(page.locator('.project-name').first()).toContainText('Project One');
    await expect(page.locator('.project-name').last()).toContainText('Project Two');
  });

  test('can open a project', async ({ page }) => {
    // Setup saved project
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: null,
        projects: [
          {
            id: '1',
            name: 'My Project',
            videos: [{ id: '1', name: 'test.mp4', path: '/test/test.mp4', duration: 60, status: 'ready' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });
    await page.reload();

    // Open dialog and click project
    await page.click('[title="Open project"]');
    await page.click('[data-testid="project-1"]');

    // Verify project opened
    await expect(page.locator('.project-name')).toContainText('My Project');
    await expect(page.locator('.video-preview')).toContainText('test.mp4');
  });

  test('can search projects', async ({ page }) => {
    // Setup multiple projects
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: null,
        projects: [
          {
            id: '1',
            name: 'Vacation Videos',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Work Project',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });
    await page.reload();

    // Open dialog
    await page.click('[title="Open project"]');

    // Search for vacation
    await page.fill('[data-testid="search-input"]', 'Vacation');

    // Only vacation project should show
    await expect(page.locator('.project-item')).toHaveCount(1);
    await expect(page.locator('.project-name')).toContainText('Vacation Videos');
  });

  test('can delete a project', async ({ page }) => {
    // Setup project
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: null,
        projects: [
          {
            id: '1',
            name: 'To Delete',
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });
    await page.reload();

    // Open dialog
    await page.click('[title="Open project"]');
    await expect(page.locator('.project-item')).toHaveCount(1);

    // Click delete button (mock confirm)
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-1"]');

    // Project should be removed
    await expect(page.locator('.project-item')).toHaveCount(0);
  });
});

describe('State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('persists state across reloads', async ({ page }) => {
    // Setup project
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: {
          id: '1',
          name: 'Persisted Project',
          videos: [{ id: '1', name: 'persisted.mp4', path: '/test/persisted.mp4', duration: 180, status: 'ready' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        projects: [],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });

    // Reload page
    await page.reload();

    // Verify state persisted
    await expect(page.locator('.project-name')).toContainText('Persisted Project');
    await expect(page.locator('.video-preview')).toContainText('persisted.mp4');
    await expect(page.locator('.video-count')).toContainText('1');
  });

  test('theme persists across reloads', async ({ page }) => {
    // Setup with dark theme
    await page.evaluate(() => {
      localStorage.setItem('clipflow-state', JSON.stringify({
        currentProject: null,
        projects: [],
        settings: { theme: 'dark', autoSaveInterval: 30, showAdvancedOptions: false, ffmpegPath: 'ffmpeg', whisperModel: 'base' },
      }));
    });

    await page.reload();

    // Verify dark mode is active
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
