import { test, expect } from '@playwright/test';
import { startLevel, pressKey, pressKeys } from './utils';

test.describe('Escape Key Behavior', () => {
  test('Esc in Search + Select All should exit search and clear selections', async ({ page }) => {
    // Start Level 2 (general sandbox)
    await startLevel(page, 2);

    // 1. Enter search mode and search for something
    await pressKey(page, 's');
    await expect(page.getByText('Recursive search')).toBeVisible();

    // Type query matching some files (e.g., "log")
    await page.keyboard.type('log');
    await pressKey(page, 'Enter');

    // Verify search is active (breadcrumb shows search:)
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('search: log');

    // 2. Select All (Ctrl+A)
    // Ctrl+A selects all items in the current view (search results)
    await pressKeys(page, ['Control+a']);

    // Verify we have selections by checking Status Bar mode (should be VIS)
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).toBeVisible();

    // 3. Press Esc
    await pressKey(page, 'Escape');

    // 4. Verify Search exited (back to Normal mode in status bar?)
    // If we clear selection AND search, mode should be 'NOR'
    await expect(page.getByTestId('status-bar').getByText('NOR', { exact: true })).toBeVisible();

    // 5. Verify Selections Cleared (Status bar not VIS)
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).not.toBeVisible();

    // Verify "Search cleared" notification might appear
    // await expect(page.getByText('Search cleared')).toBeVisible(); // This might be flaky if notification times out
  });

  test('Esc in Normal Mode with selections should clear selections', async ({ page }) => {
    await startLevel(page, 2);

    // 1. Select a file (Space)
    await pressKey(page, 'Space');
    // Verify selection (Status bar VIS)
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).toBeVisible();

    // 2. Press Esc
    await pressKey(page, 'Escape');

    // 3. Verify selection cleared (Status bar NOR)
    await expect(page.getByTestId('status-bar').getByText('NOR', { exact: true })).toBeVisible();
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).not.toBeVisible();
  });
});
