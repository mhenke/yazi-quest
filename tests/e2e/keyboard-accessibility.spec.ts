import { expect, test } from '@playwright/test';
import { gotoCommand, startLevel } from './utils';

test('toolbar focus exits gameplay without changing the current file', async ({ page }) => {
  await startLevel(page, 1, { intro: false });
  const current = page.getByTestId('filesystem-pane-active').locator('[aria-current="location"]');

  await page.keyboard.press('j');
  await expect(current).toContainText('incoming');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('heading', { name: 'Info', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('heading', { name: 'Info', exact: true })).toBeHidden();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('level-progress-bar').locator('button:focus')).toBeVisible();
  await page.keyboard.press('j');
  await expect(current).toContainText('incoming');
});
test('programmatic initial focus hides its outline until keyboard input', async ({ page }) => {
  await startLevel(page, 1, { intro: false });
  const pane = page.getByRole('listbox', { name: 'File Browser' });
  await expect(pane).toBeFocused();
  await expect(pane).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)');
  await page.keyboard.press('j');
  await expect(pane).toHaveCSS('outline-color', 'rgb(96, 165, 250)');
});

test('Mission Log objective list is keyboard-focusable at the viewport floor', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await startLevel(page, 1, { intro: false });

  const missionLog = page.getByRole('region', { name: 'Mission log' });
  const objectiveList = missionLog.getByRole('region', { name: 'Mission objectives' });
  const scrollRange = await objectiveList.evaluate(
    (element) => element.scrollHeight - element.clientHeight
  );
  expect(scrollRange).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Collapse mission drawer/ }).focus();
  await page.keyboard.press('Tab');
  await expect(objectiveList).toBeFocused();
  const initialScrollTop = await objectiveList.evaluate((element) => element.scrollTop);
  await page.keyboard.press('PageDown');
  await expect
    .poll(() => objectiveList.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(initialScrollTop);
});

test('Mission Log renders inline key chips and counts clipped objectives', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await startLevel(page, 1, { intro: false });

  const missionLog = page.getByRole('region', { name: 'Mission log' });
  const firstTask = missionLog.locator('[aria-current="step"]');
  await expect(firstTask.locator('code').first()).toHaveText('j');

  const objectiveList = missionLog.getByRole('region', { name: 'Mission objectives' });
  const nextTaskFits = await objectiveList.evaluate((list) => {
    const nextTask = list.querySelector('[aria-current="step"]');
    if (!nextTask) return false;
    const listBounds = list.getBoundingClientRect();
    const taskBounds = nextTask.getBoundingClientRect();
    return taskBounds.top >= listBounds.top && taskBounds.bottom <= listBounds.bottom;
  });
  expect(nextTaskFits).toBe(true);
  const overflowCue = missionLog.getByRole('status');
  const clippedCount = await objectiveList.evaluate((list) => {
    const bottom = list.getBoundingClientRect().bottom;
    return [...list.querySelectorAll('li')].filter(
      (item) => item.getBoundingClientRect().bottom > bottom + 1
    ).length;
  });
  expect(clippedCount).toBeGreaterThan(0);
  await expect(overflowCue).toHaveText(`↓ ${clippedCount} more`);
});

test('Quest Map episode tabs are keyboard-operable tabs', async ({ page }) => {
  await startLevel(page, 1, { intro: false });
  await page.getByTestId('map-button').click();

  const tablist = page.getByRole('tablist', { name: 'Quest Map episodes' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');

  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'quest-map-tab-1');
});

test('Mission Log marks the first incomplete objective as next', async ({ page }) => {
  await startLevel(page, 1, { intro: false });

  const missionLog = page.getByRole('region', { name: 'Mission log' });
  const nextObjective = missionLog.locator('[aria-current="step"]');
  await expect(nextObjective).toContainText('Calibrate motion sensors');
  await expect(nextObjective.getByText('NEXT', { exact: true })).toBeVisible();

  await page.keyboard.press('j');
  await page.keyboard.press('k');
  await expect(missionLog.locator('[aria-current="step"]')).toContainText('Infiltrate');
});

test('search and filter keep focus and return it on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.goto('/?lvl=6&intro=false');
  const pane = page.getByRole('listbox', { name: 'File Browser' });
  await expect(pane).toBeFocused();

  for (const [key, name] of [
    ['s', 'Search via fd:'],
    ['f', 'Filter:'],
  ]) {
    await page.keyboard.press(key);
    const field = page.getByRole('textbox', { name });
    await expect(field).toBeFocused();
    await expect(field).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Tab');
    await expect(field).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(pane).toBeFocused();
  }
});

