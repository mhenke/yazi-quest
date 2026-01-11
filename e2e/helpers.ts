import { Page, expect } from '@playwright/test';

/**
 * Wait for the game to load and be ready for interaction
 */
export async function waitForGameLoad(page: Page): Promise<void> {
  // Wait for the main game container to appear
  await page.waitForSelector('.bg-zinc-950', { timeout: 10000 });
  // Short delay to let React finish initial render
  await page.waitForTimeout(500);
}

/**
 * Dismiss the episode intro if it's showing
 * Episode intro requires Shift+Enter to dismiss
 */
export async function dismissEpisodeIntro(page: Page): Promise<void> {
  // Wait a bit for the page to settle
  await page.waitForTimeout(300);

  // Try multiple times to dismiss any intro/overlay
  for (let i = 0; i < 3; i++) {
    const intro = page.locator('text=EPISODE');
    const skipButton = page.locator('text=SKIP INTRO');

    if (
      (await intro.isVisible({ timeout: 500 }).catch(() => false)) ||
      (await skipButton.isVisible({ timeout: 500 }).catch(() => false))
    ) {
      // Press Shift+Enter to dismiss (as shown in UI: "Press Shift+Enter to continue")
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }

  // Wait for game to be ready
  await page.waitForTimeout(200);
}

/**
 * Press a key and wait briefly for the game to react
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(100);
}

/**
 * Type text character by character with small delays
 */
export async function typeText(page: Page, text: string): Promise<void> {
  for (const char of text) {
    await page.keyboard.type(char);
    await page.waitForTimeout(50);
  }
}

/**
 * Open the level map via Alt+M
 */
export async function openLevelMap(page: Page): Promise<void> {
  await page.keyboard.press('Alt+m');
  await page.waitForTimeout(300);
}

/**
 * Jump to a specific level via the level map
 * Uses keyboard navigation: j/k to select, Enter to jump
 */
export async function jumpToLevel(page: Page, levelIndex: number): Promise<void> {
  await openLevelMap(page);
  await page.waitForTimeout(300);

  // The map modal uses j/k to navigate levels, Enter to select
  // Level 0 is already selected by default when we open the map
  // Navigate down to the target level
  for (let i = 0; i < levelIndex; i++) {
    await page.keyboard.press('j');
    await page.waitForTimeout(100);
  }

  // Press Enter to jump to the selected level
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

/**
 * Get the current path text from the UI
 */
export async function getCurrentPath(page: Page): Promise<string> {
  const pathElement = page.locator('[data-testid="current-path"]');
  if (await pathElement.isVisible({ timeout: 1000 }).catch(() => false)) {
    return (await pathElement.textContent()) || '';
  }

  // Look for elements with font-mono and try to find a path-like string
  const texts = await page.locator('.font-mono').allTextContents();
  for (const txt of texts) {
    if (!txt) continue;
    const lower = txt.toLowerCase();
    if (
      txt.includes('/') ||
      txt.includes('~') ||
      /guest|datastore|incoming|workspace|tmp|config|root/i.test(lower)
    ) {
      return txt.trim();
    }
  }

  // Fallback: look for the path bar
  const pathBar = page.locator('.font-mono.text-zinc-400').first();
  return (await pathBar.textContent()) || '';
}

/**
 * Verify the current directory path contains expected text
 */
export async function expectPathContains(page: Page, expected: string): Promise<void> {
  const path = await getCurrentPath(page);
  expect(path).toContain(expected);
}

/**
 * Get the count of visible items in the file list
 */
export async function getVisibleItemCount(page: Page): Promise<number> {
  await page.waitForTimeout(200);
  const items = page.locator(
    '[data-testid="filesystem-pane-active"] .cursor-pointer, [data-testid="filesystem-pane-active"] [role="listitem"]',
  );
  const count = await items.count();
  // Fallback: count file entries by looking for file icons
  if (count === 0) {
    const fileEntries = page.locator('.flex-1 .flex.items-center.gap-2');
    return await fileEntries.count();
  }
  return count;
}

/**
 * Check if filter mode is active
 */
export async function isFilterModeActive(page: Page): Promise<boolean> {
  const filterInput = page.locator(
    '[data-testid="filter-input"], input[placeholder*="filter"], .text-orange-500:has-text("Filter")',
  );
  return await filterInput.isVisible({ timeout: 500 }).catch(() => false);
}

/**
 * Enter filter mode and type a filter string
 */
export async function enterFilter(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await page.waitForTimeout(200);
  await typeText(page, filterText);
}

/**
 * Exit filter mode with Escape
 */
export async function exitFilterMode(page: Page): Promise<void> {
  await pressKey(page, 'Escape');
  await page.waitForTimeout(200);
}

/**
 * Check if the fuzzy finder (search) input is visible.
 */
export async function isFuzzyFinderVisible(page: Page): Promise<boolean> {
  const finder = page.locator('[data-test-id="fuzzy-finder"]');
  return finder.isVisible({ timeout: 1000 });
}

/**
 * Expect a file with a given name to be visible in the file list.
 */
export async function expectFileInView(page: Page, filename: string): Promise<void> {
  const fileLocator = page.locator(`[data-test-id="file-${filename}"]`);
  await expect(fileLocator).toBeVisible({ timeout: 2000 });
}

/**
 * Expect a file with a given name to NOT be visible in the file list.
 */
export async function expectFileNotInView(page: Page, filename: string): Promise<void> {
  const fileLocator = page.locator(`[data-test-id="file-${filename}"]`);
  await expect(fileLocator).not.toBeVisible({ timeout: 2000 });
}
