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
  expectClipboard,
  expectCurrentDir,
  areHiddenFilesVisible,
  navigateRight,
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
  // Level 11: DAEMON RECONNAISSANCE
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await startLevel(page, 11, { intro: false });

    // Task 1: gr, j, l, . then s, type ".service", enter
    await gotoCommand(page, 'r');
    await navigateDown(page, 1);
    await navigateRight(page, 1); // Enter daemons
    await pressKey(page, '.'); // Show hidden
    await search(page, '\\.service$');
    // Wait for search results to populate (8 .service files now in Level 11)
    await expect(page.locator('[data-testid^="file-"][data-testid$=".service"]')).toHaveCount(8);
    await assertTask(page, '1/4', testInfo.outputDir, 'search_complete');

    // Task 2: , then Shift+M
    await sortCommand(page, 'Shift+M');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Exfiltrate two legacy files.
    // Use precise search to isolate the legacy files, ignoring recent honeypots.
    await search(page, '(ghost-handler|backup-archive)\\.service$');

    // Select all results (should be exactly 2)
    await pressKey(page, 'Control+a');

    // Sort logic is still required for Task 2
    await sortCommand(page, 'Shift+M');

    // Cut selected
    await pressKey(page, 'x');

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

    // Task 1: Secure fragments in vault
    await test.step('Task 1: Secure fragments in vault', async () => {
      await expectCurrentDir(page, 'workspace');
      await filterByText(page, 'central_relay');
      await navigateRight(page, 1);
      await clearFilter(page);

      if (!(await areHiddenFilesVisible(page))) {
        await pressKey(page, '.');
      }
      await pressKey(page, 'Ctrl+A');
      await pressKey(page, 'x'); // Cut keys
      await clearFilter(page);

      await pressKey(page, 'h'); // back to workspace
      await expectCurrentDir(page, 'workspace');
      await clearFilter(page);
      await pressKey(page, 'h'); // back to ~
      await expectCurrentDir(page, '~'); // explicit verification
      await clearFilter(page);
      await enterDirectory(page, '.config');
      await enterDirectory(page, 'vault');
      await pressKey(page, 'p'); // Paste keys
      await assertTask(page, '1/6', testInfo.outputDir, 'task1_secure_done');
      await clearFilter(page);
    });

    // Task 2: Access guest partition
    await test.step('Task 2: Access the ~ partition', async () => {
      await pressKey(page, 'h'); // back to .config
      await expectCurrentDir(page, '.config');
      await clearFilter(page);
      await pressKey(page, 'h'); // back to ~
      await expectCurrentDir(page, '~');
      await clearFilter(page);
      await assertTask(page, '2/6', testInfo.outputDir, 'task2_home');
    });

    await test.step('Task 3: Move vault to /tmp', async () => {
      await enterDirectory(page, '.config');
      await filterByText(page, 'vault');
      await pressKey(page, 'x'); // Cut
      await clearFilter(page);
      await gotoCommand(page, 't');
      await pressKey(page, 'p'); // Paste
      await clearFilter(page);
      await assertTask(page, '3/6', testInfo.outputDir, 'task3_move_vault');
    });

    await test.step('Task 4: Create decoys', async () => {
      await pressKey(page, 'h'); // Back to root of /tmp or wherever we were
      // Wait, Task 3 pasted to /tmp. We are likely in /tmp.
      // Task 4 says "Deploy three decoy sectors in '~'".
      // So we need to go to Home.
      await gotoCommand(page, 'h'); // use gh for Home jump
      await expectCurrentDir(page, '~');
      await addItem(page, 'decoy_1/');
      await addItem(page, 'decoy_2/');
      await addItem(page, 'decoy_3/');
      await assertTask(page, '4/6', testInfo.outputDir, 'task4_decoys');
    });

    await test.step('Task 5: Delete original directories', async () => {
      const targets = ['incoming', 'media', 'workspace', 'datastore'];
      for (const target of targets) {
        await filterAndSelect(page, target);
      }
      await deleteItem(page, { permanent: true, confirm: true });
      await clearFilter(page);
      await assertTask(page, '5/6', testInfo.outputDir, 'task5_purge_data');
    });

    await test.step('Task 6: Delete .config directory', async () => {
      await filterAndSelect(page, '.config');
      await deleteItem(page, { permanent: true, confirm: true });
      await clearFilter(page);
      await assertTask(page, '6/6', testInfo.outputDir, 'task6_purge_config');
    });

    // Auto-fix protocol violation (hidden files) with Shift+Enter
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(200);
    await confirmMission(page, 'STERILIZATION');
  });

  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await startLevel(page, 15, { intro: false });

    // PHASE 1: Enter Vault
    await filterByText(page, 'vault');
    await navigateRight(page, 1);
    await clearFilter(page);
    await assertTask(page, '1/5', testInfo.outputDir, 'phase1_vault');

    // PHASE 2: Assemble Identity (Move keys to active)
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }
    await filterByText(page, '.key');
    await pressKey(page, 'Ctrl+A');
    await pressKey(page, 'x');
    await clearFilter(page);

    await filterByText(page, 'active');
    await navigateRight(page, 1);
    await clearFilter(page);
    await pressKey(page, 'p');
    await clearFilter(page);
    await assertTask(page, '2/5', testInfo.outputDir, 'phase2_keys');

    // PHASE 3: Activate Uplink (Delete V1, Activate V2)
    // We use Shift+P for overwrite based on the logic I implemented earlier
    await filterByText(page, 'uplink_v2.conf');
    await pressKey(page, 'x');
    await clearFilter(page);
    await filterByText(page, 'uplink_v1.conf');
    await pressKey(page, 'Shift+P');
    await clearFilter(page);
    await page.waitForTimeout(500);
    await assertTask(page, '3/5', testInfo.outputDir, 'phase3_active');

    // PHASE 4: Activate Payload
    await filterByText(page, 'payload.py');
    await expect(page.getByTestId('file-payload.py')).toBeVisible();
    await assertTask(page, '4/5', testInfo.outputDir, 'phase4_payload');

    // PHASE 5: Finalize
    await page.keyboard.press('Shift+Enter');
    await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('mission-complete')).toBeVisible();
  });
});

