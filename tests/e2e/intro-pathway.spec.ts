/**
 * Intro Pathway Tests - Validate landing paths for Levels 1, 6, and 11
 *
 * Goal: Ensure the correct directory path is reached regardless of whether
 * the user clicks "Skip Intro", mashes Shift+Enter, or uses a combination.
 * Also validates intro screens appear correctly and task state is clean.
 */

import { test, expect, Page } from '@playwright/test';
import { DEFAULT_DELAY, assertTask } from './utils';

/**
 * Helper to skip intro via the Skip Intro button.
 */
async function skipViaButton(page: Page): Promise<void> {
  const skipButton = page.getByRole('button', { name: 'Skip Intro' });
  for (let i = 0; i < 5; i++) {
    try {
      await skipButton.click({ timeout: 1000 });
      await page.waitForTimeout(300);
    } catch {
      break;
    }
  }
}

/**
 * Helper to skip intro via mashing Shift+Enter.
 */
async function skipViaMashShiftEnter(page: Page): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(200);
    const statusBar = page.locator('[data-testid="status-bar"]');
    if (await statusBar.isVisible({ timeout: 500 }).catch(() => false)) {
      break;
    }
  }
}

/**
 * Helper to skip intro using a hybrid approach: partial Shift+Enter then button.
 */
async function skipViaHybrid(page: Page): Promise<void> {
  await page.keyboard.press('Shift+Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Shift+Enter');
  await page.waitForTimeout(300);
  await skipViaButton(page);
}

/**
 * Wait for the game UI to be ready (status bar visible).
 */
async function waitForGameReady(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="status-bar"]')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Assert the current directory path displayed in the breadcrumb.
 */
async function assertPath(page: Page, expectedPath: string): Promise<void> {
  const breadcrumb = page.locator('.breadcrumb');
  await expect(breadcrumb).toContainText(expectedPath, { timeout: 3000 });
}

/**
 * Assert task counter shows 0 completed tasks.
 */
async function assertTasksStartAtZero(page: Page): Promise<void> {
  const taskCounter = page.getByText(/Tasks:\s*0\/\d+/);
  await expect(taskCounter).toBeVisible({ timeout: 3000 });
}

