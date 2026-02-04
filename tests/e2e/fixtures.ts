/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page } from '@playwright/test';
import { startLevel } from './utils';

type GameOptions = {
  intro: boolean;
  extraParams?: Record<string, string>;
  tasks?: 'all';
};

type GameFixtures = {
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
    // Level 6 often fails if 1-5 aren't "complete" in state, but startLevel handles params.
    // However, some tests assume specific start conditions.
    // Using standard startLevel behavior here.
    await startLevel(page, 6, { intro: false });
    await use(page);
  },

  gamePageFactory: async ({ page }, use) => {
    const factory = async (level: number, options?: Partial<GameOptions>) => {
      const defaultOptions: GameOptions = { intro: true };
      const mergedOptions = { ...defaultOptions, ...options } as GameOptions;
      await startLevel(page, level, mergedOptions);
      return page;
    };
    await use(factory);
  },
});

export { expect } from '@playwright/test';
