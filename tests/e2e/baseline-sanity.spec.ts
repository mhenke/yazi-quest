import { test } from '@playwright/test';
import { goToLevel, assertLevelStartedIncomplete, assertTask } from './utils';

test.describe('Baseline Sanity Check', () => {
  test('Level 1 starts with incomplete navigation tasks', async ({ page }, testInfo) => {
    await goToLevel(page, 1);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/5', testInfo.outputDir, 'smoke_start');
  });

  test('Level 6 starts with incomplete batch operation tasks', async ({ page }, testInfo) => {
    await goToLevel(page, 6);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/5', testInfo.outputDir, 'smoke_start');
  });

  test('Level 11 starts with incomplete reconnaissance tasks', async ({ page }, testInfo) => {
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/4', testInfo.outputDir, 'smoke_start');
  });
});
