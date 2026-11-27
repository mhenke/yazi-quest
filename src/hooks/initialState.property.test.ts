import {
  assert,
  array,
  boolean,
  constantFrom,
  dictionary,
  integer,
  jsonValue,
  oneof,
  option,
  property,
  record,
  string,
  stringMatching,
} from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EPISODE_LORE } from '../constants/narrative';
import { LEVELS } from '../constants/levels';
import { getNodeByPath } from '../utils/fsHelpers';
import { resetGameSession } from '../utils/gameSessionStorage';
import {
  loadUnlockedLevelIndex,
  persistUnlockedLevelIndex,
  resetUnlockedLevel,
} from '../utils/progressionStorage';
import { isRecord, isValidZoxideData } from '../utils/validation';
import { createInitialState } from './initialState';

const setQuery = (search: string): void => {
  window.history.replaceState({}, '', search ? `/?${search}` : '/');
};

const KNOWN_QUERY_KEYS = [
  'debug',
  'ep',
  'episode',
  'lvl',
  'level',
  'mission',
  'tasks',
  'task',
  'complete',
  'startAtTask',
  'intro',
  'skipIntro',
] as const;

const STORAGE_KEYS = [
  'yazi-quest-unlocked-level',
  'yazi-quest-cycle',
  'yazi-quest-zoxide-history',
  'yazi-quest-session-v1',
] as const;

const arbQueryValue = oneof(
  constantFrom('outro', 'true', 'false', 'all', '0', '1', '2', '99', '-1', 'abc', ''),
  stringMatching(/^[a-z0-9,_-]{0,12}$/)
);

const arbStorageEntry = oneof(
  string({ maxLength: 32 }),
  jsonValue().map((value) => JSON.stringify(value))
);

