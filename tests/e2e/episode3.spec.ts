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
  assertTask,
} from './utils';

import * as fs from 'fs';

// Helper for common Level 12 mission steps (DRY)
// Uses short filters for robust navigation (27 keys total)
async function runLevel12Mission(page: Page) {
  // 1) gw to workspace (2 keys)
  await gotoCommand(page, 'w');
  await page.waitForTimeout(500);

  // 2) . to show hidden files (1 key)
  await pressKey(page, '.');
  await page.waitForTimeout(200);

  // 3) Filter to identity (f .i Enter = 4 keys)
  await pressKey(page, 'f');
  await typeText(page, '.i');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);

  // 4) Scroll 6 times to read (6 keys)
  for (let i = 0; i < 6; i++) {
    await pressKey(page, 'Shift+J');
    await page.waitForTimeout(50);
  }

  // 5) Clear filter (Esc = 1 key)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 6) Filter to systemd-core (f sy Enter = 4 keys)
  await pressKey(page, 'f');
  await typeText(page, 'sy');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);

  // 7) x (Cut = 1 key)
  await pressKey(page, 'x');
  await page.waitForTimeout(200);

  // Clear the filter after cutting (Esc = 1 key)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 8) . to hide files (1 key)
  await pressKey(page, '.');
  await page.waitForTimeout(200);

  // 9) Navigate to daemons and install (gr j l p l = 6 keys)
  await gotoCommand(page, 'r');
  await page.waitForTimeout(300);
  await pressKey(page, 'j');
  await page.waitForTimeout(100);
  await pressKey(page, 'l');
  await page.waitForTimeout(200);
  await pressKey(page, 'p');
  await page.waitForTimeout(500);
  await pressKey(page, 'l');
  await page.waitForTimeout(200);
}

