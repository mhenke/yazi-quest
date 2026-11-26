import { LEVELS } from '../constants/levels';

const STORAGE_KEY = 'yazi-quest-unlocked-level';

export const loadUnlockedLevelIndex = (): number => {
  try {
    const rawLevelId = localStorage.getItem(STORAGE_KEY);
    if (rawLevelId === null) return -1;
    const levelId = Number(rawLevelId);
    return Number.isSafeInteger(levelId) ? LEVELS.findIndex((level) => level.id === levelId) : -1;
  } catch {
    return -1;
  }
};

export const persistUnlockedLevelIndex = (index: number): void => {
  const currentIndex = Number.isSafeInteger(index)
    ? Math.min(Math.max(index, 0), LEVELS.length - 1)
    : -1;
  const highestIndex = Math.max(currentIndex, loadUnlockedLevelIndex());
  if (highestIndex < 0) return;

  try {
    localStorage.setItem(STORAGE_KEY, String(LEVELS[highestIndex].id));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
};
