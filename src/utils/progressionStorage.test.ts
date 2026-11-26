import { beforeEach, describe, expect, it } from 'vitest';
import { loadUnlockedLevelIndex, persistUnlockedLevelIndex } from './progressionStorage';

const STORAGE_KEY = 'yazi-quest-unlocked-level';

beforeEach(() => localStorage.clear());

describe('level progression storage', () => {
  it('restores only a known level id and rejects malformed or out-of-range values', () => {
    localStorage.setItem(STORAGE_KEY, '5');
    expect(loadUnlockedLevelIndex()).toBe(4);

    localStorage.setItem(STORAGE_KEY, 'not-a-level');
    expect(loadUnlockedLevelIndex()).toBe(-1);

    localStorage.setItem(STORAGE_KEY, '999');
    expect(loadUnlockedLevelIndex()).toBe(-1);
  });

  it('keeps the highest unlocked level when the player visits an earlier level', () => {
    localStorage.setItem(STORAGE_KEY, '5');
    persistUnlockedLevelIndex(2);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('5');

    persistUnlockedLevelIndex(6);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('7');
  });

  it('replaces corrupt progress with the valid current level', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    persistUnlockedLevelIndex(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });
});
