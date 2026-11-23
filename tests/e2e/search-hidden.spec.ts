import { test, expect } from '@playwright/test';
import { goToLevel, pressKey, search } from './utils';

// Regression: search results are a snapshot taken while hidden files were shown.
// Toggling hidden back off must drop hidden matches from the rendered list
// (App.tsx visibleItems memo used to return them unfiltered).
test.describe('Hidden toggle applies to active search results', () => {
  test('hiding hidden removes hidden search matches but keeps visible ones', async ({ page }) => {
    // Level 1 starts in /home/guest, which holds the hidden dir .config/ (yazi.toml,
    // theme.toml) and the visible workspace/systemd-core/Cargo.toml. Hidden is off by default.
    await goToLevel(page, 1);

    await pressKey(page, '.'); // Reveal hidden traces

    await search(page, 'toml');
    const hiddenRow = page.getByTestId('file-yazi.toml');
    await expect(hiddenRow).toBeVisible();
    // Search rows render the relative path, proving this one came from inside .config/.
    await expect(hiddenRow).toContainText('.config/yazi.toml');
    await expect(page.getByTestId('file-theme.toml')).toBeVisible();

    await pressKey(page, '.'); // Cloak hidden again, search still active

    await expect(hiddenRow).not.toBeVisible();
    await expect(page.getByTestId('file-theme.toml')).not.toBeVisible();
    // The search is still live; the non-hidden match stays rendered.
    await expect(page.getByTestId('file-Cargo.toml')).toBeVisible();
  });
});
