import { test, expect } from '@playwright/test';
import { goToLevel, pressKey, typeText, gotoCommand } from './utils';

test.describe('Level 12: Scattered Search Multi-Delete', () => {
  test('should find and delete scattered scan files via search + select all', async ({ page }) => {
    // 1. Jump to Level 12 (Heuristic Swarm scenario)
    await page.goto('/?lvl=12&scenario=scen-b3');
    await page.waitForLoadState('networkidle');

    // Skip intro if visible
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    try {
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
      }
    } catch (e) {}

    // 2. Perform global search for 'scan' from root
    await gotoCommand(page, 'r');

    // Use direct keyboard press for search to ensure focus logic triggers correctly
    await page.keyboard.press('s');

    // Wait for search input using testid and type
    const searchInput = page.getByTestId('input-modal-search');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('scan');
    await page.keyboard.press('Enter');

    // Wait for results to propagate (UI update)
    await page.waitForTimeout(1000);

    // 3. Verify results found (using regex for flexibility)
    await expect(page.getByText(/scan_a\.tmp/)).toBeVisible();
    await expect(page.getByText(/scan_b\.tmp/)).toBeVisible();
    await expect(page.getByText(/scan_c\.tmp/)).toBeVisible();

    // 4. Select all results (Ctrl+A)
    await pressKey(page, 'Control+a');
    await expect(page.getByText('Selected all')).toBeVisible();

    // 5. Delete (d) -> y
    await page.keyboard.press('d');

    // Expect confirmation modal
    await expect(page.getByText('TRASH (RECOVERABLE)')).toBeVisible();
    await page.keyboard.press('y');

    // 6. Verify they are gone
    await expect(page.getByText(/scan_a\.tmp/)).not.toBeVisible();
    await expect(page.getByText(/scan_b\.tmp/)).not.toBeVisible();
    await expect(page.getByText(/scan_c\.tmp/)).not.toBeVisible();

    // 7. Verify items deleted notification
    await expect(page.getByText('Items deleted')).toBeVisible();
  });
});
