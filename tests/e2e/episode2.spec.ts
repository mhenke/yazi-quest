import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  typeText,
  assertTask,
  filterByText,
  clearFilter,
  addItem,
  ensureCleanState,
  findFZF,
  fuzzyJump,
  dismissAlertIfPresent,
  expectNarrativeThought,
  confirmMission,
  deleteItem,
  expectCurrentDir,
  enterDirectory,
  filterAndSelect,
} from './utils';

test.describe('Episode 2: FORTIFICATION', () => {
  // Level 6: BATCH OPERATIONS - Batch Select (Ctrl+A) and Recursive Search (s)
  test('Level 6: BATCH OPERATIONS - completes recursive search and batch operations', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 6, { intro: false });

    // 2) gi (g then i), then l (enter batch_logs)
    await gotoCommand(page, 'i');
    await enterDirectory(page, 'batch_logs');
    await assertTask(page, '1/5', testInfo.outputDir, 'task1');

    // 3) s, then type ".log" and press enter key
    await pressKey(page, 's');
    await typeText(page, '.log');
    await pressKey(page, 'Enter');
    await assertTask(page, '2/5', testInfo.outputDir, 'task2');

    // 4) ctrl+a, then y
    await pressKey(page, 'Control+a');
    await pressKey(page, 'y');
    // Task 3 requires clearing the search (Escape) to be marked complete
    await pressKey(page, 'Escape');
    await assertTask(page, '3/5', testInfo.outputDir, 'task3');

    // 5) gc (g then c) -- Escape is already pressed
    await gotoCommand(page, 'c');
    await assertTask(page, '3/5', testInfo.outputDir, 'after_gc');

    // 6) l (enter vault) then a and type "training_data/"
    await enterDirectory(page, 'vault');
    await addItem(page, 'training_data/');
    await assertTask(page, '4/5', testInfo.outputDir, 'task4');

    // 7) l (enter training_data) then p
    await enterDirectory(page, 'training_data');
    await pressKey(page, 'p');
    await assertTask(page, '5/5', testInfo.outputDir, 'task5');

    // Wait for mission complete dialog to appear
    await confirmMission(page, 'BATCH OPERATIONS');
  });

  // Level 7: QUANTUM BYPASS - FZF (z) and Abort (Y)
  test('Level 7: QUANTUM BYPASS - completes FZF find and clipboard abort', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 7);

    // Task 1: Jump to Root (gr)
    await gotoCommand(page, 'r');
    // Verify Task 1 completion (1/4 visible tasks initially)
    await assertTask(page, '1/4', testInfo.outputDir, 'jump_to_root');

    // Task 2: Locate 'access_token.key' using FZF find (z)
    await findFZF(page, 'access_token');

    // Verify we actually landed on the file
    const selectedFile = page.locator('[aria-current="location"]');
    await expect(selectedFile).toContainText('access_token.key');

    // Verify Task 2 completion (Locate Token)
    await assertTask(page, '2/4', testInfo.outputDir, 'locate_token');

    await pressKey(page, 'x'); // cut the file
    // Verify Task 3 completion (Stage Token)
    await assertTask(page, '3/4', testInfo.outputDir, 'stage_token');

    // Task 4: Jump to vault using Zoxide (Z -> 'vault' -> Enter)
    await fuzzyJump(page, 'vault');
    // Task 4 complete -> hidden Task 5 appears, so count becomes 4/5
    await expectNarrativeThought(page, "It's a trap. I remember the shape of this code.");
    await assertTask(page, '4/5', testInfo.outputDir, 'jump_to_vault_and_reveal_trap');

    await dismissAlertIfPresent(page); // Dismiss alert
    await page.keyboard.press('Shift+Y'); // Abort operation (Y)

    await assertTask(page, '5/5', testInfo.outputDir, 'abort_operation');

    await confirmMission(page, 'QUANTUM BYPASS');
  });

  // Level 8: DAEMON DISGUISE CONSTRUCTION - Force Overwrite (Shift+P)
  test('Level 8: DAEMON DISGUISE CONSTRUCTION - performs force overwrite', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 8, { intro: false });

    // Objective 1: Navigate to '~/workspace/systemd-core' (gw followed by l)
    // Objective 1: Navigate to '~/workspace/systemd-core' (gw followed by l)
    await gotoCommand(page, 'w');
    await enterDirectory(page, 'systemd-core');
    await assertTask(page, '1/5', testInfo.outputDir, 'nav_to_systemd');

    // Objective 2: Preview 'uplink_v1.conf' to confirm corruption (f -> type 'uplink')
    await filterByText(page, 'uplink_v1');
    await assertTask(page, '2/5', testInfo.outputDir, 'preview_corrupted');

    // Objective 3: Clear the filter (Esc x2: once for input, once for filter)
    await clearFilter(page);
    await assertTask(page, '3/5', testInfo.outputDir, 'clear_filter');

    // Objective 4: Jump to '~/.config/vault/active' (Shift+Z -> "active" -> Enter) and yank (y)
    await fuzzyJump(page, 'active');

    // Ensure we are in active directory
    await expectCurrentDir(page, 'active');

    // Select uplink_v1.conf and yank
    await pressKey(page, 'y');
    await assertTask(page, '4/5', testInfo.outputDir, 'yank_clean_file');

    // Objective 5: Return to '~/workspace/systemd-core' (Shift+H) and OVERWRITE (Shift+P)
    await pressKey(page, 'Shift+H');
    await expectCurrentDir(page, 'systemd-core');

    await pressKey(page, 'Shift+P');
    await assertTask(page, '5/5', testInfo.outputDir, 'force_overwrite');

    await confirmMission(page, 'DAEMON DISGUISE CONSTRUCTION');
  });

  // Level 9: TRACE CLEANUP - Invert Selection (Ctrl+R)
  test('Level 9: TRACE CLEANUP - selects, inverts, and deletes junk', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 9);
    await expectNarrativeThought(
      page,
      'The corruption felt... familiar. Like a half-remembered dream.'
    );

    // Task 1: Navigate to '/tmp' (gt) and select 'ghost_process.pid' and 'socket_001.sock'
    await gotoCommand(page, 't');

    // Verify we are in /tmp (Task 1 won't complete until selection is done, so we check breadcrumb/path)
    await expectCurrentDir(page, 'tmp');

    // Pattern: Filter -> Select -> Clear Filter
    // Use filterAndSelect for robust visibility waiting
    await filterAndSelect(page, 'ghost_process.pid');
    await filterAndSelect(page, 'socket_001.sock');

    // FIX: Also select system_monitor.pid so it gets deselected on invert (preserving it)
    await filterAndSelect(page, 'system_monitor.pid');

    await assertTask(page, '1/3', testInfo.outputDir, 'select_preserve_files');

    // Task 2: Invert the selection (Ctrl+R)
    await pressKey(page, 'Control+r');
    await assertTask(page, '2/3', testInfo.outputDir, 'invert_selection');

    // Task 3: Permanently delete the selected junk files (D)
    await deleteItem(page, { permanent: true, confirm: true });

    await assertTask(page, '3/3', testInfo.outputDir, 'delete_junk');

    await confirmMission(page, 'TRACE CLEANUP');
  });

  // Level 10: CREDENTIAL HEIST - Archive Nav & Sort by Modified
  test('Level 10: CREDENTIAL HEIST - identifies and secures active key', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 10);

    // Task 1: Navigate into '~/incoming/backup_logs.zip/credentials'
    await gotoCommand(page, 'i');

    await enterDirectory(page, 'backup_logs.zip');
    await enterDirectory(page, 'credentials');

    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_creds');

    // Task 2: Sort by modification time to identify the most recent key (,m)
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Yank the newest key ('access_key_new.pem')
    await filterByText(page, 'access_key_new.pem');
    await pressKey(page, 'y'); // Yank
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_key');
    await clearFilter(page);

    // Task 4: Jump to '~/workspace/systemd-core', create 'credentials/' folder, and paste the key
    await ensureCleanState(page);
    await gotoCommand(page, 'w'); // go to workspace

    // Nav to systemd-core
    await enterDirectory(page, 'systemd-core');

    // Create credentials/ folder
    await addItem(page, 'credentials/');

    // Enter credentials/
    await enterDirectory(page, 'credentials');

    // Paste
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_key');

    await confirmMission(page, 'CREDENTIAL HEIST');
  });
});