test.describe('Intro Pathway Validation', () => {
  test.describe('Level 1: Landing in ~ (home directory)', () => {
    const EXPECTED_PATH = '~';

    test('Scenario A: Mash Shift+Enter lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      await skipViaMashShiftEnter(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/5', testInfo.outputDir, 'lvl1_mash_shift_enter');
    });

    test('Scenario B: Click Skip Intro button lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/5', testInfo.outputDir, 'lvl1_skip_button');
    });

    test('Scenario C: Hybrid skip lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      await skipViaHybrid(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/5', testInfo.outputDir, 'lvl1_hybrid_skip');
    });
  });

  test.describe('Level 6: Landing in ~ (home directory)', () => {
    const EXPECTED_PATH = '~';

    test('Scenario A: Mash Shift+Enter lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');
      await skipViaMashShiftEnter(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/4', testInfo.outputDir, 'lvl6_mash_shift_enter');
    });

    test('Scenario B: Click Skip Intro button lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/4', testInfo.outputDir, 'lvl6_skip_button');
    });

    test('Scenario C: Hybrid skip lands in ~', async ({ page }, testInfo) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');
      await skipViaHybrid(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
      await assertTask(page, '0/4', testInfo.outputDir, 'lvl6_hybrid_skip');
    });
  });

  test.describe('Level 11: Landing in ~/workspace/systemd-core', () => {
    const EXPECTED_PATH = 'systemd-core';

    test('Scenario A: Mash Shift+Enter lands in systemd-core', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');
      await skipViaMashShiftEnter(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
    });

    test('Scenario B: Click Skip Intro button lands in systemd-core', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
    });

    test('Scenario C: Hybrid skip lands in systemd-core', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');
      await skipViaHybrid(page);
      await waitForGameReady(page);
      await assertPath(page, EXPECTED_PATH);
    });
  });

  test.describe('Intro Screen Validation', () => {
    test('Level 1: EpisodeIntro displays EPISODE I: AWAKENING', async ({ page }) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      // Episode intro should be visible with the correct title
      await expect(page.getByText('EPISODE I: AWAKENING')).toBeVisible({ timeout: 3000 });
      await expect(page.getByRole('button', { name: 'Skip Intro' })).toBeVisible();
    });

    test('Level 1: BiosBoot appears after EpisodeIntro', async ({ page }) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      // EpisodeIntro has multiple sections - mash Shift+Enter until we see BiosBoot
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Shift+Enter');
        await page.waitForTimeout(300);
        // Check if BiosBoot is visible
        const bios = page.getByText(/ANTIGRAVITY BIOS/);
        if (await bios.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }
      }
      // BiosBoot should now be visible with BIOS text
      await expect(page.getByText(/ANTIGRAVITY BIOS/)).toBeVisible({ timeout: 3000 });
    });

    test('Level 6: EpisodeIntro displays EPISODE II: FORTIFICATION', async ({ page }) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('EPISODE II: FORTIFICATION')).toBeVisible({ timeout: 3000 });
    });

    test('Level 11: EpisodeIntro displays EPISODE III: MASTERY', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('EPISODE III: MASTERY')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Task State Validation', () => {
    test('Level 1: Tasks start at 0 after intro skip', async ({ page }) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertTasksStartAtZero(page);
    });

    test('Level 6: Tasks start at 0 after intro skip', async ({ page }) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertTasksStartAtZero(page);
    });

    test('Level 11: Tasks start at 0 after intro skip', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');
      await skipViaButton(page);
      await waitForGameReady(page);
      await assertTasksStartAtZero(page);
    });
  });

  test.describe('URL Param Skip (intro=false)', () => {
    test('Level 1: intro=false skips directly to game UI', async ({ page }) => {
      await page.goto('/?lvl=1&intro=false');
      await page.waitForLoadState('networkidle');
      await waitForGameReady(page);
      await assertPath(page, '~');
      await assertTasksStartAtZero(page);
    });

    test('Level 6: intro=false skips directly to game UI', async ({ page }) => {
      await page.goto('/?lvl=6&intro=false');
      await page.waitForLoadState('networkidle');
      await waitForGameReady(page);
      await assertPath(page, '~');
      await assertTasksStartAtZero(page);
    });

    test('Level 11: intro=false skips directly to game UI', async ({ page }) => {
      await page.goto('/?lvl=11&intro=false');
      await page.waitForLoadState('networkidle');
      await waitForGameReady(page);
      await assertPath(page, 'systemd-core');
      await assertTasksStartAtZero(page);
    });
  });

  test.describe('Natural Progression (section-by-section Shift+Enter)', () => {
    test('Level 1: Natural progression through intro lands in ~', async ({ page }) => {
      await page.goto('/?lvl=1');
      await page.waitForLoadState('networkidle');

      // Go through EpisodeIntro and BiosBoot section by section
      // Keep pressing Shift+Enter until we reach the game UI
      for (let i = 0; i < 15; i++) {
        const statusBar = page.locator('[data-testid="status-bar"]');
        if (await statusBar.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }
        await page.keyboard.press('Shift+Enter');
        await page.waitForTimeout(400);
      }

      await waitForGameReady(page);
      await assertPath(page, '~');
      await assertTasksStartAtZero(page);
    });

    test('Level 6: Natural progression through intro lands in ~', async ({ page }) => {
      await page.goto('/?lvl=6');
      await page.waitForLoadState('networkidle');

      for (let i = 0; i < 15; i++) {
        const statusBar = page.locator('[data-testid="status-bar"]');
        if (await statusBar.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }
        await page.keyboard.press('Shift+Enter');
        await page.waitForTimeout(400);
      }

      await waitForGameReady(page);
      await assertPath(page, '~');
      await assertTasksStartAtZero(page);
    });

    test('Level 11: Natural progression through intro lands in systemd-core', async ({ page }) => {
      await page.goto('/?lvl=11');
      await page.waitForLoadState('networkidle');

      for (let i = 0; i < 15; i++) {
        const statusBar = page.locator('[data-testid="status-bar"]');
        if (await statusBar.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }
        await page.keyboard.press('Shift+Enter');
        await page.waitForTimeout(400);
      }

      await waitForGameReady(page);
      await assertPath(page, 'systemd-core');
      await assertTasksStartAtZero(page);
    });
  });
});
