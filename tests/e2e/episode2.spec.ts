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
} from './utils';

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

    // Task 1: Locate 'access_token.key' using FZF find (z) from root
    await gotoCommand(page, 'r');
    await pressKey(page, 'z');
    await typeText(page, 'access_token');
    await pressKey(page, 'Enter'); // Select in FZF
    await assertTask(page, '1/4', testInfo.outputDir, 'fzf_access_token');

    // Task 2: Stage the suspicious file for deletion
    await pressKey(page, 'x');
    await assertTask(page, '2/4', testInfo.outputDir, 'stage_file');

    // Task 3: Jump to '/etc' using FZF directory jump
    await pressKey(page, 'Shift+z');
    await typeText(page, 'etc');
    await pressKey(page, 'Enter');
    await assertTask(page, '3/4', testInfo.outputDir, 'jump_to_etc');

    // Task 4: Abort the pending operation when the threat alert appears
    // The alert is modal, so we confirm it, then abort the clipboard.
    await page.waitForTimeout(DEFAULT_DELAY * 2); // Wait for alert to be reliably visible
    const alert = page.getByText('Unauthorized operation detected');
    await expect(alert).toBeVisible();
    await pressKey(page, 'Enter'); // Dismiss alert

    await pressKey(page, 'Shift+y'); // Abort clipboard action
    await assertTask(page, '4/4', testInfo.outputDir, 'abort_operation');

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
    await pressKey(page, 'l'); // Enter workspace
    await navigateDown(page, 3); // to systemd-core
    await pressKey(page, 'l'); // Enter systemd-core
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_systemd');

    // Task 2: Preview the corrupted 'uplink_v1.conf'
    await navigateDown(page, 2); // to uplink_v1.conf
    await assertTask(page, '2/4', testInfo.outputDir, 'preview_corrupted');

    // Task 3: Jump to '~/.config/vault/active' and yank the clean 'uplink_v1.conf'
    await ensureCleanState(page);
    await gotoCommand(page, 'c');
    await pressKey(page, 'l'); // into vault
    await navigateDown(page, 1); // to active
    await pressKey(page, 'l'); // into active
    await navigateDown(page, 2); // to uplink_v1.conf
    await pressKey(page, 'y');
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_clean_file');

    // Task 4: Return to '~/workspace/systemd-core' and force-overwrite the corrupted file
    await gotoCommand(page, 'w');
    await pressKey(page, 'l');
    await navigateDown(page, 3);
    await pressKey(page, 'l');
    await navigateDown(page, 2); // to the corrupted uplink_v1.conf
    await pressKey(page, 'Shift+p');
    await assertTask(page, '4/4', testInfo.outputDir, 'force_overwrite');

    await waitForMissionComplete(page);
  });

  // Level 9: SPECTRAL ANALYSIS - Sorting and Multiple Selection
  test('Level 9: SPECTRAL ANALYSIS - sorts and selects multiple files', async ({
    page,
  }, testInfo) => {
    await goToLevel(page, 9);
    await assertTask(page, '0/4', testInfo.outputDir, 'start');

    // Task 1: Navigate into '~/incoming/anomaly_data'
    await gotoCommand(page, 'i');
    await navigateDown(page, 1);
    await pressKey(page, 'l');
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_anomaly');

    // Task 2: Sort files by size
    await pressKey(page, ',');
    await pressKey(page, 's');
    await assertTask(page, '2/4', testInfo.outputDir, 'sort_by_size');

    // Task 3: Select all 'segment_*.dat' files
    await pressKey(page, 'v'); // Enter visual mode
    await navigateDown(page, 3); // Select the 4 segment files
    await assertTask(page, '3/4', testInfo.outputDir, 'visual_select');

    // Task 4: Delete the selected files
    await pressKey(page, 'd');
    await pressKey(page, 'y'); // Confirm deletion
    await assertTask(page, '4/4', testInfo.outputDir, 'delete_selected');

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
    await navigateDown(page, 1); // to media
    await pressKey(page, 'l');
    await navigateDown(page, 1); // to archives
    await pressKey(page, 'l');
    await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_archives');

    // Task 2: Filter for '.zip' files and select them
    await pressKey(page, 'f');
    await typeText(page, '.zip');
    await pressKey(page, 'Escape');
    await pressKey(page, ' '); // Select first
    await pressKey(page, 'j');
    await pressKey(page, ' '); // Select second
    await assertTask(page, '2/4', testInfo.outputDir, 'filter_and_select_zip');

    // Task 3: Yank files and navigate to '~/datastore/backups'
    await pressKey(page, 'y');
    await ensureCleanState(page);
    await gotoCommand(page, 'd');
    await navigateDown(page, 1); // to backups
    await pressKey(page, 'l');
    await assertTask(page, '3/4', testInfo.outputDir, 'nav_to_backups');

    // Task 4: Paste the archives
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_archives');

    await waitForMissionComplete(page);
  });
});
