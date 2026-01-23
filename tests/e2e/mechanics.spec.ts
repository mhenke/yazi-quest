import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  expectCurrentDir,
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

  test('L8 Trap: Overwriting with honeypot triggers Game Over', async ({ page }) => {
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

  test('L9 Trap: Deleting system_monitor.pid triggers Game Over', async ({ page }) => {
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
});
