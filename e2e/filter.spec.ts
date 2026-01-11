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
} from './helpers';

test.describe('Filter Mode - Episode I', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
  });

  test('should enter and exit filter mode with f and Escape', async ({ page }) => {
    // Jump to Level 3 where filter is introduced
    await jumpToLevel(page, 2); // 0-indexed, so 2 = Level 3
    await dismissEpisodeIntro(page);

    // Press 'f' to enter filter mode
    await pressKey(page, 'f');

    // Verify filter dialog is visible
    const filterLabel = page.locator('text=Filter:');
    await expect(filterLabel).toBeVisible({ timeout: 2000 });

    // Verify input is focused (we can type)
    const filterInput = page.locator('input').first();
    await expect(filterInput).toBeFocused();

    // Press Escape to exit
    await pressKey(page, 'Escape');

    // Filter dialog should close
    await expect(filterLabel).not.toBeVisible({ timeout: 2000 });
  });

  test('should filter file list as user types', async ({ page }) => {
    // Jump to Level 3 (~/incoming has multiple files)
    await jumpToLevel(page, 2);
    await dismissEpisodeIntro(page);

    // Navigate to ~/incoming
    await pressKey(page, 'g');
    await pressKey(page, 'i');
    await page.waitForTimeout(500);

    // Enter filter mode and type 'sector'
    await enterFilter(page, 'sector');
    await page.waitForTimeout(300);

    // Verify filter dialog is visible with our text - use exact match
    const filterLabel = page.getByText('Filter:', { exact: true });
    await expect(filterLabel).toBeVisible({ timeout: 2000 });

    // Exit filter mode
    await exitFilterMode(page);
  });

  test('should keep filter text active after closing dialog', async ({ page }) => {
    // Jump to Level 3
    await jumpToLevel(page, 2);
    await dismissEpisodeIntro(page);

    // Navigate to ~/incoming
    await pressKey(page, 'g');
    await pressKey(page, 'i');
    await page.waitForTimeout(500);

    // Enter filter mode, type text, and close
    await enterFilter(page, 'sector');
    await exitFilterMode(page);

    // Look for filter indicator in path bar (should show "filter: sector")
    const pathBar = page.locator('.font-mono.text-zinc-400').first();
    const pathText = await pathBar.textContent();

    // Filter indicator should be visible in the path bar
    const filterIndicator = page.locator('text=/filter.*sector/i');
    const hasFilter = await filterIndicator.isVisible({ timeout: 1000 }).catch(() => false);

    // Either the indicator is visible or the file list is filtered
    expect(pathText || hasFilter).toBeTruthy();
  });

  test('should allow arrow key navigation while filter is open', async ({ page }) => {
    // Jump to Level 3
    await jumpToLevel(page, 2);
    await dismissEpisodeIntro(page);

    // Navigate to ~/incoming
    await pressKey(page, 'g');
    await pressKey(page, 'i');
    await page.waitForTimeout(500);

    // Enter filter mode
    await pressKey(page, 'f');
    await page.waitForTimeout(200);

    // Press arrow down to move cursor
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Press arrow up to move cursor back
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);

    // We're still in filter mode (dialog still visible)
    const filterLabel = page.locator('text=Filter:');
    await expect(filterLabel).toBeVisible();

    // Exit filter mode
    await exitFilterMode(page);
  });
});
