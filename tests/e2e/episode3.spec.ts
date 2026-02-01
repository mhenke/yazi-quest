import { test, expect, type Page, type TestInfo } from '@playwright/test';
import {
  startLevel,
  assertLevel,
  pressKey,
  pressKeys,
  gotoCommand,
  waitForMissionComplete,
  ensureCleanState,
  assertTask,
  filterByText,
  clearFilter,
  search,
  addItem,
  filterAndSelect,
  confirmMission,
  deleteItem,
  renameItem,
  expectClipboard,
  expectCurrentDir,
  areHiddenFilesVisible,
  navigateRight,
  navigateLeft,
  navigateDown,
  enterDirectory,
  sortCommand,
  dismissAlertIfPresent,
  expectNarrativeThought,
  DEFAULT_DELAY,
} from './utils';

// Helper to handle Level 12 threat scenarios
async function handleLevel12Threat(
  page: Page,
  scenario: { id: string; threat: string | null; location: string | null }
) {
  await dismissAlertIfPresent(page, /Threat Detected/i);
  if (!scenario.threat) return;

  if (scenario.location === 's') {
    await gotoCommand(page, 'r');
    await search(page, 'scan_');
    await expect(page.locator('[data-testid^="file-scan_"]')).toHaveCount(3, { timeout: 2000 });
    await pressKey(page, 'Ctrl+a');
    await page.waitForTimeout(DEFAULT_DELAY);
    await deleteItem(page, { confirm: true });
    await dismissAlertIfPresent(page, /Threat Detected/i);
  } else {
    await gotoCommand(page, scenario.location as 'c' | 'w' | 'i');
    await filterByText(page, scenario.threat);
    await deleteItem(page, { confirm: true });
    await page.waitForTimeout(DEFAULT_DELAY);
  }
  await clearFilter(page);
  await dismissAlertIfPresent(page, /Protocol Violation/i);
}

// Helper for Level 12 common path (Discover Identity -> Cut -> Nav -> Paste)
async function runLevel12CommonPath(
  page: Page,
  testInfo: TestInfo,
  scenario: { id: string; threat: string | null }
) {
  const totalTasks = scenario.threat ? 5 : 4; // 4 base tasks + 1 threat task if applicable

  // 1. Discover Identity
  await gotoCommand(page, 'w');
  const navTaskNum = scenario.threat ? 2 : 1;
  await assertTask(
    page,
    `${navTaskNum}/${totalTasks}`,
    testInfo.outputDir,
    `nav_workspace_${scenario.id}`
  );

  await pressKey(page, '.'); // Show hidden
  await filterByText(page, 'identity');
  await expect(page.getByTestId('file-.identity.log.enc')).toBeVisible({ timeout: 2000 });
  await page.waitForTimeout(DEFAULT_DELAY);
  await pressKey(page, 'g');
  await pressKey(page, 'g');
  await page.waitForTimeout(DEFAULT_DELAY);

  // Simulation of reading
  for (let i = 0; i < 5; i++) await pressKey(page, 'Shift+j');

  const discoverTaskNum = scenario.threat ? 3 : 2;
  await assertTask(page, `${discoverTaskNum}/${totalTasks}`, testInfo.outputDir);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(DEFAULT_DELAY);
  await pressKey(page, '.'); // Hide hidden

  // 2. Cut systemd-core
  await filterAndSelect(page, 'systemd-core');
  await dismissAlertIfPresent(page, /Protocol Violation/i);
  await pressKey(page, 'x');

  // Verify clipboard updated
  await expectClipboard(page, 'MOVE');

  const cutTaskNum = scenario.threat ? 4 : 3;
  await assertTask(page, `${cutTaskNum}/${totalTasks}`, testInfo.outputDir);

  // 3. Navigate to /daemons
  await gotoCommand(page, 'r');
  await enterDirectory(page, 'daemons');

  const navDaemonsTaskNum = scenario.threat ? 5 : 4;
  await assertTask(page, `${navDaemonsTaskNum}/${totalTasks}`, testInfo.outputDir);

  // 4. Paste and finish
  await pressKey(page, 'p');
  await enterDirectory(page, 'systemd-core');

  await expectNarrativeThought(page, 'The loops are closing');

  // Verify level completion counter (total/total)
  await expect(page.getByTestId('task-counter')).toHaveText(/Tasks:\s*(\d+)\/\1/, {
    timeout: 5000,
  });

  await waitForMissionComplete(page);
}

