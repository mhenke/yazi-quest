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
  addItem,
  filterAndSelect,
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
  // Objective for scen-a1 (Legacy Path):
  // 1. Discover identity (toggle hidden, scroll preview) - now handled by discoverIdentity
  // 2. Cut systemd-core
  // 3. Navigate to daemons
  // 4. Paste and enter daemon

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
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);

    // Task 1: Search for 'service'
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'service');
    await pressKey(page, 'Enter');
    // Task 1 complete (Search)
    await assertTask(page, '1/4', testInfo.outputDir, 'search_complete');

    // Task 2: Sort by modified (,m or ,M)
    // Efficiency tip says ",m"
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Select 2 legacy files (safe ones)

    // Task 3: Select 2 legacy files (safe ones)

    // Select 'network.service'
    await filterAndSelect(page, 'network.service');
    // Filter remains active, but selecting next item overwrites it.

    // Select 'legacy-backup.service'
    await filterAndSelect(page, 'legacy-backup.service');

    // Task 4: Yank
    await pressKey(page, 'y');
    await expect(page.locator('[data-testid="status-clipboard"]')).toContainText('COPY: 2');
    // Clear filter to clean up state
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await assertTask(page, '3/4', testInfo.outputDir, 'yank_files');

    // Task 5: Paste in /daemons
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
        await page.keyboard.press('Shift+Enter');
      }

      await assertLevelStartedIncomplete(page);

      // Handle specific threat files for each scenario
      if (scenario.threat) {
        if (scenario.location === 's') {
          // Special case for swarm search
          await gotoCommand(page, 'r');
          await pressKey(page, 's');
          // 'tmp' matches all swarm files (scan_*.tmp) but avoids scanner_lock.pid honeypot
          await typeText(page, 'tmp');
          await pressKey(page, 'Enter');
          // Wait for search results to stabilize
          await page.waitForTimeout(500);
          await pressKey(page, 'Control+a');
        } else {
          await gotoCommand(page, scenario.location as 'c' | 'w' | 'i');
          await filterByText(page, scenario.threat);
        }
        await pressKey(page, 'd');
        await page.waitForTimeout(200); // Wait for modal
        await pressKey(page, 'y');
        // Swarm deletion involves finding/removing multiple files, can be slow
        await page.waitForTimeout(2000);
        await clearFilter(page);
      }

      await ensureCleanState(page);
      // Discovery step (Tasks 1-2) - required for all scenarios
      await discoverIdentity(page);
      // Finale steps (Tasks 3-5) - common to all scenarios
      await runLevel12Mission(page);

      const totalTasks = scenario.threat ? 6 : 5;
      await assertTask(
        page,
        `${totalTasks}/${totalTasks}`,
        testInfo.outputDir,
        `mission_complete_${scenario.id}`
      );
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
    // Toggle hidden files ON to find .key files
    await pressKey(page, '.');

    await pressKey(page, 's');
    // Use '.key_' to specifically match .key_tokyo, .key_berlin, .key_saopaulo
    // Avoids vague '.key' which might match other system files
    await typeText(page, '.key_');
    await pressKey(page, 'Enter');

    // Wait for search results
    await page.waitForTimeout(500);

    // Cut all keys found
    await pressKey(page, 'Control+a');
    await pressKey(page, 'x');

    // Verify we have exactly 3 keys (tokyo, berlin, saopaulo)
    // 'x' (Cut) results in 'MOVE' status, 'y' (Yank) results in 'COPY'
    await expect(page.locator('[data-testid="status-clipboard"]')).toContainText('MOVE: 3');

    // Escape out of search mode to return to file view
    await pressKey(page, 'Escape');
    await clearFilter(page);

    // Toggle hidden files OFF to clean state for discoverIdentity
    await pressKey(page, '.');

    // Tasks 1-3 (Extract Tokyo, Berlin, Sao Paulo) complete upon cutting keys
    // There are 5 tasks total: 3 keys + 1 identity + 1 paste
    await assertTask(page, '3/5', testInfo.outputDir, 'keys_cut');

    // Task 4: Discover Identity
    await discoverIdentity(page);
    await assertTask(page, '4/5', testInfo.outputDir, 'discover_identity');

    // Task 5: Paste in central_relay
    await gotoCommand(page, 'w'); // Go to workspace
    await filterAndNavigate(page, 'central_relay');

    // Wait for navigation to settle before pasting
    await page.waitForTimeout(500);

    await pressKey(page, 'p');

    // Wait for paste/task completion logic
    await page.waitForTimeout(1000);

    // Conditional handling: If Protocol Violation appears, handle it.
    // Otherwise, wait for success.
    const violation = page.getByText('Protocol Violation');
    if (await violation.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press('Shift+Enter');
    }

    // Verify mission complete OR level transition
    // We skip assertTask('5/5') because we might have already transitioned (fast success)
    await waitForMissionComplete(page);
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 14);

    // Task 1 (Return to /home/guest) completes immediately because we start there
    await assertTask(page, '1/4', testInfo.outputDir, 'task1_auto_complete');

    await test.step('Task 2: Create 3 decoy directories', async () => {
      await addItem(page, 'decoy_1/');
      await addItem(page, 'decoy_2/');
      await addItem(page, 'decoy_3/');
      await assertTask(page, '2/4', testInfo.outputDir, 'task2_create_decoys');
    });

    await test.step('Task 3: Purge all visible original directories', async () => {
      // Batch select all target directories
      const targets = ['datastore', 'incoming', 'media', 'workspace'];
      for (const target of targets) {
        await filterAndSelect(page, target);
        await clearFilter(page);
      }

      // Permanent Delete (Shift+D)
      await pressKey(page, 'Shift+D');
      // Confirm deletion if prompted (usually 'y') - game might strictly require just D or D then y
      // Level 14 hint says "Use 'D' for permanent deletion".
      // Usually D triggers a confirmation modal in Yazi, let's assume 'y' is needed
      await page.waitForTimeout(200);
      await pressKey(page, 'y');

      await assertTask(page, '3/4', testInfo.outputDir, 'task3_delete_visible');
    });

    await test.step('Task 4: Purge .config directory', async () => {
      // Toggle hidden files to see .config
      await pressKey(page, '.');

      await filterAndSelect(page, '.config');
      await clearFilter(page);

      await pressKey(page, 'Shift+D');
      await page.waitForTimeout(200);
      await pressKey(page, 'y');

      await assertTask(page, '4/4', testInfo.outputDir, 'task4_delete_hidden');
    });

    await waitForMissionComplete(page);
  });

  // Level 15: TRANSMISSION PROTOCOL
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    await goToLevel(page, 15);
    await assertLevelStartedIncomplete(page);

    await test.step('Phase 1: Enter Vault', async () => {
      // Navigate to /tmp/vault
      // Level starts at /home/guest, so we go to Root ('r') to find 'tmp'
      await gotoCommand(page, 'r');
      await filterAndNavigate(page, 'tmp');
      await clearFilter(page);

      // Wait for vault creation/visibility
      await page.waitForTimeout(200);
      await filterAndNavigate(page, 'vault');

      // Wait for state update
      await page.waitForTimeout(500);
      await assertTask(page, '1/4', testInfo.outputDir, 'phase1_enter_vault');
    });

    await test.step('Phase 2: Verify Keys', async () => {
      // Must verify 3 keys in 'keys' directory
      // Keys are hidden files (.key_...), so we must toggle hidden view
      await pressKey(page, '.');

      await filterAndNavigate(page, 'keys');
      await assertTask(page, '2/4', testInfo.outputDir, 'phase2_verify_keys');
      // Go back up to vault root for next phase
      await pressKey(page, 'h');
    });

    await test.step('Phase 3: Verify Configs', async () => {
      // Go into 'active' and filter for '.conf'
      await filterAndNavigate(page, 'active');
      await filterByText(page, '.conf');
      await assertTask(page, '3/4', testInfo.outputDir, 'phase3_verify_configs');

      // Cleanup: Exit filter and go back up
      await clearFilter(page);
      await pressKey(page, 'h');
    });

    await test.step('Phase 4: Verify Training Data', async () => {
      // Go into 'training_data', select log, scroll preview
      await filterAndNavigate(page, 'training_data');

      // Select an exfil log
      await filterAndSelect(page, 'exfil_01.log');
      await clearFilter(page);

      // Scroll preview down to verify content (J/K)
      // Task check requires previewScroll > 0
      await pressKey(page, 'Shift+J');
      await pressKey(page, 'Shift+J');

      await assertTask(page, '4/4', testInfo.outputDir, 'phase4_verify_training');
    });

    await waitForMissionComplete(page);
  });
});
