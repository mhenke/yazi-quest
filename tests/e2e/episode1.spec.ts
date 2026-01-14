/**
 * Episode 1 Tests - Levels 1-5
 *
 * Tests for the "AWAKENING" episode covering:
 * - Level 1: SYSTEM AWAKENING - Navigation (j/k/h/l, gg/G)
 * - Level 2: THREAT NEUTRALIZATION - Inspect & Purge (Tab, J/K, d)
 * - Level 3: DATA HARVEST - Filter (f) & File Operations (x, p)
 * - Level 4: UPLINK ESTABLISHMENT - Create (a), Copy (y/p), Rename (r)
 * - Level 5: CONTAINMENT BREACH - Visual Select (Space), Cut (x), Hidden (.)
 */

import { test, expect } from '@playwright/test';
import {
  goToLevel,
  pressKey,
  pressKeys,
  typeText,
  gotoCommand,
  waitForMissionComplete,
} from './utils';

test.describe('Episode 1: AWAKENING', () => {
  test.describe('Level 1: SYSTEM AWAKENING', () => {
    test('completes all navigation tasks', async ({ page }) => {
      await goToLevel(page, 1);

      // Task 1: Calibrate sensors - Move Down (j) and Up (k)
      await pressKey(page, 'j');
      await pressKey(page, 'k');

      // Task 2: Enter ~/datastore directory (l)
      await pressKey(page, 'l');

      // Task 3: Preview personnel_list.txt using G (jump to bottom)
      await pressKey(page, 'Shift+g');
      await page.waitForTimeout(200);

      // Task 4: Jump to top of file list (gg)
      // Use evaluate to dispatch keydown events directly like the browser subagent
      await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG' }));
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG' }));
      });
      await page.waitForTimeout(300);

      // Task 5: Navigate to /etc using h to go up
      await pressKey(page, 'h'); // to ~ (guest home)
      await pressKey(page, 'h'); // to /home
      await pressKey(page, 'h'); // to / (root)
      // At root, navigate to etc (use j to go down from current position)
      await pressKey(page, 'j'); // move down
      await pressKey(page, 'j'); // to etc (bin->daemons->etc or similar)
      await pressKey(page, 'l'); // enter etc

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('SYSTEM AWAKENING')).toBeVisible();
    });
  });

  test.describe('Level 2: THREAT NEUTRALIZATION', () => {
    test('locates and deletes watcher_agent.sys', async ({ page }) => {
      await goToLevel(page, 2);

      // Task 1: Open goto dialog (g) and navigate to ~/incoming (i)
      await gotoCommand(page, 'i');

      // Task 2: Locate watcher_agent.sys (G) and inspect metadata (Tab)
      await pressKey(page, 'Shift+g'); // Jump to bottom
      await pressKey(page, 'Tab'); // Show info panel

      // Task 3: Scroll preview content with J and K
      await pressKey(page, 'Escape'); // Close info panel first
      await pressKey(page, 'Shift+j'); // Scroll preview down
      await pressKey(page, 'Shift+k'); // Scroll preview up

      // Task 4: Delete watcher_agent.sys (d, then y)
      await pressKey(page, 'd'); // Initiate delete
      await pressKey(page, 'y'); // Confirm

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('THREAT NEUTRALIZATION')).toBeVisible();
    });
  });

  test.describe('Level 3: DATA HARVEST', () => {
    test('filters, cuts and pastes sector_map.png', async ({ page }) => {
      await goToLevel(page, 3);

      // Task 1: Preview abandoned_script.py (gd then navigate with j)
      await gotoCommand(page, 'd'); // go to datastore
      // Navigate down to abandoned_script.py (about 6 items down)
      await pressKeys(page, ['j', 'j', 'j', 'j', 'j', 'j']);
      await page.waitForTimeout(200);

      // Task 2: Navigate to ~/incoming and find sector_map.png using filter
      await gotoCommand(page, 'i'); // go to incoming
      await pressKey(page, 'f'); // open filter
      await page.keyboard.type('sector_map.png', { delay: 30 });
      await page.keyboard.press('Escape'); // exit filter mode (keeps filter active)
      await page.waitForTimeout(200);

      // Task 3: Cut the sector_map.png (x) and clear filter (Escape)
      await pressKey(page, 'x'); // cut the file
      await page.keyboard.press('Escape'); // clear filter
      await page.waitForTimeout(200);

      // Task 4: Go home (gh), enter ~/media, paste (p)
      await gotoCommand(page, 'h'); // go home
      // Navigate to media directory (skip hidden files if visible)
      await pressKeys(page, ['j', 'j', 'j']); // navigate to media
      await pressKey(page, 'l'); // enter media
      await pressKey(page, 'p'); // paste

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('DATA HARVEST')).toBeVisible();
    });
  });

  test.describe('Level 4: UPLINK ESTABLISHMENT', () => {
    test('creates directory structures and duplicates files', async ({ page }) => {
      await goToLevel(page, 4);

      // Task 1: Go to ~/datastore (gd) and create protocols/ directory
      await gotoCommand(page, 'd');
      await pressKey(page, 'a'); // create
      await page.keyboard.type('protocols/', { delay: 30 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Task 2: Enter protocols/ and create uplink_v1.conf
      await pressKey(page, 'l'); // enter protocols
      await pressKey(page, 'a'); // create
      await page.keyboard.type('uplink_v1.conf', { delay: 30 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Task 3: Duplicate file (y, p) and rename to uplink_v2.conf (r)
      await pressKey(page, 'y'); // yank (copy)
      await pressKey(page, 'p'); // paste
      await page.waitForTimeout(200);
      // The cursor may be on the new file, need to rename it
      await pressKey(page, 'r'); // rename
      // Clear existing text and type new name
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type('uplink_v2.conf', { delay: 30 });
      await page.keyboard.press('Enter');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('UPLINK ESTABLISHMENT')).toBeVisible();
    });
  });

  test.describe('Level 5: CONTAINMENT BREACH', () => {
    test('selects, cuts, creates vault structure and hides files', async ({ page }) => {
      await goToLevel(page, 5);

      // Level 5 has a "QUARANTINE ALERT" overlay - dismiss it
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(300);

      // Task 1: Select both files in ~/datastore/protocols (Space) and cut (x)
      await gotoCommand(page, 'd'); // go to datastore
      await expect(page.getByTestId('filesystem-pane-active').getByText('protocols')).toBeVisible();
      await pressKey(page, 'l'); // enter protocols

      await expect(
        page.getByTestId('filesystem-pane-active').getByText('uplink_v1.conf')
      ).toBeVisible();
      await expect(
        page.getByTestId('filesystem-pane-active').getByText('uplink_v2.conf')
      ).toBeVisible();

      const activePane = page.getByTestId('filesystem-pane-active');

      // Verify no selection initially
      await expect(activePane.locator('.text-yellow-400')).toHaveCount(0);

      // Verify both files are present in the list
      await expect(activePane.getByRole('listitem')).toHaveCount(2);

      await page.keyboard.type('gg'); // go to top
      await page.waitForTimeout(100);
      await page.keyboard.press(' '); // select top
      await expect(activePane.locator('.text-yellow-400')).toHaveCount(1);

      await page.keyboard.press('G'); // go to bottom
      await page.waitForTimeout(100);
      await page.keyboard.press(' '); // select bottom

      // Verify 2 files selected
      await expect(activePane.locator('.text-yellow-400')).toHaveCount(2);

      await page.keyboard.press('x'); // cut both
      await page.waitForTimeout(200);

      // Verify Task 1 complete (clipboard populated)
      // If this fails, then selection or cut failed
      await expect(page.getByText('Tasks: 1/5')).toBeVisible();

      // Task 2: Navigate to ~ (gh) and reveal hidden files (.)
      await gotoCommand(page, 'h'); // go home
      await pressKey(page, '.'); // show hidden files
      await page.waitForTimeout(200);

      // Task 3: Establish ~/.config/vault/active/ sector
      // After showing hidden files, cursor is at first item
      // Order is: .cache, .config, .local, datastore...
      await expect(page.getByText('HIDDEN: ON')).toBeVisible();
      await pressKey(page, 'j'); // move to .config (from .cache)
      await pressKey(page, 'l'); // enter .config

      // Verify we are actually in .config before creating
      // yazi.toml is a child of .config, so it should be visible
      await expect(page.getByTestId('filesystem-pane-active').getByText('yazi.toml')).toBeVisible();

      await pressKey(page, 'a'); // create
      await page.keyboard.type('vault/active/', { delay: 30 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Task 4: Navigate into vault/active and paste
      // After creating vault/active/, cursor is on vault (index 0) because directories sort first
      // Verify vault exists
      await expect(page.getByTestId('filesystem-pane-active').getByText('vault')).toBeVisible();
      await pressKey(page, 'l'); // enter vault

      // Verify active exists
      await expect(page.getByTestId('filesystem-pane-active').getByText('active')).toBeVisible();
      await pressKey(page, 'l'); // enter active

      await pressKey(page, 'p'); // paste files
      await page.waitForTimeout(200);

      // Verify paste successful
      await expect(
        page.getByTestId('filesystem-pane-active').getByText('uplink_v1.conf')
      ).toBeVisible();

      // Task 5: Return home (gh) and hide hidden files (.)
      await gotoCommand(page, 'h'); // go home
      await pressKey(page, '.'); // hide hidden files

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('CONTAINMENT BREACH')).toBeVisible();
    });
  });
});
