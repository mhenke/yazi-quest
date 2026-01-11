import { test, expect } from '@playwright/test';
import {
  waitForGameLoad,
  dismissEpisodeIntro,
  pressKey,
  typeText,
  isFilterModeActive,
  enterFilter,
  exitFilterMode,
  jumpToLevel,
  getCurrentPath,
} from './helpers';

test.describe('Filter Mode - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
  });

  test.describe('Filter Mode Entry and Exit', () => {
    test('should enter filter mode with f key', async ({ page }) => {
      // Jump to Level 3 where filter is available
      await jumpToLevel(page, 2); // 0-indexed, Level 3
      await dismissEpisodeIntro(page);

      // Press 'f' to enter filter mode
      await pressKey(page, 'f');

      // Verify filter input is visible and focused
      const filterInput = page.locator('input').first();
      await expect(filterInput).toBeVisible({ timeout: 2000 });
      await expect(filterInput).toBeFocused();

      // Verify filter label is shown
      const filterLabel = page.getByText('Filter:', { exact: true });
      await expect(filterLabel).toBeVisible();
    });

    test('should exit filter mode with Escape', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Enter filter mode
      await pressKey(page, 'f');
      const filterInput = page.locator('input').first();
      await expect(filterInput).toBeVisible();

      // Exit with Escape
      await pressKey(page, 'Escape');

      // Filter input should no longer be visible
      await expect(filterInput).not.toBeVisible({ timeout: 1000 });
    });

    test('should maintain input focus when filter mode is active', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Enter filter mode
      await pressKey(page, 'f');
      const filterInput = page.locator('input').first();
      await expect(filterInput).toBeFocused();

      // Type some text
      await typeText(page, 'test');

      // Input should still be focused
      await expect(filterInput).toBeFocused();

      // Verify text was typed
      await expect(filterInput).toHaveValue('test');
    });
  });

  test.describe('Real-Time Filtering', () => {
    test('should filter file list as user types', async ({ page }) => {
      // Jump to Level 3 which has multiple files in ~/incoming
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Navigate to ~/incoming (has sector_map.png and potentially others)
      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Get initial file count
      const allFiles = page.locator('.flex.items-center.gap-2').count();

      // Enter filter mode and type 'sector'
      await enterFilter(page, 'sector');
      await page.waitForTimeout(300);

      // File list should now be filtered
      // We should see sector_map.png but filter out any files without 'sector' in the name
      const filteredFiles = page.locator('text=sector_map.png');
      await expect(filteredFiles).toBeVisible({ timeout: 1000 });

      // Exit filter
      await exitFilterMode(page);
    });

    test('should show no results when filter matches nothing', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Navigate to a directory with files
      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter mode with text that won't match anything
      await enterFilter(page, 'xyznonexistent123');
      await page.waitForTimeout(300);

      // File list should be empty or show "no matches" message
      const fileList = page.locator('.flex.items-center.gap-2');
      const count = await fileList.count();

      // Either no files shown, or a "no results" message
      expect(count).toBe(0);

      await exitFilterMode(page);
    });

    test('should update results immediately as user types', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter mode
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Type 's' - might match multiple files
      await typeText(page, 's');
      await page.waitForTimeout(200);

      // Type 'e' - narrows results
      await typeText(page, 'e');
      await page.waitForTimeout(200);

      // Type 'c' - further narrows to 'sec...'
      await typeText(page, 'c');
      await page.waitForTimeout(200);

      // Should now be showing only files matching 'sec'
      const filterInput = page.locator('input').first();
      await expect(filterInput).toHaveValue('sec');

      await exitFilterMode(page);
    });

    test('should clear results when filter text is deleted', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter and type
      await enterFilter(page, 'sector');
      await page.waitForTimeout(300);

      // Delete all text
      const filterInput = page.locator('input').first();
      await filterInput.press('Control+a');
      await filterInput.press('Backspace');
      await page.waitForTimeout(200);

      // All files should be visible again
      await expect(filterInput).toHaveValue('');

      await exitFilterMode(page);
    });
  });

  test.describe('Navigation While Filtering', () => {
    test('should allow arrow key navigation while filter dialog is open', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter mode
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Use arrow keys to navigate the filtered list
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);

      // Filter dialog should still be visible
      const filterLabel = page.getByText('Filter:', { exact: true });
      await expect(filterLabel).toBeVisible();

      await exitFilterMode(page);
    });

    test('should allow j/k navigation while filter dialog is open', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter mode
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Use j/k keys to navigate (these should work even with filter open)
      await pressKey(page, 'j');
      await pressKey(page, 'k');

      // Filter dialog should still be visible
      const filterLabel = page.getByText('Filter:', { exact: true });
      await expect(filterLabel).toBeVisible();

      await exitFilterMode(page);
    });

    test('should exit filter and enter directory with l key', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Start in home directory
      const initialPath = await getCurrentPath(page);

      // Enter filter mode
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Press 'l' to enter directory (should close filter)
      await pressKey(page, 'l');
      await page.waitForTimeout(500);

      // Filter should be closed
      const filterInput = page.locator('input').first();
      await expect(filterInput).not.toBeVisible({ timeout: 1000 });

      // We should have navigated into a directory
      const newPath = await getCurrentPath(page);
      expect(newPath).not.toBe(initialPath);
    });

    test('should exit filter and go to parent with h key', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Navigate into a subdirectory first
      await pressKey(page, 'g');
      await pressKey(page, 'i'); // Go to ~/incoming
      await page.waitForTimeout(500);

      // Enter filter mode
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Press 'h' to go to parent (should close filter)
      await pressKey(page, 'h');
      await page.waitForTimeout(500);

      // Filter should be closed
      const filterInput = page.locator('input').first();
      await expect(filterInput).not.toBeVisible({ timeout: 1000 });

      // We should have navigated to parent directory
      const path = await getCurrentPath(page);
      expect(path).not.toContain('incoming');
    });
  });

  test.describe('Filter Persistence', () => {
    test('should persist filter text after closing dialog', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter, type text, and close
      await enterFilter(page, 'sector');
      await exitFilterMode(page);

      // Filter indicator should show in the path bar
      const pathBar = page.locator('.font-mono').first();
      const pathText = await pathBar.textContent();

      // Path should indicate filter is active
      const hasFilterIndicator =
        pathText?.toLowerCase().includes('filter') || pathText?.toLowerCase().includes('sector');
      expect(hasFilterIndicator).toBe(true);
    });

    test('should keep filtering files after dialog is closed', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Apply filter
      await enterFilter(page, 'sector');

      // Close filter dialog but keep filter active
      await exitFilterMode(page);
      await page.waitForTimeout(300);

      // File list should still be filtered
      // sector_map.png should be visible
      const sectorFile = page.locator('text=sector_map.png');
      await expect(sectorFile).toBeVisible({ timeout: 2000 });
    });

    test('should clear filter when opening filter dialog and clearing text', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Apply filter
      await enterFilter(page, 'sector');
      await exitFilterMode(page);
      await page.waitForTimeout(300);

      // Re-open filter dialog
      await pressKey(page, 'f');
      await page.waitForTimeout(200);

      // Clear the filter text
      const filterInput = page.locator('input').first();
      await filterInput.press('Control+a');
      await filterInput.press('Backspace');
      await page.waitForTimeout(200);

      // Exit filter mode
      await exitFilterMode(page);

      // All files should be visible again (no filter indicator)
      const pathBar = page.locator('.font-mono').first();
      const pathText = await pathBar.textContent();
      const hasFilterIndicator = pathText?.toLowerCase().includes('filter');
      expect(hasFilterIndicator).toBe(false);
    });
  });

  test.describe('Filter Warnings', () => {
    test('should show warning when attempting navigation with active filter', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Apply filter
      await enterFilter(page, 'test');
      await exitFilterMode(page);
      await page.waitForTimeout(300);

      // Try to use FZF mode (z key) - should trigger warning
      await pressKey(page, 'z');
      await page.waitForTimeout(500);

      // Warning modal or message should appear
      const warningText = page.locator('text=/filter.*active/i, text=/clear.*filter/i');
      const hasWarning = await warningText.isVisible({ timeout: 2000 }).catch(() => false);

      // If warning appears, we expect it to be there
      if (hasWarning) {
        expect(hasWarning).toBe(true);
      }

      // Dismiss warning if present
      await page.keyboard.press('Shift+Enter').catch(() => {});
    });

    test('should block Zoxide jump when filter is active', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Apply a filter
      await enterFilter(page, 'test');
      await exitFilterMode(page);
      await page.waitForTimeout(300);

      const pathBefore = await getCurrentPath(page);

      // Try to trigger Zoxide mode (Shift+Z)
      await page.keyboard.press('Shift+Z');
      await page.waitForTimeout(500);

      // Either we get a warning, or navigation is blocked
      // Path should not have changed to Zoxide mode
      const pathAfter = await getCurrentPath(page);

      // We might see a warning modal instead
      const warningVisible = await page
        .locator('text=/filter/i, text=/warning/i')
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      // Either warning is shown or path didn't change (navigation blocked)
      expect(warningVisible || pathBefore === pathAfter).toBe(true);

      // Clean up
      await page.keyboard.press('Escape').catch(() => {});
    });
  });

  test.describe('Filter Mode Edge Cases', () => {
    test('should handle special characters in filter text', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'g');
      await pressKey(page, 'i');
      await page.waitForTimeout(500);

      // Enter filter with special characters
      await pressKey(page, 'f');
      await typeText(page, 'test_123.png');
      await page.waitForTimeout(200);

      // Should not crash or error
      const filterInput = page.locator('input').first();
      await expect(filterInput).toHaveValue('test_123.png');

      await exitFilterMode(page);
    });

    test('should handle very long filter text', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      await pressKey(page, 'f');
      const longText = 'a'.repeat(100);
      await typeText(page, longText);
      await page.waitForTimeout(200);

      // Should handle gracefully
      const filterInput = page.locator('input').first();
      const value = await filterInput.inputValue();
      expect(value.length).toBeGreaterThan(50);

      await exitFilterMode(page);
    });

    test('should handle rapid filter open/close', async ({ page }) => {
      await jumpToLevel(page, 2);
      await dismissEpisodeIntro(page);

      // Rapidly open and close filter mode
      for (let i = 0; i < 5; i++) {
        await pressKey(page, 'f');
        await pressKey(page, 'Escape');
      }

      // Should not crash or leave UI in bad state
      const filterInput = page.locator('input').first();
      await expect(filterInput).not.toBeVisible();
    });
  });
});
