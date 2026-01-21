/**
 * Utility to robustly rename a file or directory using the rename (r) command.
 * Ensures the input is cleared before typing the new name.
 * Usage: await renameItem(page, 'uplink_v2.conf');
 */
export async function findFZF(page: Page, name: string): Promise<void> {
  await pressKey(page, 'z');
  await page.keyboard.type(name, { delay: 50 });
  // Wait for results to appear in the DOM before confirming
  // The fuzzy finder renders results in a div with data-test-id="fuzzy-finder"
  // We can look for the item name in the results
  const fuzzyFinder = page.locator('[data-testid="fuzzy-finder"]');
  await expect(fuzzyFinder).toBeVisible();
  await expect(fuzzyFinder.getByText(name).first()).toBeVisible({ timeout: 500 });

  await page.keyboard.press('Enter');
  await page.waitForTimeout(DEFAULT_DELAY); // Wait for navigation to complete
}

/**
 * Utility to robustly rename a file or directory using the rename (r) command.
 * Ensures the input is cleared before typing the new name.
 * Usage: await renameItem(page, 'uplink_v2.conf');
 */
export async function renameItem(page: Page, name: string): Promise<void> {
  await page.keyboard.press('r');
  await expect(page.getByTestId('input-modal')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(200); // Wait for modal animation/focus
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(name, { delay: 30 });
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('input-modal')).not.toBeVisible({ timeout: 500 });
}

/**
 * Utility to create a file or directory using the add (a) command.
 * Usage: await addItem(page, 'filename_or_dir/');
 */
export async function addItem(page: Page, name: string): Promise<void> {
  await page.keyboard.press('a');
  await expect(page.getByTestId('input-modal')).toBeVisible({ timeout: 2000 });
  await page.waitForTimeout(200); // Wait for modal animation/focus
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(name, { delay: 30 });
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('input-modal')).not.toBeVisible({ timeout: 2000 });
}

/**
 * Yazi Quest E2E Test Utilities
 *
 * Common helper functions for testing the Yazi Quest game.
 */

import { Page, expect } from '@playwright/test';
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
    await skipButton.click({ timeout: 500 });
    await expect(skipButton).not.toBeVisible({ timeout: 1000 });
  } catch {
    // This is expected behavior for many levels.
  }

  await page.waitForTimeout(DEFAULT_DELAY); // Standard post-load delay
}

/**
 * Combines goToLevel and assertLevelStartedIncomplete for a cleaner test start.
 */
export async function startLevel(page: Page, level: number): Promise<void> {
  await goToLevel(page, level);
  await assertLevelStartedIncomplete(page);
}

/**
 * Asserts that the level starts with 0 completed tasks.
 * This prevents regressions where a level might start in a pre-completed state.
 */
