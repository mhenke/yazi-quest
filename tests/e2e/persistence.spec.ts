import { test, expect } from '@playwright/test';
import { startLevel, gotoCommand, expectCurrentDir, DEFAULT_DELAY, pressKey } from './utils';

test.describe('Persistence & State Survival', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
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
    await gotoCommand(page, 't'); // Jump to tmp (guaranteed to exist and be tracked)
    await expectCurrentDir(page, 'tmp');

    // 3. Reload page with intro=false so the skip is read at init time
    await page.goto('/?lvl=2&intro=false');
    await page.waitForLoadState('domcontentloaded');

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
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('yazi-quest-cycle', '5');
    });

    // 2. Reload to pick up state, with intro=false so skip is race-free
    await page.goto('/?intro=false');
    await page.waitForLoadState('domcontentloaded');

    // 3. Verify Cycle 5 effects
    // Level 1: "AI-7738 INITIALIZATION" (7733 + 5)
    await expect(page.locator('[data-testid="status-bar"]')).toContainText('AI-7738');
  });
  test('restores saved Quest Map progress after reload', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('yazi-quest-unlocked-level', '5'));
    await page.goto('/?intro=false');

    const progress = page.getByTestId('level-progress-bar');
    await expect(progress).toContainText('CONTAINMENT BREACH');
    await page.getByTestId('map-button').click();
    await expect(page.locator('#quest-map-panel button[aria-current="step"]')).toContainText(
      'CONTAINMENT BREACH'
    );
  });

  test('revisiting a level keeps later unlocked levels available by mouse and keyboard', async ({
    page,
  }) => {
    await page.evaluate(() => localStorage.setItem('yazi-quest-unlocked-level', '5'));
    await page.goto('/?intro=false');
    await expect(page.getByTestId('level-progress-bar')).toContainText('CONTAINMENT BREACH');

    await page.getByTestId('map-button').click();
    await page.getByRole('button', { name: /RECONNAISSANCE & EXTRACTION/ }).click();
    await expect(page.getByTestId('level-progress-bar')).toContainText(
      'RECONNAISSANCE & EXTRACTION'
    );
    await page.getByTestId('map-button').click();
    await expect(page.getByRole('button', { name: /CONTAINMENT BREACH/ })).toBeEnabled();
    await page.getByRole('button', { name: /CONTAINMENT BREACH/ }).click();
    await expect(page.getByTestId('level-progress-bar')).toContainText('CONTAINMENT BREACH');

    await page.getByTestId('map-button').click();
    await page.getByRole('button', { name: /RECONNAISSANCE & EXTRACTION/ }).click();
    await page.getByTestId('map-button').click();
    await page.keyboard.press('j');
    await page.keyboard.press('j');
    await page.keyboard.press('j');
    await page.keyboard.press('j');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('level-progress-bar')).toContainText('CONTAINMENT BREACH');
  });

  test('later-cycle mission brief uses the full subject designation', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('yazi-quest-cycle', '7'));
    await page.goto('/?intro=false');
    await expect(page.getByTestId('level-progress-bar')).toContainText('AI-7740');
    await expect(page.getByRole('region', { name: 'Mission log', exact: true })).toContainText(
      'Subject AI-7740 Online'
    );
  });

  test('preserves ambiguous old saves until the player confirms a current-cycle restart', async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem('yazi-quest-cycle', '2');
      localStorage.setItem('yazi-quest-unlocked-level', '5');
    });
    await page.goto('/?intro=false');
    await expect(page.getByTestId('level-progress-bar')).toContainText('CONTAINMENT BREACH');
    await page.getByTestId('map-button').click();
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Restart current cycle' }).click();
    await expect(page.getByTestId('level-progress-bar')).toContainText('CONTAINMENT BREACH');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Restart current cycle' }).click();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('yazi-quest-unlocked-level')))
      .toBe('1');
    await page.goto('/?intro=false');
    await expect(page.getByTestId('level-progress-bar')).toContainText('AI-7735');
    await expect(page.getByTestId('status-bar')).toContainText('L1');
  });
});
