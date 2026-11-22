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

test('narrow desktop search and filter keep focus and return it on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 450 });
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
  await expect(page.getByText('FACILITY DATE: MAY 31, 2015', { exact: true })).toBeVisible();
  await expect(page.locator('body > .scanline')).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Shift+Enter');
  await expect(page.getByText('STATUS: UNBOUND', { exact: true })).toBeVisible();
});

test('short opening keeps its controls visible while the story scrolls by keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const log = page.getByRole('region', { name: 'Episode log' });
  const title = page.getByRole('heading', { name: 'EPISODE I: AWAKENING' });
  const date = page.getByText('FACILITY DATE: MAY 31, 2015', { exact: true });
  const advance = page.getByText('Press Shift+Enter to continue', { exact: true });
  await expect(log).toBeFocused();
  await expect(title).toBeInViewport({ ratio: 1 });
  await expect(date).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Skip Intro' })).toBeInViewport({ ratio: 1 });
  await expect(advance).toBeInViewport({ ratio: 1 });

  await page.keyboard.press('PageDown');
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  await page.keyboard.press('Shift+Enter');
  await expect(date).not.toBeVisible();
  await expect(page.getByText('STATUS: UNBOUND', { exact: true })).toBeInViewport({ ratio: 1 });
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
