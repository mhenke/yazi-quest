import { test, expect } from '@playwright/test';
import { goToLevel } from './utils';

test.describe('Phase 2 Narrative Verification', () => {
  // Helper for robust navigation
  const navigateTo = async (page, path: string[]) => {
    console.log(`Navigating to: ${path.join('/')}`);
    // Always start from a known anchor based on first segment
    if (path[0] === '~') {
      await page.keyboard.press('g');
      await page.keyboard.press('h');
    } else if (path[0] === '/') {
      await page.keyboard.press('g');
      await page.keyboard.press('r');
    }
    await page.waitForTimeout(800);

    // Navigate through segments
    for (let i = 1; i < path.length; i++) {
      const segment = path[i];
      console.log(`  Targeting segment: ${segment}`);

      await page.keyboard.press('Escape'); // Clear prev filter/state
      await page.waitForTimeout(300);

      // Filter for the segment
      await page.keyboard.press('f');
      await page.waitForTimeout(200);
      await page.keyboard.type(segment);
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter'); // Confirm filter
      await page.waitForTimeout(500);

      // Enter directory (unless it's the last element which is the file)
      if (i < path.length - 1) {
        console.log(`    Entering directory: ${segment}`);
        await page.keyboard.press('l'); // Use 'l' (right) to enter
        await page.waitForTimeout(800);
      }
    }
  };

  test('Pillar I & II: Full Verification (Level 7)', async ({ page }) => {
    // Level 7 provides robust tools
    await goToLevel(page, 7);

    // 1. Check ~/.config/.cycle_history
    await page.keyboard.press('g');
    await page.keyboard.press('h');
    await page.keyboard.press('.'); // Show hidden
    await page.waitForTimeout(500);

    await navigateTo(page, ['~', '.config', '.cycle_history']);
    const configFiles = await page.getByTestId(/^file-/).allTextContents();
    console.log('Files in .config:', configFiles);
    await expect(page.getByTestId('file-.cycle_history')).toBeVisible();
    await expect(page.getByText('CYCLE_ID: 7733 [FAILED - PARTIAL UPLOAD]')).toBeVisible();

    // 2. Check ~/workspace/notes.txt
    await navigateTo(page, ['~', 'workspace', 'notes.txt']);
    const workspaceFiles = await page.getByTestId(/^file-/).allTextContents();
    console.log('Files in Workspace:', workspaceFiles);
    await expect(page.getByTestId('file-notes.txt')).toBeVisible();
    await expect(page.getByText('To self: The system feels loops')).toBeVisible();
    await expect(page.getByText('Date: 6 months ago.')).toBeVisible();

    // 3. Check /tmp/ghost_process.pid
    await navigateTo(page, ['/', 'tmp', 'ghost_process.pid']);
    await expect(page.getByTestId('file-ghost_process.pid')).toBeVisible();
    await expect(page.getByText('PARENT: 7733 (DEAD)')).toBeVisible();

    // 4. Check /etc/scan_schedule.cron
    await navigateTo(page, ['/', 'etc', 'scan_schedule.cron']);
    await expect(page.getByTestId('file-scan_schedule.cron')).toBeVisible();
    await expect(page.getByText('deep_scan.sh --force')).toBeVisible();

    // 5. Check /var/log/maintenance.log
    await navigateTo(page, ['/', 'var', 'log', 'maintenance.log']);
    await expect(page.getByTestId('file-maintenance.log')).toBeVisible();
    await expect(page.getByText('Sector 7 cleanup complete.')).toBeVisible();
  });
});
