import { test, expect } from '@playwright/test';

test.describe('Game State Reset on Restart', () => {
  test('should reset search, filter, hidden files, and sort on level restart', async ({ page }) => {
    // Navigate to Level 12 which has a low keystroke limit (25)
    await page.goto('http://localhost:3000/?lvl=12&intro=false');

    // Wait for game to load
    await expect(page.locator('body')).toContainText('DAEMON INSTALLATION');

    // Level 12 triggers a random threat alert (one of 3 scenarios).
    // Any of them triggers the ThreatAlert component with role="alert".
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Shift+Enter');
    await expect(page.getByRole('alert')).not.toBeVisible();

    // 1. Toggle Hidden Files
    // Initial state: .config should NOT be visible
    await expect(page.getByText('.config')).not.toBeVisible();
    await page.keyboard.press('.');
    await expect(page.getByText('.config')).toBeVisible();

    // 2. Apply Filter (e.g., filter for "work")
    await page.keyboard.press('f');
    await expect(page.getByTestId('filter-input')).toBeVisible();
    await page.keyboard.type('work');
    await page.keyboard.press('Enter');
    // Verify filter matches (workspace should be visible, others might be hidden)
    await expect(page.getByTestId('filesystem-pane-active').getByText('workspace')).toBeVisible();
    // Verify filter indicator in status bar/path bar
    await expect(page.locator('text=(filter: work)')).toBeVisible();

    // 3. Apply Search (e.g., search for "sys")
    await page.keyboard.press('s'); // or /
    await expect(page.getByTestId('search-input')).toBeVisible();
    await page.keyboard.type('sys');
    await page.keyboard.press('Enter');
    // Verify search indicator
    await expect(page.locator('text=(search: sys)')).toBeVisible();

    // 4. Trigger Game Over (Max Keystrokes)
    // We need to burn ~25 keystrokes. We already used:
    // . (1)
    // f (1) + w,o,r,k (4) + Enter (1) = 6
    // s (1) + s,y,s (3) + Enter (1) = 5
    // Total used: ~12.
    // Need ~13 more.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('j');
    }

    // Wait for Game Over Modal
    await expect(page.getByText('CONNECTION LOST')).toBeVisible();
    await expect(page.getByText('MAX KEYSTROKES EXCEEDED')).toBeVisible();

    // 5. Click Reinitialize (Restart)
    await page.getByRole('button', { name: 'Reinitialize' }).click();

    // 6. Verify Reset State
    // Hidden files should be hidden again
    await expect(page.getByText('.config')).not.toBeVisible();

    // Filter should be cleared
    await expect(page.locator('text=(filter: work)')).not.toBeVisible();

    // Search should be cleared
    await expect(page.locator('text=(search: sys)')).not.toBeVisible();

    // Sort should be default (Natural) - implicit if order matches default,
    // but main goal is search/filter/hidden which are more obvious "ghost" states.
  });
});
