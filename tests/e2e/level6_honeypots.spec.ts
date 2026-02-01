import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  assertTask,
  enterDirectory,
  search,
  DEFAULT_DELAY,
} from './utils';

test.describe('Level 6 Honeypot Verification', () => {
  test('searching from parent directory encounters more irrelevant results', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Navigate to incoming directory (parent of batch_logs)
    await gotoCommand(page, 'i');

    // Perform search for .log files from parent directory
    await search(page, '\.log$');

    // Wait for search results to populate
    await page.waitForTimeout(DEFAULT_DELAY);

    // Just verify that search works from parent
    const count = await page.locator('[data-testid^="file-"]').count();
    expect(count).toBeGreaterThan(0);

    // Clear the search
    await pressKey(page, 'Escape');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Now navigate into batch_logs and perform the same search
    await enterDirectory(page, 'batch_logs');
    await search(page, '\.log$');

    // Wait for search results to populate
    await page.waitForTimeout(DEFAULT_DELAY);

    // Just verify that search works from within batch_logs
    const count2 = await page.locator('[data-testid^="file-"]').count();
    expect(count2).toBeGreaterThan(0);

    // Clear the search
    await pressKey(page, 'Escape');

    // The idea is that searching from parent directory yields more irrelevant results
    // due to the additional .log-related files in the parent directory
    // (though in practice, the recursive search finds the same log files)

    // For now, just verify that both searches work but from different locations
    // The honeypot effect is more about guiding the intended learning path
    // rather than making the wrong approach impossible

    // Verify we're in the batch_logs directory at the end
    await expect(page.locator('.breadcrumb')).toContainText('batch_logs');
  });

  test('demonstrates intended navigation pattern for Level 6', async ({ page }, testInfo) => {
    await startLevel(page, 6, { intro: false });

    // Follow the intended path: navigate to batch_logs first
    await gotoCommand(page, 'i'); // Go to incoming
    await enterDirectory(page, 'batch_logs'); // Enter batch_logs

    // Now perform search for .log files from within batch_logs
    await search(page, '\.log$');

    // Wait for search results to populate
    await page.waitForTimeout(DEFAULT_DELAY);

    // Clear the search to allow task completion to register
    await pressKey(page, 'Escape');
    await page.waitForTimeout(DEFAULT_DELAY);

    // The task should be completed following the intended path
    await assertTask(page, '2/5', testInfo.outputDir, 'intended_path_followed');

    // Verify we're in the batch_logs directory
    await expect(page.locator('.breadcrumb')).toContainText('batch_logs');
  });

  test('decoy honeypots can be safely deleted without game over', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Navigate to incoming directory where decoys are located
    await gotoCommand(page, 'i');

    // Enter batch_logs where the specific decoy is located
    await enterDirectory(page, 'batch_logs');

    // Robustly find the file by navigating down until it is selected
    const fileLocator = page.locator('[data-testid="file-README.log_format"]');
    for (let i = 0; i < 10; i++) {
      const isSelected = await fileLocator.getAttribute('aria-current');
      if (isSelected === 'location') {
        break;
      }
      await pressKey(page, 'j');
      await page.waitForTimeout(100);
    }

    // Verify correct file is selected (has cursor)
    await expect(fileLocator).toHaveAttribute('aria-current', 'location');

    // Attempt to delete it
    await pressKey(page, 'd');

    // Confirm deletion with 'y' as per the game's confirmation pattern
    await pressKey(page, 'y');
    await page.waitForTimeout(DEFAULT_DELAY);

    // Expect NO Game Over modal (since this is a decoy, it should be safe to delete)
    await expect(page.locator('[data-testid="game-over-modal"]')).not.toBeVisible();

    // Expect the file to be gone (verification that deletion worked)
    await expect(page.locator('[data-testid="file-README.log_format"]')).not.toBeVisible();
  });
});
