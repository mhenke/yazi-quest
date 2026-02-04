import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  filterByText,
  search,
  gotoCommand,
  addItem,
  enterDirectory,
  navigateRight,
  DEFAULT_DELAY,
} from './utils';

test.describe('Protocol Violations and Navigation Blocking', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `/home/mhenke/.gemini/antigravity/brain/fcf9e7e6-cd6f-4bb3-a244-0ef3d21013fe/${testInfo.title.replace(/\s+/g, '_')}_fail.png`;
      await page.screenshot({ path: screenshotPath });
    }
  });

  test('blocks navigation when filter is active during tasks', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Apply a filter
    await filterByText(page, 'batch');

    // Attempt to navigate (j)
    await page.keyboard.press('j');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify modal appeared with correct text
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Active filters detected.')).toBeVisible();
  });

  test('allows vertical navigation when sort is active during tasks', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Apply a custom sort (sort by size: ,s)
    await page.keyboard.press(',');
    await page.keyboard.press('s');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Attempt to navigate (k) - should succeed
    await page.keyboard.press('k');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify sort warning modal did NOT appear
    await expect(page.locator('h2:has-text("Protocol Violation")')).not.toBeVisible();
    await expect(page.locator('text=Custom sorting active.')).not.toBeVisible();

    // Verify we can still navigate down (j)
    await page.keyboard.press('j');
    await page.waitForTimeout(DEFAULT_DELAY);
    await expect(page.locator('h2:has-text("Protocol Violation")')).not.toBeVisible();

    // Verify horizontal navigation (l) is still blocked
    await page.keyboard.press('l');
    await page.waitForTimeout(DEFAULT_DELAY);
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Custom sorting active.')).toBeVisible();
  });

  test('blocks navigation when search is active during tasks', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Start a search
    await search(page, 'log');

    // Wait for results
    await page.waitForSelector('[data-testid^="file-"]', { timeout: 5000 });

    // Attempt to navigate (l)
    await page.keyboard.press('l');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify search warning modal appeared
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Active search session detected.')).toBeVisible();
  });

  test('triggers auto-fix when navigation is attempted after tasks are complete', async ({
    page,
  }) => {
    await startLevel(page, 6, { intro: false });

    // --- COMPLETE LEVEL 6 TASKS 1-4, THEN CREATE VIOLATION, THEN COMPLETE TASK 5 ---
    // 1. gi
    await gotoCommand(page, 'i');
    await enterDirectory(page, 'batch_logs');

    // 2. search
    await search(page, '\\.log$');
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="file-"]').length >= 4,
      { timeout: 5000 }
    );

    // 3. select all and yank
    await pressKey(page, 'Ctrl+a');
    await pressKey(page, 'y');
    await page.keyboard.press('Escape'); // Clear search
    await page.waitForTimeout(DEFAULT_DELAY);

    // 4. gc and create training_data/
    await gotoCommand(page, 'c');
    await enterDirectory(page, 'vault');
    await addItem(page, 'training_data/');

    // 5. Enter training_data
    await page.keyboard.press('j'); // Move to training_data (sorted after 'active')
    await navigateRight(page, 1);

    // --- APPLY FILTER BEFORE COMPLETING THE FINAL TASK ---
    // This creates a violation state BEFORE the mission completes
    await page.keyboard.press('f');
    await page.getByTestId('filter-input').fill('exfil');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(DEFAULT_DELAY);

    // 6. NOW paste (completing task 5) - this triggers "all tasks complete" with active filter
    await pressKey(page, 'p');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify all tasks are complete
    await expect(page.getByTestId('status-bar')).toContainText('Tasks: 5/5', { timeout: 5000 });

    // SuccessToast should NOT be visible because there's a filter violation
    await expect(page.getByTestId('mission-complete')).not.toBeVisible();

    // Attempt navigation - should show violation modal
    await page.keyboard.press('j');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Violation modal should be visible
    await expect(page.locator('text=Protocol Violation')).toBeVisible({ timeout: 5000 });

    // Press Shift+Enter to trigger the explicit auto-fix
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify baseline is restored (filter cleared)
    await expect(page.locator('[data-testid="status-bar"]')).not.toContainText('FILTER:');

    // SuccessToast should now appear
    await expect(page.getByTestId('mission-complete')).toBeVisible({ timeout: 5000 });

    // Finally advance to next level
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(DEFAULT_DELAY);
    await expect(page.getByTestId('status-bar')).toContainText('L7');
  });
});
