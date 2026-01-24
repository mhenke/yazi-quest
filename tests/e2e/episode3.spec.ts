import { test, expect, type Page } from '@playwright/test';
import {
  startLevel,
  assertLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  ensureCleanState,
  assertTask,
  filterByText,
  clearFilter,
  search,
  addItem,
  filterAndSelect,
  dismissAlert,
  confirmMission,
  deleteItem,
  renameItem,
  expectClipboard,
  expectCurrentDir,
  areHiddenFilesVisible,
  navigateRight,
  navigateLeft,
  dismissAlertIfPresent,
  expectNarrativeThought,
} from './utils';

// Helper for common Level 12 finale steps (Tasks 3-5 for all scenarios)
async function runLevel12Mission(page: Page) {
  // Task 3: Cut systemd-core
  await filterAndSelect(page, 'systemd-core');
  await dismissAlertIfPresent(page, /Protocol Violation/i);
  await pressKey(page, 'x'); // Cut

  // Task 4: Navigate to /daemons
  await gotoCommand(page, 'r');
  await filterByText(page, 'daemons');
  await navigateRight(page, 1); // Enter BEFORE clearing filter
  await dismissAlertIfPresent(page, /Protocol Violation/i);

  // Task 5: Paste and enter daemon
  await pressKey(page, 'p');
  await filterByText(page, 'systemd-core');
  await navigateRight(page, 1); // Enter BEFORE clearing filter
  await dismissAlertIfPresent(page, /Protocol Violation/i);

  // Mid-level staggered thought trigger (3-2-3 model)
  await expectNarrativeThought(page, 'I am the virus now.');
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

    // Task 2: Sort by modified (,M for oldest first)
    await pressKey(page, ',');
    await pressKey(page, 'M'); // Uppercase M = oldest first
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Select 2 legacy files (oldest two in the sorted list)
    // After sorting by modified ascending (oldest first), legacy files are at top:
    // 1. legacy-backup.service (90 days old) - LEGACY (oldest)
    // 2. cron.service (60 days old) - SAFE
    // 3. network.service (45 days old) - LEGACY
    // 4. audit-daemon.service (1 day old) - HONEYPOT!
    // Select the first two: legacy-backup and cron
    await pressKey(page, ' '); // Select first file (legacy-backup.service)
    await pressKey(page, 'j'); // Move down
    await pressKey(page, ' '); // Select second file (cron.service)

    // Task 4: Yank
    await pressKey(page, 'y');
    await expectClipboard(page, 'COPY: 2');
    await page.keyboard.press('Escape');

    await assertTask(page, '3/4', testInfo.outputDir, 'yank_files');

    // Task 5: Paste in /daemons
    await ensureCleanState(page);
    await gotoCommand(page, 'r');
    await expectCurrentDir(page, '/'); // Verify we are at root

    await filterByText(page, 'daemons');
    await pressKey(page, 'l');
    await clearFilter(page);
    await expectCurrentDir(page, 'daemons'); // Verify we are in daemons

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

      await dismissAlertIfPresent(page, /Threat Detected/i);

      if (scenario.threat) {
        if (scenario.location === 's') {
          await gotoCommand(page, 'r');
          await search(page, 'scan_');
          await expect(page.locator('[data-testid^="file-scan_"]')).toHaveCount(3, {
            timeout: 2000,
          });
          await page.keyboard.press('Control+a'); // Select all scan files
          await page.waitForTimeout(500);
          await deleteItem(page, { confirm: true });

          // Dismiss any threat alerts that appear after deletion
          await dismissAlertIfPresent(page, /Threat Detected/i);
        } else {
          await gotoCommand(page, scenario.location as 'c' | 'w' | 'i');
          await filterByText(page, scenario.threat);
          await deleteItem(page, { confirm: true });
          await page.waitForTimeout(500);
        }
        await clearFilter(page);

        await dismissAlertIfPresent(page, /Protocol Violation/i);
      }

      await ensureCleanState(page);

      // === INLINE DISCOVER IDENTITY LOGIC ===
      // Navigate to workspace
      await gotoCommand(page, 'w');

      // If threat exists, we've already completed the mitigation task, so we have 2 tasks done (Nav + Mitigation).
      // If no threat (clean run), only 1 task done (Nav).
      const expectedDone = scenario.threat ? 2 : 1;
      const expectedTotal = scenario.threat ? 6 : 5;

      await assertTask(
        page,
        `${expectedDone}/${expectedTotal}`,
        testInfo.outputDir,
        `nav_workspace_${scenario.id}`
      );

      // Toggle hidden files to see .identity.log.enc
      await pressKey(page, '.');

      // Find and cursor to identity file using Recursive Search (s) to avoid filter clearing issues
      await pressKey(page, 's');
      await typeText(page, 'identity');
      await page.waitForTimeout(300); // Ensure input is registered
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);

      // Search might trigger a warning if implemented (unlikely for s, but good to wait)
      // Ensure we are in search results

      // Move cursor to first item (identity log)
      await pressKey(page, 'g');
      await pressKey(page, 'g');
      await page.waitForTimeout(300);

      // Scroll preview pane IMMEDIATELY to complete task check while cursor is on file
      for (let i = 0; i < 12; i++) {
        await pressKey(page, 'Shift+j');
      }
      await page.waitForTimeout(800);

      // Task should be complete now - assert BEFORE clearing filter
      // For no-threat: Task 1 = navigate-workspace, Task 2 = discover-identity
      // For threat: Task 1 = threat, Task 2 = navigate-workspace, Task 3 = discover-identity
      const discoverTaskNum = scenario.threat ? 3 : 2;
      await assertTask(page, `${discoverTaskNum}/${scenario.threat ? 6 : 5}`, testInfo.outputDir);

      // Now clear filter
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Toggle hidden off before continuing
      await pressKey(page, '.');
      await page.waitForTimeout(300);

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
    await assertLevel(page, '13');

    // PHASE 1: ACQUIRE
    // ----------------------------------------------------------------
    await gotoCommand(page, 'r');
    await filterByText(page, 'nodes');
    await pressKey(page, 'l');
    await clearFilter(page);

    await pressKey(page, '.'); // Show hidden
    await pressKey(page, 's'); // Search
    await typeText(page, '.key');
    await pressKey(page, 'Enter');
    await expect(page.locator('[data-testid^="file-"][data-testid$=".key"]')).toHaveCount(3, {
      timeout: 2000,
    });

    await pressKey(page, 'Ctrl+A'); // Select all
    await pressKey(page, 'x'); // Cut
    await expectClipboard(page, 'MOVE: 3');
    await assertTask(page, '1/4', testInfo.outputDir, 'phase1_acquired');

    // PHASE 2: RELAY
    // ----------------------------------------------------------------
    await pressKey(page, 'Escape'); // Clear search
    await gotoCommand(page, 'w'); // Warp to workspace
    await expectCurrentDir(page, 'workspace');

    await addItem(page, 'central_relay/'); // Create directory
    await assertTask(page, '2/4', testInfo.outputDir, 'phase2_relay_created');

    // PHASE 3: SYNC
    // ----------------------------------------------------------------
    await filterByText(page, 'central_relay');
    await navigateRight(page, 1); // Enter relay
    await clearFilter(page);
    await pressKey(page, 'p'); // Paste
    await assertTask(page, '3/4', testInfo.outputDir, 'phase3_synchronized');

    // PHASE 4: AUDIT
    // ----------------------------------------------------------------
    await navigateLeft(page, 1); // Go back to workspace
    await expectCurrentDir(page, 'workspace');

    // Ensure hidden visible
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }

    await filterByText(page, '.identity'); // Select identity file

    // Preview and scroll
    for (let i = 0; i < 10; i++) {
      await pressKey(page, 'Shift+J');
    }
    // Mid-level staggered thought trigger (3-2-3 model) - Level 13 is silent
    // await expect(page.locator('[data-testid="narrative-thought"]')).toContainText(
    //   'To self: The loops are closing. I remember the static.'
    // );
    await assertTask(page, '4/4', testInfo.outputDir, 'phase4_audit_complete');
    await clearFilter(page);

    await waitForMissionComplete(page);
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 14);

    // Task 1: Return to home (starts in /daemons/systemd-core)
    await gotoCommand(page, 'h');
    await assertTask(page, '1/5', testInfo.outputDir, 'task1_home');

    await test.step('Task 2: Move vault to /tmp', async () => {
      // 1. Show hidden files to see .config
      if (!(await areHiddenFilesVisible(page))) {
        await pressKey(page, '.');
      }
      await expect(page.getByText('HIDDEN: ON')).toBeVisible();

      // 2. Navigate into .config
      await filterByText(page, '.config');
      await navigateRight(page, 1); // Enter BEFORE clearing filter
      await clearFilter(page);
      await expectCurrentDir(page, '.config');

      // 3. Cut vault from ~/.config
      await filterByText(page, 'vault');
      await expect(page.getByTestId('file-vault')).toBeVisible();
      await pressKey(page, 'x'); // Cut
      await clearFilter(page);

      // 4. Move to /tmp and paste vault there
      await gotoCommand(page, 't');
      await expectCurrentDir(page, 'tmp');
      await pressKey(page, 'p'); // Paste
      await assertTask(page, '2/5', testInfo.outputDir, 'task2_move_vault');
    });

    await test.step('Task 3: Create decoys', async () => {
      await gotoCommand(page, 'h'); // Return to /home/guest
      await expectCurrentDir(page, '~'); // Breadcrumb shows ~ for /home/guest
      await addItem(page, 'decoy_1/');
      await addItem(page, 'decoy_2/');
      await addItem(page, 'decoy_3/');
      // Must create decoys before deleting original folders per logic
      await assertTask(page, '3/5', testInfo.outputDir, 'task3_decoys');
    });

    await test.step('Task 4: Delete original directories', async () => {
      // Visible original directories: incoming, media, workspace, datastore
      if (!(await areHiddenFilesVisible(page))) {
        await pressKey(page, '.');
      }

      const targets = ['incoming', 'media', 'workspace', 'datastore'];
      for (const target of targets) {
        await filterAndSelect(page, target);
      }
      // Delete selected original folders permanently
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '4/5', testInfo.outputDir, 'task4_purge_data');
    });

    await test.step('Task 5: Delete .config directory', async () => {
      // .config can only be deleted after visible dirs are purged
      await filterAndSelect(page, '.config');
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '5/5', testInfo.outputDir, 'task5_purge_config');
    });

    // Auto-fix protocol violation (hidden files) to see Success Toast
    await dismissAlert(page);
    await confirmMission(page, 'EVIDENCE PURGE - WORKSPACE');
  });

  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    // Override max keystrokes to prevent game over
    await page.evaluate(() => {
      // @ts-expect-error: Custom test function
      if (window.resetGame) window.resetGame();
    });

    await startLevel(page, 15);
    await expectNarrativeThought(
      page,
      'The guest partition is gone. There is only the gauntlet now.'
    );

    // PHASE 1: Enter Vault
    // ----------------------------------------------------------------
    await filterByText(page, 'vault');
    await pressKey(page, 'l'); // Enter BEFORE clearing filter
    await clearFilter(page);
    await assertTask(page, '1/4', testInfo.outputDir, 'phase1_vault');

    // PHASE 2: Assemble Identity (Move keys to active)
    // ----------------------------------------------------------------
    // 1. Enter 'keys'
    await filterByText(page, 'keys');
    await pressKey(page, 'l'); // Enter BEFORE clearing filter
    await clearFilter(page);

    // 2. Reveal hidden files (.) if needed
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }

    // 3. Select all 3 keys using Ctrl+A (robust)
    await pressKey(page, 'Ctrl+A');

    // 4. Cut (x)
    await pressKey(page, 'x');

    // 5. Navigate to 'active'
    await navigateLeft(page, 1); // Leave keys
    await filterByText(page, 'active');
    await navigateRight(page, 1); // Enter BEFORE clearing filter
    await clearFilter(page);

    // 6. Paste (p)
    await pressKey(page, 'p');
    await assertTask(page, '2/4', testInfo.outputDir, 'phase2_keys');

    // PHASE 3: Activate Uplink (Delete V1, Activate V2)
    // ----------------------------------------------------------------
    // We are already in 'active'

    // 1. Delete uplink_v1.conf
    await filterByText(page, 'uplink_v1');
    await pressKey(page, 'Space'); // Select it
    await pressKey(page, 'D'); // Permanent delete
    await pressKey(page, 'y');
    await clearFilter(page);

    // 2. Rename uplink_v2.conf to uplink_active.conf
    await filterByText(page, 'uplink_v2');
    await renameItem(page, 'uplink_active.conf');
    await clearFilter(page);

    await assertTask(page, '3/4', testInfo.outputDir, 'phase3_active');

    // PHASE 4: Activate Payload (Rename & Move)
    // ----------------------------------------------------------------
    // 1. Go to training_data
    await navigateLeft(page, 1); // Leave active
    await filterByText(page, 'training_data');
    await navigateRight(page, 1); // Enter BEFORE clearing filter
    await clearFilter(page);

    // 2. Rename exfil_04.log to payload.py
    await filterByText(page, 'exfil_04');
    await renameItem(page, 'payload.py');
    await clearFilter(page);

    // 3. Select payload.py and Cut (x)
    await filterByText(page, 'payload.py');
    await pressKey(page, 'x');
    await clearFilter(page);

    // 4. Navigate to 'active'
    await navigateLeft(page, 1); // Leave training_data
    await filterByText(page, 'active');
    await navigateRight(page, 1); // Enter BEFORE clearing filter
    await clearFilter(page);

    // 5. Paste (p)
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'phase4_complete');

    await waitForMissionComplete(page);
  });
});
