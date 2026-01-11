import { test, expect } from '@playwright/test';
import {
    waitForGameLoad,
    dismissEpisodeIntro,
    pressKey,
    typeText,
    isFuzzyFinderVisible,
    expectFileInView,
    expectFileNotInView,
    getCurrentPath,
} from './helpers';

test.describe('Search Mode - Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForGameLoad(page);
        await dismissEpisodeIntro(page);
        // Jump to Level 6 where search is unlocked
        await require('./helpers').jumpToLevel(page, 5);
        await dismissEpisodeIntro(page);
    });

    test('should show no results state when query matches nothing', async ({ page }) => {
        // Activate search
        await pressKey(page, 's');
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

        // Type a query that definitely yields no results
        await typeText(page, 'xyz_nonexistent_12345');
        await page.waitForTimeout(300);

        // Verify search indicator is correct
        // Just check the text appears in the input area
        await expect(page.locator('span.text-zinc-100', { hasText: 'xyz_nonexistent_12345' }).last()).toBeVisible();

        // Verify file list is empty (or shows "No results")
        // FuzzyFinder renders "No matches in recursive search"
        await expect(page.locator('text=No matches in recursive search')).toBeVisible();
    });

    test('should handle special characters in search query', async ({ page }) => {
        await pressKey(page, 's');
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

        // Type special characters: .*[]()
        const specialChars = '.*[]()';
        await typeText(page, specialChars);
        await page.waitForTimeout(300);

        // Verify input value reflects the chars
        // The search indicator usually shows the query
        // Use try/catch or simple visibility check.
        // Escaping regex chars for locator text matching might be needed for getByText, but stricter locators usually handle it.
        // We'll just check if the element exists.
        await expect(page.locator('span.text-zinc-100').last()).toContainText(specialChars);

        // Verify app didn't crash
        // Search indicator logic replacement
        // const searchIndicator = page.locator('text=search:'); 
        // await expect(searchIndicator).toBeVisible();
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

        // Resume standard search
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');

        await typeText(page, 'REA');
        await expectFileInView(page, 'README.md');
    });

    test('should enter a directory selected via search results', async ({ page }) => {
        const initialPath = await getCurrentPath(page);

        // Search for a directory we know exists, e.g., 'datastore' or 'bin'
        // In Level 1, 'datastore' is usually visible in 'guest' or we can find 'bin' in root

        // Let's go to root first to find 'bin' or 'etc' reliably
        await pressKey(page, 'g');
        await pressKey(page, 'r');
        await page.waitForTimeout(500);

        await pressKey(page, 's');
        await typeText(page, 'datastore'); // 'datastore' exists in guest
        await page.waitForTimeout(300);

        // Select 'datastore'
        // Depending on fuzzy find, it might select 'datastore' immediately if it's the best match
        // Or we might need to navigate. Let's assume 'datastore' matches 'datastore' well.

        // Press 'l' to ENTER the directory
        await pressKey(page, 'l');
        await page.waitForTimeout(500);

        // Verify we navigated INTO /datastore
        const newPath = await getCurrentPath(page);
        expect(newPath).toContain('datastore');
        expect(newPath).not.toBe(initialPath);

        // Verify search mode is exited
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(false);
    });
});
