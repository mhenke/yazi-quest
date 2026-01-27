/**
 * Helper to press a navigation key multiple times.
 */
async function repeatKey(page: Page, key: string, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await pressKey(page, key);
  }
}
/**
 * Navigates left in the file list by pressing 'h' a specified number of times.
 */
export async function navigateLeft(page: Page, count: number): Promise<void> {
  await repeatKey(page, 'h', count);
}

/**
 * Navigates right in the file list by pressing 'l' a specified number of times.
 */
export async function navigateRight(page: Page, count: number): Promise<void> {
  await repeatKey(page, 'l', count);
}

/**
 * Enters a directory by its name using filtering for robustness.
 */
export async function enterDirectory(page: Page, name: string): Promise<void> {
  await filterByText(page, name);
  await navigateRight(page, 1);
  await clearFilter(page);
}

/**
 * Navigates up to the parent directory.
 */
export async function goUp(page: Page, count: number = 1): Promise<void> {
  await repeatKey(page, 'h', count);
}
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
  await page.waitForTimeout(500); // Small wait for focus stabilization
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
  await expect(page.getByTestId('input-modal')).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(500); // Small wait for focus stabilization
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(name, { delay: 30 });
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('input-modal')).not.toBeVisible({ timeout: 500 });
}

/**
 * Yazi Quest E2E Test Utilities
 *
 * Common helper functions for testing the Yazi Quest game.
 */

import { Page, expect, TestInfo } from '@playwright/test';

export const DEFAULT_DELAY = 75;

/**
 * Navigates to a specific level, handling intro and boot sequences.
 *
 * @param page Playwright Page object.
 * @param level The level number to start.
 * @param options.intro If `false`, skips intro and boot sequences. Defaults to `true`.
 */
export async function startLevel(
  page: Page,
  level: number,
  options: { intro: boolean; extraParams?: Record<string, string> } = { intro: true }
): Promise<void> {
  const params = new URLSearchParams();
  params.set('lvl', level.toString());
  if (!options.intro) {
    params.set('intro', 'false');
  }
  if (options.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      params.set(key, value);
    }
  }

  await page.goto(`/?${params.toString()}`);
  await page.waitForLoadState('domcontentloaded');

  // Unified intro skip logic.
  // Set a global skip flag and dispatch the skip event to handle boot and intro overlays
  // that may miss a dispatched event if the component hasn't attached listeners yet.
  // Set the skip flag and dispatch the event. Also attempt to click any visible Skip Intro button as a fallback.
  await page.evaluate(() => {
    window.__yaziQuestSkipIntroRequested = true;
    window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
  });

  // Fallback: if a visual Skip Intro button exists (e.g., Boot screen), click it.
  try {
    const skipBtn = await page.getByRole('button', { name: 'Skip Intro' });
    await skipBtn.click({ timeout: 500 });
  } catch {
    // ignore - not present in many levels
  }

  const skipButton = page.getByRole('button', { name: 'Skip Intro' });
  try {
    await skipButton.click({ timeout: 500 });
    await expect(skipButton).not.toBeVisible({ timeout: 500 });
  } catch {
    // This is expected behavior for many levels.
  }

  // Handle episode intro screens that require Shift+Enter to progress
  // These intros don't have visible buttons but require key presses
  if (options.intro) {
    try {
      // Check if episode intro is visible (has the characteristic classes)
      // Only certain levels (episode starts) have episode intros
      const introVisible = await page
        .locator('div.bg-black.absolute.inset-0')
        .isVisible({ timeout: 500 });
      if (introVisible) {
        // Press Shift+Enter multiple times to get through the episode intro
        await page.keyboard.press('Shift+Enter');
        await page.keyboard.press('Shift+Enter');
        await page.keyboard.press('Shift+Enter');

        // Wait for intro to disappear
        await expect(page.locator('div.bg-black.absolute.inset-0')).not.toBeVisible({
          timeout: 500,
        });
      }
    } catch {
      // If no intro screen appears within timeout, continue with normal flow
    }
  }

  // Wait for the app to be ready - specifically for the status bar Tasks indicator.
  await page.waitForFunction(() => !!document.querySelector('[data-testid="status-bar"]'));

  // Ensure no blocking overlays (Intro/Boot) are present before returning
  // This is critical because App.tsx blocks inputs while these are visible
  await expect(page.locator('div.bg-black.absolute.inset-0')).not.toBeVisible({ timeout: 500 });

  await page.waitForTimeout(DEFAULT_DELAY); // Standard post-load delay

  // Assert level started incomplete
  await assertLevelStartedIncomplete(page);
}

