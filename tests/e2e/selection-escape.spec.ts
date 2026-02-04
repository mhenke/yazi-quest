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
  });

  test('Esc in Filter + Select All should exit filter and clear selections', async ({ page }) => {
    await startLevel(page, 2);

    // 1. Enter Filter mode (f)
    await pressKey(page, 'f');
    await expect(page.getByTestId('filter-input')).toBeVisible();

    // 2. Type filter query
    await page.keyboard.type('log');
    await pressKey(page, 'Enter');
    await expect(page.getByTestId('filter-input')).not.toBeVisible();

    // Verify filter is active in breadcrumbs
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('filter: log');

    // 3. Select All (Ctrl+A)
    await pressKeys(page, ['Control+a']);

    // Verify selection (Status bar VIS)
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).toBeVisible();

    // 4. Press Esc
    await pressKey(page, 'Escape');

    // 5. Verify Filter Exited (Breadcrumb should NOT have "filter: log")
    await expect(page.locator('[data-testid="breadcrumbs"]')).not.toContainText('filter: log');

    // 6. Verify Selections Cleared (Status bar NOR)
    await expect(page.getByTestId('status-bar').getByText('NOR', { exact: true })).toBeVisible();
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).not.toBeVisible();
  });

  test('Esc in Search + Filter + Select All should clear everything', async ({ page }) => {
    await startLevel(page, 2);

    // 1. Enter Search mode
    await pressKey(page, 's');
    await page.keyboard.type('log');
    await pressKey(page, 'Enter');
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('search: log');

    // 2. Apply Filter on top of search results
    await pressKey(page, 'f');
    await expect(page.getByTestId('filter-input')).toBeVisible();
    await page.keyboard.type('watch');
    await pressKey(page, 'Enter');

    // Verify both search and filter are active
    // Breadcrumb format: "~ ... (search: log) (filter: watch)"
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('search: log');
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('filter: watch');

    // 3. Select All (Ctrl+A)
    await pressKeys(page, ['Control+a']);
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).toBeVisible();

    // 4. Press Esc
    await pressKey(page, 'Escape');

    // 5. Verify Clean State
    // Breadcrumb should be clean
    await expect(page.locator('[data-testid="breadcrumbs"]')).not.toContainText('search: log');
    await expect(page.locator('[data-testid="breadcrumbs"]')).not.toContainText('filter: exfil');

    // Status bar should be NOR (not VIS)
    await expect(page.getByTestId('status-bar').getByText('NOR', { exact: true })).toBeVisible();
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).not.toBeVisible();
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
