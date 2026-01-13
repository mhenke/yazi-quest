import { test, expect } from '@playwright/test';
import {
  waitForGameLoad,
  dismissEpisodeIntro,
  pressKey,
  typeText,
  jumpToLevel,
  expectFileInView,
} from '../helpers';

test.describe('Search UI Render & Results', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game
    await page.goto('/');
    await waitForGameLoad(page);
    await dismissEpisodeIntro(page);

    // Jump to Level 6 where search is unlocked
    await jumpToLevel(page, 5);
    await dismissEpisodeIntro(page);
  });

  test('should render Search Input (Not FuzzyFinder) when pressing "s"', async ({ page }) => {
    // 1. Initial State: Mode Normal
    await expect(page.locator('[data-testid="search-input"]')).not.toBeVisible();
    await expect(page.locator('[data-test-id="fuzzy-finder"]')).not.toBeVisible();

    // 2. Press 's' to Enter Search Mode
    await pressKey(page, 's');

    // 3. Verify Search Input is Visible
    // The new UI uses a green border/text for search, similar to filter
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // 4. Verify FuzzyFinder is NOT Visible (User requirement: s is not f)
    await expect(page.locator('[data-test-id="fuzzy-finder"]')).not.toBeVisible();

    // 5. Verify UI Text
    await expect(page.getByText('Recursive fd search')).toBeVisible();
  });

  test('should display results in Main Pane after confirming search', async ({ page }) => {
    // Debug: Print current path
    const path = await page
      .locator('[data-testid="current-path"]')
      .textContent()
      .catch(() => 'unknown');
    console.log('Current Path before search:', path);

    // 1. Enter Search
    await pressKey(page, 's');

    // 2. Type Query
    await typeText(page, 'legacy');

    // 3. Confirm with Enter
    await pressKey(page, 'Enter');

    // 4. Verify Search Input Disappears
    await expect(page.locator('[data-testid="search-input"]')).not.toBeVisible();

    // 5. Verify Results in Main Pane (Displaced/Replaced View)
    // "legacy_admin_notes.log" should be visible (unique match)
    await expectFileInView(page, 'legacy_admin_notes.log');

    // Verify a file that shouldn't be there (no match)
    await expect(page.locator('[data-test-id="file-tiles"]')).not.toBeVisible();

    // 6. Verify Status Bar Indicator
    await expect(page.locator('text=(search: legacy)')).toBeVisible();
  });
});