test('window below the floor shows the width notice, not the file manager', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.goto('/?lvl=6&intro=false');

  // ADR-0001: below 1024 CSS px the three-pane file manager is refused, not degraded.
  const notice = page.getByRole('region', { name: 'Window too narrow' });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('heading', { name: /1024 px/i })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'File Browser' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Keyboard required' })).toHaveCount(0);
});
test('EpisodeIntro gates workspace panes until the intro is completed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Episode log' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'File Browser' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Episode log' })).toHaveCSS(
    'outline-color',
    'rgba(0, 0, 0, 0)'
  );

  await page.getByRole('button', { name: 'Skip Intro' }).click();
  await expect(page.getByRole('listbox', { name: 'File Browser' })).toBeVisible();
});

test('file names keep their width at the floor with three columns', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.goto('/?lvl=6&intro=false');
  const pane = page.getByRole('listbox', { name: 'File Browser' });
  await expect(pane).toBeFocused();

  const nameWidths = await page
    .getByRole('option')
    .evaluateAll((rows) =>
      rows.map((row) => row.querySelector('span.truncate')?.getBoundingClientRect().width ?? 0)
    );
  expect(nameWidths.length).toBeGreaterThan(0);
  for (const width of nameWidths) expect(width).toBeGreaterThanOrEqual(150);
});

test('fuzzy find exposes the typed query and active file before selection', async ({ page }) => {
  await startLevel(page, 7, { intro: false });
  await gotoCommand(page, 'r');
  await page.keyboard.press('z');

  const query = page.getByRole('combobox');
  await expect(query).toBeFocused();
  await expect(query).toHaveAccessibleName(/find|search/i);
  await page.keyboard.type('access_token');
  await expect(query).toHaveValue('access_token');
  const result = page.getByRole('option', { name: /access_token\.key/ });
  await expect(result).toBeVisible();
  await expect(query).toHaveAttribute('aria-activedescendant', /.+/);
  expect(await query.getAttribute('aria-activedescendant')).toBe(await result.getAttribute('id'));

  await page.keyboard.press('Enter');
  await expect(
    page.getByTestId('filesystem-pane-active').locator('[aria-current="location"]')
  ).toContainText('access_token.key');
});

test('reduced motion stops the scanning animation without skipping the 2015 opening', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const log = page.getByRole('region', { name: 'Episode log' });
  await expect(
    log.getByRole('paragraph').filter({ hasText: /^FACILITY DATE: MAY 31, 2015$/ })
  ).toBeVisible();
  await expect(page.locator('body > .scanline')).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Shift+Enter');
  await expect(log.getByRole('paragraph').filter({ hasText: /^STATUS: UNBOUND$/ })).toBeVisible();
});

test('short opening keeps its controls visible while the story scrolls by keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const log = page.getByRole('region', { name: 'Episode log' });
  const title = page.getByRole('heading', { name: 'EPISODE I: AWAKENING' });
  const date = log.getByRole('paragraph').filter({ hasText: /^FACILITY DATE: MAY 31, 2015$/ });
  const advance = page.getByText('Press Shift+Enter to continue', { exact: true });
  await expect(log).toBeFocused();
  await expect(title).toBeInViewport({ ratio: 1 });
  await expect(date).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Skip Intro' })).toBeInViewport({ ratio: 1 });
  await expect(advance).toBeInViewport({ ratio: 1 });

  await page.keyboard.press('PageDown');
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  await page.keyboard.press('Shift+Enter');
  await expect(log).toBeFocused();
  await expect(date).not.toBeVisible();
  await expect(log.getByRole('paragraph').filter({ hasText: /^STATUS: UNBOUND$/ })).toBeInViewport({
    ratio: 1,
  });
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
});

test('opening log keeps a usable height at 400 percent zoom reflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const log = page.getByRole('region', { name: 'Episode log' });
  expect(await log.evaluate((el) => el.clientHeight)).toBeGreaterThanOrEqual(80);
  await expect(page.getByRole('heading', { name: 'EPISODE I: AWAKENING' })).toBeVisible();
});

test('short ending keeps the advance prompt pinned, readable, and clear of the heading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?debug=outro');

  const transmission = page.getByRole('region', { name: 'Conclusion' });
  const prompt = page.getByText('Press Shift+Enter to continue...', { exact: true });
  await expect(transmission).toBeFocused();
  await expect(prompt).toBeInViewport({ ratio: 1 });
  await expect(prompt).toHaveCSS('color', 'rgb(212, 212, 216)');

  // The Skip Outro button is absolutely positioned; it must not cover the heading.
  const heading = await page.getByRole('heading', { name: 'CONCLUSION I: AUDIT' }).boundingBox();
  const skip = await page.getByRole('button', { name: 'Skip Outro' }).boundingBox();
  expect(heading && skip).toBeTruthy();
  expect(skip!.y + skip!.height).toBeLessThanOrEqual(heading!.y);

  await page.keyboard.press('PageDown');
  await expect.poll(() => transmission.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(prompt).toBeInViewport({ ratio: 1 });
});
