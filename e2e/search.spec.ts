
import { test, expect } from '@playwright/test';
import {
  waitForGameLoad,
  dismissEpisodeIntro,
  pressKey,
  typeText,
  isFuzzyFinderVisible,
  expectFileInView,
  expectFileNotInView,
  getCurrentPath,
  jumpToLevel,
} from './helpers';

test.describe('Search Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
    // Search is unlocked in Level 6
    await jumpToLevel(page, 5);
    await dismissEpisodeIntro(page);
  });

  test('should enter search mode with "s", filter results, and show search indicator', async ({
    page,
  }) => {
    // Press 's' to activate search
    await pressKey(page, 's');
    await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

    // Type a search query
    await typeText(page, 'txt');

    // Verify search indicator is visible
    // FuzzyFinder shows the query in the bottom bar
    await expect(page.getByText('enter search here...')).not.toBeVisible();
    await expect(page.locator('span.text-zinc-100', { hasText: 'txt' }).last()).toBeVisible();

    // Verify that files are filtered
    await expectFileInView(page, 'personnel_list.txt'); // Should be visible
    await expectFileNotInView(page, 'about.md'); // Should not be visible
  });

  test('should clear search and exit search mode when pressing "h" to go to parent dir', async ({
    page,
  }) => {
    const initialPath = await getCurrentPath(page);

    // Go into a subdirectory first
    await pressKey(page, 'j'); // Move to 'sys'
    await pressKey(page, 'l'); // Enter 'sys'
    await expect(getCurrentPath(page)).not.toBe(initialPath);

    // Activate search and type something
    await pressKey(page, 's');
    await typeText(page, 'conf');
    await expect(page.locator('span.text-zinc-100', { hasText: 'conf' }).last()).toBeVisible();
    // 'yazi.toml' is in .config, might not be found from here if not recursive? 
    // recursive search finds everything.
    // 'uplink_v1.conf' is in protocols (level 4). In Level 6 it is in vault/active.
    // Let's assume 'conf' matches something or use 'md'
    await pressKey(page, 'Escape'); // Clear first
    await pressKey(page, 's');
    await typeText(page, 'md');
    await expectFileInView(page, 'about.md');

    // Press 'h' to go back
    await pressKey(page, 'h');

    // Verify path has changed back to parent
    await expect(getCurrentPath(page)).toBe(initialPath);

    // Verify search is cleared
    await expect(isFuzzyFinderVisible(page)).resolves.toBe(false);
    // await expect(page.locator('text=search:')).not.toBeVisible(); // Not present in UI


    // Verify file list is no longer filtered
    await expectFileInView(page, 'README.md'); // Is visible again
  });

  test('should exit search mode and clear results with Escape', async ({ page }) => {
    // Activate search and type
    await pressKey(page, 's');
    await typeText(page, 'log');
    // Activate search and type
    await pressKey(page, 's');
    await typeText(page, 'log');
    await expect(page.locator('span.text-zinc-100', { hasText: 'log' }).last()).toBeVisible();

    // Press Escape
    await pressKey(page, 'Escape');

    // Verify search UI is gone
    await expect(isFuzzyFinderVisible(page)).resolves.toBe(false);
    // await expect(page.locator('text=search:')).not.toBeVisible();

    // Verify file list is no longer filtered
    await expectFileInView(page, 'README.md');
  });

  test('should navigate search results with j and k', async ({ page }) => {
    // Activate search and type
    await pressKey(page, 's');
    await typeText(page, 'txt'); // Matches multiple .txt files

    // Initially, the first match should be selected
    // Note: Order depends on fuzzy match score. 
    // Let's just grab the first and second visible items.
    const firstItem = page.locator('[data-test-id^="file-"]').nth(0);
    const secondItem = page.locator('[data-test-id^="file-"]').nth(1);

    await expect(firstItem).toHaveClass(/bg-blue-500/);

    // Press 'j' to navigate down
    await pressKey(page, 'j');
    await expect(secondItem).toHaveClass(/bg-blue-500/);
    await expect(firstItem).not.toHaveClass(/bg-blue-500/);

    // Press 'k' to navigate up
    await pressKey(page, 'k');
    await expect(firstItem).toHaveClass(/bg-blue-500/);
    await expect(secondItem).not.toHaveClass(/bg-blue-500/);
  });

  test('should open a file with l or Enter and exit search mode', async ({ page }) => {
    // Activate search for a specific file
    await pressKey(page, 's');
    await typeText(page, 'about.md');
    await expect(page.locator('span.text-zinc-100', { hasText: 'about.md' }).last()).toBeVisible();

    // Press 'l' to open it
    await pressKey(page, 'l');

    // Verify search is exited
    await expect(isFuzzyFinderVisible(page)).resolves.toBe(false);

    // Verify the file content is shown in the preview pane
    // 'about.md' contains 'Yazi Quest'
    const previewPane = page.locator('[data-test-id="preview-pane"]');
    await expect(previewPane).toContainText('Yazi Quest');
  });

  test('should toggle selection with Space on search results', async ({ page }) => {
    // Activate search
    await pressKey(page, 's');
    await typeText(page, 'txt'); // Matches multiple .txt files

    const firstItem = page.locator('[data-test-id^="file-"]').nth(0);
    const secondItem = page.locator('[data-test-id^="file-"]').nth(1);

    // Press space to select the first item
    await pressKey(page, ' '); // Space
    await expect(firstItem).toHaveClass(/bg-yellow-500/); // Check for selection highlight

    // Navigate down and select the second item
    await pressKey(page, 'j');

    // FIX: Add a small delay to ensure the UI has updated after navigation
    await page.waitForTimeout(100);

    await pressKey(page, ' '); // Space

    // Both items should now be selected
    await expect(secondItem).toHaveClass(/bg-yellow-500/);
    await expect(firstItem).toHaveClass(/bg-yellow-500/); // First one remains selected

    // Exit search mode and check if selections persist
    await pressKey(page, 'Escape');
    await expect(firstItem).toHaveClass(/bg-yellow-500/);
    await expect(secondItem).toHaveClass(/bg-yellow-500/);
  });
});
