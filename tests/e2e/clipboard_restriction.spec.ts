import { test, expect } from '@playwright/test';
import { startLevel } from './utils';

test.describe('Clipboard Level Restrictions', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  });

  test('Level 3 blocks yank (y) and allows cut (x)', async ({ page }) => {
    await startLevel(page, 3, { intro: false });

    // Level 3 starts at ~/incoming
    await page.keyboard.press('j'); // Move down to select something if not already on it
    await page.keyboard.press(' '); // Select the item

    // Attempt Yank (should be blocked)
    await page.keyboard.press('y');

    // Check for blocking notification
    const notification = page.getByTestId('system-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('PROTOCOL VIOLATION');
    // We expect advice on using Cut (x)
    await expect(notification).toContainText('Cut (x)');

    // Attempt Cut (should work)
    await page.keyboard.press('x');
    const clipboardStatus = page.getByTestId('status-clipboard');
    await expect(clipboardStatus).toBeVisible();
    await expect(clipboardStatus).toContainText('MOVE'); // MOVE indicates Cut
  });

  test('Level 6 blocks cut (x) and allows yank (y)', async ({ page }) => {
    await startLevel(page, 6, { intro: false });

    // Level 6: BATCH OPERATIONS. Hint: '... Replicate (y).'
    // Level 6 starts at ~ (which is /home/guest)
    // Select something by moving cursor and pressing Space
    await page.keyboard.press('j');
    await page.keyboard.press(' '); // Select the item

    // Attempt Cut (should be blocked if only Yank is requested)
    await page.keyboard.press('x');

    const notification = page.getByTestId('system-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('PROTOCOL VIOLATION');
    await expect(notification).toContainText('Yank (y)'); // Suggests Yank

    // Attempt Yank (should work)
    await page.keyboard.press('y');
    const clipboardStatus = page.getByTestId('status-clipboard');
    await expect(clipboardStatus).toBeVisible();
    await expect(clipboardStatus).toContainText('COPY'); // COPY indicates Yank
  });

  test('Level 15 requests (x) and (x) only in phase 1 checks?', async ({ page }) => {
    // Level 15 hint: '... Batch move (Space, x, p). Overwrite (Shift+P).'
    // This explicitly lists 'x'. So 'x' should be allowed.
    // It does NOT list 'y'. So 'y' should be blocked.

    await startLevel(page, 15, { intro: false });

    // Need to find a file first, start in /tmp
    // /tmp has vault dir and some files
    await page.keyboard.press('j');
    await page.keyboard.press(' '); // Select the item

    // Try Yank (should be blocked because it's not requested)
    await page.keyboard.press('y');

    const notification = page.getByTestId('system-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('PROTOCOL VIOLATION');

    // Try Cut (should work)
    await page.keyboard.press('x');
    const clipboardStatus = page.getByTestId('status-clipboard');
    await expect(clipboardStatus).toBeVisible();
    await expect(clipboardStatus).toContainText('MOVE');
  });

  test('Level with mixed requirements allows both', async ({ page }) => {
    // Level 4 hint: "Replicate (y), exfiltrate (x)."
    await startLevel(page, 4, { intro: false });

    await page.keyboard.press('j');
    await page.keyboard.press(' '); // Select the item

    // Try Yank (should work)
    await page.keyboard.press('y');
    let clipboardStatus = page.getByTestId('status-clipboard');
    await expect(clipboardStatus).toBeVisible();
    await expect(clipboardStatus).toContainText('COPY');

    // Try Cut (should work - overrides clipboard)
    await page.keyboard.press('x');
    clipboardStatus = page.getByTestId('status-clipboard');
    await expect(clipboardStatus).toBeVisible();
    await expect(clipboardStatus).toContainText('MOVE');
  });
});
