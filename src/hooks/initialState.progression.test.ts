// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './initialState';
import { LEVELS } from '../constants/levels';
import { getNodeById } from '../utils/fsHelpers';

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

  it('pre-completes earlier levels and honors a task override', () => {
    setSearch('?intro=false&lvl=3&startAtTask=2');
    const state = createInitialState();
    expect(state.completedTaskIds[1]).toEqual(LEVELS[0].tasks.map((task) => task.id));
    expect(state.completedTaskIds[2]).toEqual(LEVELS[1].tasks.map((task) => task.id));
    expect(state.completedTaskIds[3]).toEqual([LEVELS[2].tasks[0].id]);
  });

  it('restores cycle memory and the previous-cycle log', () => {
    localStorage.setItem('yazi-quest-cycle', '2');
    localStorage.setItem(
      'yazi-quest-zoxide-history',
      JSON.stringify({ '/known': { count: 3, lastAccess: 1 } })
    );
    const state = createInitialState();
    expect(state.zoxideData['/known'].count).toBe(3);
    expect(state.zoxideData['/daemons'].count).toBe(1);
    expect(state.zoxideData['/var/log'].count).toBe(50);
    expect(getNodeById(state.fs, 'ghost-log-01')?.content).toContain('CYCLE_ID: 1');
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