test.describe('Level Advancement with Shift+Enter', () => {
  // Skipped due to environment state flakiness in E2E runner (clipboard/filter state consistency).
  // The core logic of Level 14 and 15 is covered by their respective individual tests.
  // The transition mechanic is verified via waitForMissionComplete in other tests.
  test('verifies Shift+Enter properly advances from Level 14 to Level 15', async ({ page }) => {
    // Start at Level 14 and complete it
    await startLevel(page, 14, { intro: false });
    await clearFilter(page);
    await expectCurrentDir(page, 'workspace');

    // Task 1: Secure fragments in vault
    await filterByText(page, 'central_relay');
    await navigateRight(page, 1);
    await expectCurrentDir(page, 'central_relay');

    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }
    await pressKey(page, 'Ctrl+A');
    await pressKey(page, 'x');

    // Navigate to .config/vault
    await pressKey(page, 'h'); // space to workspace
    await expectCurrentDir(page, 'workspace');
    await clearFilter(page);
    await pressKey(page, 'h'); // space to home (guest)
    await expectCurrentDir(page, '~');
    await assertTask(page, '1/6', 'temp', 'task1_secure_not_pasted'); // Doesn't complete task yet

    await enterDirectory(page, '.config');
    await enterDirectory(page, 'vault');
    await pressKey(page, 'p');
    await assertTask(page, '1/6', 'temp', 'task1_secure_done');
    await clearFilter(page);

    // Task 2: nav-guest (navigate up to ~)
    await pressKey(page, 'h'); // back to .config
    await expectCurrentDir(page, '.config');
    await clearFilter(page);
    await pressKey(page, 'h'); // back to ~
    await expectCurrentDir(page, '~');
    await assertTask(page, '2/6', 'temp', 'task2_home');

    // Task 3: Move vault to /tmp
    await filterByText(page, '.config');
    await navigateRight(page, 1);
    await expectCurrentDir(page, '.config');

    await page.waitForTimeout(500);

    // Ensure normal mode
    await clearFilter(page);
    await page.waitForTimeout(500);

    // Select vault (Normal mode) and Cut
    await filterByText(page, 'vault');

    // Ensure specific visibility
    const vaultFile = page.getByTestId('file-vault');
    await expect(vaultFile).toBeVisible({ timeout: 5000 });

    // Use explicit Space selection if filter acts as quick-select
    await pressKey(page, 'Space');
    await pressKey(page, 'x'); // Cut
    await clearFilter(page);

    await gotoCommand(page, 't');
    await expectCurrentDir(page, 'tmp');
    await pressKey(page, 'p');
    await assertTask(page, '3/6', 'temp', 'task3_move_vault');

    // Task 4: Create decoys
    await gotoCommand(page, 'h');
    await expectCurrentDir(page, '~');
    await addItem(page, 'decoy_1/');
    await addItem(page, 'decoy_2/');
    await addItem(page, 'decoy_3/');
    await assertTask(page, '4/6', 'temp', 'task4_decoys');

    // Task 5: Delete original directories
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

    await assertTask(page, '5/6', 'temp', 'task5_purge_visible');

    // Task 6: Delete .config
    await filterAndSelect(page, '.config');
    await page.waitForTimeout(DEFAULT_DELAY);
    await deleteItem(page, { permanent: true, confirm: true });
    await assertTask(page, '6/6', 'temp', 'task6_purge_config');

    // Use Shift+Enter to auto-fix violations (like HIDDEN: ON) and advance
    await page.keyboard.press('Shift+Enter');

    // VERIFY TRANSITION TO LEVEL 15
    await expect(page.getByText('TRANSMISSION PROTOCOL')).toBeVisible({ timeout: 5000 });
    await expectCurrentDir(page, 'tmp');

    // Task 1: Find and enter vault
    await filterByText(page, 'vault');
    await navigateRight(page, 1);
    await expectCurrentDir(page, 'vault');
    await assertTask(page, '1/5', 'temp', 'task1_enter_vault');

    // Task 2: Consolidate identity fragments
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
    }

    // NO SUBFOLDER: Keys are directly in vault now
    await filterByText(page, '.key');
    await pressKey(page, 'Ctrl+A');
    await pressKey(page, 'x');

    await filterByText(page, 'active');
    await navigateRight(page, 1);
    await expectCurrentDir(page, 'active');
    await pressKey(page, 'p');
    await assertTask(page, '2/5', 'temp', 'task2_consolidate');

    // Task 3: Apply protocols (verify-configs)
    await filterByText(page, 'uplink_v2.conf');
    await pressKey(page, 'x'); // Cut v2
    await filterByText(page, 'uplink_v1.conf');
    await pressKey(page, 'Shift+P'); // Overwrite v1 with v2 -> creates uplink_active.conf (based on game logic)

    // Wait for rename/overwrite to settle
    await page.waitForTimeout(500);
    await assertTask(page, '3/5', 'temp', 'task3_configs');

    // Task 4: Execute final transmission (verify-training)
    // Navigate to payload.py
    await filterByText(page, 'payload.py');
    // Hovering/Selecting is enough for the "Execute" check in some levels,
    // but let's ensure it's selected.
    await expect(page.getByTestId('file-payload.py')).toBeVisible();
    await assertTask(page, '4/5', 'temp', 'task4_payload');

    // Task 5: Finalize (initiate-transmission) - Use Shift+Enter or similar
    await page.keyboard.press('Shift+Enter');

    // VERIFY FINAL VICTORY
    await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('mission-complete')).toBeVisible();
  });
});
