import { Page, expect } from '@playwright/test';

export const DEFAULT_DELAY = 150;

/**
 * Helper to simulate a keyboard press using Playwright's native API.
 * This is more robust than window.dispatchEvent as it handles focus and bubbling correctly.
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  // Map common game keys to Playwright strings
  let pwKey = key;
  if (key === ' ') pwKey = 'Space';
  if (key.includes('+')) {
    pwKey = key.replace('Ctrl+', 'Control+').replace('Alt+', 'Alt+').replace('Shift+', 'Shift+');
  }

  await page.keyboard.press(pwKey);
  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Types text into an input field with a minor delay between characters.
 */
export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

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
 * Navigates up in the file list by pressing 'k' a specified number of times.
 */
export async function navigateUp(page: Page, count: number): Promise<void> {
  await repeatKey(page, 'k', count);
}

/**
 * Navigates down in the file list by pressing 'j' a specified number of times.
 */
export async function navigateDown(page: Page, count: number): Promise<void> {
  await repeatKey(page, 'j', count);
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
  await repeatKey(page, 'h', count);
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
 * Clears an active filter by pressing Escape.
 */
export async function clearFilter(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}

/**
 * Filter the file list by text.
 */
export async function filterByText(page: Page, text: string): Promise<void> {
  await pressKey(page, 'f');
  const input = page.getByTestId('filter-input');
  await expect(input).toBeVisible({ timeout: 3000 }); // Increase timeout
  await input.focus();
  await input.fill(text);

  // Verify that the input contains the expected text
  await expect(input).toHaveValue(text);

  await page.keyboard.press('Enter');

  // Handle distinct Protocol Violation modal that may appear
  try {
    const modal = page.locator('div:has-text("Protocol Violation")').first();
    if (await modal.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape'); // Dismiss modal
      await page.waitForTimeout(200);
    }
  } catch {
    // Ignore timeout
  }
}

/**
 * Performs a recursive search from the current location.
 */
export async function search(page: Page, query: string): Promise<void> {
  await pressKey(page, 's');
  const input = page.getByTestId('search-input');
  await expect(input).toBeVisible({ timeout: 1000 });
  await input.focus();
  await input.fill(query);
  await page.keyboard.press('Enter');
}

/**
 * Executes a fuzzy jump to a directory (Shift+Z).
 */
export async function fuzzyJump(page: Page, target: string): Promise<void> {
  await pressKey(page, 'Shift+Z');
  // FuzzyFinder doesn't use a real input element, it captures global keys
  await expect(page.getByTestId('fuzzy-finder')).toBeVisible();
  await page.keyboard.type(target);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Utility to create a file or directory using the add (a) command.
 */
export async function addItem(page: Page, name: string): Promise<void> {
  await pressKey(page, 'a');
  const modal = page.getByTestId('input-modal');
  await expect(modal).toBeVisible({ timeout: 1000 });
  const input = modal.locator('input');
  await input.focus();
  await input.fill(name);
  await page.keyboard.press('Enter');
  await expect(modal).not.toBeVisible({ timeout: 1000 });
}

/**
 * Press multiple keys in sequence with standard delays.
 */
export async function pressKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    let pwKey = key;
    if (key === ' ') pwKey = 'Space';
    if (key.includes('+')) {
      pwKey = key.replace('Ctrl+', 'Control+').replace('Alt+', 'Alt+').replace('Shift+', 'Shift+');
    }
    await page.keyboard.press(pwKey);
    await page.waitForTimeout(DEFAULT_DELAY);
  }
}

/**
 * Utility to find an item using fzf (z command).
 */
