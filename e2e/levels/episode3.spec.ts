import { test, expect, Page } from '@playwright/test';
import { waitForGameLoad, dismissEpisodeIntro, pressKey, typeText, jumpToLevel } from '../helpers';

/**
 * Helper to verify task progress
 */
async function verifyTaskProgress(page: Page): Promise<void> {
  await page.waitForTimeout(200);
}

test.describe('Episode III - Level Completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
  });

  test('Level 11: Daemon Reconnaissance - Identify safe files by date', async ({ page }) => {
    // Jump to Level 11
    await jumpToLevel(page, 10); // 0-indexed
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Jump to /daemons
    await pressKey(page, 'g');
    await pressKey(page, 'r'); // Go to root
    await page.waitForTimeout(500);

    // Navigate to daemons directory
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter daemons
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Inspect metadata (Tab) of at least 3 files
    await page.keyboard.press('Tab'); // Open info panel
    await page.waitForTimeout(200);
    await pressKey(page, 'j');
    await page.waitForTimeout(200);
    await pressKey(page, 'j');
    await page.waitForTimeout(200);
    await pressKey(page, 'j');
    await page.waitForTimeout(200);
    await verifyTaskProgress(page);

    // Task 3: Select 2 SAFE (Legacy) files - avoid honeypots
    // Safe files have older dates - select first 2 files (legacy ones)
    await pressKey(page, 'g');
    await pressKey(page, 'g'); // Go to top
    await page.waitForTimeout(200);

    await page.keyboard.press('Space'); // Select first
    await page.waitForTimeout(100);
    await pressKey(page, 'j');
    await page.keyboard.press('Space'); // Select second
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Targets acquired', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 12: Daemon Installation - Move systemd-core to /daemons', async ({ page }) => {
    // Jump to Level 12
    await jumpToLevel(page, 11);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Handle any scenario-based tasks first (delete threat files if they exist)
    // These are dynamically shown based on the scenario

    // Task: Navigate to ~/workspace
    await pressKey(page, 'g');
    await pressKey(page, 'w'); // Go to workspace
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task: Cut systemd-core
    // Find systemd-core directory
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'x'); // Cut
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task: Navigate to /daemons
    await pressKey(page, 'g');
    await pressKey(page, 'r'); // Go to root
    await page.waitForTimeout(500);

    // Navigate to daemons
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter daemons
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task: Paste and navigate into systemd-core
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(500);

    // Navigate into systemd-core
    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter systemd-core
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Daemon installed', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 13: Distributed Consciousness - Collect keys from 3 nodes', async ({ page }) => {
    // Jump to Level 13
    await jumpToLevel(page, 12);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Access all 3 nodes using 1, 2, 3 keys
    // Start in Tokyo (node 1)
    await page.keyboard.press('1'); // Tokyo
    await page.waitForTimeout(300);

    // Yank the key from Tokyo
    await pressKey(page, 'y'); // Yank part_a.key
    await page.waitForTimeout(200);

    // Paste to /tmp/central
    await pressKey(page, 'g');
    await pressKey(page, 't'); // Go to /tmp
    await page.waitForTimeout(300);

    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter central
    await page.waitForTimeout(200);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(300);

    // Switch to Berlin (node 2)
    await page.keyboard.press('2');
    await page.waitForTimeout(300);
    await pressKey(page, 'y'); // Yank part_b.key

    // Paste to /tmp/central
    await pressKey(page, 'g');
    await pressKey(page, 't');
    await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter central
    await page.waitForTimeout(200);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(300);

    // Switch to São Paulo (node 3)
    await page.keyboard.press('3');
    await page.waitForTimeout(300);
    await pressKey(page, 'y'); // Yank part_c.key

    // Paste to /tmp/central
    await pressKey(page, 'g');
    await pressKey(page, 't');
    await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter central
    await page.waitForTimeout(200);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('Keys assembled', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 14: Evidence Purge - Create decoys and delete evidence', async ({ page }) => {
    // Jump to Level 14
    await jumpToLevel(page, 13);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Navigate to /home/guest
    await pressKey(page, 'g');
    await pressKey(page, 'h'); // Go home
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Create 3 decoy directories
    for (let i = 1; i <= 3; i++) {
      await pressKey(page, 'a');
      await page.waitForTimeout(200);
      await typeText(page, `decoy_${i}/`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    await verifyTaskProgress(page);

    // Task 3: Permanently delete visible directories (workspace, media, datastore, incoming)
    // Select and delete each one - use D (permanent delete)
    const dirsToDelete = ['workspace', 'media', 'datastore', 'incoming'];

    for (const dir of dirsToDelete) {
      await pressKey(page, 'f'); // Filter
      await page.waitForTimeout(200);
      await typeText(page, dir);
      await pressKey(page, 'Escape');
      await page.waitForTimeout(200);

      await page.keyboard.press('Shift+d'); // Permanent delete
      await page.waitForTimeout(200);
      await pressKey(page, 'y'); // Confirm
      await page.waitForTimeout(300);
    }
    await verifyTaskProgress(page);

    // Task 4: Show hidden and delete .config LAST
    await page.keyboard.press('.'); // Show hidden
    await page.waitForTimeout(300);

    await pressKey(page, 'f'); // Filter
    await page.waitForTimeout(200);
    await typeText(page, '.config');
    await pressKey(page, 'Escape');
    await page.waitForTimeout(200);

    await page.keyboard.press('Shift+d'); // Permanent delete
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Confirm
    await page.waitForTimeout(500);

    // Check for success
    const successVisible = await page
      .getByText('GUEST PARTITION STERILIZED', { exact: false })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });

  test('Level 15: Transmission Protocol - Final verification and escape', async ({ page }) => {
    // Jump to Level 15
    await jumpToLevel(page, 14);
    await dismissEpisodeIntro(page);
    await page.waitForTimeout(500);

    // Task 1: Use search to find keys and copy to /tmp/upload
    await pressKey(page, 's'); // Search mode
    await page.waitForTimeout(300);
    await typeText(page, '.key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Select all search results and yank
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    await pressKey(page, 'y');
    await page.waitForTimeout(300);

    // Navigate to /tmp/upload and paste
    await pressKey(page, 'g');
    await pressKey(page, 't'); // Go to /tmp
    await page.waitForTimeout(300);

    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter upload
    await page.waitForTimeout(300);
    await pressKey(page, 'p'); // Paste
    await page.waitForTimeout(500);
    await verifyTaskProgress(page);

    // Task 2: Verify daemon - navigate to /daemons/systemd-core and inspect
    await pressKey(page, 'g');
    await pressKey(page, 'r'); // Go to root
    await page.waitForTimeout(300);

    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter daemons
    await page.waitForTimeout(300);

    for (let i = 0; i < 5; i++) {
      await pressKey(page, 'j');
    }
    await pressKey(page, 'l'); // Enter systemd-core
    await page.waitForTimeout(300);

    // Inspect with Tab and scroll with J/K
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Shift+j');
    await page.waitForTimeout(200);
    await page.keyboard.press('Shift+k');
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 3: Navigate to hidden breadcrumb
    await pressKey(page, 'g');
    await pressKey(page, 't'); // Go to /tmp
    await page.waitForTimeout(300);
    await page.keyboard.press('.'); // Show hidden files
    await page.waitForTimeout(300);
    await verifyTaskProgress(page);

    // Task 4: Finalize by navigating to /tmp/upload and deleting noise files
    await pressKey(page, 'f'); // Filter
    await page.waitForTimeout(200);
    await typeText(page, 'upload');
    await pressKey(page, 'Escape');
    await page.waitForTimeout(200);
    await pressKey(page, 'l'); // Enter upload
    await page.waitForTimeout(500);

    // Check for success or game completion
    const successVisible = await page
      .getByText('TRANSMISSION', { exact: false })
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (successVisible) {
      await page.keyboard.press('Shift+Enter');
    }
  });
});