/**
 * Navigates to a specific level, handling intro screens appropriately.
 */
export async function goToLevel(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  await page.waitForLoadState('networkidle');

  // Unified intro skip logic.
  // Set a global skip flag and dispatch the skip event to handle boot and intro overlays
  // that may miss a dispatched event if the component hasn't attached listeners yet.
  // Set the skip flag and dispatch the event. Also attempt to click any visible Skip Intro button as a fallback.
  await page.evaluate(() => {
    window.__yaziQuestSkipIntroRequested = true;
    window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
  });

  // Fallback: if a visual Skip Intro button exists (e.g., Boot screen), click it.
  try {
    const skipBtn = await page.getByRole('button', { name: 'Skip Intro' });
    await skipBtn.click({ timeout: 500 });
  } catch {
    // ignore - not present in many levels
  }

  const skipButton = page.getByRole('button', { name: 'Skip Intro' });
  try {
    await skipButton.click({ timeout: 500 });
    await expect(skipButton).not.toBeVisible({ timeout: 500 });
  } catch {
    // This is expected behavior for many levels.
  }

  // Handle episode intro screens that require Shift+Enter to progress
  // These intros don't have visible buttons but require key presses
  try {
    // Check if episode intro is visible (has the characteristic classes)
    const introVisible = await page
      .locator('div.bg-black.absolute.inset-0')
      .isVisible({ timeout: 500 });
    if (introVisible) {
      // Press Shift+Enter multiple times to get through the episode intro
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Shift+Enter');

      // Wait for intro to disappear
      await expect(page.locator('div.bg-black.absolute.inset-0')).not.toBeVisible({
        timeout: 500,
      });
    }
  } catch {
    // If no intro screen, continue with normal flow
  }

  // Wait for the app to be ready - specifically for the status bar Tasks indicator.
  await page.waitForFunction(() => !!document.querySelector('[data-testid="status-bar"]'));
  await page.waitForTimeout(DEFAULT_DELAY); // Standard post-load delay
}

/**
 * Starts a level and progresses through intro with early Shift+Enter.
 */
export async function startLevelWithEarlyIntroSkip(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  await page.waitForLoadState('networkidle');

  // Handle both boot screen and episode intro
  // Boot screen has skip button
  try {
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    await skipButton.click({ timeout: 500 });
    await expect(skipButton).not.toBeVisible({ timeout: 500 });
  } catch {
    // Skip button not present, continue
  }

  // Episode intro requires Shift+Enter
  try {
    const introLocator = page.locator('div.bg-black.absolute.inset-0');
    if (await introLocator.isVisible({ timeout: 500 })) {
      await pressKey(page, 'Shift+Enter');
      await expect(introLocator).not.toBeVisible({ timeout: 500 });
    }
  } catch {
    // No intro screen, continue
  }

  await page.waitForFunction(() => !!document.querySelector('[data-testid="status-bar"]'));
  await page.waitForTimeout(DEFAULT_DELAY);
  await assertLevelStartedIncomplete(page);
}

/**
 * Starts a level and lets intro complete naturally.
 */