describe('property: startup hydration, progressionStorage, and validation', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGameSession();
    setQuery('');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    resetGameSession();
    setQuery('');
    vi.restoreAllMocks();
  });

  it('never throws and upholds core state invariants for arbitrary URL params and corrupted localStorage', () => {
    const arbKnownParams = dictionary(constantFrom(...KNOWN_QUERY_KEYS), arbQueryValue, {
      maxKeys: 6,
    });
    const arbExtraParams = dictionary(
      stringMatching(/^[a-z]{1,6}$/),
      stringMatching(/^[a-z0-9-]{0,8}$/),
      { maxKeys: 3 }
    );
    const arbStorage = record({
      'yazi-quest-unlocked-level': option(arbStorageEntry, { nil: undefined }),
      'yazi-quest-cycle': option(arbStorageEntry, { nil: undefined }),
      'yazi-quest-zoxide-history': option(arbStorageEntry, { nil: undefined }),
      'yazi-quest-session-v1': option(arbStorageEntry, { nil: undefined }),
    });

    assert(
      property(arbKnownParams, arbExtraParams, arbStorage, (known, extra, storage) => {
        localStorage.clear();
        resetGameSession();
        for (const key of STORAGE_KEYS) {
          const val = storage[key];
          if (val !== undefined) {
            localStorage.setItem(key, val);
          }
        }

        const params = new URLSearchParams({ ...extra, ...known });
        setQuery(params.toString());

        const state = createInitialState();

        if (params.get('debug') === 'outro') {
          expect(state.levelIndex).toBe(LEVELS.length);
          expect(state.unlockedLevelIndex).toBe(LEVELS.length - 1);
        } else {
          expect(state.levelIndex).toBeGreaterThanOrEqual(0);
          expect(state.levelIndex).toBeLessThan(LEVELS.length);
          expect(state.unlockedLevelIndex).toBeGreaterThanOrEqual(state.levelIndex);
          expect(state.unlockedLevelIndex).toBeLessThan(LEVELS.length);
        }

        expect(getNodeByPath(state.fs, state.currentPath)).toBeDefined();
        expect(getNodeByPath(state.levelStartFS, state.levelStartPath)).toBeDefined();
        expect(Number.isInteger(state.cycleCount)).toBe(true);
        expect(isValidZoxideData(state.zoxideData)).toBe(true);

        for (const level of LEVELS) {
          expect(Array.isArray(state.completedTaskIds[level.id])).toBe(true);
          expect(state.completedTaskIds[level.id].every((id) => typeof id === 'string')).toBe(true);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('honors explicit lvl, ep, tasks, and startAtTask overrides deterministically', () => {
    const arbLevelIdx = integer({ min: 0, max: LEVELS.length - 1 });
    const arbEpisodeId = constantFrom(...EPISODE_LORE.map((ep) => ep.id));

    assert(
      property(
        arbLevelIdx,
        boolean(),
        option(integer({ min: 1, max: 6 }), { nil: undefined }),
        boolean(),
        (idx, useAllTasks, startAtTask, skipIntro) => {
          const targetLevel = LEVELS[idx];
          const params = new URLSearchParams({ lvl: String(targetLevel.id) });
          if (skipIntro) params.set('intro', 'false');
          if (useAllTasks) params.set('tasks', 'all');
          if (startAtTask !== undefined) params.set('startAtTask', String(startAtTask));
          setQuery(params.toString());

          const state = createInitialState();
          expect(state.levelIndex).toBe(idx);
          expect(state.unlockedLevelIndex).toBe(idx);
          if (skipIntro) {
            expect(state.showEpisodeIntro).toBe(false);
          }

          for (let i = 0; i < idx; i++) {
            expect(state.completedTaskIds[LEVELS[i].id]).toEqual(
              LEVELS[i].tasks.map((task) => task.id)
            );
          }

          if (startAtTask !== undefined) {
            expect(state.completedTaskIds[targetLevel.id]).toEqual(
              targetLevel.tasks.slice(0, startAtTask - 1).map((task) => task.id)
            );
          } else if (useAllTasks) {
            expect(state.completedTaskIds[targetLevel.id]).toEqual(
              targetLevel.tasks.map((task) => task.id)
            );
          } else {
            expect(state.completedTaskIds[targetLevel.id]).toEqual([]);
          }
        }
      ),
      { numRuns: 40 }
    );

    assert(
      property(arbEpisodeId, (epId) => {
        setQuery(`ep=${epId}&intro=false`);
        const expectedIdx = LEVELS.findIndex((level) => level.episodeId === epId);
        const state = createInitialState();
        expect(state.levelIndex).toBe(expectedIdx);
      }),
      { numRuns: 20 }
    );
  });

  it('progressionStorage is monotonic, clamps out-of-range indices, and resets cleanly', () => {
    const arbIndex = oneof(
      integer({ min: -10, max: LEVELS.length + 10 }),
      constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5)
    );

    assert(
      property(array(arbIndex, { minLength: 1, maxLength: 20 }), (indices) => {
        resetUnlockedLevel();
        expect(loadUnlockedLevelIndex()).toBe(-1);

        let expectedMax = -1;
        for (const index of indices) {
          persistUnlockedLevelIndex(index);
          if (Number.isSafeInteger(index)) {
            const clamped = Math.min(Math.max(index, 0), LEVELS.length - 1);
            expectedMax = Math.max(expectedMax, clamped);
          }
          expect(loadUnlockedLevelIndex()).toBe(expectedMax);
        }

        resetUnlockedLevel();
        expect(loadUnlockedLevelIndex()).toBe(-1);
      }),
      { numRuns: 100 }
    );
  });

  it('validation helpers enforce plain-object records and finite zoxide metrics', () => {
    assert(
      property(jsonValue(), (value) => {
        const expected = typeof value === 'object' && value !== null && !Array.isArray(value);
        expect(isRecord(value)).toBe(expected);
      }),
      { numRuns: 150 }
    );

    const arbZoxideEntry = record({
      count: integer({ min: 0, max: 10000 }),
      lastAccess: integer({ min: 0, max: 2_000_000_000_000 }),
    });
    const arbValidZoxide = dictionary(stringMatching(/^\/[a-z0-9/_.-]{0,16}$/), arbZoxideEntry, {
      maxKeys: 8,
    });

    assert(
      property(arbValidZoxide, (data) => {
        expect(isValidZoxideData(data)).toBe(true);
      }),
      { numRuns: 100 }
    );

    const arbBadMetric = constantFrom<unknown>(
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      '10',
      null,
      undefined
    );

    assert(
      property(
        arbValidZoxide,
        stringMatching(/^\/[a-z]{1,8}$/),
        boolean(),
        arbBadMetric,
        (base, badKey, corruptCount, badVal) => {
          const invalidEntry = corruptCount
            ? { count: badVal, lastAccess: 100 }
            : { count: 1, lastAccess: badVal };
          expect(isValidZoxideData({ ...base, [badKey]: invalidEntry })).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    assert(
      property(
        oneof(
          jsonValue().filter((v) => !isRecord(v)),
          record({ bad: oneof(string(), integer(), boolean(), array(integer())) })
        ),
        (nonZoxide) => {
          expect(isValidZoxideData(nonZoxide)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
