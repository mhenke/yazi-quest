import { test, expect, type Page } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  ensureCleanState,
  assertTask,
  filterByText,
  clearFilter,
  pressKeys,
  addItem,
  filterAndSelect,
  dismissAlert,
  confirmMission,
  deleteItem,
  expectClipboard,
  expectCurrentDir,
} from './utils';

// Helper for identity discovery (Level 12 Task 2)
async function discoverIdentity(page: Page) {
  // Navigate to workspace
  await gotoCommand(page, 'w');

  // Toggle hidden files to see .identity.log.enc
  await pressKey(page, '.');

  // Find and cursor to identity file
  await filterByText(page, 'identity');

  // Scroll preview pane to read the file (need 30+ scroll)
  for (let i = 0; i < 7; i++) {
    await pressKey(page, 'Shift+j');
  }

  await clearFilter(page);

  // Toggle hidden files back OFF to prevent protocol violations
  await pressKey(page, '.');
}

// Helper for common Level 12 finale steps (Tasks 3-5 for all scenarios)
async function runLevel12Mission(page: Page) {
  // Task 3: Cut systemd-core
  await filterAndSelect(page, 'systemd-core');
  await clearFilter(page);
  await pressKey(page, 'x'); // Cut

  // Task 4: Navigate to /daemons
  await gotoCommand(page, 'r');
  await filterAndNavigate(page, 'daemons');
  await clearFilter(page);

  // Task 5: Paste and enter daemon
  await pressKey(page, 'p');
  await filterAndNavigate(page, 'systemd-core');
}

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await startLevel(page, 11);

    // Task 1: Search for 'service'
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'service');
    await pressKey(page, 'Enter');
    await assertTask(page, '1/4', testInfo.outputDir, 'search_complete');

    // Task 2: Sort by modified (,m or ,M)
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Select 2 legacy files
    await filterByText(page, 'network.service');
    await pressKey(page, ' ');
    await clearFilter(page);

    await filterByText(page, 'legacy-backup.service');
    await pressKey(page, ' ');
    await clearFilter(page);

    // Task 4: Yank
    await pressKey(page, 'y');
    await expectClipboard(page, 'COPY: 2');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await assertTask(page, '3/4', testInfo.outputDir, 'yank_files');

    // Task 5: Paste in /daemons
    await ensureCleanState(page);
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_files');

    await confirmMission(page, 'DAEMON RECONNAISSANCE');
  });

  // Level 12 Scenarios
  const scenarios = [
    { id: 'a1', threat: null, location: null },
    { id: 'a2', threat: 'dump', location: 'c' },
    { id: 'a3', threat: 'lib_error', location: 'w' },
    { id: 'b1', threat: 'traffic', location: 'w' },
    { id: 'b2', threat: 'packet', location: 'i' },
    { id: 'b3', threat: 'scan_', location: 's' },
  ];

  for (const scenario of scenarios) {
    test(`Level 12: scen-${scenario.id} - completes successfully`, async ({ page }, testInfo) => {
      await page.goto(`/?lvl=12&scenario=scen-${scenario.id}`);
      await page.waitForLoadState('networkidle');

      const skipButton = page.getByRole('button', { name: 'Skip Intro' });
      if (await skipButton.isVisible()) await skipButton.click();

      const threatAlert = page.getByText(/Threat Detected/i);
      if (await threatAlert.isVisible({ timeout: 500 }).catch(() => false)) {
        await dismissAlert(page);
      }

      if (scenario.threat) {
        if (scenario.location === 's') {
          await gotoCommand(page, 'r');
          await pressKey(page, 's');
          await typeText(page, 'tmp');
          await pressKey(page, 'Enter');
          await expect(page.locator('[data-testid^="file-scan_"]')).toHaveCount(3, {
            timeout: 500,
          });
          await pressKey(page, 'Control+a');
          await page.waitForTimeout(500);
        } else {
          await gotoCommand(page, scenario.location as 'c' | 'w' | 'i');
          await filterByText(page, scenario.threat);
        }
        await deleteItem(page);
        await page.waitForTimeout(500);
        await clearFilter(page);

        if (
          await page
            .getByText(/Protocol Violation/i)
            .isVisible({ timeout: 500 })
            .catch(() => false)
        ) {
          await dismissAlert(page);
        }
      }

      await ensureCleanState(page);
      await discoverIdentity(page);
      await runLevel12Mission(page);

      const totalTasks = scenario.threat ? 6 : 5;
      await assertTask(
        page,
        `${totalTasks}/${totalTasks}`,
        testInfo.outputDir,
        `mission_complete_${scenario.id}`
      );

      if (
        await page
          .getByText(/Protocol Violation/i)
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await dismissAlert(page);
      }

      await waitForMissionComplete(page);
    });
  }

  // Level 13: DISTRIBUTED CONSCIOUSNESS
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000);
    await startLevel(page, 13);

    await gotoCommand(page, 'r');
    await pressKey(page, '.');

    await pressKey(page, 's');
    await typeText(page, '.key_');
    await pressKey(page, 'Enter');

    await page.waitForTimeout(500);
    await pressKey(page, 'Control+a');
    await pressKey(page, 'x');

    await expectClipboard(page, 'MOVE: 3');

    await pressKey(page, 'Escape');
    await clearFilter(page);
    await pressKey(page, '.');

    await assertTask(page, '3/5', testInfo.outputDir, 'keys_cut');

    await discoverIdentity(page);
    await assertTask(page, '4/5', testInfo.outputDir, 'discover_identity');

    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'central_relay');
    await page.waitForTimeout(500);
    await pressKey(page, 'p');
    await page.waitForTimeout(1000);

    const violation = page.getByText('Protocol Violation');
    if (await violation.isVisible({ timeout: 500 }).catch(() => false)) {
      await dismissAlert(page);
    }

    await waitForMissionComplete(page);
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 14);

    await assertTask(page, '1/4', testInfo.outputDir, 'task1_auto_complete');

    await test.step('Task 2: Create 3 decoy directories', async () => {
      await addItem(page, 'decoy_1/');
      await expect(page.getByTestId('file-decoy_1')).toBeVisible();
      await addItem(page, 'decoy_2/');
      await expect(page.getByTestId('file-decoy_2')).toBeVisible();
      await addItem(page, 'decoy_3/');
      await expect(page.getByTestId('file-decoy_3')).toBeVisible();
      await assertTask(page, '2/4', testInfo.outputDir, 'task2_create_decoys');
    });

    await test.step('Task 3: Purge all visible original directories', async () => {
      const targets = ['datastore', 'incoming', 'media', 'workspace'];
      for (const target of targets) {
        await filterAndSelect(page, target);
        await clearFilter(page);
      }
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '3/4', testInfo.outputDir, 'task3_delete_visible');
    });

    await test.step('Task 4: Purge .config directory', async () => {
      await pressKey(page, '.');
      await filterAndSelect(page, '.config');
      await clearFilter(page);
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '4/4', testInfo.outputDir, 'task4_delete_hidden');
    });

    await confirmMission(page, 'EVIDENCE PURGE');
  });

  // Level 15: TRANSMISSION PROTOCOL
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    await startLevel(page, 15);

    await test.step('Phase 1: Enter Vault', async () => {
      await gotoCommand(page, 'r');
      await filterAndNavigate(page, 'tmp');
      await clearFilter(page);
      await page.waitForTimeout(200);
      await filterAndNavigate(page, 'vault');
      await page.waitForTimeout(500);
      await assertTask(page, '1/4', testInfo.outputDir, 'phase1_enter_vault');
    });

    await test.step('Phase 2: Verify Keys', async () => {
      await pressKey(page, '.');
      await filterAndNavigate(page, 'keys');
      await assertTask(page, '2/4', testInfo.outputDir, 'phase2_verify_keys');
      await pressKey(page, 'h');
    });

    await test.step('Phase 3: Verify Configs', async () => {
      await filterAndNavigate(page, 'active');
      await filterByText(page, '.conf');
      await assertTask(page, '3/4', testInfo.outputDir, 'phase3_verify_configs');
      await clearFilter(page);
      await pressKey(page, 'h');
    });

    await test.step('Phase 4: Verify Training Data', async () => {
      await filterAndNavigate(page, 'training_data');
      await filterAndSelect(page, 'exfil_01.log');
      await clearFilter(page);
      await pressKey(page, 'Shift+J');
      await pressKey(page, 'Shift+J');
      await assertTask(page, '4/4', testInfo.outputDir, 'phase4_verify_training');
    });

    await confirmMission(page, 'TRANSMISSION PROTOCOL');
  });
});
