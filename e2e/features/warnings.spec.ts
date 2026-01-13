import { test, expect } from '@playwright/test';
import { waitForGameLoad, dismissEpisodeIntro, pressKey, enterFilter, typeText } from '../helpers';

test.describe('Protocol Violation Warnings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?level=1&intro=false');
    await waitForGameLoad(page);
  });

  // Helper to complete Level 1 using dev parameter
  async function completeLevel1(page: any) {
    // Reload with tasks=all to force completion
    await page.goto('/?level=1&intro=false&tasks=all');
    await waitForGameLoad(page);

    // Verify Success Toast (Mission Complete) is visible
    await expect(page.locator('text=/Mission Complete/i')).toBeVisible({ timeout: 5000 });
  }

  test.skip('should Warn when completing level with Hidden Files enabled', async ({ page }) => {
    // 1. Complete Level 1
    await completeLevel1(page);

    // 2. Enable Hidden Files (.)
    await pressKey(page, '.');
    await expect(page.locator('text=HIDDEN: ON')).toBeVisible();

    // 3. Trigger Warning by attempting to Advance (Shift+Enter)
    await page.keyboard.press('Shift+Enter');

    // 4. Expect Protocol Violation
    await expect(page.locator('text=/Protocol Violation/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Hidden Files/i')).toBeVisible();

    // 5. Auto-fix with Shift+Enter
    await page.keyboard.press('Shift+Enter');

    // 6. Verify Warning Gone and Success
    await expect(page.locator('text=/Protocol Violation/i')).not.toBeVisible();
    await expect(page.locator('text=HIDDEN: OFF')).toBeVisible();
    await expect(page.locator('text=/Mission Complete/i')).toBeVisible();
  });

  test.skip('should Warn when completing level with Custom Sort', async ({ page }) => {
    // 1. Complete Level 1
    await completeLevel1(page);

    // 2. Set Custom Sort (Size) -> , s
    await page.keyboard.press(',');
    await page.waitForTimeout(200);
    await page.keyboard.press('s');

    // 3. Trigger Warning
    await page.keyboard.press('Shift+Enter');

    // 4. Verification Warning
    await expect(page.locator('text=/Protocol Violation/i')).toBeVisible();
    await expect(page.locator('text=/Non-Standard Sort/i')).toBeVisible();

    // 5. Auto-Fix
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('text=/Protocol Violation/i')).not.toBeVisible();
    await expect(page.locator('text=/Mission Complete/i')).toBeVisible();
  });

  test.skip('should Warn when completing level with Active Filter', async ({ page }) => {
    // 1. Complete Level 1
    await completeLevel1(page);

    // 2. Apply Filter active
    // If we use filter, we are in filter mode.
    // Does success toast persist? Yes, until we move to invalid state?
    // Just applying filter shouldn't invalidate task completion (we are still in /home/guest).
    await pressKey(page, 'f');
    await page.keyboard.type('test');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // 3. Trigger Warning
    await page.keyboard.press('Shift+Enter');

    // 4. Expect Warning
    await expect(page.locator('text=/Protocol Violation/i')).toBeVisible();
    await expect(page.locator('text=/Active Filter/i')).toBeVisible();

    // 5. Auto-Fix
    await page.keyboard.press('Shift+Enter');
    // Clears filter.
    await expect(page.locator('text=/Protocol Violation/i')).not.toBeVisible();
    await expect(page.locator('text=/Mission Complete/i')).toBeVisible();
  });
});
