import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  pressKeys,
  gotoCommand,
  expectCurrentDir,
  filterAndSelect,
  deleteItem,
  navigateDown,
  enterDirectory,
} from './utils';

test.describe('Game Mechanics & Failures', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `/home/mhenke/.gemini/antigravity/brain/${testInfo.title.replace(/\s+/g, '_')}_fail.png`;
      await page.screenshot({ path: screenshotPath });
    }
  });
  test('Shell Collapse: Deleting critical system directory triggers Game Over', async ({
    page,
  }, _testInfo) => {
    // Start Level 2 (allows shortcuts like gr)
    await startLevel(page, 2);

    // Navigate to Root
    await gotoCommand(page, 'r');
    await expectCurrentDir(page, '/');

    // Select a critical folder (e.g., 'bin')
    // Note: 'bin' must be in the initial filesystem list for this to work
    await filterAndSelect(page, 'bin');

    // Attempt recursive delete
    // We use permanant delete (D) to bypass trash can logic if possible, or simple delete (d + y)
    await deleteItem(page, { permanent: true, confirm: true });

    // Expect Game Over Modal with "SHELL COLLAPSE"
    await expect(page.getByText('SHELL COLLAPSE')).toBeVisible();
    await expect(page.getByText('CRITICAL SYSTEM FAILURE')).toBeVisible();
    await expect(page.getByText('User environment destabilized')).toBeVisible();
  });

  test('L9 Trap: Deleting system_monitor.pid triggers Game Over', async ({ page }) => {
    await startLevel(page, 9);

    // 1. Go to /tmp
    await gotoCommand(page, 't');

    // 2. Select honeypot
    await filterAndSelect(page, 'system_monitor.pid');

    // 3. Delete
    await pressKeys(page, ['Shift+D', 'y']); // Permanent Delete and confirm

    // 4. Expect Game Over
    await expect(page.getByRole('heading', { name: /TRAP ACTIVATED/i })).toBeVisible();
  });

  // Note: L14 Honeypot test removed - Level 14 (STERILIZATION) now bypasses all honeypots
  // to allow "purging everything" as the narrative requires.

  test('L11 Honeypot: Selecting recent service does not complete task', async ({
    page,
  }, _testInfo) => {
    await startLevel(page, 11, { intro: false });

    // Verify where we are. L11 starts in /daemons.
    // If not, go there.
    const path = await page.locator('.breadcrumb').textContent();
    if (path !== 'daemons') {
      if (path === '/') {
        await enterDirectory(page, 'daemons');
      } else {
        await gotoCommand(page, 'r');
        await enterDirectory(page, 'daemons');
      }
    }

    // Ensure hidden files are shown (optional but good for visibility)
    await pressKey(page, '.');

    // Select 'security-audit.service' directly from the file list
    // This avoids search mode complexity
    await filterAndSelect(page, 'security-audit.service');

    // 4. Cut it (x) - Level 11 Task 3 requires 'cut'
    // This should trigger the "too recent" thought AND the honeypot notification
    await pressKey(page, 'x');

    // Narrative check: "SCAN: This signature is too recent..."
    // Wait longer as notification might delay thought rendering
    // Narrative check: "HONEYPOT TRIGGERED" alert
    // Wait longer as notification might delay thought rendering
    const alert = page.getByText(/HONEYPOT TRIGGERED/i).first();
    await expect(alert).toBeVisible({ timeout: 5000 });

    // Optional: Dismiss it to clean up
    await pressKey(page, 'Shift+Enter');
  });

  test('Toggling hidden files preserves cursor position', async ({ page }) => {
    await startLevel(page, 1, { intro: false });

    // Ensure the game is ready
    await expect(page.getByTestId('status-bar')).toBeVisible();

    // 1. Navigate down to the 3rd item (index 2)
    await navigateDown(page, 2);

    // 2. Identify current file via data-testid
    const currentFile = page.locator('[aria-current="location"]');
    const fileName = await currentFile.getAttribute('data-testid');
    expect(fileName).toBeTruthy();

    // 3. Toggle hidden files ('.')
    await pressKey(page, '.');

    // 4. Verify cursor is still on the same file
    const postToggleFile = page.locator('[aria-current="location"]');
    await expect(postToggleFile).toHaveAttribute('data-testid', fileName!);

    // 5. Toggle hidden files back
    await pressKey(page, '.');
    await expect(page.locator('[aria-current="location"]')).toHaveAttribute(
      'data-testid',
      fileName!
    );
  });
});
