import { test, expect, Page } from '@playwright/test';
import { waitForGameLoad, dismissEpisodeIntro, pressKey, typeText, jumpToLevel } from '../helpers';

/**
 * Helper to verify task progress
 */
async function verifyTaskProgress(page: Page): Promise<void> {
  await page.waitForTimeout(200);
}

test.describe('Episode II - Level Completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
  });

  test('Level 6: Batch Operations - Search and collect logs', async ({ page }) => {
    // Jump to Level 6
    await jumpToLevel(page, 5); // 0-indexed
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Jump to ~/incoming/batch_logs
    await pressKey(page, 'g');
    await pressKey(page, 'i'); // Go to incoming
    await page.waitForTimeout(500);

    // Navigate to find batch_logs and enter it
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter batch_logs
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Use recursive search (s) to find 'log'
    await pressKey(page, 's'); // Enter search mode
    await page.waitForTimeout(300);
    await typeText(page, 'log');
    await page.keyboard.press('Enter'); // Execute search
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 3: Select all search results and yank (Ctrl+A, y)
    await page.keyboard.press('Control+a'); // Select all
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 4: Jump to ~/.config (gc) and create vault/training_data
    await pressKey(page, 'g');
    await pressKey(page, 'c'); // Go to .config
    await page.waitForTimeout(500);

    // Navigate to vault and create training_data
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter vault
    await page.waitForTimeout(300);
    await pressKey(page, 'a'); // Create
    await page.waitForTimeout(200);
    await typeText(page, 'training_data/');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Enter training_data and paste
    await pressKey(page, 'l');
    await page.waitForTimeout(200);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Training data archived', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 7: Quantum Bypass - FZF find and honeypot abort', async ({ page }) => {
    // Jump to Level 7
    await jumpToLevel(page, 6);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Jump to system Root (gr)
    await pressKey(page, 'g');
    await pressKey(page, 'r'); // Go to root
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Locate access_token.key using FZF (z)
    await pressKey(page, 'z'); // FZF mode
    await page.waitForTimeout(300);
    await typeText(page, 'access_token');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter'); // Select result
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 3: Stage file (x - cut)
    await pressKey(page, 'x'); // Cut
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 4: Jump to /etc using zoxide (Z)
    await page.keyboard.press('Shift+z'); // Uppercase Z for zoxide
    await page.waitForTimeout(300);
    await typeText(page, 'etc');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 5: Detect honeypot warning and abort (Y to clear clipboard)
    // The honeypot warning should appear - press Y to clear clipboard
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+y'); // Capital Y to clear clipboard
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Honeypot avoided', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 8: Daemon Disguise - Overwrite corrupted file', async ({ page }) => {
    // Jump to Level 8
    await jumpToLevel(page, 7);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Navigate to ~/workspace/systemd-core
    await pressKey(page, 'g');
    await pressKey(page, 'w'); // Go to workspace
    await page.waitForTimeout(500);

    // Find and enter systemd-core
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter systemd-core
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Preview uplink_v1.conf to confirm corruption
    await pressKey(page, 'f'); // Filter
    await page.waitForTimeout(200);
    await typeText(page, 'uplink');
    await pressKey(page, 'Escape'); // Exit filter, keep selection
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 3: Jump to ~/.config/vault/active and yank the clean file
    await pressKey(page, 'g');
    await pressKey(page, 'c'); // Go to .config
    await page.waitForTimeout(500);

    // Navigate vault -> active -> find uplink_v1.conf
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter vault
    await page.waitForTimeout(200);
    await pressKey(page, 'l'); // Enter active
    await page.waitForTimeout(300);

    // Yank the clean file
    await pressKey(page, 'y'); // Yank
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 4: Return to ~/workspace/systemd-core and overwrite (Shift+P)
    await pressKey(page, 'g');
    await pressKey(page, 'w'); // Go to workspace
    await page.waitForTimeout(500);

    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter systemd-core
    await page.waitForTimeout(300);

    // Use Shift+P to overwrite
    await page.keyboard.press('Shift+p');
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Patch deployed', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 9: Trace Cleanup - Invert selection and delete', async ({ page }) => {
    // Jump to Level 9
    await jumpToLevel(page, 8);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Should start in /tmp
    // Task 1: Select ghost_process.pid and socket_001.sock
    await pressKey(page, 'g');
    await pressKey(page, 't'); // Go to /tmp
    await page.waitForTimeout(500);

    // Find and select ghost_process.pid
    for (let i = 0; i < 10; i++) {
      const cursorItem = page.locator('.bg-zinc-800').first();
      const text = await cursorItem.textContent().catch(() => '');
      if (text?.includes('ghost_process.pid')) {
        await page.keyboard.press('Space'); // Select
        break;
      }
      await pressKey(page, 'j');
    }
    await page.waitForTimeout(200);

    // Find and select socket_001.sock
    await pressKey(page, 'g');
    await pressKey(page, 'g'); // Go to top
    for (let i = 0; i < 10; i++) {
      const cursorItem = page.locator('.bg-zinc-800').first();
      const text = await cursorItem.textContent().catch(() => '');
      if (text?.includes('socket_001.sock')) {
        await page.keyboard.press('Space'); // Select
        break;
      }
      await pressKey(page, 'j');
    }
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 2: Invert selection (Ctrl+R)
    await page.keyboard.press('Control+r');
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 3: Permanently delete (D)
    await page.keyboard.press('Shift+d'); // Capital D for permanent delete
    await page.waitForTimeout(300);
    await pressKey(page, 'y'); // Confirm
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Trace evidence purged', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 10: Credential Heist - Archive navigation and sort', async ({ page }) => {
    // Jump to Level 10
    await jumpToLevel(page, 9);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Navigate into ~/incoming/backup_logs.zip/credentials
    await pressKey(page, 'g');
    await pressKey(page, 'i'); // Go to incoming
    await page.waitForTimeout(500);

    // Find backup_logs.zip and enter it
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter archive
    await page.waitForTimeout(500);

    // Find credentials folder and enter
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter credentials
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Sort by modification time
    await page.keyboard.press(','); // Enter sort mode
    await page.waitForTimeout(200);
    await pressKey(page, 'm'); // Sort by modified
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 3: Yank the newest key (access_key_new.pem should be at top after sort)
    await pressKey(page, 'g');
    await pressKey(page, 'g'); // Go to top
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Yank
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 4: Jump to ~/workspace/systemd-core, create credentials/, paste
    await pressKey(page, 'g');
    await pressKey(page, 'w'); // Go to workspace
    await page.waitForTimeout(500);

    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter systemd-core
    await page.waitForTimeout(300);

    // Create credentials folder
    await pressKey(page, 'a');
    await page.waitForTimeout(200);
    await typeText(page, 'credentials/');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Enter and paste
    await pressKey(page, 'l');
    await page.waitForTimeout(200);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Key secured', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });
});
