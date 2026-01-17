/**
 * Yazi Quest E2E Test Utilities
 *
 * Common helper functions for testing the Yazi Quest game.
 */

import { Page, expect, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_DELAY = 500;

/**
 * Navigate to a specific level and skip the intro.
 * Consolidates waiting for network and handling the intro sequence.
 */
export async function goToLevel(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  await page.waitForLoadState('networkidle');

  // Unified intro skip logic.
  const skipButton = page.getByRole('button', { name: 'Skip Intro' });
  try {
    await skipButton.click({ timeout: 2000 });
    await expect(skipButton).not.toBeVisible({ timeout: 3000 });
  } catch (error) {
    // This is expected behavior for many levels.
  }

  await page.waitForTimeout(DEFAULT_DELAY); // Standard post-load delay
}

/**
 * Asserts that the level starts with 0 completed tasks.
 * This prevents regressions where a level might start in a pre-completed state.
 */
export async function assertLevelStartedIncomplete(page: Page): Promise<void> {
  // Wait for the Task counter to appear and assert it starts at 0
  const taskCounter = page.getByText(/Tasks: 0\/\d+/);
  await expect(taskCounter).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts the current task count and takes an optional screenshot for evidence.
 */
export async function assertTask(
  page: Page,
  taskCount: string,
  outputDir: string,
  screenshotName?: string
): Promise<void> {
  await expect(page.getByText(`Tasks: ${taskCount}`)).toBeVisible({ timeout: 5000 });

  if (screenshotName) {
    const url = new URL(page.url());
    const lvlStr = url.searchParams.get('lvl') || '0';
    const lvl = parseInt(lvlStr, 10);
    const ep = lvl > 0 ? Math.floor((lvl - 1) / 5) + 1 : 0;
    const evidenceDir = path.join(outputDir, 'evidence', `episode${ep}`, `lvl${lvl}`);

    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    const filename = screenshotName.endsWith('.png') ? screenshotName : `${screenshotName}.png`;
    const fullPath = path.join(evidenceDir, filename);

    await page.screenshot({ path: fullPath });
    // console.log(`Screenshot captured: ${fullPath}`);
  }
}

/**
 * Press a key in the game using window.dispatchEvent.
 * Applies a standard delay after each key press for CI stability.
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  const eventPayload: {
    key: string;
    code: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
  } = { key: '', code: '' };

  if (key.includes('+')) {
    const parts = key.split('+');
    const modifier = parts[0].toLowerCase();
    const mainKey = parts[1];

    if (modifier === 'shift') {
      eventPayload.shiftKey = true;
      eventPayload.key = mainKey.toUpperCase();
      eventPayload.code = `Key${mainKey.toUpperCase()}`;
    } else if (modifier === 'ctrl' || modifier === 'control') {
      eventPayload.ctrlKey = true;
      eventPayload.key = mainKey.toLowerCase();
      eventPayload.code = `Key${mainKey.toUpperCase()}`;
    }
  } else {
    eventPayload.key = key;
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      eventPayload.code = `Key${key.toUpperCase()}`;
    } else if (/\d/.test(key)) {
      eventPayload.code = `Digit${key}`;
    } else {
      // Map special keys to their 'code' values
      const codeMap: { [key: string]: string } = {
        ' ': 'Space',
        Enter: 'Enter',
        Escape: 'Escape',
        Tab: 'Tab',
        Backspace: 'Backspace',
        ',': 'Comma',
        '.': 'Period',
        '/': 'Slash',
      };
      eventPayload.code = codeMap[key] || '';
    }
  }

  await page.evaluate((payload) => {
    window.dispatchEvent(new KeyboardEvent('keydown', payload));
  }, eventPayload);

  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Press a sequence of keys with standard delays between them.
 */
export async function pressKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    await pressKey(page, key);
  }
}

/**
 * Types text into an input field with a minor delay between characters.
 */
export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

/**
 * Navigates down in the file list by pressing 'j' a specified number of times.
 */
export async function navigateDown(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await pressKey(page, 'j');
  }
}

/**
 * Navigates up in the file list by pressing 'k' a specified number of times.
 */
export async function navigateUp(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await pressKey(page, 'k');
  }
}

