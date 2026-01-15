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

  // Level 13: DISTRIBUTED CONSCIOUSNESS - Nested Hidden Keys
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys', async ({ page }) => {
    await goToLevel(page, 13);

    // One-Swoop Strategy:
    // 1. Navigate to root
    await gotoCommand(page, 'r');
    await page.waitForTimeout(300);

    // 2. Toggle hidden files visibility (leaves them on for protocol violation test)
    await pressKey(page, '.');
    await page.waitForTimeout(300);

    // 3. Search for all .key fragments
    await pressKey(page, 's');
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // Give time for search results to populate

    // 4. Select all results and yank
    await pressKey(page, 'Control+A');
    await page.waitForTimeout(200);
    await pressKey(page, 'y');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); // Exit search view (returns to root)
    await page.waitForTimeout(300);

    // 5. Navigate to the central relay (/tmp/central)
    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'central');
    await page.waitForTimeout(300);

    // 6. Paste fragments
    await pressKey(page, 'p');
    await page.waitForTimeout(1000); // Wait for paste and task updates

    // 7. Verify task progress (4 main tasks complete, 1 optional remaining)
    await expect(page.getByText(/Tasks: 4\/5/)).toBeVisible();

    // 8. Resolve Protocol Violation (Shift+Enter to auto-fix hidden files warning)
    await pressKey(page, 'Shift+Enter');
    await page.waitForTimeout(500);

    // 9. Final Shift+Enter to advance level (mission complete dialog now visible)
    await pressKey(page, 'Shift+Enter');
    await page.waitForTimeout(500);

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
  test.skip('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }) => {
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
