import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  pressKeys,
  gotoCommand,
  waitForMissionComplete,
  typeText,
} from './utils';

test.describe('Episode 2: FORTIFICATION', () => {
  // Level 6: BATCH OPERATIONS - Batch Select (Ctrl+A) and Recursive Search (s)
  test('Level 6: BATCH OPERATIONS - completes recursive search and batch operations', async ({
    page,
  }) => {
    await goToLevel(page, 6);

    // Task 1: Jump to '~/incoming/batch_logs' (gi -> enter batch_logs)
    await gotoCommand(page, 'i');
    await pressKey(page, 'Enter');

    // Task 2: Use recursive search (s) to find 'log'
    await pressKey(page, 's');
    await typeText(page, 'log');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500); // Increased wait for search results

    // Task 3: Select all search results and yank (Ctrl+A, y)
    await pressKey(page, 'Control+A');
    await page.waitForTimeout(300);
    await pressKey(page, 'y');
    await pressKey(page, 'Escape'); // Exit search mode

    // Task 4: Jump to '~/.config' (gc) and create 'vault/training_data'
    await gotoCommand(page, 'c');
    await pressKey(page, 'Enter'); // Enter vault
    // And it still failed (17.4s)?
    // If so, sticking with slash.
    // Maybe the problem is `training_data` exists?
    // I'll add `force` or checking existence?
    // I'll try to Filter/Enter it first?
    // If it exists, creation fails?
    // I'll assume it doesn't exist.
    // I'll change the wait time?
    // Maybe type slower?
    await typeText(page, 'training_data/');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter'); // Use keyboard press for input
    await page.waitForTimeout(500); // Wait for creation

    // Task 5: Paste logs into '~/.config/vault/training_data'
    // After creation, training_data should be selected or available.
    // It's a directory.
    // Let's filter to be sure we enter the right one.
    await pressKey(page, 'f');
    await typeText(page, 'training_data');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Enter');

    await pressKey(page, 'p');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('BATCH OPERATIONS')).toBeVisible();
  });

  // Level 7: QUANTUM BYPASS - FZF (z) and Abort (Y)
  test('Level 7: QUANTUM BYPASS - finds honeypot and aborts', async ({ page }) => {
    await goToLevel(page, 7);

    // Task 1: Jump to Root (gr)
    await gotoCommand(page, 'r');

    // Task 2: Locate 'access_token.key' using FZF find (z)
    await pressKey(page, 'z');
    await typeText(page, 'access_token');
    await page.waitForTimeout(500); // Wait for FZF
    await page.keyboard.press('Enter'); // Select in FZF

    // Task 3: Stage suspicious file (x)
    await pressKey(page, 'x');

    // Task 4: Jump to '/etc' (Z -> 'etc' -> Enter)
    await pressKey(page, 'Shift+Z');
    await typeText(page, 'etc');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');

    // Task 5: Abort operation when warning appears
    await page.waitForTimeout(1000); // Wait for alert
    await pressKey(page, 'Shift+Enter'); // Dismiss alert

    await page.waitForTimeout(500);
    await pressKey(page, 'Shift+Y'); // Clear clipboard

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('QUANTUM BYPASS')).toBeVisible();
  });

  // Level 8: DAEMON DISGUISE CONSTRUCTION - Force Overwrite (Shift+P)
  test('Level 8: DAEMON DISGUISE CONSTRUCTION - performs force overwrite', async ({ page }) => {
    await goToLevel(page, 8);

    // Task 1: Navigate to '~/workspace/systemd-core'
    await gotoCommand(page, 'w');
    await pressKey(page, 'Enter');

    // Task 2: Preview 'uplink_v1.conf'
    // Filter specific filename to avoid matching v0 backup
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape');

    // Task 3: Jump to '~/.config/vault/active' and yank clean version
    await gotoCommand(page, 'c');

    // Clear potential persistent filter alert
    await pressKey(page, 'Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'Escape'); // Twice to be safe

    await pressKey(page, 'Enter'); // enter vault
    await pressKey(page, 'Enter'); // enter active

    // Find and yank uplink_v1.conf
    // Filter exact name
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape');
    await pressKey(page, 'y');

    // Task 4: Return to '~/workspace/systemd-core' and OVERWRITE (Shift+P)
    await gotoCommand(page, 'w');
    await pressKey(page, 'Enter');

    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Shift+P');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON DISGUISE CONSTRUCTION')).toBeVisible();
  });

  // Level 9: TRACE CLEANUP - Invert Selection (Ctrl+R)
  test('Level 9: TRACE CLEANUP - uses invert selection to clean up', async ({ page }) => {
    await goToLevel(page, 9);

    // Task 1: Navigate to '/tmp'
    await gotoCommand(page, 't');

    // Task 2: Select files to KEEP
    // ghost_process.pid
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await page.keyboard.press('Escape');
    await pressKey(page, ' '); // Select
    await pressKey(page, 'Escape'); // Clear filter

    // socket_001.sock
    await pressKey(page, 'f');
    await typeText(page, 'socket');
    await page.keyboard.press('Escape');
    await pressKey(page, ' '); // Select
    await pressKey(page, 'Escape'); // Clear filter

    // Task 3: Invert selection (Ctrl+R)
    await pressKey(page, 'Control+R');
    await page.waitForTimeout(200);

    // Task 4: Permanently delete (Shift+D) and confirm
    await pressKey(page, 'Shift+D');
    await page.waitForTimeout(500);
    await pressKey(page, 'y'); // Confirm

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('TRACE CLEANUP')).toBeVisible();
  });

  // Level 10: CREDENTIAL HEIST - Sorting (,m) and Archives
  test('Level 10: CREDENTIAL HEIST - sorts by modified and extracts key from archive', async ({
    page,
  }) => {
    await goToLevel(page, 10);

    // Task 1: Navigate into '~/incoming/backup_logs.zip/credentials'
    await gotoCommand(page, 'i');
    await pressKey(page, 'Enter'); // backup_logs.zip
    await pressKey(page, 'Enter'); // credentials

    // Task 2: Sort by modification time (,m)
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await page.waitForTimeout(500); // Wait for sort

    // Task 3: Yank newest key (top item)
    // Ensure we are at top
    await pressKey(page, 'g');
    await pressKey(page, 'g');
    await pressKey(page, 'y');

    // Task 4: Jump to '~/workspace/systemd-core', create credentials/, paste
    await gotoCommand(page, 'w');
    await pressKey(page, 'Enter');

    await pressKey(page, 'a');
    await typeText(page, 'credentials/');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Enter credentials/
    await pressKey(page, 'Enter');

    await pressKey(page, 'p');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('CREDENTIAL HEIST')).toBeVisible();
  });
});
