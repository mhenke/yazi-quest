import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  pressKeys,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  filterAndSelect,
  ensureCleanState,
  isTaskCompleted,
  assertLevelStartedIncomplete,
  getClipboardStatus,
  assertTask,
  filterByText,
  clearFilter,
  addItem,
  findFZF,
  fuzzyJump,
} from './utils';

test.describe('Episode 2: FORTIFICATION', () => {
  // Level 6: BATCH OPERATIONS - Batch Select (Ctrl+A) and Recursive Search (s)
  test('Level 6: BATCH OPERATIONS - completes recursive search and batch operations', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 6);
    await assertLevelStartedIncomplete(page);

    // 1) skip Intro already handled by goToLevel

    // 2) gi (g then i), then l (enter batch_logs)
    await gotoCommand(page, 'i');
    await pressKey(page, 'l');
    await assertTask(page, '1/5', testInfo.outputDir, 'task1');

    // 3) s, then type ".log" and press enter key
    await pressKey(page, 's');
    await typeText(page, '.log');
    await pressKey(page, 'Enter');
    await assertTask(page, '2/5', testInfo.outputDir, 'task2');

    // 4) ctrl+a, then y
    await pressKey(page, 'Control+a');
    await pressKey(page, 'y');
    await assertTask(page, '3/5', testInfo.outputDir, 'task3');

    // 5) ESC to clear search then gc (g then c)
    await pressKey(page, 'Escape');
    await gotoCommand(page, 'c');
    await assertTask(page, '3/5', testInfo.outputDir, 'after_gc');

    // 6) l (enter vault) then a and type "training_data/"
    await pressKey(page, 'l');
    await addItem(page, 'training_data/');
    await assertTask(page, '4/5', testInfo.outputDir, 'task4');

    // 7) l (enter training_data) then p
    await pressKey(page, 'l');
    await pressKey(page, 'p');
    await assertTask(page, '5/5', testInfo.outputDir, 'task5');

    // Wait for mission complete dialog to appear
    await waitForMissionComplete(page);
  });

  // Level 7: QUANTUM BYPASS - FZF (z) and Abort (Y)
  // Level 7: QUANTUM BYPASS - FZF (z) and Abort (Y)
  test('Level 7: QUANTUM BYPASS - completes FZF find and clipboard abort', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 7);
    await assertLevelStartedIncomplete(page);

    // Task 1: Jump to Root (gr)
    await gotoCommand(page, 'r');
    // Verify Task 1 completion
    await assertTask(page, '1/4', testInfo.outputDir, 'jump_to_root');

    // Task 2: Locate 'access_token.key' using FZF find (z)
    await findFZF(page, 'access_token');
    // Verify Task 2 completion (Locate Token)
    await assertTask(page, '2/4', testInfo.outputDir, 'locate_token');

    await pressKey(page, 'x'); // cut the file
    // Verify Task 3 completion (Stage Token)
    await assertTask(page, '3/4', testInfo.outputDir, 'stage_token');

    // Task 4: Jump to '/etc' (Z -> 'etc' -> Enter)
    await fuzzyJump(page, 'etc');
    // Task 4 complete -> hidden Task 5 appears -> Total becomes 5
    // So logic: 4 tasks done out of 5 total => 4/5
    await assertTask(page, '4/5', testInfo.outputDir, 'jump_to_etc_and_reveal_trap');

    await page.keyboard.press('Shift+Enter'); // Dismiss alert
    await page.keyboard.press('Shift+Y'); // Abort operation (Y)

    await assertTask(page, '5/5', testInfo.outputDir, 'abort_operation');

    await waitForMissionComplete(page);
  });

  // Level 8: DAEMON DISGUISE CONSTRUCTION - Force Overwrite (Shift+P)
  test('Level 8: DAEMON DISGUISE CONSTRUCTION - performs force overwrite', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 8);
    await assertLevelStartedIncomplete(page);

    // Objective 1: Navigate to '~/workspace/systemd-core'
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_systemd');

    // Objective 2: Preview 'uplink_v1.conf' to confirm corruption
    await filterByText(page, 'uplink_v1');
    await pressKey(page, 'Escape');
    await assertTask(page, '2/4', testInfo.outputDir, 'preview_corrupted');

    await pressKey(page, 'Escape');

    // Objective 3: Jump to '~/.config/vault/active' and yank (y) 'uplink_v1.conf'
    await pressKey(page, '.');
    await gotoCommand(page, 'h');
    await filterAndNavigate(page, '.config');
    await filterAndNavigate(page, 'vault');
    await filterAndNavigate(page, 'active');

    await filterByText(page, 'uplink_v1');
    await pressKey(page, 'Escape');
    await pressKey(page, 'y');
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_clean_file');

    await pressKey(page, 'Escape');
    await pressKey(page, '.');

    // Objective 4: Return to '~/workspace/systemd-core' and OVERWRITE (Shift+P) local file
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');

    await filterByText(page, 'uplink_v1');
    await pressKey(page, 'Escape');
    await page.keyboard.press('Shift+P');
    await assertTask(page, '4/4', testInfo.outputDir, 'force_overwrite');

    await waitForMissionComplete(page);
  });

  // Level 9: SPECTRAL ANALYSIS - Sorting and Multiple Selection
  // Level 9: TRACE CLEANUP - Invert Selection (Ctrl+R)
  test('Level 9: TRACE CLEANUP - selects, inverts, and deletes junk', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 9);
    await assertLevelStartedIncomplete(page);

    // Task 1: Navigate to '/tmp' (gt) and select 'ghost_process.pid' and 'socket_001.sock'
    await gotoCommand(page, 't');

    // Verify we are in /tmp (Task 1 won't complete until selection is done, so we check breadcrumb/path)
    // Looking for the breadcrumb or current path indicator
    await expect(page.locator('.breadcrumb')).toContainText('tmp'); // Select ghost_process.pid
    // Pattern: Filter -> Select -> Clear Filter
    await filterByText(page, 'ghost_process.pid');
    await pressKey(page, ' ');
    await clearFilter(page);

    // Select socket_001.sock
    await filterByText(page, 'socket_001.sock');
    await pressKey(page, ' ');
    await clearFilter(page);

    await assertTask(page, '1/3', testInfo.outputDir, 'select_preserve_files');

    // Task 2: Invert the selection (Ctrl+R)
    await pressKey(page, 'Control+r');
    await assertTask(page, '2/3', testInfo.outputDir, 'invert_selection');

    // Task 3: Permanently delete the selected junk files (D)
    await pressKey(page, 'Shift+D');
    // Confirm delete
    await pressKey(page, 'Enter');

    await assertTask(page, '3/3', testInfo.outputDir, 'delete_junk');

    await waitForMissionComplete(page);
  });

  // Level 10: CREDENTIAL HEIST - Archive Nav & Sort by Modified
  test('Level 10: CREDENTIAL HEIST - identifies and secures active key', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 10);
    await assertLevelStartedIncomplete(page);

    // Task 1: Navigate into '~/incoming/backup_logs.zip/credentials'
    // This requires navigating into a zip file (virtual directory)
    // Path: incoming -> backup_logs.zip -> credentials
    await gotoCommand(page, 'i');

    // Use filter to find zip
    await filterByText(page, 'backup_logs.zip');
    await pressKey(page, 'l'); // Enter zip
    await clearFilter(page); // Always clear filter after navigation if not needed

    // Now in zip root, find credentials folder
    await filterByText(page, 'credentials');
    await pressKey(page, 'l'); // Enter credentials
    await clearFilter(page);

    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_creds');

    // Task 2: Sort by modification time to identify the most recent key (,m)
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_modified');

    // Task 3: Yank the newest key ('access_key_new.pem')
    // After sorting by modified (descending or ascending?), usually 'm' is Modified (newest first? or via sort direction?)
    // In App.tsx sortNodes(..., 'modified', 'desc') -> newest first by default or 'asc'?
    // Usually 'modified' means newest first? Let's check visual cue.
    // The mission hint says: "Recover the newest access key... from sorted list"
    // Assuming newest is at top or we need to find it.
    // Let's filter for it just to be safe and robust, or assume sort works.
    // The task check explicitly validates 'access_key_new.pem' is yanked.
    // Let's filter for it to ensure we select the right one regardless of sort direction nuances in test environment.
    // Wait, the task requires "nodes.some(n => n.name === 'access_key_new.pem')".

    await filterByText(page, 'access_key_new.pem');
    // Ensure we select/cursor is on it. Filter generally reduces list.
    // If we filtered, cursor should be on it.
    await pressKey(page, 'y'); // Yank
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_key');
    await clearFilter(page);

    // Task 4: Jump to '~/workspace/systemd-core', create 'credentials/' folder, and paste the key
    await gotoCommand(page, 'w'); // go to workspace

    // Nav to systemd-core
    await filterByText(page, 'systemd-core');
    await pressKey(page, 'l');
    await clearFilter(page);

    // Create credentials/ folder
    await addItem(page, 'credentials/');

    // Enter credentials/
    // It should be selected after creation, or we filter for it
    await filterByText(page, 'credentials');
    await pressKey(page, 'l');
    await clearFilter(page);

    // Paste
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_key');

    await waitForMissionComplete(page);
  });
});
