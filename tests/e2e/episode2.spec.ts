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
  cleanupBeforeComplete,
  isTaskCompleted,
} from './utils';

test.describe('Episode 2: FORTIFICATION', () => {
  // Level 6: BATCH OPERATIONS - Batch Select (Ctrl+A) and Recursive Search (s)
  test('Level 6: BATCH OPERATIONS - completes recursive search and batch operations', async ({
    page,
  }) => {
    await goToLevel(page, 6);

    // Task 1: Jump to '~/incoming/batch_logs' (gi → l to enter)
    await gotoCommand(page, 'i'); // gi -> ~/incoming
    await page.waitForTimeout(500);
    // batch_logs should be first item, use l to enter it
    await pressKey(page, 'l'); // Enter batch_logs
    await page.waitForTimeout(500);

    // Task 2: Use recursive search (s) to find 'log'
    await pressKey(page, 's');
    await typeText(page, 'log');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Task 3: Select all search results and yank (Ctrl+A, y)
    await pressKey(page, 'Control+A');
    await page.waitForTimeout(200);
    await pressKey(page, 'y');
    await page.waitForTimeout(300);

    // Exit search mode - CRITICAL to clear search before navigation
    await ensureCleanState(page);
    await page.waitForTimeout(500);

    // Task 4: Jump to '~/.config' (gc), enter vault, create training_data
    await gotoCommand(page, 'c'); // gc -> ~/.config with vault highlighted
    await page.waitForTimeout(500);

    // vault is already highlighted after gc, just enter it
    await pressKey(page, 'l'); // Enter vault
    await page.waitForTimeout(300);

    // Create 'training_data/' directory
    await pressKey(page, 'a');
    await typeText(page, 'training_data/');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Task 5: Navigate into training_data and paste
    // Verify 'training_data' is selected automatically
    await expect(page.locator('[aria-current="location"]')).toContainText('training_data');

    await pressKey(page, 'l'); // Enter training_data
    await page.waitForTimeout(300);

    // Paste the logs
    await pressKey(page, 'p');
    await page.waitForTimeout(500);

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

    // Objective 1: Navigate to '~/workspace/systemd-core'
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');
    await expect(page.getByText('Tasks: 1/4')).toBeVisible();

    // Objective 2: Preview 'uplink_v1.conf' to confirm corruption
    // Note: Task check requires usedFilter === true
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1');
    await page.keyboard.press('Escape'); // Stay on the file with filter active
    await expect(page.getByText('Tasks: 2/4')).toBeVisible();

    // Clear filter before leaving to stay clean
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Objective 3: Jump to '~/.config/vault/active' and yank (y) 'uplink_v1.conf'
    await pressKey(page, '.'); // Show hidden files for .config
    await gotoCommand(page, 'h'); // gh to home
    await filterAndNavigate(page, '.config');
    await filterAndNavigate(page, 'vault');
    await filterAndNavigate(page, 'active');

    // Find and yank clean file
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1');
    await page.keyboard.press('Escape');
    await pressKey(page, 'y');
    await expect(page.getByText('Tasks: 3/4')).toBeVisible();

    // Clear filter and hide files before returning
    await page.keyboard.press('Escape');
    await pressKey(page, '.');
    await page.waitForTimeout(100);

    // Objective 4: Return to '~/workspace/systemd-core' and OVERWRITE (Shift+P) local file
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');

    // Find the file robustly with a filter
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape'); // Position cursor on the file
    await page.waitForTimeout(200);

    // CRITICAL: Clear filter BEFORE overwriting so we are in protocol compliance
    // at the moment the level completes.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Overwrite with Shift+P. This completes Task 4 and triggers Mission Complete.
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

    // Objective 1: Navigate into '~/incoming/backup_logs.zip/credentials'
    await gotoCommand(page, 'i');
    await filterAndNavigate(page, 'backup_logs.zip');
    await filterAndNavigate(page, 'credentials');
    await expect(page.getByText('Tasks: 1/4')).toBeVisible();

    // Objective 2: Sort by modification time (,m)
    await pressKey(page, ',');
    await pressKey(page, 'm');
    await page.waitForTimeout(200);
    await expect(page.getByText('Tasks: 2/4')).toBeVisible();

    // Objective 3: Yank newest key (access_key_new.pem should be at top after sort desc)
    await pressKey(page, 'g');
    await pressKey(page, 'g'); // Ensure we are at the top

    // Explicitly verify the file is there before yanking
    await pressKey(page, 'f');
    await typeText(page, 'access_key_new');
    await page.keyboard.press('Escape');
    await expect(
      page.getByTestId('filesystem-pane-active').getByText('access_key_new.pem')
    ).toBeVisible();

    await pressKey(page, 'y');
    await expect(page.getByText('Tasks: 3/4')).toBeVisible();

    // Reset sort AND clear filter BEFORE leaving to stay clean
    await page.keyboard.press('Escape'); // Clear 'access_key_new' filter
    await pressKey(page, ',');
    await pressKey(page, 'n');
    await page.waitForTimeout(200);

    // Objective 4: Jump to '~/workspace/systemd-core', create credentials/, paste
    await gotoCommand(page, 'w');
    await filterAndNavigate(page, 'systemd-core');

    // Create credentials directory
    await pressKey(page, 'a');
    await typeText(page, 'credentials/');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Enter credentials/
    await filterAndNavigate(page, 'credentials');

    // Paste the key. This completes Task 4 and triggers Mission Complete.
    await pressKey(page, 'p');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('CREDENTIAL HEIST')).toBeVisible();
  });
});
