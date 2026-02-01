import { test, expect } from '@playwright/test';
import {
  startLevel,
  pressKey,
  typeText,
  expectCurrentDir,
  filterByText,
  clearFilter,
  addItem,
} from './utils';

test.describe('File and Folder Creation (add command)', () => {
  test.beforeEach(async ({ page }) => {
    // Start Level 1 (sandbox)
    await startLevel(page, 1, { intro: false });
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('Add a simple file', async ({ page }) => {
    await pressKey(page, 'a');
    await expect(page.getByTestId('input-modal')).toBeVisible();
    await typeText(page, 'new_file.txt');
    await page.keyboard.press('Enter');

    // Verify file exists in the list
    await expect(page.getByTestId('file-new_file.txt')).toBeVisible();
    // Verify it's a file (icon/label)
    await expect(page.locator('[data-testid="file-new_file.txt"]')).toContainText('new_file.txt');
  });

  test('Add a simple folder (trailing slash)', async ({ page }) => {
    await pressKey(page, 'a');
    await typeText(page, 'new_folder/');
    await page.keyboard.press('Enter');

    // Verify folder exists
    await expect(page.getByTestId('file-new_folder')).toBeVisible();
    // In Yazi, folders often have a trailing arrow or specific color,
    // but the testId would be 'file-new_folder' (clean name)
  });

  test('Add recursive path: folder/file.txt', async ({ page }) => {
    await pressKey(page, 'a');
    await typeText(page, 'deep_path/inner_file.txt');
    await page.keyboard.press('Enter');

    // Verify the folder was created and we are still in current dir
    await expect(page.getByTestId('file-deep_path')).toBeVisible();

    // Navigate into deep_path robustly
    await filterByText(page, 'deep_path');
    await clearFilter(page);
    await page.keyboard.press('l');

    await expectCurrentDir(page, 'deep_path');
    await expect(page.getByTestId('file-inner_file.txt')).toBeVisible();
  });

  test('Add recursive folders: folder/subfolder/', async ({ page }) => {
    await pressKey(page, 'a');
    await typeText(page, 'nested/dirs/');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('file-nested')).toBeVisible();

    // Navigate in
    await filterByText(page, 'nested');
    await clearFilter(page);
    await page.keyboard.press('l');

    await expectCurrentDir(page, 'nested');
    await expect(page.getByTestId('file-dirs')).toBeVisible();
  });

  test('Error: Cannot create folder inside a file (file/folder)', async ({ page }) => {
    // 1. Create a file
    await addItem(page, 'some_file.txt');
    await expect(page.getByTestId('file-some_file.txt')).toBeVisible();

    // 2. Try to create a folder inside it
    await addItem(page, 'some_file.txt/blocked_folder');

    // 3. Expect error notification
    // SystemNotification often has testid 'system-notification' or similar
    // From previous knowledge, it's often in StatusBar or a separate component
    await expect(page.getByTestId('system-notification')).toContainText(/Error|Cannot/i);
  });

  test('Error: Cannot create folder inside a file (user specific: file.txt/folder)', async ({
    page,
  }) => {
    await addItem(page, 'file.txt');
    await expect(page.getByTestId('file-file.txt')).toBeVisible();

    await addItem(page, 'file.txt/folder');
    await expect(page.getByTestId('system-notification')).toContainText(/Error|Cannot/i);
  });
});