export async function assertLevelStartedIncomplete(page: Page): Promise<void> {
  // Wait for the Task counter to appear and assert it starts at 0
  const taskCounter = page.getByText(/Tasks: 0\/\d+/);
  await expect(taskCounter).toBeVisible({ timeout: 500 });
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

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(evidenceDir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
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

    // Auto-detect uppercase letters and apply Shift modifier implied by physics
    if (key.length === 1 && /[A-Z]/.test(key)) {
      eventPayload.shiftKey = true;
    }

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
 * Dismisses a game alert (like Protocol Violation or Threat Detected) using Shift+Enter.
 */
export async function dismissAlert(page: Page): Promise<void> {
  await page.keyboard.press('Shift+Enter');
}

/**
 * Standardizes mission completion verification.
 * Waits for mission complete state and asserts the success toast title.
 */
export async function confirmMission(page: Page, title: string): Promise<void> {
  await waitForMissionComplete(page);
  await expect(page.getByRole('alert').getByText(title)).toBeVisible();
}

/**
 * Utility to delete the currently selected item(s).
 * Handles both normal (d) and permanent (D) deletion flows.
 */
export async function deleteItem(
  page: Page,
  options: { permanent?: boolean; confirm?: boolean } = { confirm: true }
): Promise<void> {
  if (options.permanent) {
    await page.keyboard.press('Shift+D');
  } else {
    await pressKey(page, 'd');
  }

  if (options.confirm) {
    // Wait for the confirmation modal to appear to avoid race conditions
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(200);
    await pressKey(page, 'y'); // Confirm deletion
  }
}

/**
 * Asserts the content of the status clipboard.
 */
export async function expectClipboard(page: Page, text: string): Promise<void> {
  await expect(page.locator('[data-testid="status-clipboard"]')).toContainText(text);
}

/**
 * Asserts the current directory name in the breadcrumbs.
 */
export async function expectCurrentDir(page: Page, dirName: string): Promise<void> {
  await expect(page.locator('.breadcrumb')).toContainText(dirName);
}

/**
 * Navigates to the parent directory by pressing 'h'.
 */
export async function goParent(page: Page): Promise<void> {
  await pressKey(page, 'h');
}

/**
 * Navigates up parent directories multiple times.
 */
export async function goParentCount(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await goParent(page);
  }
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
 * Filters the file list by text and then exits the filter input, keeping the
 * file selection active. This uses a direct keyboard event for 'Escape'
 * as it's more reliable for modal inputs.
 */
export async function filterByText(page: Page, text: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, text);
  await page.keyboard.press('Enter'); // Confirm filter

  // Handle distinct Protocol Violation modal that may appear
  try {
    const modal = page.getByText(/Protocol Violation/i);
    if (await modal.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape'); // Dismiss modal
      await page.waitForTimeout(200);
    }
  } catch {
    // Ignore timeout, modal didn't appear
  }
}

/**
 * Clears an active filter by pressing Escape.
 */
export async function clearFilter(page: Page): Promise<void> {
  await page.keyboard.press('Escape'); // Use direct press for modal
}

/**
 * Performs a recursive search from the current location.
 */
export async function search(page: Page, query: string): Promise<void> {
  await pressKey(page, 's');
  await typeText(page, query);
  await page.keyboard.press('Enter'); // Confirm search
}

/**
 * Filter to find an item and select it (without navigating).
 * Leaves the filter active.
 */
export async function filterAndSelect(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  await typeText(page, filterText);
  await page.keyboard.press('Enter'); // Confirm filter

  // Handle distinct Protocol Violation modal that may appear
  try {
    const modal = page.getByText(/Protocol Violation/i);
    if (await modal.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape'); // Dismiss modal
      await page.waitForTimeout(200);
    }
  } catch {
    // Ignore timeout
  }

  await pressKey(page, ' '); // Toggle selection
  await clearFilter(page); // Clear filter for next action
}

/**
 * Executes a fuzzy jump to a directory.
 */
export async function fuzzyJump(page: Page, target: string): Promise<void> {
  await pressKey(page, 'Shift+Z');
  await typeText(page, target);
  await page.keyboard.press('Enter');
}

/**
 * Ensures a clean state by clearing filters, search, and sorting.
 * Use this before critical navigation to prevent "protocol violations".
 */
export async function ensureCleanState(page: Page): Promise<void> {
  // Two escapes clear most modal states (filter, search input)
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // Reset sorting to natural
  await pressKey(page, ',');
  await pressKey(page, 'n');
}

/**
 * Execute a goto command (g followed by target key).
 */
export async function gotoCommand(
  page: Page,
  target: 'h' | 'c' | 'w' | 'd' | 'i' | 't' | 'r' | 'g'
): Promise<void> {
  await pressKey(page, 'g');
  await pressKey(page, target);
}

/**
 * Asserts that the game is currently on the expected level.
 */
export async function assertLevel(page: Page, levelId: string): Promise<void> {
  await expect(page.getByText(`LVL ${levelId}`)).toBeVisible({ timeout: 5000 });
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
 * Waits for either the mission complete dialog to appear or for the URL to change,
 * indicating that the next level has loaded. Throws an error if neither occurs.
 */
export async function waitForMissionComplete(page: Page): Promise<void> {
  await Promise.race([
    expect(page.getByTestId('mission-complete')).toBeVisible({ timeout: 10000 }),
    page.waitForURL((url) => !url.search.includes(page.url())),
  ]).catch(() => {
    throw new Error('Timeout waiting for mission complete or level advancement.');
  });
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
  const selected = page
    .locator('[data-testid^="file-"]')
    .filter({ has: page.locator('[aria-current="location"]') });
  if (await selected.isVisible()) {
    const testid = await selected.getAttribute('data-testid');
    return testid?.replace('file-', '') || null;
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
