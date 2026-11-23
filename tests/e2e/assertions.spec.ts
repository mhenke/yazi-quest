import { test, expect } from '@playwright/test';
import {
  assertLevel,
  assertLevelStartedIncomplete,
  assertTask,
  confirmMission,
  pressKey,
  startLevel,
  waitForMissionComplete,
} from './utils';

test('task assertions reject the wrong total', async ({ page }) => {
  await startLevel(page, 1, { intro: false });
  await assertTask(page, '0/5');
  const accepted = await assertTask(page, '0/6').then(
    () => true,
    () => false
  );
  expect(accepted).toBe(false);
});

test('startup assertions reject completed tasks', async ({ page }) => {
  await startLevel(page, 1, { intro: false });

  await pressKey(page, 'j');
  await pressKey(page, 'k');
  await assertTask(page, '1/5');
  const accepted = await assertLevelStartedIncomplete(page).then(
    () => true,
    () => false
  );
  expect(accepted).toBe(false);
});

test('level assertions distinguish Level 1 from Level 11', async ({ page }) => {
  await startLevel(page, 11, { intro: false });
  await assertLevel(page, '11');
  const accepted = await assertLevel(page, '1').then(
    () => true,
    () => false
  );
  expect(accepted).toBe(false);
});

test('mission confirmation rejects the wrong mission title', async ({ page }) => {
  await startLevel(page, 1, { intro: false, extraParams: { tasks: 'all' } });
  const accepted = await confirmMission(page, 'BATCH OPERATIONS').then(
    () => true,
    () => false
  );
  expect(accepted).toBe(false);
  await confirmMission(page, 'SYSTEM AWAKENING');
});

test('changing the level URL does not count as mission completion', async ({ page }) => {
  await startLevel(page, 1, { intro: false });
  const completion = waitForMissionComplete(page).then(
    () => 'completed',
    () => 'rejected'
  );
  // Let the completion waiter subscribe before navigating to an unrelated level.
  await page.waitForTimeout(100);
  await page.goto('/?lvl=2&intro=false');
  await expect(completion).resolves.toBe('rejected');
});
