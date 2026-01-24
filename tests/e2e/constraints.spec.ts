import { test, expect } from '@playwright/test';
import { startLevel, pressKey } from './utils';

test.describe('Game Constraints', () => {
  test('Keystroke Limit: Exceeding maxKeystrokes triggers Game Over', async ({ page }) => {
    // Start Level 11 (maxKeystrokes: 60)
    await startLevel(page, 11);

    // Mash keys to exceed 60 keystrokes
    // Each pressKey should increment keystrokes unless it's blocked
    for (let i = 0; i < 61; i++) {
      await pressKey(page, 'j');
    }

    // Expect Game Over Modal with correct text
    await expect(page.getByText('HEURISTIC ANALYSIS COMPLETE')).toBeVisible();
    await expect(page.getByText('Heuristic Analysis Complete')).toBeVisible();
  });

  test('Time Limit: Running out of time triggers Game Over', async ({ page }) => {
    // Use clock to fast-forward time
    // Level 6 (timeLimit: 90)
    await page.clock.install();
    await startLevel(page, 6);

    // Fast-forward 91 seconds
    await page.clock.fastForward(91000);

    // Expect Game Over Modal with correct text
    await expect(page.getByText('WATCHDOG CYCLE COMPLETE')).toBeVisible();
    await expect(page.getByText('Watchdog Timer Expired')).toBeVisible();
  });
});
