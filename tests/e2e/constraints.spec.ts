import { test, expect } from '@playwright/test';
import { startLevel, pressKey } from './utils';

test.describe('Game Constraints', () => {
  test('Keystroke Limit: Exceeding maxKeystrokes triggers Game Over', async ({ page }) => {
    test.setTimeout(60000); // Increase to 60s because of pressKey delays

    // Start Level 11 (maxKeystrokes: 60)
    await startLevel(page, 11);

    // Mash keys to exceed 60 keystrokes
    // Use pressKey to ensure keystrokes are registered by the game logic hook properly
    for (let i = 0; i < 70; i++) {
      await pressKey(page, 'j');
    }

    // Expect Game Over Modal with correct text - using more specific heading locator
    await expect(page.getByRole('heading', { name: /IG KERNEL PANIC/i }).first()).toBeVisible();
    await expect(page.getByText(/Instruction Analysis Complete/i).first()).toBeVisible();
  });

  test('Time Limit: Running out of time triggers Game Over', async ({ page }) => {
    // Install clock before navigation
    await page.clock.install();

    await page.goto('/?lvl=6'); // Use raw goto to ensure clock is active from start
    await page.waitForLoadState('networkidle');

    // Unified intro skip flag
    await page.evaluate(() => {
      window.__yaziQuestSkipIntroRequested = true;
      window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
    });

    // Ensure the timer is visible/active
    await expect(page.getByText(/WATCHDOG/i).first()).toBeVisible();

    // Fast-forward 100 seconds (Level 6 limit is 90s)
    await page.clock.runFor(100000);

    // Expect Game Over Modal with correct text
    await expect(page.getByText(/WATCHDOG CYCLE COMPLETE/i)).toBeVisible();
    await expect(page.getByText(/Watchdog Timer Expired/i)).toBeVisible();
  });
});
