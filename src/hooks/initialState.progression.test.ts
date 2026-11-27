import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './initialState';

const setSearch = (search = '?intro=false') => window.history.replaceState({}, '', `/${search}`);

beforeEach(() => {
  localStorage.clear();
  setSearch();
});

afterEach(() => vi.restoreAllMocks());

describe('initial level restoration', () => {
  it('starts at the highest saved known level', () => {
    localStorage.setItem('yazi-quest-unlocked-level', '5');

    expect(createInitialState().levelIndex).toBe(4);
    expect(createInitialState().unlockedLevelIndex).toBe(4);
  });

  it('ignores malformed progress and keeps explicit debug level selection authoritative', () => {
    localStorage.setItem('yazi-quest-unlocked-level', '{broken');
    expect(createInitialState().levelIndex).toBe(0);

    localStorage.setItem('yazi-quest-unlocked-level', '5');
    setSearch('?intro=false&lvl=2');
    expect(createInitialState().levelIndex).toBe(1);
  });

  it('falls back to the first level when progress storage throws', () => {
    const getItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (key) {
      if (key === 'yazi-quest-unlocked-level') throw new Error('storage unavailable');
      return getItem.call(this, key);
    });

    expect(createInitialState().levelIndex).toBe(0);
  });
});
