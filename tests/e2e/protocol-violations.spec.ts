import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  filterByText,
  search,
  gotoCommand,
  addItem,
  enterDirectory,
  DEFAULT_DELAY,
} from './utils';

test.describe('Protocol Violations and Navigation Blocking', () => {
  test('blocks navigation when filter is active during tasks', async ({ page }, _testInfo) => {
    await startLevel(page, 6, { intro: false });

    // Apply a filter
    await filterByText(page, 'batch');

    // Attempt to navigate (j)
    await page.keyboard.press('j');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify modal appeared with correct text
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible();
    await expect(page.locator('text=Active filters detected.')).toBeVisible();
  });

  test('blocks navigation when sort is active during tasks', async ({ page }, _testInfo) => {
    await startLevel(page, 6, { intro: false });

    // Apply a custom sort (sort by size: ,s)
    await page.keyboard.press(',');
    await page.keyboard.press('s');

    // Attempt to navigate (k)
    await page.keyboard.press('k');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify sort warning modal appeared
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible();
    await expect(page.locator('text=Custom sorting active.')).toBeVisible();
  });

  test('blocks navigation when search is active during tasks', async ({ page }, _testInfo) => {
    await startLevel(page, 6, { intro: false });

    // Start a search
    await search(page, 'log');

    // Wait for results
    await page.waitForSelector('[data-testid^="file-"]');

    // Attempt to navigate (l)
    await page.keyboard.press('l');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify search warning modal appeared
    await expect(page.locator('h2:has-text("Protocol Violation")')).toBeVisible();
    await expect(page.locator('text=Recursive search active.')).toBeVisible();
  });

  test('triggers auto-fix when navigation is attempted after tasks are complete', async ({
    page,
  }, _testInfo) => {
    await startLevel(page, 6, { intro: false });

    // --- QUICKLY COMPLETE LEVEL 6 ---
    // 1. gi
    await gotoCommand(page, 'i');
    await enterDirectory(page, 'batch_logs');

    // 2. search
    await search(page, '\\.log$');
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="file-"]').length >= 4
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

    // 5. enter training_data and paste
    await enterDirectory(page, 'training_data');
    await pressKey(page, 'p');

    // Wait for Success Toast (this means tasks are complete)
    await expect(page.getByTestId('mission-complete')).toBeVisible();

    // --- TRIGGER VIOLATION AFTER COMPLETION ---
    // Apply a filter
    await filterByText(page, 'ghost');

    // Attempt to navigate (j)
    await page.keyboard.press('j');

    // Should see the auto-fix notification
    await expect(page.getByTestId('system-notification')).toContainText(
      'PROTOCOL BREACH DETECTED: AUTO-CORRECTING...'
    );

    // After a delay, filter should be cleared and modal should NOT be visible
    await page.waitForTimeout(1500);
    await expect(page.locator('h2:has-text("Protocol Violation")')).not.toBeVisible();

    // Check if filter is gone (no filter indicator in breadcrumbs)
    await expect(page.locator('[data-testid="breadcrumbs"]')).not.toContainText('(filter:');
  });
});
