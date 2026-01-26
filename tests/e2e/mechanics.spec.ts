import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  expectCurrentDir,
  assertTask,
  filterAndSelect,
  deleteItem,
  navigateRight,
} from './utils';

test.describe('Game Mechanics & Failures', () => {
  test('Shell Collapse: Deleting critical system directory triggers Game Over', async ({
    page,
  }, _testInfo) => {
    // Start Level 2 (allows shortcuts like gr)
    await startLevel(page, 2);

    // Navigate to Root
    await gotoCommand(page, 'r');
    await expectCurrentDir(page, '/');

    // Select a critical folder (e.g., 'bin')
    // Note: 'bin' must be in the initial filesystem list for this to work
    await filterAndSelect(page, 'bin');

    // Attempt recursive delete
    // We use permanant delete (D) to bypass trash can logic if possible, or simple delete (d + y)
    await deleteItem(page, { permanent: true, confirm: true });

    // Expect Game Over Modal with "SHELL COLLAPSE"
    await expect(page.getByText('SHELL COLLAPSE')).toBeVisible();
    await expect(page.getByText('CRITICAL SYSTEM FAILURE')).toBeVisible();
    await expect(page.getByText('User environment destabilized')).toBeVisible();
  });

  // FIXME: Level 8 onEnter logic seems to fail to populate systemd-core in workspace when jumped to directly.
  test.fixme('L8 Trap: Overwriting with honeypot triggers Game Over', async ({ page }) => {
    await startLevel(page, 8);

    // 1. Get the TRAP file from vault/active
    await gotoCommand(page, 'c');
    await filterAndSelect(page, 'vault');
    await navigateRight(page, 1);

    await filterAndSelect(page, 'active');
    await navigateRight(page, 1);

    await filterAndSelect(page, 'uplink_v1.conf.trap');
    await pressKey(page, 'y'); // Yank trap

    // 2. Go to target in workspace
    await gotoCommand(page, 'w');
    await expectCurrentDir(page, 'workspace');
    await filterAndSelect(page, 'systemd-core');
    await navigateRight(page, 1);

    await filterAndSelect(page, 'uplink_v1.conf');

    // 3. Overwrite (Shift+P)
    await pressKey(page, 'Shift+P');
    await pressKey(page, 'y'); // Confirm

    // 4. Expect Game Over
    await expect(page.getByText('TRAP ACTIVATED')).toBeVisible();
    await expect(page.getByText('Security Incident logged')).toBeVisible();
  });

  // FIXME: Level 9 onEnter logic seems to fail to populate /tmp with honeypots when jumped to directly.
  test.fixme('L9 Trap: Deleting system_monitor.pid triggers Game Over', async ({ page }) => {
    await startLevel(page, 9);

    // 1. Go to /tmp
    await gotoCommand(page, 't');

    // 2. Select honeypot
    await filterAndSelect(page, 'system_monitor.pid');

    // 3. Delete
    await pressKey(page, 'Shift+D'); // Permanent Delete

    // Wait for modal to ensure we are in confirm-delete mode
    await expect(page.getByRole('alertdialog')).toBeVisible();

    await pressKey(page, 'y'); // confirm

    // 4. Expect Game Over
    await expect(page.getByText('TRAP ACTIVATED')).toBeVisible();
  });

  test('L14 Honeypot: Deleting visible data before decoys triggers Game Over', async ({ page }) => {
    await startLevel(page, 14);

    // 1. Return to home (starts in ~/workspace)
    await gotoCommand(page, 'h');
    await expectCurrentDir(page, '~');

    // 2. Show hidden files to find .purge_lock
    await pressKey(page, '.');

    // 3. Find and select .purge_lock in home
    await filterAndSelect(page, '.purge_lock');

    // 4. Attempt to delete it before creating decoys
    await pressKey(page, 'Shift+D');
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await pressKey(page, 'y');

    // 5. Expect Game Over with HONEYPOT message
    await expect(page.getByText('HONEYPOT TRIGGERED')).toBeVisible();
    await expect(page.getByText('Security tripwire detected')).toBeVisible();
  });

  // FIXME: Level 11 onEnter logic seems to fail to populate daemons when jumped to directly.
  test.fixme('L11 Honeypot: Selecting recent service does not complete task', async ({
    page,
  }, testInfo) => {
    await startLevel(page, 11);

    // 1. Search for service files
    await gotoCommand(page, 'r');
    await expectCurrentDir(page, '/');
    await pressKey(page, 's');
    await page.keyboard.type('service');
    await pressKey(page, 'Enter');

    // 2. Sort by modified (,m)
    await pressKey(page, ',');
    await pressKey(page, 'm');

    // 3. Select 'audit-daemon.service' (the honeypot - very recent)
    // We'll find it by name for robustness
    await filterAndSelect(page, 'audit-daemon.service');

    // 4. Yank it
    await pressKey(page, 'y');

    // 5. Verify task '3/4' is NOT complete (still at 2/4 after sort)
    // This is a soft failure check - the task check should return false
    await assertTask(page, '2/4', testInfo.outputDir, 'l11_honeypot_select');
  });
});
