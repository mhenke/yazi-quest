import { test, expect } from '@playwright/test';
import { startLevel, pressKey } from './utils';

test.describe('Level 5 ThreatAlert Dialog Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, 5, { intro: false });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  });

  test('should allow meta commands (Alt+M, Alt+H, Alt+?) even when ThreatAlert is active on Level 5 - modals should overlay alert', async ({
    page,
  }) => {
    // Wait for the ThreatAlert to appear (it should show automatically on Level 5)
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible({ timeout: 500 });

    // Verify that the ThreatAlert is indeed visible
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible();

    // Try to open the help modal using Alt+?
    await pressKey(page, 'Alt+?');

    // Both the help modal AND the threat alert should be visible (modal overlays the alert)
    await expect(page.getByTestId('help-modal')).toBeVisible();
    await expect(page.getByTestId('threat-alert')).toBeVisible(); // Should still be visible underneath

    // Close the help modal
    await pressKey(page, 'Escape');
    await expect(page.getByTestId('help-modal')).not.toBeVisible();

    // The ThreatAlert should still be visible
    await expect(page.getByTestId('threat-alert')).toBeVisible();

    // Now try Alt+h to open hint
    await pressKey(page, 'Alt+h');
    await expect(page.getByTestId('hint-modal')).toBeVisible();
    await expect(page.getByTestId('threat-alert')).toBeVisible(); // Should still be visible underneath

    // Close the hint modal
    await pressKey(page, 'Escape');
    await expect(page.getByTestId('hint-modal')).not.toBeVisible();
    await expect(page.getByTestId('threat-alert')).toBeVisible(); // Should still be visible

    // Now try Alt+m to open map
    await pressKey(page, 'Alt+m');
    await expect(page.getByTestId('quest-map-modal')).toBeVisible();
    await expect(page.getByTestId('threat-alert')).toBeVisible(); // Should still be visible underneath

    // Close the map modal
    await pressKey(page, 'Escape');
    await expect(page.getByTestId('quest-map-modal')).not.toBeVisible();
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible(); // Should still be visible
  });

  test('should dismiss ThreatAlert with Shift+Enter and still allow meta commands', async ({
    page,
  }) => {
    // Wait for the ThreatAlert to appear
    await expect(page.locator('[data-testid="threat-alert"]')).toBeVisible({ timeout: 500 });

    // Dismiss the ThreatAlert with Shift+Enter
    await pressKey(page, 'Shift+Enter');
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('threat-alert')).not.toBeVisible({ timeout: 10000 });

    // Now try to open help modal with Alt+?
    await pressKey(page, 'Alt+?');
    await expect(page.getByTestId('help-modal')).toBeVisible();

    // Close the help modal
    await pressKey(page, 'Escape');
    await expect(page.getByTestId('help-modal')).not.toBeVisible();
  });
});
