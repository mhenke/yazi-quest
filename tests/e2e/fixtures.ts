/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page } from '@playwright/test';
import { startLevel } from './utils';

export type GameOptions = {
  intro: boolean;
  extraParams?: Record<string, string>;
  tasks?: 'all';
};

export type GameFixtures = {
  level1Page: Page;
  level2Page: Page;
  level6Page: Page;
  gamePageFactory: (level: number, options?: GameOptions) => Promise<Page>;
};

export const test = base.extend<GameFixtures>({
  level1Page: async ({ page }, use) => {
    await startLevel(page, 1, { intro: false });
    await use(page);
  },

  level2Page: async ({ page }, use) => {
    await startLevel(page, 2, { intro: false });
    await use(page);
  },

  level6Page: async ({ page }, use) => {
    await startLevel(page, 6, { intro: false });
    await use(page);
  },

  gamePageFactory: async ({ page }, use) => {
    const factory = async (level: number, options?: Partial<GameOptions>) => {
      const mergedOptions: GameOptions = { intro: true, ...options };
      await startLevel(page, level, mergedOptions);
      return page;
    };
    await use(factory);
  },
});

export { expect } from '@playwright/test';
