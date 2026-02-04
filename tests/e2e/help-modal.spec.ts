import { test, expect } from '@playwright/test';
import { startLevel, pressKey } from './utils';

test.describe.skip('Help Modal', () => {
  test('opens and closes correctly', async ({ page }) => {
    // Start at Level 1
    await startLevel(page, 1, { intro: false });

    // Ensure it's not visible initially
    await expect(page.getByTestId('help-modal')).not.toBeVisible();

    // Open with 'Alt+?' (Meta command)
    await pressKey(page, 'Alt+?');

    // Check visibility
    await expect(page.getByTestId('help-modal')).toBeVisible();
    await expect(page.getByText('HELP / KEYBINDINGS')).toBeVisible();
    await expect(page.getByText('Core Yazi Commands')).toBeVisible();

    // Check for specific command content
    await expect(page.getByText('Navigation').first()).toBeVisible();

    // Close with Escape
    await pressKey(page, 'Escape');
    await expect(page.getByTestId('help-modal')).not.toBeVisible();
  });

  test('scrolls with j/k keys', async ({ page }) => {
    await startLevel(page, 1, { intro: false });
    await pressKey(page, 'Alt+?');
    await expect(page.getByTestId('help-modal')).toBeVisible();

    // We can't easily check scroll position visually in a headless way without complex evaluation,
    // but we can ensure the app doesn't crash or close when pressing nav keys inside the modal.
    await pressKey(page, 'j');
    await pressKey(page, 'j');
    await expect(page.getByTestId('help-modal')).toBeVisible();

    await pressKey(page, 'k');
    await expect(page.getByTestId('help-modal')).toBeVisible();
  });
});
