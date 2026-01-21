import { test } from '@playwright/test';
import { goToLevel, assertLevelStartedIncomplete, assertTask } from './utils';

test.describe('Baseline Sanity Check', () => {
  test('Level 1: Navigation Smoke Test', async ({ page }, testInfo) => {
    await goToLevel(page, 1);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/5', testInfo.outputDir, 'smoke_start');
  });

  test('Level 6: Batch Operations Smoke Test', async ({ page }, testInfo) => {
    await goToLevel(page, 6);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/5', testInfo.outputDir, 'smoke_start');
  });

  test('Level 11: Reconnaissance Smoke Test', async ({ page }, testInfo) => {
    await goToLevel(page, 11);
    await assertLevelStartedIncomplete(page);
    await assertTask(page, '0/4', testInfo.outputDir, 'smoke_start');
  });
});
