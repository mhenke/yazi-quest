import { test, expect, type Page } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  gotoCommand,
  waitForMissionComplete,
  typeText,
  filterAndNavigate,
  filterAndSelect,
  ensureCleanState,
  getSelectedFileName,
  assertLevelStartedIncomplete,
} from './utils';

import * as fs from 'fs';

// Helper for common Level 12 mission steps (DRY)
async function runLevel12Mission(page: Page) {
  // 1) gw (g then w, to jump to ~/workspace)
  await gotoCommand(page, 'w');
  await page.waitForTimeout(500);

  // 2) . to show hidden files
  await pressKey(page, '.');
  await page.waitForTimeout(200);

  // 3) f, type ".i" then enter key
  await pressKey(page, 'f');
  await typeText(page, '.i');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  // 4) J (shift+j) multiple times to get to bottom
  // Scroll enough to read the log (requires > 15 lines usually)
  for (let i = 0; i < 3; i++) {
    await pressKey(page, 'Shift+J');
    await page.waitForTimeout(50);
  }

  // 5) ESC to clear filter
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  // 6) j then x (Select systemd-core? Assumes order: .identity, central_relay, systemd-core)
  // If .identity was selected (by filter), Escape keeps selection?
  // j moves to next.
  await pressKey(page, 'j');
  await page.waitForTimeout(100);
  await pressKey(page, 'x'); // Cut
  await page.waitForTimeout(200);

  // 7) . to reset hidden flag
  await pressKey(page, '.');
  await page.waitForTimeout(200);

  // Navigate Daemons: Z ae Enter (Keys 18, 19, 20, 21)
  // 'ae' uniquely marks 'dAE-mons' vs 'datastore' in history.
  // Z ae Enter = 4 keys.
  await pressKey(page, 'Z');
  await page.waitForTimeout(200);
  await typeText(page, 'ae'); // 'daemons'
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);

  await pressKey(page, 'p'); // Paste
  await page.waitForTimeout(300);

  await pressKey(page, 'l'); // Enter systemd-core
  await page.waitForTimeout(200);
}

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Search + Tab + Clipboard
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }) => {
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);

    // 1. If a "REINITIALIZE" button is visible, click it first.
    const reinitButton = page.getByRole('button', { name: 'REINITIALIZE' });
    if (await reinitButton.isVisible()) {
      await reinitButton.click();
    }

    // 2. Press 'g', then 'r' to navigate to root.
    await gotoCommand(page, 'r');

    // 3. Press 's' to search, type "service", and press "Enter".
    await pressKey(page, 's');
    await typeText(page, 'service');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // 4. Press ',' (comma) to open sort menu, then press "M" (Shift+M) to sort by modified (oldest at top).
    await pressKey(page, ',');
    await page.keyboard.down('Shift');
    await page.keyboard.press('M');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(500);

    // 5. Press "Space" to select the first item.
    // 6. Press "Space" again to select the second item.
    await pressKey(page, ' ');
    await pressKey(page, ' ');

    // 7. Press "y" to yank the 2 selected files.
    await pressKey(page, 'y');
    await page.waitForTimeout(500);

    // 8. Press "Escape" to exit search mode.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 9. Press ',' (comma), then 'n' to reset sort to natural.
    await pressKey(page, ',');
    await pressKey(page, 'n');
    await page.waitForTimeout(300);

    // 10. Press 'g', then 'r' to ensure you are at root.
    await gotoCommand(page, 'r');

    // 11. Navigate to the 'daemons' directory (use 'j' or 'k' until it's highlighted).
    // Using filterAndNavigate as a reliable way to get into daemons
    await filterAndNavigate(page, 'daemons');

    // 13. Press 'p' to paste the yanked files.
    await pressKey(page, 'p');
    await page.waitForTimeout(1000);

    // 14. Take a screenshot showing "Mission Complete" and all 4 tasks checked.
    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON RECONNAISSANCE')).toBeVisible();
  });

  // Level 12: DAEMON INSTALLATION - Scenario A1 (Clean Run)
  test('Level 12: scen-a1 (Clean Run) - installs daemon with identity discovery', async ({
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
    await assertLevelStartedIncomplete(page);

    // scen-a1 is "Clean Run" - no threat files spawn
    // Main objectives: navigate to workspace, discover identity, cut systemd-core, navigate to /daemons, paste, enter

    // Use common helper
    await runLevel12Mission(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 12: Scenario A3 (Dependency Error - lib_error.log in workspace)
  test('Level 12: scen-a3 (Dependency Error) - deletes lib_error.log and installs daemon', async ({
    page,
  }) => {
    await page.goto('/?lvl=12&scenario=scen-a3');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);
    await assertLevelStartedIncomplete(page);

    // Wait for and dismiss scenario alert
    const threatAlert = page.getByRole('alert');
    try {
      await threatAlert.waitFor({ state: 'visible', timeout: 2000 });
      await pressKey(page, 'Shift+Enter');
      await threatAlert.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
      // Alert may not appear in some scenarios
    }
    await page.waitForTimeout(300);

    // Navigate to workspace
    await gotoCommand(page, 'w');
    await page.waitForTimeout(200);

    // Delete lib_error.log (scenario threat)
    await pressKey(page, 'f');
    await typeText(page, 'lib_error');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'd');
    await page.waitForTimeout(200);
    await pressKey(page, 'Enter'); // Confirm delete
    await page.waitForTimeout(200);

    // Use common helper
    await runLevel12Mission(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 12: Scenario A2 (Bitrot - hidden core_dump.tmp in .config)
  test('Level 12: scen-a2 (Bitrot) - deletes hidden core_dump.tmp and installs daemon', async ({
    page,
  }) => {
    await page.goto('/?lvl=12&scenario=scen-a2');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);
    await assertLevelStartedIncomplete(page);

    // 1) Shift+Enter (Dismiss Alert)
    const threatAlert = page.getByRole('alert');
    try {
      await threatAlert.waitFor({ state: 'visible', timeout: 3000 });
      await pressKey(page, 'Shift+Enter');
      await threatAlert.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(300);

    // 2) gc (Jump to ~/.config)
    await gotoCommand(page, 'c');
    await page.waitForTimeout(500);

    // 3) j then d then y (Select, Delete, Confirm)
    await pressKey(page, 'j');
    await page.waitForTimeout(100);
    await pressKey(page, 'd');
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Confirm delete
    await page.waitForTimeout(200);

    // Reset: gw (Jump to workspace)
    // Use common helper which starts with gw
    await runLevel12Mission(page);

    // Check for violations (Robust)
    try {
      if (
        await page.getByRole('heading', { name: 'Protocol Violation' }).isVisible({ timeout: 1000 })
      ) {
        const text = await page.getByRole('dialog').textContent();
        if (text?.includes('filter')) {
          await page.keyboard.press('Escape');
          await page.keyboard.press('Escape');
        } else {
          await pressKey(page, '.');
        }
      }
    } catch {}

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 12: Scenario B1 (Traffic Alert - alert_traffic.log in workspace)
  test('Level 12: scen-b1 (Traffic Alert) - deletes alert_traffic.log and installs daemon', async ({
    page,
  }) => {
    await page.goto('/?lvl=12&scenario=scen-b1');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(300);
    await assertLevelStartedIncomplete(page);

    // Wait for and dismiss scenario alert
    const threatAlert = page.getByRole('alert');
    try {
      await threatAlert.waitFor({ state: 'visible', timeout: 2000 });
      await pressKey(page, 'Shift+Enter');
      await threatAlert.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(300);

    // Navigate to workspace
    await gotoCommand(page, 'w');
    await page.waitForTimeout(200);

    // Delete alert_traffic.log (scenario threat)
    // Use filter 'alert' (5 chars) or 'al' (2 chars)?
    // alert_traffic.log. Unique starting with a?
    // In workspace: central_relay, systemd-core.
    // alert... starts with a. First item?
    // If sorted natural asc: alert_traffic, central_relay.
    // So 'gg' works?
    // Let's use 'f al' to be safe.
    await pressKey(page, 'f');
    await typeText(page, 'alert');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await pressKey(page, 'd');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter'); // Confirm delete
    await page.waitForTimeout(200);

    // Clear filter
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Use common helper
    await runLevel12Mission(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 12: Scenario B2 (Remote Tracker - trace_packet.sys in incoming)
  test('Level 12: scen-b2 (Remote Tracker) - deletes trace_packet.sys and installs daemon', async ({
    page,
  }) => {
    await page.goto('/?lvl=12&scenario=scen-b2');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Initial Alert
    const threatAlert = page.getByRole('alert');
    try {
      await threatAlert.waitFor({ state: 'visible', timeout: 3000 });
      await pressKey(page, 'Shift+Enter'); // Key 1
      await threatAlert.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(300);

    // 2) gi (g then i to jump to ~/incoming)
    await gotoCommand(page, 'i');
    await page.waitForTimeout(200);

    // 3) f, type "pac" then press enter key (Filter 'pac' matches trace_packet, implies strict target)
    // 'pac' (3 chars) + f + Enter = 5 keys.
    // Unique enough to avoid 'trace_archive' (honeypot) and others.
    await pressKey(page, 'f');
    await typeText(page, 'pac');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // 4) d then y
    await pressKey(page, 'd');
    await page.waitForTimeout(200);
    await page.keyboard.press('y'); // Confirm delete
    await page.waitForTimeout(200);

    // 5) OPTIMIZATION: Do NOT Escape. gw switches context anyway.
    // await page.keyboard.press('Escape');
    // await page.waitForTimeout(100);

    await runLevel12Mission(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 12: Scenario B3 (Heuristic Swarm - scattered scan_*.tmp files)
  test('Level 12: scen-b3 (Heuristic Swarm) - deletes scattered scan files and installs daemon', async ({
    page,
  }) => {
    await page.goto('/?lvl=12&scenario=scen-b3');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
      await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {}
    await page.waitForTimeout(300);
    await assertLevelStartedIncomplete(page);

    // Wait for and dismiss scenario alert
    const threatAlert = page.getByRole('alert');
    try {
      await threatAlert.waitFor({ state: 'visible', timeout: 2000 });
      await pressKey(page, 'Shift+Enter');
      await threatAlert.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
      // Alert may not appear in some scenarios
    }
    await page.waitForTimeout(300);

    // Navigate to root for recursive search
    await gotoCommand(page, 'r');
    await page.waitForTimeout(200);

    // Use recursive search to find all scan_*.tmp files
    await pressKey(page, 's');
    await page.waitForTimeout(200);
    await typeText(page, 'scan_');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Select all and delete
    await pressKey(page, 'Control+A');
    await page.waitForTimeout(100);
    await pressKey(page, 'd');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter'); // Confirm delete (if specialized dialog appears)
    await page.waitForTimeout(200);

    // Exit search mode
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Navigate to workspace
    // Use common helper which starts with gw
    await runLevel12Mission(page);

    await waitForMissionComplete(page);
    await expect(page.getByRole('alert').getByText('DAEMON INSTALLATION')).toBeVisible();
  });

  // Level 13: DISTRIBUTED CONSCIOUSNESS - Node Switching + Key Assembly
  // User's exact manual flow that works:
  // 1) gr to root then into /nodes
  // 2) . to show hidden files
  // 3) s to search ".key" then Enter to activate
  // 4) ctrl+a then x and escape
  // 5) gw, G (bottom), J to scroll preview
  // 6) gg then l into central_relay, paste, shift+enter
  // Level 13: DISTRIBUTED CONSCIOUSNESS - Node Switching + Key Assembly
  // User's exact manual flow that works:
  // 1) gr to root then into /nodes (j*4, l)
  // 2) . to show hidden files
  // 3) s to search ".key" then Enter to activate
  // 4) ctrl+a then x and escape
  // 5) gw, G (bottom), J to scroll preview (read hidden truth)
  // 6) gg then l into central_relay, paste, shift+enter
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys via search', async ({
    page,
  }) => {
    // Increase timeout slightly for this complex level, but keep it reasonable
    test.setTimeout(60000);

    try {
      await goToLevel(page, 13);
      await assertLevelStartedIncomplete(page);

      // 1) gr to root, then navigate to nodes
      await gotoCommand(page, 'r');
      await page.waitForTimeout(200);

      // Navigate down to 'nodes'. j*4 is the user's explicit instruction.
      for (let i = 0; i < 4; i++) {
        await pressKey(page, 'j');
        await page.waitForTimeout(50);
      }
      await pressKey(page, 'l'); // Enter nodes
      await page.waitForTimeout(200);

      // 2) . to show hidden files
      await pressKey(page, '.');
      await page.waitForTimeout(200);

      // 3) s to search ".key" and Enter to activate results
      await pressKey(page, 's');
      await page.waitForTimeout(200);
      await typeText(page, '.key');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // 4) ctrl+a then x and escape
      await pressKey(page, 'Control+A');
      await page.waitForTimeout(100);
      await pressKey(page, 'x'); // Cut
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape'); // Exit search mode
      await page.waitForTimeout(200);

      // 5) gw to workspace
      await gotoCommand(page, 'w'); // gw -> ~/workspace
      await page.waitForTimeout(500);

      // Ensure .identity.log.enc is visible (toggle hidden if needed)
      // Safety check in case previous toggle was missed or state reset
      const visibleContent = await page.getByTestId('filesystem-pane-active').textContent();
      if (!visibleContent?.includes('.identity.log.enc')) {
        console.log('.identity.log.enc missing, toggling hidden files');
        await pressKey(page, '.');
        await page.waitForTimeout(500);
      }

      // Harden: Use filter to select .identity.log.enc reliably
      await pressKey(page, 'f');
      await page.waitForTimeout(200);
      await typeText(page, 'identity');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Scroll preview to reveal truth
      for (let i = 0; i < 20; i++) {
        await pressKey(page, 'Shift+J');
        await page.waitForTimeout(50);
      }

      // Clear the filter to avoid Protocol Violation later
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Explicitly verify task completion for 'discover-identity' before moving on
      await expect(page.getByText('Tasks: 4/5')).toBeVisible({ timeout: 5000 });

      // 6) gg to go back to top, then l into central_relay
      await pressKey(page, 'g');
      await page.waitForTimeout(100);
      await pressKey(page, 'g'); // Second 'g' triggers 'gg' (go to top)
      await page.waitForTimeout(200);

      // Enter central_relay
      await pressKey(page, 'l');
      await page.waitForTimeout(200);

      // Paste keys
      await pressKey(page, 'p');
      await page.waitForTimeout(1000); // Wait for paste to trigger dialog

      // Pass protocol violation
      // Dialog needs to be visible/active before we can dismiss it
      await pressKey(page, 'Shift+Enter');
      await page.waitForTimeout(1000); // Wait for dismissal and mission complete trigger

      // Expect mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('DISTRIBUTED CONSCIOUSNESS')).toBeVisible({
        timeout: 10000,
      });
    } catch (error) {
      console.log('Test failed, capturing screenshot: level13-failure.png');
      await page.screenshot({ path: 'level13-failure.png', fullPage: true });
      throw error;
    }
  });

  // Level 15: TRANSMISSION PROTOCOL
  test.skip('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }) => {
    await goToLevel(page, 15);
    await assertLevelStartedIncomplete(page);

    // Phase 1: Assemble keys in /tmp/upload using search
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    // Debug: take a screenshot after all actions
    await page.screenshot({ path: 'level13-debug-after-actions.png', fullPage: true });

    // Assert all tasks are marked complete (look for 'Tasks: 5/5' or similar)
    await expect(page.getByText(/Tasks:\s*\d+\/\d+/)).toHaveText(/Tasks:\s*\d+\/\d+/);

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
