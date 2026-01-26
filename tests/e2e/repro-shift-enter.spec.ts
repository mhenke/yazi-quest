import { test, expect } from '@playwright/test';
import {
  startLevel,
  assertLevel,
  pressKey,
  typeText,
  assertTask,
  gotoCommand,
  filterByText,
  navigateRight,
  addItem,
  areHiddenFilesVisible,
  expectCurrentDir,
  ensureCleanState,
} from './utils';

test.describe('Reproduction: Shift+Enter Dismissal', () => {
  test('Level 13 completion should be dismissible via Shift+Enter', async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await startLevel(page, 13, { intro: false });
    await assertLevel(page, '13');

    // 1. Acquire keys
    await gotoCommand(page, 'r');
    await filterByText(page, 'nodes');
    await navigateRight(page, 1);
    await pressKey(page, '.'); // Show hidden

    await pressKey(page, 's'); // Enter search mode
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid^="file-"][data-testid$=".key"]')).toHaveCount(3);
    await pressKey(page, 'Control+A');
    await pressKey(page, 'x'); // Cut

    // Clear search to continue
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await assertTask(page, '1/4', testInfo.outputDir);

    // 2. Create relay
    await gotoCommand(page, 'w');
    await addItem(page, 'central_relay/');
    await assertTask(page, '2/4', testInfo.outputDir);

    // 3. Paste
    await filterByText(page, 'central_relay');
    await navigateRight(page, 1);
    await pressKey(page, 'p');
    await assertTask(page, '3/4', testInfo.outputDir);

    // 4. Audit
    await pressKey(page, 'h'); // Go back to workspace
    await expectCurrentDir(page, 'workspace');
    await ensureCleanState(page);

    // Ensure hidden visible
    if (!(await areHiddenFilesVisible(page))) {
      await pressKey(page, '.');
      await page.waitForTimeout(500);
    }

    await filterByText(page, '.identity');
    // Ensure the identity file is selected
    await expect(
      page.getByTestId('filesystem-pane-active').getByText('.identity.log.enc')
    ).toBeVisible({ timeout: 5000 });

    for (let i = 0; i < 15; i++) {
      await pressKey(page, 'Shift+J');
    }
    await assertTask(page, '4/4', testInfo.outputDir);

    // Now all tasks are done. Trigger a violation.
    await pressKey(page, 'f');
    await typeText(page, 'id');
    await page.keyboard.press('Enter');

    // Attempt navigation back to trigger modal
    await pressKey(page, 'h');
    await expect(page.getByText(/PROTOCOL VIOLATION/i)).toBeVisible();

    // Check for "Shift+Enter to continue"
    // This will work now because allowAutoFix uses checkAllTasksComplete
    await expect(page.getByText(/Press Shift\+Enter to continue\.\.\./i)).toBeVisible();

    // Dismiss it
    await page.keyboard.press('Shift+Enter');

    // Verify it's gone and SuccessToast is visible
    await expect(page.getByText(/Sector Cleared/i)).toBeVisible();
  });
});
