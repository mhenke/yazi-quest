import { test, expect } from '@playwright/test';
import { startLevel, gotoCommand, expectCurrentDir, DEFAULT_DELAY, pressKey } from './utils';

test.describe('Persistence & State Survival', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('localStorage persists zoxide history across reloads', async ({ page }) => {
    // 1. Start Level 2 (Level 1 blocks 'gr' shortcut)
    await startLevel(page, 2, { intro: false });

    // 2. Perform a jump to populate zoxide history (e.g., to /var)
    // First navigate manually to /var to add it to history?
    // Or assume initial state has some, but let's add a new one.
    // Jump to root, then enter var.
    await gotoCommand(page, 'r');

    // Wait for breadcrumb to update to '/' (might take a moment)
    await page.waitForTimeout(2000);
    await expect(page.locator('.breadcrumb')).toHaveText('/', { timeout: 10000 });

    // Navigate into 'var' to add to zoxide
    // Safer:
    await gotoCommand(page, 't'); // Jump to tmp (guaranteed to exist and be tracked)
    await expectCurrentDir(page, 'tmp');

    // 3. Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Unified intro skip logic
    await page.evaluate(() => {
      window.__yaziQuestSkipIntroRequested = true;
      window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
    });

    // Wait for game ready
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
    await page.waitForTimeout(DEFAULT_DELAY);

    // 4. Verify Zoxide Jump remembers 'tmp'
    await pressKey(page, 'Shift+Z'); // Open Zoxide
    await page.keyboard.type('tmp', { delay: 50 });

    // Expect 'tmp' to be in results
    await expect(page.locator('[data-testid="fuzzy-finder"]')).toContainText('/tmp');

    // Confirm jump
    await page.keyboard.press('Enter');
    await expectCurrentDir(page, 'tmp');
  });

  test('Cycle count persists in localStorage', async ({ page }) => {
    // 1. Manually set cycle count in localStorage
    // Note: We already cleared it in beforeEach, but now we set specific state.
    await page.evaluate(() => {
      localStorage.setItem('yazi-quest-cycle', '5');
    });

    // 2. Reload to pick up state
    await page.reload();

    // Skip intro
    await page.evaluate(() => {
      window.__yaziQuestSkipIntroRequested = true;
      window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
    });

    // 3. Verify Cycle 5 effects
    // Level 1: "AI-7738 INITIALIZATION" (7733 + 5)
    await expect(page.locator('[data-testid="status-bar"]')).toContainText('AI-7738');
  });
});