export async function startLevelWithFullIntro(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  await page.waitForLoadState('networkidle');

  // Handle boot screen if present
  try {
    const skipButton = page.getByRole('button', { name: 'Skip Intro' });
    await skipButton.click({ timeout: 500 });
    await expect(skipButton).not.toBeVisible({ timeout: 500 });
  } catch {
    // Skip button not present, continue
  }

  // For episode intro, let text complete then press Shift+Enter
  try {
    const introLocator = page.locator('div.bg-black.absolute.inset-0');
    if (await introLocator.isVisible({ timeout: 500 })) {
      // Wait for text to finish (longer timeout)
      await page.waitForTimeout(500);
      await pressKey(page, 'Shift+Enter');
      await expect(introLocator).not.toBeVisible({ timeout: 500 });
    }
  } catch {
    // No intro screen, continue
  }

  await page.waitForFunction(() => !!document.querySelector('[data-testid="status-bar"]'));
  await page.waitForTimeout(DEFAULT_DELAY);
  await assertLevelStartedIncomplete(page);
}

/**
 * Asserts that the level starts with 0 completed tasks.
 * This prevents regressions where a level might start in a pre-completed state.
 * Updated to wait for status bar first.
 */
export async function assertLevelStartedIncomplete(page: Page): Promise<void> {
  // Ensure the status bar is visible before trying to find the task counter
  await expect(page.locator('[data-testid="status-bar"]')).toBeVisible({ timeout: 500 });

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
  _outputDir: string,
  _screenshotName?: string
): Promise<void> {
  const expectedCompleted = taskCount.split('/')[0];
  // eslint-disable-next-line security/detect-non-literal-regexp
  const tasksRegex = new RegExp(`Tasks:\\s*${expectedCompleted}/\\d+`);
  await expect(page.getByTestId('task-counter')).toHaveText(tasksRegex, {
    timeout: 1000,
  });
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
 * Dismisses a game alert if it is currently visible.
 * Useful for handling conditional threats or protocol violations.
 */
export async function dismissAlertIfPresent(
  page: Page,
  textRegex?: string | RegExp
): Promise<boolean> {
  const alert = textRegex
    ? page.getByText(textRegex)
    : page.locator('[role="alert"], [role="alertdialog"], [data-testid="threat-alert"]').first();

  try {
    if (await alert.isVisible({ timeout: 500 })) {
      await dismissAlert(page);
      await page.waitForTimeout(500);
      return true;
    }
  } catch {
    // Ignore timeout, alert didn't appear
  }
  return false;
}

/**
 * Asserts that a specified narrative thought appears on screen.
 */
export async function expectNarrativeThought(page: Page, text: string | RegExp): Promise<void> {
  const thought = page.locator('[data-testid="narrative-thought"]');
  await expect(thought).toBeVisible({ timeout: 500 });
  await expect(thought).toContainText(text);
}

/**
 * Standardizes mission completion verification.
 * Waits for mission complete state and asserts the success toast title.
 */
export async function confirmMission(page: Page, title: string | RegExp): Promise<void> {
  await waitForMissionComplete(page);
  const alert = page.getByRole('alert').first();
  await expect(alert).toBeVisible();
  const text = await alert.textContent();
  const match = title instanceof RegExp ? title.test(text || '') : text?.includes(title);
  if (!match) {
    throw new Error(`Expected mission title matching '${title}' but found: '${text}'`);
  }
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
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 500 });
    await page.waitForTimeout(500);
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
  await repeatKey(page, 'j', count);
}

/**
 * Navigates up in the file list by pressing 'k' a specified number of times.
 */
