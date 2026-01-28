import { test, expect, type Page, type TestInfo } from '@playwright/test';
import {
  startLevel,
  assertLevel,
  pressKey,
  pressKeys,
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
  confirmMission,
  deleteItem,
  renameItem,
  expectClipboard,
  expectCurrentDir,
  areHiddenFilesVisible,
  navigateRight,
  navigateLeft,
  navigateDown,
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
    await pressKey(page, 'Ctrl+A');
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
  const totalTasks = scenario.threat ? 6 : 5;

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

  const cutTaskNum = scenario.threat ? 4 : 3;
  await assertTask(page, `${cutTaskNum}/${totalTasks}`, testInfo.outputDir);

  // 3. Navigate to /daemons
  await gotoCommand(page, 'r');
  await filterByText(page, 'daemons');
  await navigateRight(page, 1);
  await dismissAlertIfPresent(page, /Protocol Violation/i);

  const navDaemonsTaskNum = scenario.threat ? 5 : 4;
  await assertTask(page, `${navDaemonsTaskNum}/${totalTasks}`, testInfo.outputDir);

  // 4. Paste and finish
  await pressKey(page, 'p');
  await filterByText(page, 'systemd-core');
  await navigateRight(page, 1);
  await dismissAlertIfPresent(page, /Protocol Violation/i);

  await expectNarrativeThought(page, 'The loops are closing');
  await assertTask(
    page,
    `${totalTasks}/${totalTasks}`,
    testInfo.outputDir,
    `mission_complete_${scenario.id}`
  );
  await waitForMissionComplete(page);
}

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await startLevel(page, 11, { intro: false });

    // Task 1: gr, j, l, . then s, type ".service", enter
    await gotoCommand(page, 'r');
    await navigateDown(page, 1);
    await navigateRight(page, 1); // Enter daemons
    await pressKey(page, '.'); // Show hidden
    await search(page, '.service');
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
    await gotoCommand(page, 'r');
    await filterByText(page, 'nodes');
    await pressKey(page, 'l');
    await clearFilter(page);

    await pressKey(page, '.'); // Show hidden
    await pressKey(page, 's'); // Search
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(DEFAULT_DELAY);
    await expect(page.locator('[data-testid^="file-"][data-testid$=".key"]')).toHaveCount(3, {
      timeout: 500,
    });

    await pressKeys(page, ['Ctrl+A', 'x']); // Select all then Cut
    await expectClipboard(page, 'MOVE: 3');
    await clearFilter(page); // Clear filter after action per expert advice
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

    await navigateRight(page, 1); // Enter relay
    await clearFilter(page);
    await pressKey(page, 'p'); // Paste

    // Task 4: Verify sync (4/4) - Increased timeout for state update
    await expect(page.getByTestId('task-counter')).toHaveText(/Tasks:\s*4\/\d+/, { timeout: 2000 });

    // Protocol violations (Hidden/Filter) only allow Shift+Enter dismissal IF tasks are complete.
    // Ensure we aggressively dismiss any blocking modals
    await dismissAlertIfPresent(page, /Protocol Violation/i);
    await page.waitForTimeout(200);

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

      // Batch selection loop
      for (const target of targets) {
        await pressKey(page, 'f');
        await typeText(page, target);
        await page.keyboard.press('Enter'); // Confirm filter

        // Wait for at least one match
        const fileRow = page.getByTestId(`file-${target}`).first();
        await expect(fileRow).toBeVisible();
        await page.waitForTimeout(DEFAULT_DELAY);

        // Check for duplicates (e.g. 'workspace' might appear twice due to glitch)
        const matchCount = await page.getByTestId(`file-${target}`).count();

        // Select ALL matches
        for (let i = 0; i < matchCount; i++) {
          await page.keyboard.press(' ');
          await page.waitForTimeout(DEFAULT_DELAY / 2);
        }

        // Verify at least one is marked
        await expect(fileRow).toContainText('[VIS]');

        // Clear filter
        await page.keyboard.press('Escape');
        await page.waitForTimeout(DEFAULT_DELAY);
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

    // Auto-fix protocol violation (hidden files) to see Success Toast
    await dismissAlertIfPresent(page, /Protocol Violation/i);
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
    await assertTask(page, '2/4', testInfo.outputDir, 'phase3_part1_v1_deleted'); // Intermediate check

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
    // Task 4: Verify payload in active (4/4? No, check logic)
    // Wait, let's verify if 'verify-training' is the target.
    // Logic: verify-training checks for payload.py in active.
    await assertTask(page, '4/4', testInfo.outputDir, 'phase4_payload_active');

    // Protocol violations (Hidden/Filter) only allow Shift+Enter dismissal IF tasks are complete.
    // Ensure we aggressively dismiss any blocking modals
    await dismissAlertIfPresent(page, /Protocol Violation/i);
    await page.waitForTimeout(200);

    await waitForMissionComplete(page);
  });
});
