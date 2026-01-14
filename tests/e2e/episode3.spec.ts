import { test, expect } from '@playwright/test';
import { goToLevel, pressKey, gotoCommand, waitForMissionComplete, typeText } from './utils';

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Metadata (Tab)
  test('Level 11: DAEMON RECONNAISSANCE - inspects metadata and selects safe files', async ({
    page,
  }) => {
    await goToLevel(page, 11);

    // Task 1: Jump to '/daemons'
    // 'daemons' is at root logic usually, but let's check hint or navigate manually
    // Hint says "Jump to /daemons" (gd?) - or just nav
    // daemons is likely in root.
    await gotoCommand(page, 'r'); // root

    // Find daemons
    // It's likely one of the folders.
    // Let's filter to find it quickly
    await pressKey(page, 'f');
    await typeText(page, 'daemons');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');

    // Task 2: Inspect metadata (Tab) of at least 3 files
    // We need to tab on 3 diff files.
    await pressKey(page, 'Tab'); // Open info
    await page.waitForTimeout(100);
    await pressKey(page, 'j'); // Next file
    await page.waitForTimeout(100);
    await pressKey(page, 'j'); // Next file
    // That should count as 3 inspections (current + next + next while panel open?)
    // Or open/close? Efficient way is nav while open.
    await pressKey(page, 'Tab'); // Close info

    // Task 3: Select 2 SAFE (Legacy) files.
    // Safe: cron-legacy.service, backup-archive.service, syslog-old.service
    // Traps: security-audit, auth-guard, etc.
    // We need to SELECT them.

    // Select cron-legacy.service
    await pressKey(page, 'f');
    await typeText(page, 'cron-legacy');
    await pressKey(page, 'Escape');
    await pressKey(page, ' '); // Select
    await pressKey(page, 'Escape'); // Clear filter

    // Select backup-archive.service
    await pressKey(page, 'f');
    await typeText(page, 'backup-archive');
    await pressKey(page, 'Escape');
    await pressKey(page, ' '); // Select
    await pressKey(page, 'Escape'); // Clear filter

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON RECONNAISSANCE')).toBeVisible();
  });

  // Level 12: DAEMON INSTALLATION - Long Distance Ops & Scenarios
  test('Level 12: DAEMON INSTALLATION - installs daemon and handles threats', async ({ page }) => {
    await goToLevel(page, 12);

    // Task 1: Navigate to '~/workspace'
    await gotoCommand(page, 'w'); // goto workspace

    // Handle Potential Scenarios (A3/B1/B3) in workspace
    // If 'alert_traffic.log' exists (B1), delete it
    // If 'scan*.tmp' exists (B3), delete trigger
    // If 'lib_error.log' exists (A3), delete it
    // We'll try to find and delete ANY of these if they exist.
    // Easiest is to select all logical candidates and delete if present?
    // Or just filter for them.

    const threats = [
      'alert_traffic.log',
      'lib_error.log',
      'scan_a.tmp',
      'scan_b.tmp',
      'scan_c.tmp',
    ];
    for (const threat of threats) {
      // Try check if visible (requires knowing if we are looking at them)
      // We can blindly filter and delete if found?
      // But filter failures might interrupt flow.
      // We can check page content text.
      if (await page.getByText(threat).isVisible()) {
        await pressKey(page, 'f');
        await typeText(page, threat.split('.')[0]); // partial
        await pressKey(page, 'Escape');
        await pressKey(page, 'Shift+D'); // Permanent delete to be sure? Or d?
        // Task says "Delete" usually implies 'd' or 'D'.
        // Level 14 teaches 'D'. But prompt for B1 says "Delete ...!".
        await pressKey(page, 'Enter'); // Confirm if prompted (or y?)
        // Usually 'd' -> 'y'. 'Shift+D' -> 'y'.
        // Let's use 'd' + 'y'.
        await pressKey(page, 'd');
        await pressKey(page, 'y');
        await pressKey(page, 'Escape'); // Clear filter
      }
    }

    // Task 2: Cut '~/workspace/systemd-core'
    // We are in workspace.
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await pressKey(page, 'Escape');
    await pressKey(page, 'x'); // Cut
    await pressKey(page, 'Escape'); // Clear filter

    // Task 3: Navigate to '/daemons'
    await gotoCommand(page, 'r');
    await pressKey(page, 'f');
    await typeText(page, 'daemons');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');

    // Task 4: Paste (Install) and Navigate into it
    await pressKey(page, 'p');

    // Enter it
    await pressKey(page, 'Enter'); // Assumes paste selects it or we filter
    // If paste deselects, we might need to find it.
    // Paste usually places cursor on pasted item? In Yazi yes?
    // Let's filter to be safe.
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 13: DISTRIBUTED CONSCIOUSNESS - Node Switching (1, 2, 3)
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - synchronizes keys across nodes', async ({ page }) => {
    await goToLevel(page, 13);

    // Start in Tokyo (Node 1)

    // Task: Assemble keys in /tmp/central
    // Strategy: 1 -> yank -> paste to /tmp/central -> 2 -> yank -> paste...

    // Node 1 (Tokyo)
    await pressKey(page, '1'); // Ensure we are in Tokyo
    // Key is part_a.key
    // Yank it
    await pressKey(page, 'y'); // Assumes cursor is on the key (only file?)

    // Go to tmp/central
    await gotoCommand(page, 't');
    await pressKey(page, 'Enter'); // enter tmp (if gt goes to /tmp parent? No gt goes TO /tmp usually)
    // gt -> /tmp. So just look for central
    await pressKey(page, 'f');
    await typeText(page, 'central');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');
    await pressKey(page, 'p');

    // Node 2 (Berlin)
    await pressKey(page, '2');
    await pressKey(page, 'y'); // Yank part_b

    // Go to tmp/central
    // We can just press '1' to go back to Tokyo context where we were in central?
    // No, switching nodes changes CWD?
    // The hint implies "switch between terminal contexts".
    // In this game level, 1/2/3 likely jumps to those folders OR swaps contexts.
    // If it swaps contexts, then context 1 is in Tokyo?
    // Wait, task says "Access all 3 nodes... Assemble in /tmp/central".
    // If contexts are independent, I can leave one context in /tmp/central?
    // Let's try:
    // Context 1: Go to Tokyo, Yank, Go to /tmp/central, Paste.
    // Context 2: Go to Berlin, Yank.
    // Context 1: Paste? No, Clipboard is shared?
    // Efficiency tip says "Clipboard persists across navigation".
    // Does it persist across contexts? Hopefully.

    // Let's assume linear flows if contexts confuse us.
    // But we MUST visit 1, 2, 3 to complete Task 1.

    // Node 2 flow
    await gotoCommand(page, 't');
    await pressKey(page, 'Enter'); // /tmp -> central?
    // Should use filter to be robust
    await pressKey(page, 'f');
    await typeText(page, 'central');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');
    await pressKey(page, 'p');

    // Node 3 (Sao Paulo)
    await pressKey(page, '3');
    await pressKey(page, 'y'); // Yank part_c

    await gotoCommand(page, 't');
    await pressKey(page, 'f');
    await typeText(page, 'central');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');
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

    await pressKey(page, 'a');
    await typeText(page, 'decoy_2/');
    await pressKey(page, 'Enter');

    await pressKey(page, 'a');
    await typeText(page, 'decoy_3/');
    await pressKey(page, 'Enter');

    // Task 3: Permanently delete visible dirs (D, y)
    // datastore, incoming, media, workspace
    // Batch select
    const targets = ['datastore', 'incoming', 'media', 'workspace'];
    for (const target of targets) {
      await pressKey(page, 'f');
      await typeText(page, target);
      await pressKey(page, 'Escape');
      await pressKey(page, ' '); // Select
      await pressKey(page, 'Escape'); // Clear filter
    }

    await pressKey(page, 'Shift+D');
    await pressKey(page, 'y'); // Confirm

    // Task 4: Permanently eliminate hidden '.config'
    await pressKey(page, '.'); // Show hidden
    await pressKey(page, 'f');
    await typeText(page, '.config');
    await pressKey(page, 'Escape');

    await pressKey(page, 'Shift+D');
    await pressKey(page, 'y');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('EVIDENCE PURGE')).toBeVisible();
  });

  // Level 15: TRANSMISSION PROTOCOL - Final Exam
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }) => {
    await goToLevel(page, 15);

    // Phase 1: Search (s) for keys in /nodes, Copy (y), Paste in /tmp/upload
    // Assuming file persistence, I might need to nav to /nodes first if 's' depends on CWD?
    // Recursive search works from current dir down.
    // If we are at ~/, we might not find /nodes/keys if nodes is in /root.
    // Jump to root first
    await gotoCommand(page, 'r');

    await pressKey(page, 's');
    await typeText(page, 'key'); // Finds .key files
    await pressKey(page, 'Enter');
    await page.waitForTimeout(500);

    await pressKey(page, 'Control+A'); // Select all keys
    await pressKey(page, 'y'); // Copy
    await pressKey(page, 'Escape'); // Exit search

    // Paste in /tmp/upload
    await gotoCommand(page, 't'); // /tmp
    await pressKey(page, 'f');
    await typeText(page, 'upload');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');
    await pressKey(page, 'p');

    // Phase 2: Verify daemon (Tab + J/K) in /daemons/systemd-core
    await gotoCommand(page, 'r');
    await pressKey(page, 'f');
    await typeText(page, 'daemons');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');

    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Enter');

    // Find uplink_v1.conf
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1.conf');
    await pressKey(page, 'Escape');

    // Tab and scroll
    await pressKey(page, 'Tab'); // Info
    await pressKey(page, 'Shift+J'); // Scroll down
    await pressKey(page, 'Shift+J');
    await pressKey(page, 'Shift+K'); // Scroll up
    await pressKey(page, 'Tab'); // Close info

    // Phase 3: Sanitize breadcrumb in /tmp (.ghost_process.pid)
    await gotoCommand(page, 't');
    await pressKey(page, '.'); // Show hidden
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await pressKey(page, 'Escape');
    // ghost_process.pid (hidden)
    await pressKey(page, 'Shift+D');
    await pressKey(page, 'y');

    // Phase 4: Init Upload (Z -> upload, f -> key)
    await pressKey(page, 'Shift+Z');
    await typeText(page, 'upload');
    await pressKey(page, 'Enter');

    // Filter for key
    await pressKey(page, 'f');
    await typeText(page, 'key');
    await pressKey(page, 'Escape');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('TRANSMISSION PROTOCOL')).toBeVisible();
  });
});
