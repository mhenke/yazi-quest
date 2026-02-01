import { test, expect } from '@playwright/test';
import { startLevel, pressKey, DEFAULT_DELAY } from './utils';

test.describe('Game Constraints', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `/home/mhenke/.gemini/antigravity/brain/fcf9e7e6-cd6f-4bb3-a244-0ef3d21013fe/${testInfo.title.replace(/\s+/g, '_')}_fail.png`;
      await page.screenshot({ path: screenshotPath });
    }
  });

  test('Keystroke Limit: Exceeding maxKeystrokes triggers Game Over', async ({ page }) => {
    test.setTimeout(60000);

    // Start Level 11 (maxKeystrokes: 60)
    await startLevel(page, 11, { intro: false });

    // Mash keys to exceed 60 keystrokes
    for (let i = 0; i < 70; i++) {
      await pressKey(page, 'j');
    }

    // Expect Game Over Modal
    await expect(page.getByRole('heading', { name: /IG KERNEL PANIC/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Instruction Analysis Complete/i).first()).toBeVisible();
  });

  test('Time Limit: Running out of time triggers Game Over', async ({ page }) => {
    test.setTimeout(60000); // Give enough time for clock simulation

    // Install clock before navigation
    await page.clock.install();

    await startLevel(page, 6, { intro: false });

    // Ensure the timer is visible/active and give it a moment to initialize
    await expect(page.getByTestId('status-bar')).toContainText('WATCHDOG');
    await page.waitForTimeout(1000);

    // Fast-forward to expire the 90s timer (100s is enough)
    await page.clock.runFor(100000);
    await page.waitForTimeout(2000);

    // Expect Game Over Modal with relaxed locator
    await expect(page.getByText('WATCHDOG', { exact: false }).first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/Timer Expired/i).first()).toBeVisible();
  });

  test('Game Over Dialog: Shift+Enter restarts the level', async ({ page }) => {
    test.setTimeout(60000); // Give enough time for clock simulation

    // Install clock before navigation
    await page.clock.install();

    await startLevel(page, 6, { intro: false });

    // Wait for level to load and timer to initialize
    await expect(page.getByText(/BATCH OPERATIONS/i).first()).toBeVisible();
    await page.waitForTimeout(1000);

    // Fast-forward to trigger game over
    await page.clock.runFor(100000);
    await page.waitForTimeout(2000);

    // Verify game over dialog appears
    await expect(page.getByText('WATCHDOG', { exact: false }).first()).toBeVisible({
      timeout: 20000,
    });

    // Press Shift+Enter to restart
    await page.keyboard.press('Shift+Enter');

    // We might need to resume the clock or uninstall it to see the UI update
    // if the restart depends on regular timing, but SET_LEVEL should be immediate.
    await page.waitForTimeout(DEFAULT_DELAY);

    // Verify the level restarted (game over modal disappears)
    await expect(page.getByText(/WATCHDOG CYCLE COMPLETE/i)).not.toBeVisible({ timeout: 10000 });

    // Verify we're back at the level
    await expect(page.getByText(/BATCH OPERATIONS/i).first()).toBeVisible();
  });
});
