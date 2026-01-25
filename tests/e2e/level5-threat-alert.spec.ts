import { test, expect } from '@playwright/test';
import { startLevel } from './utils';

test.describe('Level 5 ThreatAlert Dialog Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, 5, { intro: false });
  });

  test('should allow meta commands (Alt+M, Alt+H, Alt+?) even when ThreatAlert is active on Level 5 - modals should overlay alert', async ({
    page,
  }) => {
    // Wait for the ThreatAlert to appear (it should show automatically on Level 5)
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible({ timeout: 10000 });

    // Verify that the ThreatAlert is indeed visible
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible();

    // Try to open the help modal using Alt+?
    await page.keyboard.press('Alt+?');

    // Both the help modal AND the threat alert should be visible (modal overlays the alert)
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible underneath

    // Close the help modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // The ThreatAlert should still be visible
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible();

    // Now try Alt+H to open hint
    await page.keyboard.press('Alt+H');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible underneath

    // Close the hint modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible

    // Now try Alt+M to open map
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible underneath

    // Close the map modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible
  });

  test('should dismiss ThreatAlert with Shift+Enter and still allow meta commands', async ({
    page,
  }) => {
    // Wait for the ThreatAlert to appear
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible({ timeout: 10000 });

    // Dismiss the ThreatAlert with Shift+Enter
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('[data-testid="threat-alert"]')).not.toBeVisible();

    // Now try to open help modal with Alt+?
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Close the help modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
  });
});