test.describe('Episode 3: MASTERY', () => {
  test.beforeEach(async ({ page: _page }) => {
    // Enable console logging for debugging
    _page.on('console', (msg) => console.log('BROWSER:', msg.text()));
  });
  // Level 11: DAEMON RECONNAISSANCE
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await startLevel(page, 11, { intro: false });

    // Task 1: gr, j, l, . then s, type ".service", enter
    await gotoCommand(page, 'r');
    await navigateDown(page, 1);
    await navigateRight(page, 1); // Enter daemons
    await pressKey(page, '.'); // Show hidden
    await search(page, '\\.service$');
    // Wait for search results to populate (7 .service files now in Level 11)
    await expect(page.locator('[data-testid^="file-"][data-testid$=".service"]')).toHaveCount(7);
    await assertTask(page, '1/4', testInfo.outputDir, 'search_complete');

    // Task 2: , then Shift+M
    await sortCommand(page, 'Shift+M');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: space twice and x (Exfiltrate)
    await pressKeys(page, [' ', ' ', 'x']);
    await expectClipboard(page, 'MOVE: 2');
    await assertTask(page, '3/4', testInfo.outputDir, 'exfiltrate_files');

    // Task 4: escape, press (.) and then ,n and finally gw, l, p
    await pressKeys(page, ['Escape', '.']); // Toggle hidden back
    await sortCommand(page, 'n'); // Natural sort

    await gotoCommand(page, 'w');
    await navigateRight(page, 1); // Enter systemd-core
    await expectCurrentDir(page, 'systemd-core');

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
      test.setTimeout(90000); // Increased timeout for stability
      await startLevel(page, 12, {
        intro: false,
        extraParams: { scenario: `scen-${scenario.id}` },
      });

      await handleLevel12Threat(page, scenario);
      await ensureCleanState(page);
      await runLevel12CommonPath(page, testInfo, scenario);
    });
  }

  // Level 13: DISTRIBUTED CONSCIOUSNESS
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys', async ({
    page,
  }, testInfo) => {
    // Standard viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    test.setTimeout(60000);
    await startLevel(page, 13, { intro: false });
    await assertLevel(page, '13');

    // PHASE 1: ACQUIRE
    // ----------------------------------------------------------------
    // User sequence: gr, j*4, l, ., s, '\.key$', enter, Ctrl+a, x, .
    await gotoCommand(page, 'r'); // gr - go to root
    await pressKeys(page, ['j', 'j', 'j', 'j']); // j*4 - navigate down to nodes
    await pressKey(page, 'l'); // Enter nodes directory
    await pressKey(page, '.'); // Show hidden files
    await search(page, '\\.key$'); // Search for .key files
    await page.waitForTimeout(DEFAULT_DELAY);

    await pressKeys(page, ['Ctrl+a', 'x']); // Select all and cut
    await expectClipboard(page, 'MOVE: 3'); // Should have 3 files (excluding honeypot via game logic)
    await pressKey(page, '.'); // Toggle hidden off
    await pressKey(page, 'Escape'); // Clear search
    await assertTask(page, '1/4', testInfo.outputDir, 'phase1_acquired');

    // PHASE 2: RELAY
    // ----------------------------------------------------------------
    await pressKey(page, 'Escape'); // Clear search
    await gotoCommand(page, 'w'); // Warp to workspace
    await expectCurrentDir(page, 'workspace');

    // Ensure hidden visible
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }

    await filterByText(page, '.identity'); // Select identity file

    // Preview (no scroll needed per logic update)
    await page.waitForTimeout(DEFAULT_DELAY);
    await assertTask(page, '2/4', testInfo.outputDir, 'phase3_identity_read');

    await pressKey(page, 'Escape'); // Clear '.identity' filter
    await addItem(page, 'central_relay/'); // Create directory
    await assertTask(page, '3/4', testInfo.outputDir, 'phase2_relay_created');

    // PHASE 4: SYNC
    // ----------------------------------------------------------------

    await filterByText(page, 'central_relay'); // Filter to select the relay directory
    // At 3/4 tasks, protocol violation requires manual fix (not auto-fix)
    await dismissAlertIfPresent(page, /Protocol Violation/i); // Press Escape
    await clearFilter(page); // Manually clear the filter
    await navigateRight(page, 1); // Enter relay
    await pressKey(page, 'p'); // Paste

    // Task 4: Verify sync (4/4) - Increased timeout for state update
    await expect(page.getByTestId('task-counter')).toHaveText(/Tasks:\s*4\/\d+/, { timeout: 2000 });

    // Auto-fix protocol violation by toggling hidden files off
    await page.waitForTimeout(500); // Wait for modal
    await page.keyboard.press('.'); // Toggle hidden files off
    await page.waitForTimeout(DEFAULT_DELAY);

    await waitForMissionComplete(page);
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 14, { intro: false });

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
      await enterDirectory(page, '.config');
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

      // Ensure selection is registered before deletion
      await page.waitForTimeout(DEFAULT_DELAY * 2);

      // Execute Permanent Delete (Shift+D)
      await deleteItem(page, { permanent: true, confirm: true });

      await page.waitForTimeout(DEFAULT_DELAY);
      // Verify targets are gone
      for (const target of targets) {
        await expect(page.getByTestId(`file-${target}`)).not.toBeVisible({ timeout: 1000 });
      }

      await assertTask(page, '4/5', testInfo.outputDir, 'task4_purge_data');
    });

    await test.step('Task 5: Delete .config directory', async () => {
      // .config can only be deleted after visible dirs are purged
      await filterAndSelect(page, '.config');
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '5/5', testInfo.outputDir, 'task5_purge_config');
    });

    // Auto-fix protocol violation (hidden files) with Shift+Enter, then confirm mission
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(200);
    await confirmMission(page, 'EVIDENCE PURGE - WORKSPACE');
  });

  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    // Override max keystrokes to prevent game over
    await page.evaluate(() => {
      // @ts-expect-error: Custom test function
      if (window.resetGame) window.resetGame();
    });

    await startLevel(page, 15, { intro: false });
    await expectNarrativeThought(
      page,
      'The guest partition is gone. There is only the gauntlet now.'
    );

    // PHASE 1: Enter Vault
    await enterDirectory(page, 'vault');
    await assertTask(page, '1/4', testInfo.outputDir, 'phase1_vault');

    // PHASE 2: Assemble Identity (Move keys to active)
    // 1. Enter 'keys'
    await enterDirectory(page, 'keys');

    // 2. Reveal hidden files (.) if needed
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }

    // 3. Select all 3 keys using Ctrl+A (robust)
    await pressKey(page, 'Ctrl+a');

    // 4. Cut (x)
    await pressKey(page, 'x');

    // 5. Navigate to 'active'
    await navigateLeft(page, 1); // Leave keys
    await filterByText(page, 'active');
    await clearFilter(page); // Clear filter before entering
    await navigateRight(page, 1); // Enter active directory

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
    await assertTask(page, '2/4', testInfo.outputDir, 'phase3_part1_v1_deleted'); // Intermediate check

    // 2. Rename uplink_v2.conf to uplink_active.conf
    await filterByText(page, 'uplink_v2');
    await renameItem(page, 'uplink_active.conf');
    await clearFilter(page);

    await assertTask(page, '3/4', testInfo.outputDir, 'phase3_active');

    // PHASE 4: Activate Payload (Rename & Move)
    // ----------------------------------------------------------------
    // Disable hidden files if active to prevent protocol violations during rename
    if (await areHiddenFilesVisible(page)) {
      await pressKey(page, '.');
    }

    // 1. Go to training_data
    await navigateLeft(page, 1); // Leave active
    await filterByText(page, 'training_data');
    await clearFilter(page);
    await navigateRight(page, 1); // Enter training_data

    // 2. Rename exfil_04.log to payload.py
    await filterByText(page, 'exfil_04');
    await renameItem(page, 'payload.py');
    await clearFilter(page);

    // 3. Select payload.py and Cut (x)
    await filterByText(page, 'payload.py');
    await pressKey(page, 'Space');
    await pressKey(page, 'x');
    await clearFilter(page);

    // 4. Navigate to 'active'
    await navigateLeft(page, 1); // Leave training_data
    await filterAndSelect(page, 'active');
    await clearFilter(page);

    // 5. Paste (p)
    await pressKey(page, 'p');
    // Task 4: Verify payload in active (4/4? No, check logic)
    // Wait, let's verify if 'verify-training' is the target.
    // Logic: verify-training checks for payload.py in active.
    await assertTask(page, '4/4', testInfo.outputDir, 'phase4_payload_active');

    // Auto-fix protocol violation (e.g. Hidden files or Filter)
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(DEFAULT_DELAY);

    await waitForMissionComplete(page);
  });

  test.describe('Level Advancement with Shift+Enter', () => {
    test('verifies Shift+Enter properly advances from Level 14 to Level 15', async ({ page }) => {
      // Start at Level 14 and complete it
      await startLevel(page, 14, { intro: false });

      // Complete all tasks for Level 14
      await gotoCommand(page, 'h');
      await assertTask(page, '1/5', 'temp', 'task1_home');

      // Task 2: Move vault to /tmp
      if (!(await areHiddenFilesVisible(page))) {
        await pressKey(page, '.');
      }
      await expect(page.getByText('HIDDEN: ON')).toBeVisible();

      await filterAndSelect(page, '.config');
      await clearFilter(page);
      await expectCurrentDir(page, '.config');

      await filterByText(page, 'vault');
      await expect(page.getByTestId('file-vault')).toBeVisible();
      await pressKey(page, 'x');
      await clearFilter(page);

      await gotoCommand(page, 't');
      await expectCurrentDir(page, 'tmp');
      await pressKey(page, 'p');
      await assertTask(page, '2/5', 'temp', 'task2_move_vault');

      // Task 3: Create decoys
      await gotoCommand(page, 'h');
      await expectCurrentDir(page, '~');
      await addItem(page, 'decoy_1/');
      await addItem(page, 'decoy_2/');
      await addItem(page, 'decoy_3/');
      await assertTask(page, '3/5', 'temp', 'task3_decoys');

      // Task 4: Delete original directories
      if (!(await areHiddenFilesVisible(page))) {
        await pressKey(page, '.');
      }

      const targets = ['incoming', 'media', 'workspace', 'datastore'];

      for (const target of targets) {
        await filterAndSelect(page, target);
      }

      await page.waitForTimeout(DEFAULT_DELAY * 2);
      await deleteItem(page, { permanent: true, confirm: true });

      await page.waitForTimeout(DEFAULT_DELAY);
      for (const target of targets) {
        await expect(page.getByTestId(`file-${target}`)).not.toBeVisible({ timeout: 1000 });
      }

      await assertTask(page, '4/5', 'temp', 'task4_purge_data');

      // Task 5: Delete .config directory
      await filterAndSelect(page, '.config');
      await deleteItem(page, { permanent: true, confirm: true });
      await assertTask(page, '5/5', 'temp', 'task5_purge_config');

      // Use Shift+Enter to auto-fix violations (like HIDDEN: ON) and advance
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(DEFAULT_DELAY);

      // Verify we've moved to Level 15 by checking for Level 15's initial conditions
      await expect(page.getByText('TRANSMISSION PROTOCOL')).toBeVisible({ timeout: 10000 });

      // Verify that the mission complete dialog is no longer visible
      await expect(page.getByTestId('mission-complete')).not.toBeVisible();
    });
  });
});
