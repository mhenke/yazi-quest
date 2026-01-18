import { test, expect, type Page } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  ensureCleanState,
  assertLevelStartedIncomplete,
  assertTask,
  filterByText,
  clearFilter,
  pressKeys,
} from './utils';

// Helper for common Level 12 mission steps (DRY)
async function runLevel12Mission(page: Page) {
  await gotoCommand(page, 'w');
  await pressKey(page, '.');
  await filterByText(page, '.i');
  for (let i = 0; i < 6; i++) {
    await pressKey(page, 'Shift+j');
  }
  await clearFilter(page);
  await filterByText(page, 'sy');
  await pressKey(page, 'x');
  await clearFilter(page);
  await pressKey(page, '.');
  await gotoCommand(page, 'r');
  await pressKey(page, 'j');
  await pressKey(page, 'l');
  await pressKey(page, 'p');
  await pressKey(page, 'l');
}

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);

    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'service');
    await pressKey(page, 'Enter');

    await pressKey(page, ',');
    await pressKey(page, 'Shift+m');
    await assertTask(page, '1/4', testInfo.outputDir, 'sort_modified');

    await pressKey(page, ' ');
    await pressKey(page, ' ');
    await assertTask(page, '2/4', testInfo.outputDir, 'select_files');

    await pressKey(page, 'y');
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_files');

    await ensureCleanState(page);
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_files');

    await waitForMissionComplete(page);
  });

  // Level 12 Scenarios
  const scenarios = [
    { id: 'a1', threat: null, location: null },
    { id: 'a2', threat: 'dump', location: 'c' },
    { id: 'a3', threat: 'lib_error', location: 'w' },
    { id: 'b1', threat: 'traffic', location: 'w' },
    { id: 'b2', threat: 'packet', location: 'i' },
    { id: 'b3', threat: 'scan_', location: 's' }, // Special case: search
  ];

  for (const scenario of scenarios) {
    test(`Level 12: scen-${scenario.id} - completes successfully`, async ({ page }, testInfo) => {
      await page.goto(`/?lvl=12&scenario=scen-${scenario.id}`);
      await page.waitForLoadState('networkidle');

      const skipButton = page.getByRole('button', { name: 'Skip Intro' });
      if (await skipButton.isVisible()) await skipButton.click();

      const threatAlert = page.getByText('Threat Detected');
      if (await threatAlert.isVisible({ timeout: 1000 })) {
        await pressKey(page, 'Shift+Enter');
      }

      await assertLevelStartedIncomplete(page);

      // Handle specific threat files for each scenario
      if (scenario.threat) {
        if (scenario.location === 's') {
          // Special case for swarm search
          await gotoCommand(page, 'r');
          await pressKey(page, 's');
          await typeText(page, scenario.threat);
          await pressKey(page, 'Enter');
          await pressKey(page, 'Control+a');
        } else {
          await gotoCommand(page, scenario.location as 'c' | 'w' | 'i');
          await filterByText(page, scenario.threat);
        }
        await pressKey(page, 'd');
        await pressKey(page, 'y');
        await clearFilter(page);
      }

      await ensureCleanState(page);
      await runLevel12Mission(page);
      await assertTask(page, '5/5', testInfo.outputDir, `mission_complete_${scenario.id}`);
      await waitForMissionComplete(page);
    });
  }

  // Level 13: DISTRIBUTED CONSCIOUSNESS
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000);
    await goToLevel(page, 13);
    await assertLevelStartedIncomplete(page);

    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, '.key');
    await pressKey(page, 'Enter');
    await assertTask(page, '1/5', testInfo.outputDir, 'search_keys');

    await pressKey(page, 'Control+a');
    await pressKey(page, 'x');
    await clearFilter(page);

    await gotoCommand(page, 'w');
    await pressKey(page, '.');
    await filterByText(page, 'identity');
    for (let i = 0; i < 20; i++) {
      await pressKey(page, 'Shift+j');
    }
    await assertTask(page, '4/5', testInfo.outputDir, 'discover_identity');

    await clearFilter(page);
    await pressKeys(page, ['g', 'g']);
    await pressKey(page, 'l');
    await pressKey(page, 'p');
    await assertTask(page, '5/5', testInfo.outputDir, 'paste_keys');

    await pressKey(page, 'Shift+Enter');
    await waitForMissionComplete(page);
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 14);
    await assertLevelStartedIncomplete(page);

    await test.step('Task 1: Create 3 decoy directories', async () => {
      await pressKey(page, 'a');
      await typeText(page, 'decoy_1/');
      await pressKey(page, 'Enter');
      await pressKey(page, 'a');
      await typeText(page, 'decoy_2/');
      await pressKey(page, 'Enter');
      await pressKey(page, 'a');
      await typeText(page, 'decoy_3/');
      await pressKey(page, 'Enter');
      await assertTask(page, '1/3', testInfo.outputDir, 'task1_create_decoys');
    });

    await test.step('Task 2: Purge all visible original directories', async () => {
      await filterByText(page, 'datastore');
      await pressKey(page, ' ');
      await clearFilter(page);
      await filterByText(page, 'incoming');
      await pressKey(page, ' ');
      await clearFilter(page);
      await filterByText(page, 'media');
      await pressKey(page, ' ');
      await clearFilter(page);
      await filterByText(page, 'workspace');
      await pressKey(page, ' ');
      await clearFilter(page);

      await pressKey(page, 'Shift+d');
      await pressKey(page, 'y');
      await assertTask(page, '2/3', testInfo.outputDir, 'task2_delete_visible');
    });

    await test.step('Task 3: Purge .config directory', async () => {
      await pressKey(page, '.');
      await filterByText(page, '.config');
      await pressKey(page, 'Shift+d');
      await pressKey(page, 'y');
      await assertTask(page, '3/3', testInfo.outputDir, 'task3_delete_hidden');
    });

    await ensureCleanState(page);
    await waitForMissionComplete(page);
  });

  // Level 15: TRANSMISSION PROTOCOL
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    await goToLevel(page, 15);
    await assertLevelStartedIncomplete(page);

    await test.step('Phase 1: Assemble keys', async () => {
      await gotoCommand(page, 'r');
      await pressKey(page, 's');
      await typeText(page, 'key');
      await pressKey(page, 'Enter');
      await pressKey(page, 'Control+a');
      await pressKey(page, 'y');
      await clearFilter(page);

      await gotoCommand(page, 't');
      await filterAndNavigate(page, 'upload');
      await pressKey(page, 'p');
      await assertTask(page, '1/4', testInfo.outputDir, 'assemble_keys');
    });

    await test.step('Phase 2: Verify daemon', async () => {
      await gotoCommand(page, 'r');
      await filterAndNavigate(page, 'daemons');
      await filterAndNavigate(page, 'systemd-core');
      await filterByText(page, 'uplink_v1');
      await pressKey(page, 'Tab');
      await pressKey(page, 'Shift+j');
      await assertTask(page, '2/4', testInfo.outputDir, 'verify_daemon');
      await pressKey(page, 'Tab');
      await clearFilter(page);
    });

    await test.step('Phase 3: Sanitize', async () => {
      await gotoCommand(page, 't');
      await pressKey(page, '.');
      await filterByText(page, 'ghost');
      await pressKey(page, 'Shift+d');
      await pressKey(page, 'y');
      await assertTask(page, '3/4', testInfo.outputDir, 'sanitize');
      await clearFilter(page);
      await pressKey(page, '.');
    });

    await test.step('Phase 4: Upload', async () => {
      await pressKey(page, 'Shift+Z');
      await typeText(page, 'upload');
      await pressKey(page, 'Enter');
      await filterByText(page, 'key');
      await assertTask(page, '4/4', testInfo.outputDir, 'initiate_upload');
    });

    await clearFilter(page);
    await waitForMissionComplete(page);
  });
});
