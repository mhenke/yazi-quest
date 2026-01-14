import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  filterAndSelect,
  ensureCleanState,
  cleanupBeforeComplete,
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
    // Open info panel - this starts tracking scouted files
    await pressKey(page, 'Tab');
    await page.waitForTimeout(200);
    // Navigate through files while panel is open - each file visited is "scouted"
    await pressKey(page, 'j'); // Move to next file (1st scout)
    await page.waitForTimeout(150);
    await pressKey(page, 'j'); // Move to next file (2nd scout)
    await page.waitForTimeout(150);
    await pressKey(page, 'j'); // Move to next file (3rd scout)
    await page.waitForTimeout(150);
    await pressKey(page, 'Tab'); // Close info panel

    // Task 3: Select 2 SAFE (Legacy) files
    // Safe files are: cron-legacy.service (>30 days old), backup-archive.service, syslog-old.service
    await filterAndSelect(page, 'cron-legacy');
    await ensureCleanState(page);
    await filterAndSelect(page, 'backup-archive');

    // Clean up before completion
    await cleanupBeforeComplete(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON RECONNAISSANCE')).toBeVisible();
  });

  // Level 12: DAEMON INSTALLATION - Long Distance Ops & Scenarios
  test('Level 12: DAEMON INSTALLATION - installs daemon and handles threats', async ({ page }) => {
    await goToLevel(page, 12);

    // Task: Navigate to '~/workspace'
    await gotoCommand(page, 'w');

    // Task: Cut '~/workspace/systemd-core'
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await page.keyboard.press('Escape');
    await pressKey(page, 'x'); // Cut
    await ensureCleanState(page);

    // Task: Navigate to '/daemons'
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');

    // Task: Paste (Install) systemd-core
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Navigate into the installed systemd-core
    await filterAndNavigate(page, 'systemd-core');

    // Clean up
    await cleanupBeforeComplete(page);

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
    await ensureCleanState(page);

    // Go to /tmp/central and paste
    await gotoCommand(page, 't'); // Go to /tmp
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p'); // Paste key_tokyo.key
    await ensureCleanState(page);

    // Node 2 (Berlin) - yank key_berlin.key
    await pressKey(page, '2');
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank key_berlin.key
    await ensureCleanState(page);

    // Paste in /tmp/central
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p');
    await ensureCleanState(page);

    // Node 3 (Sao Paulo) - yank key_saopaulo.key
    await pressKey(page, '3');
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank key_saopaulo.key
    await ensureCleanState(page);

    // Paste in /tmp/central
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p');

    // Clean up
    await cleanupBeforeComplete(page);

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
      await ensureCleanState(page);
    }

    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm
    await page.waitForTimeout(200);

    // Task 4: Permanently eliminate hidden '.config'
    await pressKey(page, '.'); // Show hidden files
    await page.waitForTimeout(200);
    await pressKey(page, 'f');
    await typeText(page, '.config');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm
    await page.waitForTimeout(200);

    // Clean up: hide hidden files and clear any filters
    await pressKey(page, '.'); // Hide hidden files again
    await cleanupBeforeComplete(page);

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
    await ensureCleanState(page); // Exit search mode

    // Navigate to /tmp/upload and paste
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'upload');
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Phase 2: Verify daemon in /daemons/systemd-core
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await filterAndNavigate(page, 'systemd-core');

    // Find uplink_v1.conf and inspect with Tab + scroll
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Tab'); // Open info panel
    await pressKey(page, 'Shift+J'); // Scroll down
    await pressKey(page, 'Shift+J');
    await pressKey(page, 'Shift+K'); // Scroll up
    await pressKey(page, 'Tab'); // Close panel
    await ensureCleanState(page);

    // Phase 3: Sanitize breadcrumb in /tmp (.ghost_process.pid)
    await gotoCommand(page, 't');
    await pressKey(page, '.'); // Toggle hidden files ON
    await page.waitForTimeout(200);
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Shift+D'); // Permanent delete
    await pressKey(page, 'y'); // Confirm
    await page.waitForTimeout(200);
    // Hide hidden files again
    await pressKey(page, '.');
    await ensureCleanState(page);

    // Phase 4: Init Upload using Zoxide jump and filter for keys
    await pressKey(page, 'Shift+Z'); // Zoxide jump
    await typeText(page, 'upload');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Filter for key to verify all fragments
    await pressKey(page, 'f');
    await typeText(page, 'key');
    await page.keyboard.press('Escape');

    // Clean up
    await cleanupBeforeComplete(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('TRANSMISSION PROTOCOL')).toBeVisible();
  });
});