test.describe('Episode 3: MASTERY', () => {
  // Level 11: DAEMON RECONNAISSANCE - Search + Tab + Clipboard
  test('Level 11: DAEMON RECONNAISSANCE - completes reconnaissance', async ({ page }, testInfo) => {
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);

    // 1. Reinitialize if needed
    const reinitButton = page.getByRole('button', { name: 'REINITIALIZE' });
    if (await reinitButton.isVisible()) {
      await reinitButton.click();
    }

    // 2. Navigate to root
    await gotoCommand(page, 'r');
    await assertTask(page, '0/4', testInfo.outputDir, 'nav_to_root');

    // 3. Search "service"
    await pressKey(page, 's');
    await typeText(page, 'service');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await assertTask(page, '0/4', testInfo.outputDir, 'search_service');

    // 4. Sort by modified (Shift+M)
    await pressKey(page, ',');
    await page.keyboard.down('Shift');
    await page.keyboard.press('M');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(500);
    await assertTask(page, '1/4', testInfo.outputDir, 'sort_modified');

    // 5. Select items
    await pressKey(page, ' ');
    await pressKey(page, ' ');
    await assertTask(page, '2/4', testInfo.outputDir, 'select_files');

    // 7. Yank
    await pressKey(page, 'y');
    await page.waitForTimeout(500);
    await assertTask(page, '3/4', testInfo.outputDir, 'yank_files');

    // 8. Exit search and reset sort
    await page.keyboard.press('Escape');
    await pressKey(page, ',');
    await pressKey(page, 'n');
    await page.waitForTimeout(300);

    // 10. Navigate to daemons and paste
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await pressKey(page, 'p');
    await assertTask(page, '4/4', testInfo.outputDir, 'paste_files');

    await waitForMissionComplete(page);
  });

  // Level 12: DAEMON INSTALLATION - Scenario A1 (Clean Run)
  test('Level 12: scen-a1 (Clean Run) - installs daemon with identity discovery', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-a1');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(300);
    await assertLevelStartedIncomplete(page);

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 12: Scenario A3 (Dependency Error)
  test('Level 12: scen-a3 (Dependency Error) - deletes lib_error.log and installs daemon', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-a3');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(500);
    await assertLevelStartedIncomplete(page);

    await pressKey(page, 'Shift+Enter'); // Dismiss threat
    await page.waitForTimeout(300);

    await gotoCommand(page, 'w');
    await pressKey(page, 'f');
    await typeText(page, 'lib_error');
    await page.keyboard.press('Enter');
    await pressKey(page, 'd');
    await page.keyboard.press('y');
    await assertTask(page, '0/5', testInfo.outputDir, 'delete_threat');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 12: Scenario A2 (Bitrot)
  test('Level 12: scen-a2 (Bitrot) - deletes hidden core_dump.tmp and installs daemon', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-a2');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(500);
    await assertLevelStartedIncomplete(page);

    await pressKey(page, 'Shift+Enter');
    await gotoCommand(page, 'c');
    await pressKey(page, 'f');
    await typeText(page, 'dump');
    await page.keyboard.press('Enter');
    await pressKey(page, 'd');
    await page.keyboard.press('y');
    await assertTask(page, '0/5', testInfo.outputDir, 'delete_threat');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 12: Scenario B1 (Traffic Alert)
  test('Level 12: scen-b1 (Traffic Alert) - deletes alert_traffic.log and installs daemon', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-b1');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(300);
    await assertLevelStartedIncomplete(page);

    await pressKey(page, 'Shift+Enter');
    await gotoCommand(page, 'w');
    await pressKey(page, 'f');
    await typeText(page, 'traffic');
    await page.keyboard.press('Enter');
    await pressKey(page, 'd');
    await page.keyboard.press('y');
    await assertTask(page, '0/5', testInfo.outputDir, 'delete_threat');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 12: Scenario B2 (Remote Tracker)
  test('Level 12: scen-b2 (Remote Tracker) - deletes trace_packet.sys and installs daemon', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-b2');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(500);
    await assertLevelStartedIncomplete(page);

    await pressKey(page, 'Shift+Enter');
    await gotoCommand(page, 'i');
    await pressKey(page, 'f');
    await typeText(page, 'packet');
    await page.keyboard.press('Enter');
    await pressKey(page, 'd');
    await page.keyboard.press('y');
    await assertTask(page, '0/5', testInfo.outputDir, 'delete_threat');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 12: Scenario B3 (Heuristic Swarm)
  test('Level 12: scen-b3 (Heuristic Swarm) - deletes scattered scan files and installs daemon', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lvl=12&scenario=scen-b3');
    await page.waitForLoadState('networkidle');
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      await skipButton.click({ timeout: 2000 });
    } catch {}
    await page.waitForTimeout(300);
    await assertLevelStartedIncomplete(page);

    await pressKey(page, 'Shift+Enter');
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'scan_');
    await page.keyboard.press('Enter');
    await pressKey(page, 'Control+A');
    await pressKey(page, 'd');
    await page.keyboard.press('Enter');
    await assertTask(page, '0/5', testInfo.outputDir, 'delete_swarm');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await runLevel12Mission(page);
    await assertTask(page, '5/5', testInfo.outputDir, 'mission_complete');

    await waitForMissionComplete(page);
  });

  // Level 13: DISTRIBUTED CONSCIOUSNESS
  test('Level 13: DISTRIBUTED CONSCIOUSNESS - gathers distributed keys via search', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000);
    await goToLevel(page, 13);
    await assertLevelStartedIncomplete(page);

    await gotoCommand(page, 'r');
    for (let i = 0; i < 4; i++) await pressKey(page, 'j');
    await pressKey(page, 'l');
    await pressKey(page, '.');
    await pressKey(page, 's');
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await assertTask(page, '0/5', testInfo.outputDir, 'search_keys');

    await pressKey(page, 'Control+A');
    await pressKey(page, 'x');
    await page.keyboard.press('Escape');

    await gotoCommand(page, 'w');
    if (
      !(await page.getByTestId('filesystem-pane-active').textContent())?.includes(
        '.identity.log.enc'
      )
    ) {
      await pressKey(page, '.');
    }
    await pressKey(page, 'f');
    await typeText(page, 'identity');
    await page.keyboard.press('Enter');
    for (let i = 0; i < 20; i++) await pressKey(page, 'Shift+J');
    await assertTask(page, '4/5', testInfo.outputDir, 'discover_identity');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await pressKey(page, 'g');
    await pressKey(page, 'g');
    await pressKey(page, 'l');
    await pressKey(page, 'p');
    await assertTask(page, '5/5', testInfo.outputDir, 'paste_keys');

    await pressKey(page, 'Shift+Enter');
    await waitForMissionComplete(page);
  });

  // Level 15: TRANSMISSION PROTOCOL
  test.skip('Level 15: TRANSMISSION PROTOCOL - completes the cycle', async ({ page }, testInfo) => {
    await goToLevel(page, 15);
    await assertLevelStartedIncomplete(page);

    // Phase 1: Assemble keys
    await gotoCommand(page, 'r');
    await pressKey(page, 's');
    await typeText(page, 'key');
    await page.keyboard.press('Enter');
    await pressKey(page, 'Control+A');
    await pressKey(page, 'y');
    await page.keyboard.press('Escape');

    await gotoCommand(page, 't');
    await filterAndNavigate(page, 'upload');
    await pressKey(page, 'p');
    await assertTask(page, '1/4', testInfo.outputDir, 'assemble_keys');

    // Phase 2: Verify daemon
    await gotoCommand(page, 'r');
    await filterAndNavigate(page, 'daemons');
    await filterAndNavigate(page, 'systemd-core');
    await pressKey(page, 'f');
    await typeText(page, 'uplink_v1');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Tab');
    await pressKey(page, 'Shift+J');
    await assertTask(page, '2/4', testInfo.outputDir, 'verify_daemon');
    await pressKey(page, 'Tab');
    await page.keyboard.press('Escape');

    // Phase 3: Sanitize
    await gotoCommand(page, 't');
    await pressKey(page, '.');
    await pressKey(page, 'f');
    await typeText(page, 'ghost');
    await page.keyboard.press('Escape');
    await pressKey(page, 'Shift+D');
    await page.keyboard.press('y');
    await assertTask(page, '3/4', testInfo.outputDir, 'sanitize');
    await page.keyboard.press('Escape');
    await pressKey(page, '.');

    // Phase 4: Upload
    await pressKey(page, 'Shift+Z');
    await typeText(page, 'upload');
    await page.keyboard.press('Enter');
    await pressKey(page, 'f');
    await typeText(page, 'key');
    await page.keyboard.press('Escape');
    await assertTask(page, '4/4', testInfo.outputDir, 'initiate_upload');

    await page.keyboard.press('Escape');
    await waitForMissionComplete(page);
  });
});
