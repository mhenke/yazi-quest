/**
 * Episode 1 Tests - Levels 1-5
 *
 * Tests for the "AWAKENING" episode covering:
 * - Level 1: SYSTEM AWAKENING - Navigation (j/k/h/l, gg/G)
 * - Level 2: THREAT NEUTRALIZATION - Inspect & Purge (Tab, K/J, d)
 * - Level 3: DATA HARVEST - Filter (f) & File Operations (x, p)
 * - Level 4: UPLINK ESTABLISHMENT - Create (a), Copy (y/p), Rename (r)
 * - Level 5: CONTAINMENT BREACH - Visual Select (Space), Cut (x), Hidden (.)
 */

import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  gotoCommand,
  assertTask,
  filterByText,
  addItem,
  renameItem,
  dismissAlertIfPresent,
  expectNarrativeThought,
  confirmMission,
  navigateDown,
  navigateUp,
  navigateRight,
  enterDirectory,
  expectCurrentDir,
  getCurrentPath,
  waitForMissionComplete,
} from './utils';

test.describe('Episode 1: AWAKENING', () => {
  test.setTimeout(60000);

  test.describe('Level 1: SYSTEM AWAKENING', { tag: '@smoke' }, () => {
    test(`Level 1: SYSTEM AWAKENING - completes all navigation tasks`, async ({
      page,
    }, testInfo) => {
      await startLevel(page, 1, { intro: false });

      // Task 1: Calibrate sensors - Move Down (j) and Up (k)
      await navigateDown(page, 1);
      await navigateUp(page, 1);
      await assertTask(page, '1/5', testInfo.outputDir, 'calibrate_sensors');

      // Task 2: Enter ~/datastore directory (l)
      // datastore is at position 0 in the home directory, so no navigation needed
      await navigateRight(page, 1);

      await assertTask(page, '2/5', testInfo.outputDir, 'enter_datastore');

      // Task 3: Preview personnel_list.txt using G (jump to bottom)
      // Navigate to personnel_list.txt first
      await navigateDown(page, 22); // Navigate down to personnel_list.txt
      // Set the preview flags first
      await pressKey(page, 'Shift+J'); // Scroll preview down (sets usedPreviewDown flag)
      await pressKey(page, 'Shift+K'); // Scroll preview up (sets usedPreviewUp flag)
      // Press G to set usedG flag (this moves cursor to bottom and resets preview flags)
      await pressKey(page, 'Shift+G');
      // Now navigate back to personnel_list.txt
      await filterByText(page, 'personnel_list.txt');
      await pressKey(page, 'Escape'); // Clear filter to return to normal view with file selected
      // Now set the preview flags again (since G reset them)
      await pressKey(page, 'Shift+J'); // Scroll preview down (sets usedPreviewDown flag again)
      await pressKey(page, 'Shift+K'); // Scroll preview up (sets usedPreviewUp flag again)
      // Also press 'k' as mentioned in the task description
      await pressKey(page, 'k'); // Move up (sets usedUp flag)
      // Now all flags should be true and cursor should be on personnel_list.txt
      await assertTask(page, '3/5', testInfo.outputDir, 'preview_personnel_list');

      // Task 4: Jump to top of file list (gg)
      await gotoCommand(page, 'g');
      await assertTask(page, '4/5', testInfo.outputDir, 'jump_to_top');

      // Navigate up until we reach root '/'
      // Use native keyboard events for robustness
      await page
        .locator('[data-testid^="file-"]')
        .first()
        .click({ timeout: 1000 })
        .catch(() => page.click('body'));
      await page.waitForTimeout(200);

      // Robustly navigate to root
      let attempts = 0;
      while ((await getCurrentPath(page)) !== '/' && attempts < 10) {
        await page.keyboard.press('h');
        await page.waitForTimeout(250);
        attempts++;
      }

      await expectCurrentDir(page, '/', true); // Root is displayed as '/'

      await enterDirectory(page, 'var');
      await expectCurrentDir(page, '/var');
      await assertTask(page, '5/5', testInfo.outputDir, 'navigate_to_var');

      // Verify mission complete
      await confirmMission(page, /SYSTEM AWAKENING/i);
    });
  });

  test.describe('Level 2: THREAT NEUTRALIZATION', () => {
    test('locates and deletes watcher_agent.sys', async ({ page }, testInfo) => {
      await startLevel(page, 2, { intro: false });
      await expectNarrativeThought(page, 'Must Purge. One less eye watching me.');

      // Task 1: l, G (shift+g) - navigate to log directory and use G
      await enterDirectory(page, 'log'); // We start in /var
      await pressKey(page, 'Shift+G'); // Use G (Shift+G) to view the file
      await assertTask(page, '1/5', testInfo.outputDir, 'recon_watchdog');

      // Task 2: gm - explore mail directory and find the email about Katie Ortega's Heuristic Engine v1.1
      await gotoCommand(page, 'm'); // Use gm to go to mail
      await enterDirectory(page, 'kortega'); // Navigate to Katie Ortega's mailbox

      // Navigate to the specific email file (2025-11-15-heuristic-upgrade.eml)
      // The files in kortega are sorted alphabetically:
      // 1. 2025-10-26-keystroke-anomaly.eml
      // 2. 2025-10-28-watchdog-hysteresis.eml
      // 3. 2025-11-15-heuristic-upgrade.eml  <- We need to be on this one
      // 4. 2025-11-23-anomaly-avoidance.eml
      // 5. 2025-11-27-the-last-breach-revisited.eml
      await navigateDown(page, 2); // Move to the 3rd file (index 2)
      await pressKey(page, 'Tab'); // View specific email
      await assertTask(page, '2/5', testInfo.outputDir, 'explore_mail');
      await pressKey(page, 'Tab'); // Close it

      // Task 3: gi - use goto command to jump to ~/incoming
      await gotoCommand(page, 'i'); // Use gi to go to incoming
      await assertTask(page, '3/5', testInfo.outputDir, 'nav_to_incoming');

      // Task 4: Navigate to watcher_agent.sys and inspect it
      // Go to the bottom of the list where watcher_agent.sys should be
      await pressKey(page, 'Shift+G'); // Go to bottom of list
      await pressKey(page, 'Tab'); // Use Tab to inspect the file
      await assertTask(page, '4/5', testInfo.outputDir, 'locate_and_inspect');

      // Additional preview actions - scroll preview using J and K
      // These actions are effectively part of the "inspection" but don't trigger a new task completion
      // accurately, so we remain at 4/5.
      await pressKey(page, 'Escape'); // Close info panel if open
      await pressKey(page, 'Shift+j'); // Scroll preview down with J
      await pressKey(page, 'Shift+k'); // Scroll preview up with K
      await assertTask(page, '4/5', testInfo.outputDir, 'scroll_preview');

      // Task 5: d, y - delete the file
      await pressKey(page, 'd'); // Mark for deletion with 'd'
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 500 }); // Wait for confirmation modal
      await pressKey(page, 'y'); // Confirm deletion with 'y'
      await assertTask(page, '5/5', testInfo.outputDir, 'delete_file');

      // Verify mission complete
      await confirmMission(page, /RECONNAISSANCE & EXTRACTION/i);
    });
  });

  test.describe('Level 3: DATA HARVEST', () => {
    test('filters, cuts and pastes sector_map.png', async ({ page }, testInfo) => {
      await startLevel(page, 3, { intro: false });
      await expectNarrativeThought(page, 'Breadcrumbs... he was here. I am not the first.');

      // Task 1: gd, then 4*j - go to datastore and navigate down 4 times
      await gotoCommand(page, 'd'); // go to datastore (gd)
      await navigateDown(page, 4); // 4*j to reach abandoned_script.py
      await assertTask(page, '1/4', testInfo.outputDir, 'preview_script');

      // Task 2: gi, f, type 'sector_map.png' then Enter
      await gotoCommand(page, 'i'); // go to incoming (gi)
      await filterByText(page, 'sector_map.png'); // Use filter utility to find the file (cleaner approach)
      await assertTask(page, '2/4', testInfo.outputDir, 'filter_sector_map');

      // Task 3: x, ESC - cut file and clear filter
      await pressKey(page, 'x'); // cut the file (x)
      await page.keyboard.press('Escape'); // ESC to clear filter
      await assertTask(page, '3/4', testInfo.outputDir, 'cut_sector_map');

      // Task 4: gh, 2*j, l, p - go home, navigate to media, enter, paste
      await gotoCommand(page, 'h'); // go home (gh)
      await navigateDown(page, 2); // 2*j to navigate to media
      await navigateRight(page, 1); // l (right arrow) to enter media directory
      await pressKey(page, 'p'); // paste (p)
      await assertTask(page, '4/4', testInfo.outputDir, 'paste_sector_map');

      // Verify mission complete
      await confirmMission(page, 'DATA HARVEST');
    });
  });

  test.describe('Level 4: UPLINK ESTABLISHMENT', () => {
    test('creates directory structures and duplicates files', async ({ page }, testInfo) => {
      await startLevel(page, 4, { intro: false });

      // Task 1: Go to ~/datastore (gd) and create protocols/ directory
      await gotoCommand(page, 'd');

      await addItem(page, 'protocols/');
      await assertTask(page, '1/3', testInfo.outputDir, 'create_protocols_dir');

      // Task 2: Enter protocols/ and create uplink_v1.conf
      await navigateRight(page, 1);
      await addItem(page, 'uplink_v1.conf');
      await assertTask(page, '2/3', testInfo.outputDir, 'create_uplink_conf');

      // Task 3: Duplicate file (y, p) and rename to uplink_v2.conf (r)
      await pressKey(page, 'y');
      await pressKey(page, 'p');
      await renameItem(page, 'uplink_v2.conf');
      await assertTask(page, '3/3', testInfo.outputDir, 'duplicate_and_rename');

      // Verify mission complete
      await confirmMission(page, 'UPLINK ESTABLISHMENT');
    });
  });

  test.describe('Level 5: CONTAINMENT BREACH', { tag: '@smoke' }, () => {
    test('selects, cuts, creates vault structure and hides files', async ({ page }, _testInfo) => {
      await startLevel(page, 5, { intro: false });
      // press shift+enter to dismiss alert dialog
      await dismissAlertIfPresent(page);

      // 1) gd, l, space, space, x
      await gotoCommand(page, 'd');
      await navigateRight(page, 1);
      await pressKey(page, ' ');
      await pressKey(page, ' ');
      await pressKey(page, 'x');
      await assertTask(page, '1/5');

      // 2) gh, press . then k*2, l
      await gotoCommand(page, 'h');
      await pressKey(page, '.');
      await navigateUp(page, 2);
      await navigateRight(page, 1);
      await assertTask(page, '2/5');

      // 3) a, type 'vault/active/', enter
      await addItem(page, 'vault/active/');
      await assertTask(page, '3/5');

      // 4) l, l, p
      await navigateRight(page, 2);
      await pressKey(page, 'p');
      await assertTask(page, '4/5');

      // 5) gh, then .
      await gotoCommand(page, 'h');
      await pressKey(page, '.');

      await waitForMissionComplete(page);
    });
  });

  test.describe('Level Advancement with Shift+Enter', () => {
    test('verifies Shift+Enter properly advances from Level 1 to Level 2', async ({ page }) => {
      // Start at Level 1 and complete it
      await startLevel(page, 1, { intro: false });

      // Complete all tasks for Level 1
      await navigateDown(page, 1);
      await navigateUp(page, 1);
      await assertTask(page, '1/5', 'temp', 'calibrate_sensors');

      await navigateRight(page, 1); // Enter datastore
      await assertTask(page, '2/5', 'temp', 'enter_datastore');

      await filterByText(page, 'personnel_list.txt');
      await pressKey(page, 'Escape');
      await pressKey(page, 'Shift+J');
      await pressKey(page, 'Shift+K');
      await pressKey(page, 'Shift+G');
      await pressKey(page, 'k');
      await assertTask(page, '3/5', 'temp', 'preview_personnel_list');

      await gotoCommand(page, 'g');
      await assertTask(page, '4/5', 'temp', 'jump_to_top');

      let attempts = 0;
      while ((await getCurrentPath(page)) !== '/' && attempts < 10) {
        await page.keyboard.press('h');
        await page.waitForTimeout(250);
        attempts++;
      }
      await expectCurrentDir(page, '/', true);
      await enterDirectory(page, 'var');
      await assertTask(page, '5/5', 'temp', 'navigate_to_var');

      // Wait for the mission complete dialog to appear
      await expect(page.getByTestId('mission-complete')).toBeVisible({ timeout: 1000 });

      // Use Shift+Enter to advance to the next level
      await page.keyboard.press('Shift+Enter');

      // Verify we've moved to Level 2 by checking for Level 2's initial conditions
      await expect(page.getByText('RECONNAISSANCE & EXTRACTION').first()).toBeVisible({
        timeout: 1000,
      });

      // Verify that the mission complete dialog is no longer visible
      await expect(page.getByTestId('mission-complete')).not.toBeVisible();
    });
  });
});
