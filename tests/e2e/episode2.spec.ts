import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  ensureCleanState,
  assertTask,
  navigateDown,
  DEFAULT_DELAY,
  filterByText,
  clearFilter,
} from './utils';
import { clear } from 'console';

test.describe('Episode 2: FORTIFICATION', () => {
  // Level 6: BATCH OPERATIONS - Batch Select (Ctrl+A) and Recursive Search (s)
  test('Level 6: BATCH OPERATIONS - completes recursive search and batch operations', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 6);
    await assertTask(page, '0/5', testInfo.outputDir, 'start');

    // Task 1: Navigate into '~/incoming/batch_logs'
    await gotoCommand(page, 'i');
    await pressKey(page, 'l');
    await assertTask(page, '1/5', testInfo.outputDir, 'task1');

    // Task 2: Search for all '.log' files recursively
    await pressKey(page, 's');
    await typeText(page, '.log');
    await pressKey(page, 'Enter');
    await assertTask(page, '2/5', testInfo.outputDir, 'task2');

    // Task 3: Select all results and yank them
    await pressKey(page, 'Control+a');
    await pressKey(page, 'y');
    await assertTask(page, '3/5', testInfo.outputDir, 'task3');

    // Task 4: Navigate to '/home/maia/.config/vault/training_data' and create the directory
    await ensureCleanState(page); // Clear search and reset state
    await gotoCommand(page, 'c');
    await pressKey(page, 'l'); // Enter 'vault'
    await pressKey(page, 'a'); // Create directory
    await page.keyboard.type('training_data/', { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300); // Wait for directory creation to settle
    await assertTask(page, '4/5', testInfo.outputDir, 'task4');

    // Task 5: Enter the new directory and paste the files
    await pressKey(page, 'l');
    await pressKey(page, 'p');
    await assertTask(page, '5/5', testInfo.outputDir, 'task5');

    await waitForMissionComplete(page);
  });

  // Level 7: QUANTUM BYPASS - FZF (z) and Abort (Y)
  test('Level 7: QUANTUM BYPASS - completes FZF find and clipboard abort', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 7);
    await assertTask(page, '0/4', testInfo.outputDir, 'start');

    // Task 1: Jump to Root (gr)
    await gotoCommand(page, 'r');
    await assertTask(page, '1/4', testInfo.outputDir, 'jump_to_root');

    // Task 2: Locate 'access_token.key' using FZF find (z)
    await pressKey(page, 'z');
    await typeText(page, 'access_token');
    await pressKey(page, 'Enter'); // Select in FZF
    await assertTask(page, '2/4', testInfo.outputDir, 'fzf_access_token');

    // Task 3: Stage the suspicious file (x)
    await pressKey(page, 'x');
    await assertTask(page, '3/4', testInfo.outputDir, 'stage_file');

    // Task 4: Jump to '/etc' using FZF directory jump (Z -> etc -> Enter)
    await pressKey(page, 'Shift+Z');
    await typeText(page, 'etc');
    await pressKey(page, 'Enter');

    // Wait for threat alert to appear
    await page.waitForTimeout(DEFAULT_DELAY * 2);

    // Dismiss the threat dialog
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(300);

    // Abort clipboard with Y
    await page.keyboard.press('Shift+Y');
    await page.waitForTimeout(300);

    await waitForMissionComplete(page);
  });

  // Level 8: DAEMON DISGUISE CONSTRUCTION - Force Overwrite (Shift+P)
  test('Level 8: DAEMON DISGUISE CONSTRUCTION - performs force overwrite', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 8);
    await assertTask(page, '0/4', testInfo.outputDir, 'start');

    // Task 1: Navigate to '~/workspace/systemd-core'
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_systemd');

    // Task 2: Preview 'uplink_v1.conf' to confirm corruption
    await filterByText(page, 'uplink_v1.conf');
    await assertTask(page, '2/4', testInfo.outputDir, 'verify_damage');

    // Task 3: Jump to '~/.config/vault/active' and yank 'uplink_v1.conf'
    await clearFilter(page);
    await gotoCommand(page, 'c');
    await filterAndNavigate(page, 'vault');
    await filterAndNavigate(page, 'active');
    await filterByText(page, 'uplink_v1.conf');
    await pressKey(page, 'y');
    await assertTask(page, '3/4', testInfo.outputDir, 'acquire_patch');

    // Task 4: Return to '~/workspace/systemd-core' and force overwrite (Shift+P)
    await clearFilter(page);
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');

    await pressKey(page, 'Shift+p');

    await assertTask(page, '4/4', testInfo.outputDir, 'deploy_patch');

    await waitForMissionComplete(page);
  });

  // Level 9: TRACE CLEANUP - Invert Selection (Ctrl+R) and Permanent Delete (D)
  test('Level 9: TRACE CLEANUP - uses invert selection to clean up /tmp', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 9);
    await assertTask(page, '0/3', testInfo.outputDir, 'start');

    // Task 1: Select the files to keep.
    await filterByText(page, 'ghost_process.pid');
    await pressKey(page, ' '); // Select it
    await clearFilter(page);

    await filterByText(page, 'socket_001.sock');
    await pressKey(page, ' '); // Select it
    await clearFilter(page);

    await assertTask(page, '1/3', testInfo.outputDir, 'select_critical_files');

    // Task 2: Invert the selection to target all the junk files
    await pressKey(page, 'Control+r');
    await assertTask(page, '2/3', testInfo.outputDir, 'invert_selection');

    // Task 3: Permanently delete the selected junk files
    await pressKey(page, 'Shift+d');
    await pressKey(page, 'y'); // Confirm permanent delete
    await assertTask(page, '3/3', testInfo.outputDir, 'delete_junk');

    await waitForMissionComplete(page);
  });

  // Level 10: ARCHIVE EXTRACTION - Filter (f) and Multi-Stage Copy
  test('Level 10: ARCHIVE EXTRACTION - performs multi-stage copy and rename', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 10);
    await assertTask(page, '0/4', testInfo.outputDir, 'start');

    // Task 1: Navigate to '~/media/archives'
    await gotoCommand(page, 'h');
    await filterAndNavigate(page, 'media');
    await filterAndNavigate(page, 'archives');
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_archives');

    // Task 2: Filter for '.zip' files and select them
    await filterByText(page, '.zip');
    await pressKey(page, ' '); // Select first
    await pressKey(page, 'j');
    await pressKey(page, ' '); // Select second
    await assertTask(page, '2/4', testInfo.outputDir, 'filter_and_select_zip');

    // Task 3: Yank files and navigate to '~/datastore/backups'
    await pressKey(page, 'y');
    await ensureCleanState(page);
    await gotoCommand(page, 'd');
    await filterAndNavigate(page, 'backups');
    await assertTask(page, '3/4', testInfo.outputDir, 'nav_to_backups');

    // Task 4: Paste the archives
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_archives');

    await waitForMissionComplete(page);
  });
});
