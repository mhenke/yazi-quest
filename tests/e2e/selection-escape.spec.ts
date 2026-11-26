import { test, expect } from './fixtures';
import { pressKey, pressKeys } from './utils';

test.describe('Escape Key Behavior', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  });

  test('Esc in Search + Select All should exit search and clear selections', async ({
    level2Page: page,
  }) => {
    // 1. Enter search mode and search for something
    await pressKey(page, 's');
    await expect(page.getByText('Search via fd:')).toBeVisible();

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
    await expect(
      page.getByTestId('status-bar').getByText('VIS', { exact: true })
    ).not.toBeVisible();
  });

  test('Esc keeps a filter active, then clears it without clearing selection', async ({
    level2Page: page,
  }) => {
    await pressKey(page, 'f');
    const input = page.getByTestId('filter-input');
    await expect(input).toBeVisible();
    await page.keyboard.type('log');

    // First Esc closes the live filter prompt but leaves the filter active.
    await pressKey(page, 'Escape');
    await expect(input).not.toBeVisible();
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toContainText('filter: log');

    // Select all matches, then clear the filter while retaining that selection.
    await pressKeys(page, ['Control+a']);
    const status = page.getByTestId('status-bar');
    await expect(status.getByText('VIS', { exact: true })).toBeVisible();
    await pressKey(page, 'Escape');
    await expect(breadcrumbs).not.toContainText('filter: log');
    await expect(status.getByText('VIS', { exact: true })).toBeVisible();
  });

  test('Esc clears Search + Filter while keeping the filtered selection', async ({
    level2Page: page,
  }) => {
    await pressKey(page, 's');
    await page.keyboard.type('log');
    await pressKey(page, 'Enter');
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('search: log');

    await pressKey(page, 'f');
    await expect(page.getByTestId('filter-input')).toBeVisible();
    await page.keyboard.type('watch');
    await pressKey(page, 'Enter');
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toContainText('search: log');
    await expect(breadcrumbs).toContainText('filter: watch');

    await pressKeys(page, ['Control+a']);
    const status = page.getByTestId('status-bar');
    await expect(status.getByText('VIS', { exact: true })).toBeVisible();
    await pressKey(page, 'Escape');

    await expect(breadcrumbs).not.toContainText('search: log');
    await expect(breadcrumbs).not.toContainText('filter: watch');
    await expect(status.getByText('VIS', { exact: true })).toBeVisible();
  });

  test('Esc in Normal Mode with selections should clear selections', async ({
    level2Page: page,
  }) => {
    // 1. Select a file (Space)
    await pressKey(page, 'Space');
    // Verify selection (Status bar VIS)
    await expect(page.getByTestId('status-bar').getByText('VIS', { exact: true })).toBeVisible();

    // 2. Press Esc
    await pressKey(page, 'Escape');

    // 3. Verify selection cleared (Status bar NOR)
    await expect(page.getByTestId('status-bar').getByText('NOR', { exact: true })).toBeVisible();
    await expect(
      page.getByTestId('status-bar').getByText('VIS', { exact: true })
    ).not.toBeVisible();
  });
});
