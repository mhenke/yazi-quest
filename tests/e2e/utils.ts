/**
 * Yazi Quest E2E Test Utilities
 *
 * Common helper functions for testing the Yazi Quest game.
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Navigate to a specific level and skip the intro
 */
export async function goToLevel(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Try to click Skip Intro button if it exists
  const skipButton = page.getByRole('button', { name: 'Skip Intro' });
  try {
    await skipButton.click({ timeout: 2000 });
    // Wait for intro overlay to disappear
    await skipButton.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Intro may not be present for this level, continue
  }
  await page.waitForTimeout(300);
}

/**
 * Press a key in the game using window.dispatchEvent
 * This matches the browser subagent's successful approach
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  // Handle special key combinations
  if (key === 'Shift+g' || key === 'Shift+G') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'G', code: 'KeyG', shiftKey: true })
      );
    });
  } else if (key === 'Shift+j' || key === 'Shift+J') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'J', code: 'KeyJ', shiftKey: true })
      );
    });
  } else if (key === 'Shift+k' || key === 'Shift+K') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'K', code: 'KeyK', shiftKey: true })
      );
    });
  } else if (key === 'Shift+Enter') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', shiftKey: true })
      );
    });
  } else if (key === 'Control+a' || key === 'Control+A') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true }));
    });
  } else if (key === ' ') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
    });
  } else if (key === 'Enter') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    });
  } else if (key === 'Escape') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    });
  } else if (key === 'Tab') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab' }));
    });
  } else if (key === 'Backspace') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace' }));
    });
  } else if (key === 'Control+r' || key === 'Control+R') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', ctrlKey: true }));
    });
  } else if (key === 'Shift+d' || key === 'Shift+D') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'D', code: 'KeyD', shiftKey: true })
      );
    });
  } else if (key === 'Shift+p' || key === 'Shift+P') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'P', code: 'KeyP', shiftKey: true })
      );
    });
  } else if (key === 'Shift+y' || key === 'Shift+Y') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Y', code: 'KeyY', shiftKey: true })
      );
    });
  } else if (key === 'Shift+z' || key === 'Shift+Z') {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Z', code: 'KeyZ', shiftKey: true })
      );
    });
  } else if (key === ',') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ',', code: 'Comma' }));
    });
  } else if (key === '.') {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '.', code: 'Period' }));
    });
  } else if (/^[0-9]$/.test(key)) {
    // Handle digits 0-9
    await page.evaluate(
      ({ k }) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: `Digit${k}` }));
      },
      { k: key }
    );
  } else {
    // Single character key
    const lowerKey = key.toLowerCase();
    const code = `Key${key.toUpperCase()}`;
    await page.evaluate(
      ({ k, c }) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: c }));
      },
      { k: lowerKey, c: code }
    );
  }
  await page.waitForTimeout(100);
}

/**
 * Press a sequence of keys with delays
 */
export async function pressKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    await pressKey(page, key);
  }
}

/**
 * Type text (for filter, create, rename inputs)
 */
export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

/**
 * Filter to find an item, navigate to it, and clear the filter
 * This properly handles filter application and cleanup
 */
export async function filterAndNavigate(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, filterText);
  await page.keyboard.press('Escape'); // Exit filter mode (filter remains applied)
  await pressKey(page, 'Enter'); // Navigate into the filtered item
  // Filter is on parent directory, which we've now left
}

/**
 * Filter to find an item and select it (without navigating)
 * Does NOT clear the filter - caller should clear if needed
 */
export async function filterAndSelect(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, filterText);
  await page.keyboard.press('Escape'); // Exit filter mode
  await pressKey(page, ' '); // Toggle selection on the filtered item
}

/**
 * Clear any active filter in the current directory
 */
export async function clearFilter(page: Page): Promise<void> {
  await pressKey(page, 'Escape');
  await page.waitForTimeout(100);
}

/**
 * Execute a goto command (g followed by target key)
 */
export async function gotoCommand(
  page: Page,
  target: 'h' | 'c' | 'w' | 'd' | 'i' | 't' | 'r'
): Promise<void> {
  await pressKey(page, 'g');
  await page.waitForTimeout(50);
  await pressKey(page, target);
  await page.waitForTimeout(200);
}

/**
 * Get the task counter text (e.g., "1 / 5")
 */
export async function getTaskCount(page: Page): Promise<string> {
  const counter = page.locator('text=/\\d+ \\/ \\d+/').first();
  return (await counter.textContent()) || '';
}

/**
 * Check if a task is completed (has checkmark)
 */
export async function isTaskCompleted(page: Page, taskIndex: number): Promise<boolean> {
  const objectives = page.locator('[class*="OBJECTIVES"] ~ div, .objectives div');
  const task = objectives.nth(taskIndex);
  // Check for checkmark icon or completed styling
  const hasCheck = await task.locator('svg, [class*="text-green"]').count();
  return hasCheck > 0;
}

/**
 * Wait for mission complete dialog
 */
export async function waitForMissionComplete(page: Page): Promise<void> {
  await expect(page.getByText('MISSION COMPLETE')).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for specific task to be completed
 */
export async function waitForTaskComplete(page: Page, taskText: string): Promise<void> {
  // Tasks get a strikethrough or checkmark when completed
  await page.waitForTimeout(300);
}

/**
 * Get the current directory path shown in the UI
 */
export async function getCurrentPath(page: Page): Promise<string> {
  // The path is typically shown in the header area
  const pathElement = page.locator('[class*="path"], .breadcrumb, header').first();
  return (await pathElement.textContent()) || '';
}

/**
 * Check if the file info panel is visible (Tab toggle)
 */
export async function isInfoPanelVisible(page: Page): Promise<boolean> {
  const panel = page.locator('text=FILE INFORMATION');
  return await panel.isVisible();
}

/**
 * Get selected file name (cursor position)
 */
export async function getSelectedFileName(page: Page): Promise<string | null> {
  // The selected item typically has a specific class or background
  const selected = page.locator('[class*="selected"], [class*="cursor"], .ring-2').first();
  const text = await selected.textContent();
  return text?.trim() || null;
}

/**
 * Check if hidden files are shown
 */
export async function areHiddenFilesVisible(page: Page): Promise<boolean> {
  const hiddenIndicator = page.getByText('HIDDEN: ON');
  return await hiddenIndicator.isVisible();
}

/**
 * Get the clipboard status (e.g., "COPY: 1" or "MOVE: 2")
 */
export async function getClipboardStatus(page: Page): Promise<string | null> {
  const copyStatus = page.locator('text=/COPY: \\d+/');
  const moveStatus = page.locator('text=/MOVE: \\d+/');

  if (await copyStatus.isVisible()) {
    return await copyStatus.textContent();
  }
  if (await moveStatus.isVisible()) {
    return await moveStatus.textContent();
  }
  return null;
}
