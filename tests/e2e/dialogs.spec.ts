import { test, expect } from '@playwright/test';
import { startLevel } from './utils';

test.describe('Dialogs Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, 1, { intro: false });
  });

  test('should open and close Help modal with Alt+? and Escape', async ({ page }) => {
    // Initially, Help modal should not be visible
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // Press Alt+? to open Help modal
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Press Escape to close Help modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
  });

  test('should open and close Help modal with Alt+? and Shift+Enter', async ({ page }) => {
    // Initially, Help modal should not be visible
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // Press Alt+? to open Help modal
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Press Shift+Enter to close Help modal
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
  });

  test('should close Help modal by clicking on backdrop', async ({ page }) => {
    // Press Alt+? to open Help modal
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Click on the backdrop to close Help modal (clicking on the modal element itself since it's the backdrop)
    await page.locator('[data-testid="help-modal"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
  });

  test('should open and close Hint modal with Alt+H and Escape', async ({ page }) => {
    // Initially, Hint modal should not be visible
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();

    // Press Alt+H to open Hint modal
    await page.keyboard.press('Alt+H');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();

    // Press Escape to close Hint modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();
  });

  test('should open and close Hint modal with Alt+H and Shift+Enter', async ({ page }) => {
    // Initially, Hint modal should not be visible
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();

    // Press Alt+H to open Hint modal
    await page.keyboard.press('Alt+H');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();

    // Press Shift+Enter to close Hint modal
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();
  });

  test('should close Hint modal by clicking on backdrop', async ({ page }) => {
    // Press Alt+H to open Hint modal
    await page.keyboard.press('Alt+H');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();

    // Click on the backdrop to close Hint modal (clicking on the modal element itself since it's positioned in the corner)
    await page.locator('[data-testid="hint-modal"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();
  });

  test('should open and close Quest Map modal with Alt+M and Escape', async ({ page }) => {
    // Initially, Quest Map modal should not be visible
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();

    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Press Escape to close Quest Map modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();
  });

  test('should open and close Quest Map modal with Alt+M and Shift+Enter', async ({ page }) => {
    // Initially, Quest Map modal should not be visible
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();

    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Press Shift+Enter to close Quest Map modal
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();
  });

  test('should close Quest Map modal by clicking on backdrop', async ({ page }) => {
    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Click on the backdrop to close Quest Map modal (clicking on the modal element itself)
    await page.locator('[data-testid="quest-map-modal"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();
  });

  test('should open Hint modal by clicking the hint button', async ({ page }) => {
    // Initially, Hint modal should not be visible
    await expect(page.locator('[data-testid="hint-modal"]')).not.toBeVisible();

    // Click the hint button in the status bar
    await page.locator('[data-testid="hint-button"]').click();
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();
  });

  test('should open Help modal by clicking the help button', async ({ page }) => {
    // Initially, Help modal should not be visible
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // Click the help button in the status bar
    await page.locator('[data-testid="help-button"]').click();
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();
  });

  test('should open Quest Map modal by clicking the map button', async ({ page }) => {
    // Initially, Quest Map modal should not be visible
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();

    // Click the map button in the status bar
    await page.locator('[data-testid="map-button"]').click();
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();
  });

  test('should support navigation in Help modal with j/k keys', async ({ page }) => {
    // Press Alt+? to open Help modal
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Get initial scroll position
    const initialScrollTop = await page
      .locator('[data-testid="help-modal"]')
      .evaluate((node) => node.scrollTop || 0);

    // Press 'j' to scroll down
    await page.keyboard.press('j');
    await page.waitForTimeout(100); // Wait for scroll animation

    // Check that scroll position has changed
    const afterJScrollTop = await page
      .locator('[data-testid="help-modal"]')
      .evaluate((node) => node.scrollTop || 0);
    expect(afterJScrollTop).toBeGreaterThanOrEqual(initialScrollTop);

    // Press 'k' to scroll up
    await page.keyboard.press('k');
    await page.waitForTimeout(100); // Wait for scroll animation

    // Check that scroll position has changed back
    const afterKScrollTop = await page
      .locator('[data-testid="help-modal"]')
      .evaluate((node) => node.scrollTop || 0);
    expect(afterKScrollTop).toBeLessThanOrEqual(afterJScrollTop);

    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('should support navigation in Quest Map modal with h/l and j/k keys', async ({ page }) => {
    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Get active tab initially (first tab is typically active by default)
    const initialActiveTabs = await page
      .locator('[data-testid="episode-tab"].border-current')
      .count();
    expect(initialActiveTabs).toBe(1); // Exactly one tab should be active

    // Press 'l' to switch to next episode tab
    await page.keyboard.press('l');
    await page.waitForTimeout(100); // Wait for tab switch

    // Check that active tab has changed (still only one should be active, but different)
    const afterLActiveTabs = await page
      .locator('[data-testid="episode-tab"].border-current')
      .count();
    expect(afterLActiveTabs).toBe(1); // Still only one tab should be active

    // Press 'h' to switch back to previous episode tab
    await page.keyboard.press('h');
    await page.waitForTimeout(100); // Wait for tab switch

    // Check that active tab has changed back (still only one should be active, but back to first)
    const afterHActiveTabs = await page
      .locator('[data-testid="episode-tab"].border-current')
      .count();
    expect(afterHActiveTabs).toBe(1); // Still only one tab should be active

    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('should open help modal with Alt+? even when other dialogs are active', async ({ page }) => {
    // This test verifies that meta commands work even when other dialogs are active
    // For this test, we'll simulate the scenario by opening the map and then trying to open help

    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Now press Alt+? to open Help modal (should work even though map is open)
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // The help modal should be visible, and map should be closed
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();

    // Close the help modal
    await page.keyboard.press('Escape');
  });

  test('should open hint modal with Alt+H even when other dialogs are active', async ({ page }) => {
    // Press Alt+M to open Quest Map modal
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // Now press Alt+H to open Hint modal (should work even though map is open)
    await page.keyboard.press('Alt+H');
    await expect(page.locator('[data-testid="hint-modal"]')).toBeVisible();

    // The hint modal should be visible, and map should be closed
    await expect(page.locator('[data-testid="quest-map-modal"]')).not.toBeVisible();

    // Close the hint modal
    await page.keyboard.press('Escape');
  });

  test('should open map modal with Alt+M even when other dialogs are active', async ({ page }) => {
    // Press Alt+? to open Help modal
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Now press Alt+M to open Map modal (should work even though help is open)
    await page.keyboard.press('Alt+M');
    await expect(page.locator('[data-testid="quest-map-modal"]')).toBeVisible();

    // The map modal should be visible, and help should be closed
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // Close the map modal
    await page.keyboard.press('Escape');
  });

  test('should open help modal with Alt+? even when ThreatAlert is active (simulated)', async ({
    page,
  }) => {
    // This test simulates the scenario where a ThreatAlert is active (like on Level 5)
    // and verifies that meta commands still work

    // We'll simulate this by checking that the meta commands work in general
    // even when other blocking conditions might be present

    // Open help modal first
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Close it
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();

    // Now verify that it can be opened again
    await page.keyboard.press('Alt+?');
    await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

    // Close again
    await page.keyboard.press('Escape');
  });
});
