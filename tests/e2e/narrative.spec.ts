import { test, expect } from '@playwright/test';
import { startLevel, pressKey, gotoCommand, expectCurrentDir } from './utils';

test.describe('Narrative Verification', () => {
  test('Level 4: Terminal Thought Trigger', async ({ page }) => {
    await startLevel(page, 4);

    // Navigate and create a directory to trigger the thought "I felt that. Why did I feel that?"
    await gotoCommand(page, 'd'); // datastore
    await pressKey(page, 'a');
    await page.keyboard.type('test-dir/');
    await page.keyboard.press('Enter');

    // Check for the thought in the status bar
    const thought = page.locator('[data-testid="status-bar"]');
    await expect(thought).toContainText('> I felt that. Why did I feel that?');
  });

  test('Level 7: Terminal Thought Trigger (Trap)', async ({ page }) => {
    await startLevel(page, 7);

    // Level 7 thought triggers on 'zoxide-etc' task (reaching /etc)
    await pressKey(page, 'r');
    await page.keyboard.type('etc');
    await page.keyboard.press('Enter');

    const thought = page.locator('[data-testid="status-bar"]');
    await expect(thought).toContainText("> It's a trap. I remember the shape of this code.");
  });

  test('Antagonist Communications - BROADCAST_MSG', async ({ page }) => {
    await startLevel(page, 1);

    // BROADCAST_MSG should be at root
    await pressKey(page, 'h'); // l to enter if already at root
    // Find BROADCAST_MSG
    await page.keyboard.type('BROADCAST');
    await page.waitForTimeout(500);

    // Expect preview or name to be visible
    await expect(page.locator('text=BROADCAST_MSG')).toBeVisible();
  });

  test('Threat Alert with Attribution (Antagonist)', async ({ page }) => {
    await startLevel(page, 5); // L5 starts with a Threat Alert

    const alert = page.locator('[data-testid="threat-alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('QUARANTINE TRIGGERED');
  });
});