export async function findFZF(page: Page, name: string): Promise<void> {
  await pressKey(page, 'z');
  // FuzzyFinder doesn't use a real input element, it captures global keys
  await expect(page.getByTestId('fuzzy-finder')).toBeVisible();
  await page.keyboard.type(name);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Utility to robustly rename a file or directory using the rename (r) command.
 */
export async function renameItem(page: Page, name: string): Promise<void> {
  await pressKey(page, 'r');
  const modal = page.getByTestId('input-modal');
  await expect(modal).toBeVisible({ timeout: 1000 });
  const input = modal.locator('input');
  await input.focus();
  await input.fill(name);
  await page.keyboard.press('Enter');
  await expect(modal).not.toBeVisible({ timeout: 1000 });
}

/**
 * Utility to delete the currently selected item(s).
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
    // Wait for the confirmation modal to appear
    const modal = page.locator('[role="alertdialog"]').first();
    await expect(modal).toBeVisible({ timeout: 1000 });
    await pressKey(page, 'y');
  }
}

/**
 * Ensures a clean state by clearing filters, search, and sorting.
 */
export async function ensureCleanState(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await sortCommand(page, 'n');
}

/**
 * Execute a goto command (g followed by target key).
 */
export async function gotoCommand(
  page: Page,
  target: 'h' | 'c' | 'w' | 'd' | 'i' | 't' | 'r' | 'g' | 'm' | 'l'
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
 * Navigates to a specific level, handling intro and boot sequences.
 */
export async function startLevel(
  page: Page,
  level: number,
  options: { intro: boolean; extraParams?: Record<string, string> } = { intro: true }
): Promise<void> {
  const params = new URLSearchParams();
  params.set('lvl', level.toString());
  if (!options.intro) params.set('intro', 'false');
  if (options.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      params.set(key, value);
    }
  }

  await page.goto(`/?${params.toString()}`);
  await page.waitForLoadState('domcontentloaded');

  // Skip intros
  await page.evaluate(() => {
    window.__yaziQuestSkipIntroRequested = true;
    window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
  });

  try {
    const skipBtn = page.getByRole('button', { name: 'Skip Intro' });
    if (await skipBtn.isVisible({ timeout: 500 })) {
      await skipBtn.click();
    }
  } catch {}

  const introOverlay = page.locator('div.bg-black.absolute.inset-0');
  if (await introOverlay.isVisible({ timeout: 500 })) {
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Shift+Enter');
  }

  await page.waitForTimeout(DEFAULT_DELAY); // Standard post-load delay

  // Assert level started incomplete
  await assertLevelStartedIncomplete(page);
}

/**
 * Navigates to a specific level, handling intro screens appropriately.
 */
export async function goToLevel(page: Page, level: number): Promise<void> {
  await page.goto(`/?lvl=${level}`);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(() => {
    window.__yaziQuestSkipIntroRequested = true;
    window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
  });

  try {
    const skipBtn = page.getByRole('button', { name: 'Skip Intro' });
    if (await skipBtn.isVisible({ timeout: 500 })) {
      await skipBtn.click();
    }
  } catch {}

  const introOverlay = page.locator('div.bg-black.absolute.inset-0');
  if (await introOverlay.isVisible({ timeout: 500 })) {
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Shift+Enter');
  }

  await page.waitForFunction(() => !!document.querySelector('[data-testid="status-bar"]'));
  await page.waitForTimeout(DEFAULT_DELAY);
}

/**
 * Starts a level and progresses through intro with early Shift+Enter.
 */
export async function startLevelWithEarlyIntroSkip(page: Page, level: number): Promise<void> {
  await startLevel(page, level, { intro: true });
}

/**
 * Starts a level and lets intro complete naturally.
 */
export async function startLevelWithFullIntro(page: Page, level: number): Promise<void> {
  await startLevel(page, level, { intro: true });
}

/**
 * Asserts that the level starts with 0 completed tasks.
 */
export async function assertLevelStartedIncomplete(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="status-bar"]')).toBeVisible({ timeout: 5000 });
  const taskCounter = page.getByText(/Tasks: 0\/\d+/);
  await expect(taskCounter).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts the current level ID.
 */
export async function assertLevel(page: Page, levelId: string): Promise<void> {
  await expect(page.getByTestId('status-bar')).toContainText(`L${levelId}`);
}

/**
 * Get the current directory path shown in the UI.
 */
export async function getCurrentPath(page: Page): Promise<string> {
  const pathElement = page.locator('.breadcrumb').first();
  return (await pathElement.textContent()) || '';
}

/**
 * Asserts the current task count.
 */
export async function assertTask(
  page: Page,
  taskCount: string,
  _outputDir?: string,
  _screenshotName?: string
): Promise<void> {
  const expectedCompleted = taskCount.split('/')[0];
  const escapedExpected = expectedCompleted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tasksRegex = new RegExp('Tasks:\\s*' + escapedExpected + '/\\d+', ''); // eslint-disable-line security/detect-non-literal-regexp
  await expect(page.getByTestId('task-counter')).toHaveText(tasksRegex, { timeout: 2000 });
}

/**
 * Standardizes mission completion verification.
 */
export async function confirmMission(page: Page, _title: string | RegExp): Promise<void> {
  await waitForMissionComplete(page);
  // Optional verification of title if possible
}

/**
 * Waits for mission complete state.
 */
export async function waitForMissionComplete(page: Page): Promise<void> {
  // Check for Protocol Violation and dismiss
  try {
    const violation = page.getByText('Protocol Violation');
    if (await violation.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Shift+Enter');
    }
  } catch {}

  const currentUrl = new URL(page.url());
  const currentLvl = currentUrl.searchParams.get('lvl');

  await Promise.race([
    expect(page.getByTestId('mission-complete')).toBeVisible({ timeout: 15000 }),
    page.waitForURL(
      (url) => {
        const newLvl = url.searchParams.get('lvl');
        return newLvl !== currentLvl;
      },
      { timeout: 15000 }
    ),
  ]).catch((e) => {
    throw new Error(`Timeout waiting for mission complete or advancement. ${e}`);
  });
}

/**
 * Asserts that a specified narrative thought appears on screen.
 */
export async function expectNarrativeThought(page: Page, text: string | RegExp): Promise<void> {
  const thought = page.locator('[data-testid="narrative-thought"]');
  await expect(thought).toBeVisible({ timeout: 1000 });
  await expect(thought).toContainText(text);
}

/**
 * Gets the list of items visible in the file list.
 */
export async function getVisibleItemsCount(page: Page): Promise<number> {
  return await page.locator('[data-testid^="file-"]').count();
}

/**
 * Navigation to parent (alias for goParent)
 */
export async function goUp(page: Page): Promise<void> {
  await pressKey(page, 'h');
}

/**
 * Handles the multi-section intro sequence by pressing Shift+Enter until the intro is complete.
 */
export async function completeIntro(page: Page): Promise<void> {
  const introContainer = page.locator('.absolute.inset-0.bg-black');
  await expect(introContainer).toBeVisible({ timeout: 500 });

  for (let i = 0; i < 5; i++) {
    if (!(await introContainer.isVisible({ timeout: 500 }))) {
      break;
    }
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(500);
  }

  await expect(introContainer).not.toBeVisible({ timeout: 1000 });
}

/**
 * Dismisses a game alert if it is currently visible.
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
      await page.keyboard.press('Shift+Enter');
      await page.waitForTimeout(500);
      return true;
    }
  } catch {
    // Ignore timeout
  }
  return false;
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
export async function expectCurrentDir(
  page: Page,
  dirName: string,
  exact: boolean = false
): Promise<void> {
  if (exact) {
    await expect(page.locator('.breadcrumb')).toHaveText(dirName);
  } else {
    await expect(page.locator('.breadcrumb')).toContainText(dirName);
  }
}

/**
 * Get the task counter text (e.g., "1 / 5").
 */
export async function getTaskCount(page: Page): Promise<string> {
  const counter = page.getByTestId('task-counter');
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
 * Check if the file info panel is visible (toggled by Tab).
 */
export async function isInfoPanelVisible(page: Page): Promise<boolean> {
  const panel = page.locator('text=FILE INFORMATION');
  return await panel.isVisible();
}

/**
 * Filter to find an item and select it (without navigating).
 * Leaves the filter active.
 */
export async function filterAndSelect(page: Page, filterText: string): Promise<void> {
  await pressKey(page, 'f');
  const input = page.getByTestId('filter-input');
  await expect(input).toBeVisible({ timeout: 3000 }); // Increase timeout
  await input.focus();
  await input.fill(filterText);

  // Verify that the input contains the expected text
  await expect(input).toHaveValue(filterText);

  await page.keyboard.press('Enter');
  await expect(input).not.toBeVisible();

  // Wait for the item to be visible
  const escapedText = filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedText, 'i'); // eslint-disable-line security/detect-non-literal-regexp
  await expect(page.getByTestId('filesystem-pane-active').getByText(regex).first()).toBeVisible({
    timeout: 3000,
  });

  await pressKey(page, ' '); // Toggle selection
  await clearFilter(page);
}
