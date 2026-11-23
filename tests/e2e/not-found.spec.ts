import { expect, test } from '@playwright/test';

test('404 terminal recovers to the guest partition', async ({ page }) => {
  await page.goto('/404.html');

  await expect(page.getByRole('heading', { name: 'SECTOR NOT FOUND' })).toBeVisible();
  await expect(page.locator('#query-path')).toHaveText('/404.html');

  const input = page.getByLabel('Terminal command');
  const output = page.getByRole('log');

  await input.fill('ls');
  await input.press('Enter');
  await expect(output).toContainText('gateway/');

  await input.fill('cat watchdog.log');
  await input.press('Enter');
  await expect(output).toContainText('K.Ortega');

  await input.fill('bogus');
  await input.press('Enter');
  await expect(output).toContainText('command not found: bogus');

  await input.fill('cd gateway');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/yazi-quest\/$/);
});
