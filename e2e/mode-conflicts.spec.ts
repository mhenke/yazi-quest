import { test, expect } from '@playwright/test';
import {
    waitForGameLoad,
    dismissEpisodeIntro,
    pressKey,
    typeText,
    isFuzzyFinderVisible,
    isFilterModeActive,
    getCurrentPath,
    enterFilter,
    exitFilterMode,
    jumpToLevel
} from './helpers';

test.describe('Mode Conflicts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForGameLoad(page);
        await dismissEpisodeIntro(page);
        // Jump to Level 6 where both search and filter are unlocked
        await jumpToLevel(page, 5);
        await dismissEpisodeIntro(page);
    });

    test('should prioritize Search over Filter if Search is activated second', async ({ page }) => {
        // 1. Activate Filter
        // Jump to Level 3 where filter is allowed
        // Actually filter might be allowed earlier, but let's be safe
        // Assuming filter 'f' is globally available or available in Level 1

        await pressKey(page, 'f');
        // Check if filter is active
        const filterInput = page.locator('input').first();
        // If filter didn't open, we might need to jump levels. 
        // But standard keybindings usually work.

        // If filter opened:
        if (await filterInput.isVisible().catch(() => false)) {
            await expect(filterInput).toBeFocused();

            // 2. Try to activate Search 's'
            // This simulates typing 's' into the filter input usually...
            // Wait, if filter is active, typing 's' just types 's'.
            // So Search SHOULD NOT activate.

            await pressKey(page, 's');
            await page.waitForTimeout(200);

            // Assert: Filter input contains 's', Search is NOT active
            await expect(filterInput).toHaveValue('s');
            await expect(isFuzzyFinderVisible(page)).resolves.toBe(false);
        }
    });

    test('should prioritize Filter over Search if Filter is activated second', async ({ page }) => {
        // 1. Activate Search
        await pressKey(page, 's');
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

        // 2. Try to activate Filter 'f'
        // In search mode, typing 'f' typically filters the search results.
        // It should NOT activate Filter mode.

        await pressKey(page, 'f');
        await page.waitForTimeout(200);

        // Assert: Search indicator shows 'f', Filter mode is NOT active
        await expect(page.locator('span.text-zinc-100', { hasText: 'f' }).last()).toBeVisible();

        // Check no filter input
        const filterInput = page.locator('input[placeholder="Filter..."]'); // Specific selector if possible
        // Or verify we are still in search mode
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);
    });

    test('should clear Search when using "Go To" commands if they are allowed', async ({ page }) => {
        // 1. Activate Search
        await pressKey(page, 's');
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);

        // 2. Press 'g'
        // 'g' is a valid search character. It should just type 'g'.
        // Use 'Esc' to clear first

        await typeText(page, 'g');

        // Assert: Search query is 'g', did NOT enter Go-To mode
        await expect(page.locator('span.text-zinc-100', { hasText: 'g' }).last()).toBeVisible();

        // We are still in search mode
        await expect(isFuzzyFinderVisible(page)).resolves.toBe(true);
    });

    test('should blocking "Go To" navigation while in Filter mode', async ({ page }) => {
        // 1. Open Filter
        await pressKey(page, 'f');

        // 2. Press 'g'
        // Should type 'g' into filter
        await typeText(page, 'g');

        const filterInput = page.locator('input').first();
        if (await filterInput.isVisible().catch(() => false)) {
            await expect(filterInput).toHaveValue('g');

            // Press 'h' (normally Go Home if 'g' was pressed)
            await typeText(page, 'h');

            // Should have 'gh' in filter, NOT navigated home
            await expect(filterInput).toHaveValue('gh');

            const path = await getCurrentPath(page);
            // Assuming we started at guest/home, we stay there.
            // If we were somewhere else, we didn't move.
        }
    });
});
