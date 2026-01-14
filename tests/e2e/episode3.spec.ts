import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  filterAndSelect,
  clearFilter,
} from './utils';

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Metadata (Tab)
  test('Level 11: DAEMON RECONNAISSANCE - inspects metadata and selects safe files', async ({
    page,
  }) => {
    await goToLevel(page, 11);

    // Task 1: Jump to '/daemons'
    await gotoCommand(page, 'r'); // Go to root first
    await filterAndNavigate(page, 'daemons');

    // Task 2: Inspect metadata (Tab) of at least 3 files
    // Open info panel and navigate through files
    await pressKey(page, 'Tab'); // Open info panel
    await page.waitForTimeout(200);
    await pressKey(page, 'j'); // Move to next file (counts as inspection while panel open)
    await page.waitForTimeout(200);
    await pressKey(page, 'j'); // Move to next file
    await page.waitForTimeout(200);
    await pressKey(page, 'j'); // Move to next file (3rd inspection)
    await pressKey(page, 'Tab'); // Close info panel

    // Task 3: Select 2 SAFE (Legacy) files
    // Safe files are: cron-legacy.service, backup-archive.service, syslog-old.service
    await filterAndSelect(page, 'cron-legacy');
    await clearFilter(page);
    await filterAndSelect(page, 'backup-archive');
    await clearFilter(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON RECONNAISSANCE')).toBeVisible();
  });

  // Level 12: DAEMON INSTALLATION - Long Distance Ops & Scenarios
  test('Level 12: DAEMON INSTALLATION - installs daemon and handles threats', async ({ page }) => {
    await goToLevel(page, 12);

    // Task 1: Navigate to '~/workspace'
    await gotoCommand(page, 'w');

    // Handle potential scenario threats in workspace if they exist
    const threatFiles = [
      'alert_traffic.log',
      'lib_error.log',
      'scan_a.tmp',
      'scan_b.tmp',
      'scan_c.tmp',
    ];
    for (const threat of threatFiles) {
      const fileName = threat.split('.')[0];
      await pressKey(page, 'f');
      await typeText(page, fileName);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      const fileVisible = await page
        .getByText(threat)
        .isVisible()
        .catch(() => false);
      if (fileVisible) {
        await pressKey(page, 'd');
        await pressKey(page, 'y');
      }
      await clearFilter(page);
    }

    // Task 2: Cut '~/workspace/systemd-core'
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await page.keyboard.press('Escape');
    await pressKey(page, 'x'); // Cut
    await clearFilter(page);

    // Task 3: Navigate to '/daemons'
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');

    // Task 4: Paste (Install) systemd-core
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Navigate into the installed systemd-core
    await filterAndNavigate(page, 'systemd-core');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 13: DISTRIBUTED CONSCIOUSNESS - Node Switching (1, 2, 3)
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - synchronizes keys across nodes', async ({ page }) => {
    await goToLevel(page, 13);

    // Start in Tokyo (Node 1) - initial path is /nodes/tokyo
    // Task: Assemble keys in /tmp/central

    // Node 1 (Tokyo) - yank key_tokyo.key
    await pressKey(page, '1'); // Ensure we are in Tokyo
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank key_tokyo.key (only file in tokyo)

    // Go to /tmp/central and paste
    await gotoCommand(page, 't'); // Go to /tmp
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p'); // Paste key_tokyo.key

    // Node 2 (Berlin) - yank key_berlin.key
    await pressKey(page, '2');
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank key_berlin.key

    // Paste in /tmp/central
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p');

    // Node 3 (Sao Paulo) - yank key_saopaulo.key
    await pressKey(page, '3');
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank key_saopaulo.key

    // Paste in /tmp/central
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DISTRIBUTED CONSCIOUSNESS')).toBeVisible();
  });

  // Level 14: EVIDENCE PURGE - WORKSPACE - Permanent Delete (D)
  test('Level 14: EVIDENCE PURGE - permanently deletes evidence properly', async ({ page }) => {
    await goToLevel(page, 14);

    // Task 1: Return to '/home/guest'
    await gotoCommand(page, 'h'); // gh -> ~ (guest)

    // Task 2: Create 3 decoy directories
    await pressKey(page, 'a');
    await typeText(page, 'decoy_1/');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(200);

    await pressKey(page, 'a');
    await typeText(page, 'decoy_2/');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(200);

    await pressKey(page, 'a');
    await typeText(page, 'decoy_3/');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(200);

    // Task 3: Permanently delete visible dirs (D, y)
    // Need to select: datastore, incoming, media, workspace
    const targets = ['datastore', 'incoming', 'media', 'workspace'];
    for (const target of targets) {
      await filterAndSelect(page, target);
      await clearFilter(page);
    }

    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm

    // Task 4: Permanently eliminate hidden '.config'
    await pressKey(page, '.'); // Show hidden files
    await page.waitForTimeout(200);
    await pressKey(page, 'f');
    await typeText(page, '.config');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('EVIDENCE PURGE')).toBeVisible();
  });

  // Level 15: TRANSMISSION PROTOCOL - Final Exam
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }) => {
    await goToLevel(page, 15);

    // Phase 1: Search for keys in /nodes, Copy all, Paste in /tmp/upload
    // Jump to root first to search across all directories
    await gotoCommand(page, 'r');

    // Use recursive search to find .key files
    await pressKey(page, 's');
    await typeText(page, 'key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Select all found keys and copy
    await pressKey(page, 'Control+A');
    await pressKey(page, 'y');
    await page.keyboard.press('Escape'); // Exit search mode

    // Navigate to /tmp/upload and paste
    await gotoCommand(page, 't');
    await pressKey(page, 'f');
    await typeText(page, 'upload');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Enter');
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Phase 2: Verify daemon in /daemons/systemd-core
    await gotoCommand(page, 'r');
    await pressKey(page, 'f');
    await typeText(page, 'daemons');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Enter');

    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Enter');

    // Find uplink_v1.conf and inspect with Tab + scroll
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Tab'); // Open info panel
    await pressKey(page, 'Shift+J'); // Scroll down
    await pressKey(page, 'Shift+J');
    await pressKey(page, 'Shift+K'); // Scroll up
    await pressKey(page, 'Tab'); // Keep panel open for verification (close when not needed)

    // Phase 3: Sanitize breadcrumb in /tmp (.ghost_process.pid)
    await gotoCommand(page, 't');
    await pressKey(page, '.'); // Toggle hidden files
    await page.waitForTimeout(200);
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm

    // Phase 4: Init Upload using Zoxide jump and filter for keys
    await pressKey(page, 'Shift+Z'); // Zoxide jump
    await typeText(page, 'upload');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Filter for key to verify all fragments
    await pressKey(page, 'f');
    await typeText(page, 'key');
    await page.keyboard.press('Escape');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('TRANSMISSION PROTOCOL')).toBeVisible();
  });
});
