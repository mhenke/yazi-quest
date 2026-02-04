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
  goParent,
  renameItem,
  enterDirectory,
  filterAndSelect,
  confirmMission,
  deleteItem,
  expectClipboard,
  expectCurrentDir,
  areHiddenFilesVisible,
  navigateRight,
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
  test.setTimeout(120000);

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
    await filterAndSelect(page, 'nodes'); // Robustly select nodes directory
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

  // Level 14: STERILIZATION
  test('Level 14: STERILIZATION - permanently deletes all user data', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 14, { intro: false });

    // Task 1 & 2: l, ctrl+a, x, gc, l, p, then gc, x, gt, p
    await test.step('Task 1 & 2: Secure and Move Vault', async () => {
      // Step 1: l, ctrl+a, x, gc, l, p
      await pressKey(page, 'l'); // Enters central_relay
      await pressKeys(page, ['Control+a', 'x']); // Cut all keys
      await page.waitForTimeout(DEFAULT_DELAY);

      await gotoCommand(page, 'c'); // gc: go to config
      await pressKey(page, 'l'); // Enters vault
      await pressKey(page, 'p'); // Pastes keys
      await page.waitForTimeout(DEFAULT_DELAY);

      // Step 2: gc, x, gt, p
      await gotoCommand(page, 'c'); // gc: go to config
      await pressKey(page, 'x'); // Cut vault directory
      await gotoCommand(page, 't'); // gt: go to /tmp
      await pressKey(page, 'p'); // Paste vault
      await page.waitForTimeout(DEFAULT_DELAY);

      await assertTask(page, '2/5', testInfo.outputDir, 'task2_vault_moved');
    });

    // Task 3: gh, a sys_cache_dump/, a project_chimera/, a neural_training_set/
    await test.step('Task 3: Create decoys', async () => {
      await gotoCommand(page, 'h');
      await clearFilter(page);
      await addItem(page, 'sys_cache_dump/');
      await addItem(page, 'project_chimera/');
      await addItem(page, 'neural_training_set/');

      await assertTask(page, '3/5', testInfo.outputDir, 'task3_decoys');
    });

    // Task 4: Delete visible directories (workspace, media, datastore, incoming)
    await test.step('Task 4: Delete all directories', async () => {
      await gotoCommand(page, 'h');
      await clearFilter(page);

      // Select only the original visible directories to delete (NOT decoys or hidden files)
      // Task requires deleting: workspace, media, datastore, incoming
      // Use keepFilter=true on ALL to preserve selections (Escape clears both filter AND selections)
      const toDelete = ['workspace', 'media', 'datastore', 'incoming'];
      for (const dir of toDelete) {
        await filterAndSelect(page, dir, { keepFilter: true });
      }

      // Delete without clearing filter first (Escape would clear selections)
      await pressKey(page, 'Shift+D'); // Permanent delete
      await page.waitForTimeout(500);
      await pressKey(page, 'y'); // Confirm
      await page.waitForTimeout(DEFAULT_DELAY);

      await assertTask(page, '4/5', testInfo.outputDir, 'task4_delete_visible');
    });

    // Task 5: Delete hidden .config directory
    await test.step('Task 5: Delete hidden directories', async () => {
      await gotoCommand(page, 'h');
      await clearFilter(page);

      // Toggle hidden files to make .config visible
      await pressKey(page, '.');
      await page.waitForTimeout(DEFAULT_DELAY);

      // Select and delete .config
      await filterByText(page, '.config');
      await page.waitForTimeout(200);
      await pressKey(page, ' '); // Select
      await clearFilter(page);

      await pressKey(page, 'Shift+D'); // Permanent delete
      await page.waitForTimeout(500);
      await pressKey(page, 'y'); // Confirm
      await page.waitForTimeout(DEFAULT_DELAY);

      await assertTask(page, '5/5', testInfo.outputDir, 'task5_delete_hidden');

      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(1000);
      await confirmMission(page, 'STERILIZATION');
    });
  });

  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`));
    await startLevel(page, 15, { intro: false });

    // Task 1: Enter vault
    await test.step('Task 1: Enter vault', async () => {
      // Should start in ~
      await gotoCommand(page, 't'); // gt: go to /tmp
      await enterDirectory(page, 'vault');
      await clearFilter(page);

      await assertTask(page, '1/5', testInfo.outputDir, 'phase1_vault');
    });

    // Task 2: Move keys to active directory
    await test.step('Task 2: Assemble Identity', async () => {
      // Show hidden files to see the keys
      await pressKey(page, '.');
      await clearFilter(page);

      // Search for .key files (using regex to avoid honeypot)
      await search(page, '\\.key$');
      await page.waitForTimeout(1000); // Wait for search results
      await pressKeys(page, ['Control+a', 'x']);
      await page.waitForTimeout(DEFAULT_DELAY);
      await clearFilter(page);

      // Enter active directory and paste
      await enterDirectory(page, 'active');
      await pressKey(page, 'p');
      await page.waitForTimeout(DEFAULT_DELAY);

      // Toggle hidden files back off to avoid Protocol Violation
      await pressKey(page, '.');
      await page.waitForTimeout(DEFAULT_DELAY);

      await assertTask(page, '2/5', testInfo.outputDir, 'phase2_keys');
    });

    // Task 3: Activate Uplink
    await test.step('Task 3: Activate Uplink', async () => {
      // Delete uplink_v1.conf
      await filterAndSelect(page, 'uplink_v1.conf');
      await deleteItem(page, { permanent: true, confirm: true });
      await page.waitForTimeout(DEFAULT_DELAY);

      // Rename uplink_v2.conf to uplink_active.conf
      await filterAndSelect(page, 'uplink_v2.conf');
      await pressKey(page, 'r'); // Rename
      await page.waitForTimeout(DEFAULT_DELAY);

      const renameInput = page.getByTestId('rename-input');
      await expect(renameInput).toBeVisible();
      await renameInput.fill('uplink_active.conf');
      await pressKey(page, 'Enter');
      await page.waitForTimeout(500);

      await assertTask(page, '3/5', testInfo.outputDir, 'phase3_active');
    });

    // Task 4: Activate Payload (Move exfil_04.log from training_data -> active/payload.py)
    await test.step('Task 4: Activate Payload', async () => {
      // Navigate to training_data
      await goParent(page);
      await enterDirectory(page, 'training_data');

      // Cut exfil_04.log
      await filterAndSelect(page, 'exfil_04.log');
      await pressKey(page, 'x');
      await page.waitForTimeout(DEFAULT_DELAY);

      // Go back to active and paste
      await goParent(page);
      await enterDirectory(page, 'active');
      await pressKey(page, 'p');
      await page.waitForTimeout(DEFAULT_DELAY);

      // Rename to payload.py
      await filterAndSelect(page, 'exfil_04.log');
      await renameItem(page, 'payload.py');
      await page.waitForTimeout(500);

      await assertTask(page, '5/5', testInfo.outputDir, 'phase4_payload');
    });

    // All 5 tasks complete - use Shift+Enter to auto-fix any protocol violations and complete
    // Note: Hidden files may still be visible, causing a Protocol Violation modal.
    // Shift+Enter auto-fixes this and triggers mission completion.
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(500);

    // If Protocol Violation modal appeared, Shift+Enter dismissed it. Press again to complete.
    // Check if mission complete dialog is visible, if not press Shift+Enter again
    const missionComplete = page.locator('text=MISSION COMPLETE');
    if (!(await missionComplete.isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(500);
    }

    await confirmMission(page, 'TRANSMISSION PROTOCOL');
  });
});

test.describe('Level Advancement with Shift+Enter', () => {
  test('verifies Shift+Enter properly advances from Level 14 to Level 15', async ({ page }) => {
    await startLevel(page, 14, { intro: false, extraParams: { tasks: 'all' } });
    await page.waitForTimeout(500);

    // Press Shift+Enter to advance
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(1000);

    // Verify transition to Level 15
    await expect(page.getByText('TRANSMISSION').first()).toBeVisible({ timeout: 10000 });
    await expectCurrentDir(page, '/tmp');
  });
});