export async function navigateUp(page: Page, count: number): Promise<void> {
  await repeatKey(page, 'k', count);
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
      await page.waitForTimeout(500);
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
  await expect(page.getByTestId('filter-input')).not.toBeVisible(); // Ensure mode switch

  // Handle distinct Protocol Violation modal that may appear
  try {
    const modal = page.getByText(/Protocol Violation/i);
    if (await modal.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape'); // Dismiss modal
      await page.waitForTimeout(500);
    }
  } catch {
    // Ignore timeout
  }

  // Wait for the item to be visible in the active pane to ensure filter applied
  // Wait for the item to be visible in the active pane to ensure filter applied
  // Use a regex for case-insensitive partial match to be more robust
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  await expect(page.getByTestId('filesystem-pane-active').getByText(regex).first()).toBeVisible({
    timeout: 500,
  });

  await page.waitForTimeout(500); // Wait for state to settle
  await pressKey(page, ' '); // Toggle selection
  await page.waitForTimeout(500); // Wait for selection to register
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
 * Execute a sort command ( , followed by target modifier).
 */
export async function sortCommand(page: Page, modifier: string): Promise<void> {
  await pressKey(page, ',');
  await pressKey(page, modifier);
}

/**
 * Asserts that the game is currently on the expected level.
 */
export async function assertLevel(page: Page, levelId: string): Promise<void> {
  await expect(page.getByText(`LVL ${levelId}`)).toBeVisible({ timeout: 500 });
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
  // Check for Protocol Violation (blocking modal) and auto-dismiss if tasks are likely complete
  try {
    const violation = page.getByText('Protocol Violation');
    if (await violation.isVisible({ timeout: 1000 })) {
      await page.waitForTimeout(100);
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(100);
    }
  } catch {
    // Ignore if not present
  }

  const currentUrl = new URL(page.url());
  const currentLvl = currentUrl.searchParams.get('lvl');

  await Promise.race([
    expect(page.getByTestId('mission-complete'))
      .toBeVisible()
      .catch(() => {
        // Check for text if testId fails
        return expect(page.getByText('Mission Complete', { exact: false })).toBeVisible();
      }),
    page.waitForURL((url) => {
      const newLvl = url.searchParams.get('lvl');
      return newLvl !== currentLvl;
    }),
  ]).catch((e) => {
    throw new Error(`Timeout waiting for mission complete or level advancement. Error: ${e}`);
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

/**
 * Handles the multi-section intro sequence by pressing Shift+Enter until the intro is complete.
 * This also handles the BiosBoot screen that follows the Episode 1 intro.
 */
export async function completeIntro(page: Page): Promise<void> {
  // The intro screen has a specific container class
  const introContainer = page.locator('.absolute.inset-0.bg-black');
  await expect(introContainer).toBeVisible({ timeout: 500 });

  // Loop a few times to get through all intro sections.
  for (let i = 0; i < 5; i++) {
    if (!(await introContainer.isVisible({ timeout: 500 }))) {
      break;
    }
    await pressKey(page, 'Shift+Enter');
    await page.waitForTimeout(500); // Wait for section transition
  }

  // After loops, the intro should not be visible.
  await expect(introContainer).not.toBeVisible({ timeout: 500 });

  // For Episode 1, a BiosBoot screen appears after the intro.
  const biosBootContainer = page.locator('[data-testid="bios-boot-screen"]');
  await expect(biosBootContainer).toBeVisible({ timeout: 500 });
  await pressKey(page, 'Shift+Enter');
  await expect(biosBootContainer).not.toBeVisible({ timeout: 500 });
}

/**
 * Asserts the initial state of a level, including header and task count.
 */
export async function assertInitialState(
  page: Page,
  testInfo: TestInfo,
  totalTasks: number
): Promise<void> {
  const header = page.locator('header');
  await expect(header).toContainText('~');

  // Wait for the task counter to be visible first
  const taskCounter = page.getByTestId('task-counter');
  await expect(taskCounter).toBeVisible({ timeout: 500 });

  // Then, assert the text content
  // eslint-disable-next-line security/detect-non-literal-regexp
  const tasksRegex = new RegExp(`Tasks:\\s*0/${totalTasks}`);
  await expect(taskCounter).toHaveText(tasksRegex);

  await assertTask(page, `0/${totalTasks}`, testInfo.outputDir, 'initial_state');
}
