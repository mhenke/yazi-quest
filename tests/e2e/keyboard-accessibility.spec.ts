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
