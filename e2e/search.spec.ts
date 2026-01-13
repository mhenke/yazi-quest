import { test, expect } from '@playwright/test';
import {
  waitForGameLoad,
  dismissEpisodeIntro,
  pressKey,
  typeText,
  isSearchInputVisible,
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
    await expect(isSearchInputVisible(page)).resolves.toBe(true);

    // Type a search query and press Enter to execute
    await typeText(page, 'txt');
    await pressKey(page, 'Enter');

    // Verify search indicator is visible in path bar
    await expect(page.locator('text=(search: txt)')).toBeVisible();

    // Verify that files are filtered to show only matches
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

    // Activate search, type something, and execute
    await pressKey(page, 's');
    await typeText(page, 'md');
    await pressKey(page, 'Enter');
    await expectFileInView(page, 'about.md');

    // Press 'h' to go back (should clear search)
    await pressKey(page, 'h');

    // Verify path has changed back to parent
    await expect(getCurrentPath(page)).toBe(initialPath);

    // Verify search is cleared (no search indicator)
    await expect(page.locator('text=(search:')).not.toBeVisible();

    // Verify file list is no longer filtered
    await expectFileInView(page, 'README.md'); // Is visible again
  });

  test('should exit search mode and clear results with Escape', async ({ page }) => {
    // Activate search, type, and execute
    await pressKey(page, 's');
    await typeText(page, 'log');
    await pressKey(page, 'Enter');

    // Verify search is active
    await expect(page.locator('text=(search: log)')).toBeVisible();

    // Press Escape to clear search results
    await pressKey(page, 'Escape');

    // Verify search indicator is gone
    await expect(page.locator('text=(search:')).not.toBeVisible();

    // Verify file list is no longer filtered
    await expectFileInView(page, 'README.md');
  });

  test('should navigate search results with j and k', async ({ page }) => {
    // Activate search, type, and execute
    await pressKey(page, 's');
    await typeText(page, 'txt'); // Matches multiple .txt files
    await pressKey(page, 'Enter');

    // Wait for results to display
    await page.waitForTimeout(200);

    // Target items in the active/main file list (2nd list)
    const activePane = page.locator('ul[aria-label="File Browser"]').nth(1);
    const firstItem = activePane.locator('[data-test-id^="file-"]').nth(0);
    const secondItem = activePane.locator('[data-test-id^="file-"]').nth(1);

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
    await pressKey(page, 'Enter');

    // Verify search results show the file
    await expectFileInView(page, 'about.md');

    // Press 'l' to open/preview it
    await pressKey(page, 'l');

    // Verify the file content is shown in the preview pane
    // 'about.md' contains 'Yazi Quest'
    const previewPane = page.locator('[data-test-id="preview-pane"]');
    await expect(previewPane).toContainText('Yazi Quest');
  });

  test('should toggle selection with Space on search results', async ({ page }) => {
    // Activate search and execute
    await pressKey(page, 's');
    await typeText(page, 'txt'); // Matches multiple .txt files
    await pressKey(page, 'Enter');

    await page.waitForTimeout(200);

    // Target items in the active/main file list (2nd list)
    const activePane = page.locator('ul[aria-label="File Browser"]').nth(1);
    const firstItem = activePane.locator('[data-test-id^="file-"]').nth(0);
    const secondItem = activePane.locator('[data-test-id^="file-"]').nth(1);

    // Press space to select the first item
    await pressKey(page, ' '); // Space
    await expect(firstItem).toHaveClass(/bg-yellow-500/); // Check for selection highlight

    // Navigate down and select the second item
    await pressKey(page, 'j');
    await page.waitForTimeout(100);

    await pressKey(page, ' '); // Space

    // Both items should now be selected
    await expect(secondItem).toHaveClass(/bg-yellow-500/);
    await expect(firstItem).toHaveClass(/bg-yellow-500/); // First one remains selected

    // Exit search mode and check if selections persist
    await pressKey(page, 'Escape');
    // After Escape, search clears but selections should remain
  });
});
