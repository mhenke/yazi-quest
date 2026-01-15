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
} from './utils';

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Search + Tab + Clipboard
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }) => {
    await goToLevel(page, 11);

    // Objective 1: Search for service files from root
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, '.service');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Objective 2: Inspect metadata with Tab
    await pressKey(page, 'Tab');
    await page.waitForTimeout(400);
    await pressKey(page, 'j');
    await page.waitForTimeout(300);
    await pressKey(page, 'j');
    await page.waitForTimeout(300);
    await pressKey(page, 'j');
    await page.waitForTimeout(300);
    await pressKey(page, 'Tab'); // Close panel

    // Objective 3: Select and yank 2 LEGACY files (> 30 days)
    // Safe: network.service, cron.service, legacy-backup.service, .syslog.service
    await pressKey(page, 'f');
    await typeText(page, 'network.service');
    await page.keyboard.press('Escape');
    await pressKey(page, ' '); // Select

    await pressKey(page, 'f');
    await typeText(page, 'cron.service');
    await page.keyboard.press('Escape');
    await pressKey(page, ' '); // Select

    await pressKey(page, 'y'); // Yank both
    await page.keyboard.press('Escape'); // Exit search mode

    // Objective 4: Navigate to /daemons and paste
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON RECONNAISSANCE')).toBeVisible();
  });

  // Level 12: DAEMON INSTALLATION - Branching Scenarios
  test('Level 12: DAEMON INSTALLATION - handles scenarios and installs daemon', async ({
    page,
  }) => {
    // Use scen-a1 (clean run) - no threat files spawn, simplest path
    await page.goto('/?lvl=12&scenario=scen-a1');
    await page.waitForLoadState('networkidle');
    // Skip intro if present
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
      // Intro may not be present
    }
    await page.waitForTimeout(300);

    // scen-a1 is "Clean Run" - no threat files spawn
    // Main objectives: navigate to workspace, cut systemd-core, navigate to /daemons, paste, enter

    // Step 1: Navigate to workspace
    await gotoCommand(page, 'w');
    await page.waitForTimeout(200);

    // Verify we're in workspace
    const systemdItem = page.getByTestId('filesystem-pane-active').getByText('systemd-core');
    await expect(systemdItem).toBeVisible({ timeout: 3000 });

    // Step 2: Filter to systemd-core and cut it
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'x');
    await page.waitForTimeout(200);

    // Step 3: Navigate to root
    await gotoCommand(page, 'r');
    await page.waitForTimeout(200);

    // Step 4: Navigate to /daemons
    await pressKey(page, 'f');
    await typeText(page, 'daemons');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'l');
    await page.waitForTimeout(200);

    // Step 5: Paste systemd-core
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Step 6: Enter systemd-core to complete the level
    await pressKey(page, 'f');
    await typeText(page, 'systemd-core');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'l');
    await page.waitForTimeout(200);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 13: DISTRIBUTED CONSCIOUSNESS - Nested Hidden Keys
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys', async ({ page }) => {
    await goToLevel(page, 13);

    // Keys are now nested and hidden (.key_tokyo.key in tokyo/sector_7/logs/, etc.)
    // Use search from /nodes to find all hidden keys

    // Toggle hidden files first
    await pressKey(page, '.');
    await page.waitForTimeout(200);

    // Search for .key files
    await pressKey(page, 's');
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Select all 3 keys and yank
    await pressKey(page, 'Control+A');
    await pressKey(page, 'y');
    await page.keyboard.press('Escape'); // Exit search

    // Navigate to /tmp/central and paste
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // All 4 tasks should now be complete (3 extract + 1 synchronize)
    await expect(page.getByText('Tasks: 4/')).toBeVisible();

    // Optional: Discover Identity task - skip for faster test
    // Hide hidden files for protocol compliance
    await pressKey(page, '.');
    await page.keyboard.press('Escape');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DISTRIBUTED CONSCIOUSNESS')).toBeVisible();
  });

  // Level 14: EVIDENCE PURGE
  test('Level 14: EVIDENCE PURGE - sterilizes guest partition', async ({ page }) => {
    await goToLevel(page, 14);

    // Objective 1: Return home
    await gotoCommand(page, 'h');
    await expect(page.getByText('Tasks: 1/4')).toBeVisible();

    // Objective 2: Create 3 decoys
    for (let i = 1; i <= 3; i++) {
      await pressKey(page, 'a');
      await typeText(page, `decoy_${i}/`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    await expect(page.getByText('Tasks: 2/4')).toBeVisible();

    // Objective 3: Permanently delete visible dirs
    const targets = ['datastore', 'incoming', 'media', 'workspace'];
    for (const target of targets) {
      await filterAndSelect(page, target);
      await page.keyboard.press('Escape');
    }
    await pressKey(page, 'Shift+D');
    await page.keyboard.press('y');
    await page.waitForTimeout(200);
    await expect(page.getByText('Tasks: 3/4')).toBeVisible();

    // Objective 4: Delete .config last
    await pressKey(page, '.');
    await page.waitForTimeout(200);
    await filterAndSelect(page, '.config');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Shift+D');
    await page.keyboard.press('y');

    await expect(page.getByText('Tasks: 4/4')).toBeVisible();

    // Compliance
    await pressKey(page, '.'); // Hide files

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('EVIDENCE PURGE')).toBeVisible();
  });

  // Level 15: TRANSMISSION PROTOCOL
  test('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }) => {
    await goToLevel(page, 15);

    // Phase 1: Assemble keys in /tmp/upload using search
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    await pressKey(page, 'Control+A');
    await pressKey(page, 'y');
    await page.keyboard.press('Escape'); // Exit search
    await page.waitForTimeout(200);

    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'upload');
    await pressKey(page, 'p');
    await expect(page.getByText('Tasks: 1/4')).toBeVisible();

    // Phase 2: Verify daemon in /daemons/systemd-core
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await filterAndNavigate(page, 'systemd-core');

    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1');
    await page.keyboard.press('Escape');

    await pressKey(page, 'Tab');
    await pressKey(page, 'Shift+J');
    await pressKey(page, 'Shift+K');
    await expect(page.getByText('Tasks: 2/4')).toBeVisible();
    await pressKey(page, 'Tab'); // Close panel
    await page.keyboard.press('Escape'); // Clear filter

    // Phase 3: Sanitize breadcrumb in /tmp
    await gotoCommand(page, 't');
    await pressKey(page, '.');
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Shift+D');
    await page.keyboard.press('y');
    await page.waitForTimeout(200);
    await expect(page.getByText('Tasks: 3/4')).toBeVisible();
    await page.keyboard.press('Escape');
    await pressKey(page, '.');

    // Phase 4: Initiate upload with Zoxide + Filter
    await pressKey(page, 'Shift+Z');
    await typeText(page, 'upload');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    await pressKey(page, 'f');
    await typeText(page, 'key');
    await page.keyboard.press('Escape');

    await expect(page.getByText('Tasks: 4/4')).toBeVisible();

    // Clear final filter for compliance
    await page.keyboard.press('Escape');

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('TRANSMISSION PROTOCOL')).toBeVisible();
  });
});
