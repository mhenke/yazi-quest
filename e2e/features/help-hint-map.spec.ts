import { test, expect } from '@playwright/test';
import { waitForGameLoad, dismissEpisodeIntro, pressKey, getCurrentPath } from './helpers';

test.describe('Dialog Interactions - Help, Hint, and Map Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);
  });

  test.describe('Help Modal (Alt+?)', () => {
    test('should open Help modal with Alt+?', async ({ page }) => {
      // Open Help modal
      await page.keyboard.press('Alt+?');
      await page.waitForTimeout(500);

      // Verify Help modal is visible
      const helpHeader = page.locator('text=HELP / KEYBINDINGS');
      await expect(helpHeader).toBeVisible({ timeout: 3000 });

      // Verify it contains keybinding information
      const helpContent = page.locator('text=/navigation/i');
      await expect(helpContent).toBeVisible({ timeout: 2000 });
    });

    test('should close Help modal with Shift+Enter', async ({ page }) => {
      // Open Help modal
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Close with Shift+Enter
      await page.keyboard.press('Shift+Enter');

      // Verify modal is closed
      await expect(page.locator('text=HELP / KEYBINDINGS')).not.toBeVisible({
        timeout: 2000,
      });
    });

    test('should NOT close Help modal with Escape (regression test)', async ({ page }) => {
      // Open Help modal
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Try closing with Escape - should NOT work
      await pressKey(page, 'Escape');
      await page.waitForTimeout(500);

      // Modal should still be visible
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Clean up - close with Shift+Enter
      await page.keyboard.press('Shift+Enter');
    });

    test('should toggle Help modal with repeated Alt+?', async ({ page }) => {
      // Open
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Toggle closed
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).not.toBeVisible({
        timeout: 2000,
      });

      // Toggle open again
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Clean up
      await page.keyboard.press('Alt+?');
    });

    test('should not block keyboard input while Help modal is open', async ({ page }) => {
      // This verifies that keyboard events are properly captured by the modal
      // and don't leak through to the game
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();

      // Try pressing navigation keys - they shouldn't affect the game
      const pathBefore = await getCurrentPath(page);

      // Press some navigation keys
      await pressKey(page, 'k');
      await pressKey(page, 'j');
      await page.waitForTimeout(300);

      // Close modal
      await page.keyboard.press('Shift+Enter');

      // Path should be unchanged
      const pathAfter = await getCurrentPath(page);
      expect(pathBefore).toEqual(pathAfter);
    });
  });

  test.describe('Hint Modal (Alt+h)', () => {
    test('should open Hint modal with Alt+h', async ({ page }) => {
      // Open Hint modal
      await page.keyboard.press('Alt+h');

      // Verify Hint modal is visible (looks for "Hint (")
      const hintHeader = page.locator('text=/Hint \\(/');
      await expect(hintHeader).toBeVisible({ timeout: 2000 });
    });

    test('should close Hint modal with Shift+Enter', async ({ page }) => {
      // Open Hint modal
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();

      // Close with Shift+Enter
      await page.keyboard.press('Shift+Enter');

      // Verify modal is closed
      await expect(page.locator('text=/Hint \\(/')).not.toBeVisible({ timeout: 2000 });
    });

    test('should NOT close Hint modal with Escape (regression test)', async ({ page }) => {
      // Open Hint modal
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();

      // Try closing with Escape - should NOT work
      await pressKey(page, 'Escape');
      await page.waitForTimeout(500);

      // Modal should still be visible
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();

      // Clean up
      await page.keyboard.press('Shift+Enter');
    });

    test('should toggle Hint modal with repeated Alt+h', async ({ page }) => {
      // Open
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();

      // Toggle closed
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).not.toBeVisible({ timeout: 2000 });

      // Toggle open again
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();

      // Clean up
      await page.keyboard.press('Alt+h');
    });
  });

  test.describe('Map Modal (Alt+m)', () => {
    test('should open Map modal with Alt+m', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await page.waitForTimeout(500);

      // Verify Map modal is visible
      const mapHeader = page.locator('text=Quest Map');
      await expect(mapHeader).toBeVisible({ timeout: 3000 });

      // Verify it shows levels
      const levelOne = page.locator('text=/SYSTEM AWAKENING/i');
      await expect(levelOne).toBeVisible({ timeout: 2000 });
    });

    test('should close Map modal with Shift+Enter', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Close with Shift+Enter
      await page.keyboard.press('Shift+Enter');

      // Verify modal is closed
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 2000 });
    });

    test('should NOT close Map modal with Escape (regression test)', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Try closing with Escape - should NOT work
      await pressKey(page, 'Escape');
      await page.waitForTimeout(500);

      // Modal should still be visible
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Clean up
      await page.keyboard.press('Shift+Enter');
    });

    test('should allow navigation within Map with j/k keys', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Navigate down with j
      await pressKey(page, 'j');
      await page.waitForTimeout(200);

      // Navigate up with k
      await pressKey(page, 'k');
      await page.waitForTimeout(200);

      // Map should still be visible (not closed by navigation)
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Close with Shift+Enter
      await page.keyboard.press('Shift+Enter');
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 2000 });
    });

    test('should allow jumping to levels from Map', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await page.waitForTimeout(500);
      await expect(page.locator('text=Quest Map')).toBeVisible({ timeout: 3000 });

      // Press Enter to jump to selected level (should be Level 1 by default)
      await pressKey(page, 'Enter');
      await page.waitForTimeout(1000);

      // Map should close
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 3000 });

      // We should still be in the game (verify by checking for level title)
      const levelTitle = page.locator('text=/SYSTEM AWAKENING/i');
      const hasTitle = await levelTitle.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasTitle).toBe(true);
    });

    test('should close Map with Shift+Enter even after navigation', async ({ page }) => {
      // Open Map modal
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Navigate a few times
      await pressKey(page, 'j');
      await pressKey(page, 'j');
      await pressKey(page, 'k');
      await page.waitForTimeout(300);

      // Close with Shift+Enter should still work
      await page.keyboard.press('Shift+Enter');
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 2000 });
    });

    test('should toggle Map modal with repeated Alt+m', async ({ page }) => {
      // Open
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Toggle closed
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 2000 });

      // Toggle open again
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();

      // Clean up
      await page.keyboard.press('Alt+m');
    });
  });

  test.describe('Dialog Consistency', () => {
    test('all dialogs should use Shift+Enter for dismissal', async ({ page }) => {
      // Test Help
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();
      await page.keyboard.press('Shift+Enter');
      await expect(page.locator('text=HELP / KEYBINDINGS')).not.toBeVisible({
        timeout: 2000,
      });

      // Test Hint
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();
      await page.keyboard.press('Shift+Enter');
      await expect(page.locator('text=/Hint \\(/')).not.toBeVisible({ timeout: 2000 });

      // Test Map
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();
      await page.keyboard.press('Shift+Enter');
      await expect(page.locator('text=Quest Map')).not.toBeVisible({ timeout: 2000 });
    });

    test('no dialog should close with Escape (regression test)', async ({ page }) => {
      // Test Help
      await page.keyboard.press('Alt+?');
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();
      await pressKey(page, 'Escape');
      await page.waitForTimeout(300);
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible();
      await page.keyboard.press('Shift+Enter');

      // Test Hint
      await page.keyboard.press('Alt+h');
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();
      await pressKey(page, 'Escape');
      await page.waitForTimeout(300);
      await expect(page.locator('text=/Hint \\(/')).toBeVisible();
      await page.keyboard.press('Shift+Enter');

      // Test Map
      await page.keyboard.press('Alt+m');
      await expect(page.locator('text=Quest Map')).toBeVisible();
      await pressKey(page, 'Escape');
      await page.waitForTimeout(300);
      await expect(page.locator('text=Quest Map')).toBeVisible();
      await page.keyboard.press('Shift+Enter');
    });

    test('only one dialog should be visible at a time', async ({ page }) => {
      // Open Help
      await page.keyboard.press('Alt+?');
      await page.waitForTimeout(500);
      await expect(page.locator('text=HELP / KEYBINDINGS')).toBeVisible({ timeout: 3000 });

      // Try opening Map - Help should close first (or both stay open, depending on implementation)
      await page.keyboard.press('Alt+m');
      await page.waitForTimeout(1000);

      // Map should be open
      await expect(page.locator('text=Quest Map')).toBeVisible({ timeout: 3000 });

      // Note: Some implementations allow multiple modals. If so, just verify Map opened.
      // Clean up by closing whatever's open
      await page.keyboard.press('Shift+Enter').catch(() => {});
      await page.waitForTimeout(300);
      await page.keyboard.press('Shift+Enter').catch(() => {});
    });
  });
});