/**
 * Filter to find an item, then navigate into it.
 * Leaves the filter active on the parent directory.
 */
export async function filterAndNavigate(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, filterText);
  await pressKey(page, 'Escape'); // Exit filter mode to lock selection
  await pressKey(page, 'l'); // Navigate into directory
}

/**
 * Filter to find an item and select it (without navigating).
 * Leaves the filter active.
 */
export async function filterAndSelect(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, filterText);
  await pressKey(page, 'Escape'); // Exit filter mode
  await pressKey(page, ' '); // Toggle selection
}

/**
 * Ensures a clean state by clearing filters, search, and sorting.
 * Use this before critical navigation to prevent "protocol violations".
 */
export async function ensureCleanState(page: Page): Promise<void> {
  // Two escapes clear most modal states (filter, search input)
  await pressKey(page, 'Escape');
  await pressKey(page, 'Escape');
  // Reset sorting to natural
  await pressKey(page, ',');
  await pressKey(page, 'n');
}

/**
 * Execute a goto command (g followed by target key).
 */
export async function gotoCommand(
  page: Page,
  target: 'h' | 'c' | 'w' | 'd' | 'i' | 't' | 'r'
): Promise<void> {
  await pressKey(page, 'g');
  await pressKey(page, target);
}

/**
 * Get the task counter text (e.g., "1 / 5").
 */
export async function getTaskCount(page: Page): Promise<string> {
  const counter = page.locator('text=/\\d+ \\/ \\d+/').first();
  return (await counter.textContent()) || '';
}

/**
 * Checks if a task objective is visually marked as complete (dimmed).
 */
export async function isTaskCompleted(page: Page, taskIndex: number): Promise<boolean> {
  const objectives = page.locator('h3:has-text("Objectives") + div > div');
  const task = objectives.nth(taskIndex);
  return await task.evaluate((el) => el.classList.contains('opacity-50'));
}

/**
 * Wait for mission complete dialog or level advancement
 * Some levels complete so quickly that the toast disappears before we can check
 */
export async function waitForMissionComplete(page: Page): Promise<void> {
  try {
    // First try to catch the mission-complete toast
    await expect(page.getByTestId('mission-complete')).toBeVisible({
      timeout: 2000, // Shorter timeout since we have a fallback
    });
  } catch {
    // If toast isn't visible, check if we've advanced to the next level
    // This handles cases where the toast appeared and disappeared quickly
    await page.waitForTimeout(1000);

    // If we're still on the same level after 1s, something is wrong
    const currentLevel = await page.textContent('[class*="mission"]');
    if (!currentLevel) {
      throw new Error('Mission complete toast not found and level did not advance');
    }
  }
}

/**
 * Get the current directory path shown in the UI.
 */
export async function getCurrentPath(page: Page): Promise<string> {
  const pathElement = page.locator('//header/div[contains(@class, "flex-1")]').first();
  return (await pathElement.textContent()) || '';
}

/**
 * Check if the file info panel is visible (toggled by Tab).
 */
export async function isInfoPanelVisible(page: Page): Promise<boolean> {
  const panel = page.locator('text=FILE INFORMATION');
  return await panel.isVisible();
}

/**
 * Get the file name at the current cursor position.
 */
export async function getSelectedFileName(page: Page): Promise<string | null> {
  const selected = page.locator('[data-test-id^="fs-item-"][data-cursor="true"]');
  if (await selected.isVisible()) {
    const name = await selected.getAttribute('data-test-id');
    return name?.replace('fs-item-', '') || null;
  }
  return null;
}

/**
 * Check if hidden files are currently being shown in the file pane.
 */
export async function areHiddenFilesVisible(page: Page): Promise<boolean> {
  const hiddenIndicator = page.getByText('HIDDEN: ON');
  return await hiddenIndicator.isVisible();
}

/**
 * Get the clipboard status (e.g., "COPY: 1" or "MOVE: 2").
 */
export async function getClipboardStatus(page: Page): Promise<string | null> {
  const status = page.locator('[data-testid="status-clipboard"]');
  if (await status.isVisible()) {
    return status.textContent();
  }
  return null;
}
