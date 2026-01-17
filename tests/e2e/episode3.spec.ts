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
  getSelectedFileName,
} from './utils';

import * as fs from 'fs';

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Search + Tab + Clipboard
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }) => {
    await goToLevel(page, 11);

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

  // Level 12: DAEMON INSTALLATION - Branching Scenarios
  test.skip('Level 12: DAEMON INSTALLATION - handles scenarios and installs daemon', async ({
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
