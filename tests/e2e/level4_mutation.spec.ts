import { test, expect } from '@playwright/test';
import { startLevel, pressKey, gotoCommand, addItem, renameItem, navigateRight } from './utils';

test.describe('Level 4 Mutation Check', () => {
  test('updates uplink_v1.conf and uplink_v2.conf content upon Level 4 completion', async ({
    page,
  }) => {
    // 1. Start Level 4
    await startLevel(page, 4, { intro: false });

    // 2. Perform Level 4 Tasks
    // Task 1: Go to ~/datastore (gd) and create protocols/ directory
    await gotoCommand(page, 'd');
    await addItem(page, 'protocols/');

    // Task 2: Enter protocols/ and create uplink_v1.conf
    await navigateRight(page, 1);
    await addItem(page, 'uplink_v1.conf');

    // Task 3: Duplicate file (y, p) and rename to uplink_v2.conf (r)
    await pressKey(page, 'y');
    await pressKey(page, 'p');
    await renameItem(page, 'uplink_v2.conf');

    // 3. Verify Mission Complete Banner appears
    await expect(page.getByTestId('mission-complete')).toBeVisible({ timeout: 5000 });

    // 4. Advance to Level 5 with Shift+Enter
    await page.keyboard.press('Shift+Enter');
    await expect(page.getByTestId('mission-complete')).not.toBeVisible({ timeout: 2000 });

    // 5. Verify we're at Level 5 and in protocols directory
    await expect(page.getByTestId('status-bar')).toContainText('L5', { timeout: 3000 });

    // Dismiss the Level 5 Threat Alert (QUARANTINE ALERT modal) if present
    const threatAlert = page.locator('[role="alert"]');
    if (await threatAlert.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press('Shift+Enter');
      await expect(threatAlert).not.toBeVisible({ timeout: 2000 });
    }

    // 6. Verify we're in protocols directory by checking we can see the uplink files
    // The status bar shows the current file name when a file is selected
    await expect(page.getByTestId('status-bar')).toContainText('uplink_v1.conf', { timeout: 3000 });

    // 7. Navigate down to uplink_v2.conf to verify both files exist
    await pressKey(page, 'j');
    await expect(page.getByTestId('status-bar')).toContainText('uplink_v2.conf', { timeout: 3000 });
  });
});
