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
  assertLevelStartedIncomplete,
  assertTask,
  filterByText,
  clearFilter,
  addItem,
  renameItem,
} from './utils';

test.describe('Episode 1: AWAKENING', () => {
  test.describe('Level 1: SYSTEM AWAKENING', () => {
    test('completes all navigation tasks', async ({ page }, testInfo) => {
      await goToLevel(page, 1);
      await assertLevelStartedIncomplete(page);

      // Task 1: Calibrate sensors - Move Down (j) and Up (k)
      await pressKey(page, 'j');
      await pressKey(page, 'k');
      await assertTask(page, '1/5', testInfo.outputDir, 'calibrate_sensors');

      // Task 2: Enter ~/datastore directory (l)
      await pressKey(page, 'l');
      await assertTask(page, '2/5', testInfo.outputDir, 'enter_datastore');

      // Task 3: Preview personnel_list.txt using G (jump to bottom)
      await pressKey(page, 'Shift+g');
      await assertTask(page, '3/5', testInfo.outputDir, 'jump_to_bottom');

      // Task 4: Jump to top of file list (gg)
      await gotoCommand(page, 'g');
      await assertTask(page, '4/5', testInfo.outputDir, 'jump_to_top');

      // Task 5: Navigate to /etc using h to go up
      await pressKey(page, 'h'); // to ~ (guest home)
      await pressKey(page, 'h'); // to /home
      await pressKey(page, 'h'); // to / (root)
      await pressKey(page, 'j');
      await pressKey(page, 'j');
      await pressKey(page, 'l'); // enter etc
      await assertTask(page, '5/5', testInfo.outputDir, 'navigate_to_etc');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('SYSTEM AWAKENING')).toBeVisible();
    });
  });

  test.describe('Level 2: THREAT NEUTRALIZATION', () => {
    test('locates and deletes watcher_agent.sys', async ({ page }, testInfo) => {
      await goToLevel(page, 2);
      await assertLevelStartedIncomplete(page);

      // Task 1: Open goto dialog (g) and navigate to ~/incoming (i)
      await gotoCommand(page, 'i');
      await assertTask(page, '1/4', testInfo.outputDir, 'nav_to_incoming');

      // Task 2: Locate watcher_agent.sys (G) and inspect metadata (Tab)
      await pressKey(page, 'Shift+g');
      await pressKey(page, 'Tab');
      await assertTask(page, '2/4', testInfo.outputDir, 'locate_and_inspect');

      // Task 3: Scroll preview content with J and K
      await pressKey(page, 'Escape');
      await pressKey(page, 'Shift+j');
      await pressKey(page, 'Shift+k');
      await assertTask(page, '3/4', testInfo.outputDir, 'scroll_preview');

      // Task 4: Delete watcher_agent.sys (d, then y)
      await pressKey(page, 'd');
      await pressKey(page, 'y');
      await assertTask(page, '4/4', testInfo.outputDir, 'delete_file');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('THREAT NEUTRALIZATION')).toBeVisible();
    });
  });

  test.describe('Level 3: DATA HARVEST', () => {
    test('filters, cuts and pastes sector_map.png', async ({ page }, testInfo) => {
      await goToLevel(page, 3);
      await assertLevelStartedIncomplete(page);

      // Task 1: Preview abandoned_script.py (gd then navigate with j)
      await gotoCommand(page, 'd'); // go to datastore
      // Navigate down to abandoned_script.py (about 6 items down)
      await pressKeys(page, ['j', 'j', 'j', 'j', 'j', 'j']);
      await assertTask(page, '1/4', testInfo.outputDir, 'preview_script');

      // Task 2: Navigate to ~/incoming and find sector_map.png using filter

      await gotoCommand(page, 'i'); // go to incoming
      await filterByText(page, 'sector_map');

      // Task 3: Cut the sector_map.png (x) and clear filter (Escape)
      await pressKey(page, 'x'); // cut the file
      await clearFilter(page);
      await assertTask(page, '3/4', testInfo.outputDir, 'cut_sector_map');

      // Task 4: Go home (gh), enter ~/media, paste (p)
      await gotoCommand(page, 'h'); // go home
      // Navigate to media directory (skip hidden files if visible)
      await pressKeys(page, ['j', 'j', 'j']); // navigate to media
      await pressKey(page, 'l'); // enter media
      await pressKey(page, 'p'); // paste
      await assertTask(page, '4/4', testInfo.outputDir, 'paste_sector_map');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('DATA HARVEST')).toBeVisible();
    });
  });

  test.describe('Level 4: UPLINK ESTABLISHMENT', () => {
    test('creates directory structures and duplicates files', async ({ page }, testInfo) => {
      await goToLevel(page, 4);
      await assertLevelStartedIncomplete(page);

      // Task 1: Go to ~/datastore (gd) and create protocols/ directory
      await gotoCommand(page, 'd');

      await addItem(page, 'protocols/');
      await assertTask(page, '1/3', testInfo.outputDir, 'create_protocols_dir');

      // Task 2: Enter protocols/ and create uplink_v1.conf
      await pressKey(page, 'l');
      await addItem(page, 'uplink_v1.conf');
      await assertTask(page, '2/3', testInfo.outputDir, 'create_uplink_conf');

      // Task 3: Duplicate file (y, p) and rename to uplink_v2.conf (r)
      await pressKey(page, 'y');
      await pressKey(page, 'p');
      await renameItem(page, 'uplink_v2.conf');
      await assertTask(page, '3/3', testInfo.outputDir, 'duplicate_and_rename');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('UPLINK ESTABLISHMENT')).toBeVisible();
    });
  });

  test.describe('Level 5: CONTAINMENT BREACH', () => {
    test('selects, cuts, creates vault structure and hides files', async ({ page }, testInfo) => {
      await goToLevel(page, 5);
      await assertLevelStartedIncomplete(page);

      // Level 5 has a "QUARANTINE ALERT" overlay - dismiss it

      await page.keyboard.press('Shift+Enter'); // Dismiss alert

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

      await gotoCommand(page, 'g'); // go to top
      await pressKey(page, ' '); // select top
      await expect(activePane.locator('.text-yellow-400')).toHaveCount(1);

      await pressKey(page, 'Shift+g'); // go to bottom
      await pressKey(page, ' '); // select bottom

      // Verify 2 files selected
      await expect(activePane.locator('.text-yellow-400')).toHaveCount(2);

      await pressKey(page, 'x'); // cut both

      // Verify Task 1 complete (clipboard populated)
      // If this fails, then selection or cut failed
      await assertTask(page, '1/5', testInfo.outputDir, 'task1');

      // Task 2: Navigate to ~ (gh) and reveal hidden files (.)
      await gotoCommand(page, 'h'); // go home
      await pressKey(page, '.'); // show hidden files
      await assertTask(page, '2/5', testInfo.outputDir, 'task2');

      // Task 3: Establish ~/.config/vault/active/ sector
      // After showing hidden files, cursor is at first item
      // Order is: .cache, .config, .local, datastore...
      await expect(page.getByText('HIDDEN: ON')).toBeVisible();
      await pressKey(page, 'j'); // move to .config (from .cache)
      await pressKey(page, 'l'); // enter .config

      // Verify we are actually in .config before creating
      // yazi.toml is a child of .config, so it should be visible
      await expect(page.getByTestId('filesystem-pane-active').getByText('yazi.toml')).toBeVisible();

      await addItem(page, 'vault/active/');
      await assertTask(page, '3/5', testInfo.outputDir, 'task3');

      // Task 4: Navigate into vault/active and paste
      // After creating vault/active/, cursor is on vault (index 0) because directories sort first
      // Verify vault exists
      await expect(page.getByTestId('filesystem-pane-active').getByText('vault')).toBeVisible();
      await pressKey(page, 'l'); // enter vault

      // Verify active exists
      await expect(page.getByTestId('filesystem-pane-active').getByText('active')).toBeVisible();
      await pressKey(page, 'l'); // enter active

      await pressKey(page, 'p'); // paste files
      await assertTask(page, '4/5', testInfo.outputDir, 'task4');

      // Verify paste successful
      await expect(
        page.getByTestId('filesystem-pane-active').getByText('uplink_v1.conf')
      ).toBeVisible();

      // Task 5: Return home (gh) and hide hidden files (.)
      await gotoCommand(page, 'h'); // go home
      await pressKey(page, '.'); // hide hidden files
      await assertTask(page, '5/5', testInfo.outputDir, 'task5');

      // Verify mission complete
      await waitForMissionComplete(page);
      await expect(page.getByRole('alert').getByText('CONTAINMENT BREACH')).toBeVisible();
    });
  });
});
