import { test, expect } from '@playwright/test';

test('built Pages site boots and accepts gameplay input', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`Request failed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/yazi-quest\/$/);
  await expect(page.getByRole('heading', { name: 'EPISODE I: AWAKENING' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip Intro', exact: true }).click();

  const status = page.getByTestId('status-bar');
  await expect(status.getByText('L1', { exact: true })).toBeVisible();
  await expect(page.getByTestId('task-counter')).toHaveText('Tasks: 0/5');
  await expect(page.getByRole('listbox', { name: 'File Browser', exact: true })).toBeFocused();
  await page.keyboard.press('j');
  await page.keyboard.press('k');
  await expect(page.getByTestId('task-counter')).toHaveText('Tasks: 1/5');
  expect(errors).toEqual([]);
});
