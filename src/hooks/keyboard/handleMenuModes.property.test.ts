import { assert, array, boolean, constantFrom, integer, property } from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { GameState, Linemode, SortBy, SortDirection } from '../../types';
import { buildEpisodes } from '../../utils/episodes';
import { getNodeByPath } from '../../utils/fsHelpers';
import { getFuzzyCandidates } from '../../utils/fuzzyHelpers';
import { resetGameSession } from '../../utils/gameSessionStorage';
import { gameReducer, type Action } from '../gameReducer';
import { createInitialState } from '../initialState';
import { handleFuzzyModeKeyDown } from './handleFuzzyMode';
import { handleHelpModeKeyDown } from './handleHelpMode';
import { handleQuestMapModeKeyDown } from './handleQuestMapMode';
import { handleSortModeKeyDown } from './handleSortMode';

interface KeySpec {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

const makeKeyEvent = ({ key, shiftKey = false, ctrlKey = false }: KeySpec): KeyboardEvent =>
  new KeyboardEvent('keydown', { key, shiftKey, ctrlKey, cancelable: true });

const applyActions = (initial: GameState, actions: Action[]): GameState =>
  actions.reduce((state, action) => gameReducer(state, action), initial);

const EPISODES = buildEpisodes(LEVELS);

const createBootState = (lvl = 1): GameState => {
  window.history.replaceState({}, '', `/?intro=false&lvl=${lvl}`);
  return createInitialState();
};

describe('property: quest map, help, sort, and fuzzy menu handlers', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGameSession();
    window.history.replaceState({}, '', '/?intro=false');
  });

  afterEach(() => {
    localStorage.clear();
    resetGameSession();
    window.history.replaceState({}, '', '/');
  });

  it('handleQuestMapModeKeyDown keeps tab and mission indices bounded and never jumps past unlockedLevelIndex', () => {
    const mapKeys: KeySpec[] = [
      { key: 'h' },
      { key: 'l' },
      { key: 'j' },
      { key: 'k' },
      { key: 'J', shiftKey: true },
      { key: 'K', shiftKey: true },
      { key: 'Enter' },
      { key: 'Enter', shiftKey: true },
      { key: 'Escape' },
    ];

    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        array(constantFrom(...mapKeys), { minLength: 1, maxLength: 20 }),
        (unlockedLevelIndex, keys) => {
          let state: GameState = {
            ...createBootState(1),
            unlockedLevelIndex,
            questMapTab: 0,
            questMapMissionIdx: 0,
          };

          for (const spec of keys) {
            const dispatched: Action[] = [];
            const onClose = vi.fn();
            const onJumpToLevel = vi.fn();
            const activeEpisode = EPISODES[state.questMapTab || 0];
            const selectedLevel = activeEpisode?.levels[state.questMapMissionIdx || 0];
            const expectedGlobalIdx = selectedLevel
              ? LEVELS.findIndex((level) => level.id === selectedLevel.id)
              : -1;

            handleQuestMapModeKeyDown(
              makeKeyEvent(spec),
              state,
              (action) => dispatched.push(action),
              LEVELS,
              EPISODES,
              onClose,
              onJumpToLevel
            );

            state = applyActions(state, dispatched);

            const nextTab = state.questMapTab ?? 0;
            const nextMissionIdx = state.questMapMissionIdx ?? 0;
            expect(nextTab).toBeGreaterThanOrEqual(0);
            expect(nextTab).toBeLessThan(EPISODES.length);
            expect(nextMissionIdx).toBeGreaterThanOrEqual(0);
            expect(nextMissionIdx).toBeLessThan(EPISODES[nextTab].levels.length);

            for (const call of onJumpToLevel.mock.calls) {
              expect(call[0]).toBeLessThanOrEqual(unlockedLevelIndex);
            }

            if (spec.key === 'Escape' || (spec.key === 'Enter' && spec.shiftKey)) {
              expect(onClose).toHaveBeenCalledTimes(1);
              expect(onJumpToLevel).not.toHaveBeenCalled();
            } else if (spec.key === 'Enter' && !spec.shiftKey) {
              if (expectedGlobalIdx !== -1 && expectedGlobalIdx <= unlockedLevelIndex) {
                expect(onJumpToLevel).toHaveBeenCalledWith(expectedGlobalIdx);
                expect(onClose).toHaveBeenCalledTimes(1);
              } else {
                expect(onJumpToLevel).not.toHaveBeenCalled();
                expect(onClose).not.toHaveBeenCalled();
              }
            }
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleHelpModeKeyDown clamps scroll >= 0 and only closes on Escape or Shift+Enter', () => {
    const helpKeys: KeySpec[] = [
      { key: 'j' },
      { key: 'ArrowDown' },
      { key: 'k' },
      { key: 'ArrowUp' },
      { key: 'J', shiftKey: true },
      { key: 'K', shiftKey: true },
      { key: 'Enter' },
      { key: 'Enter', shiftKey: true },
      { key: 'Escape' },
      { key: 'x' },
    ];

    assert(
      property(
        integer({ min: 0, max: 100 }),
        array(constantFrom(...helpKeys), { minLength: 1, maxLength: 20 }),
        (initialScroll, keys) => {
          let state: GameState = { ...createBootState(1), helpScrollPosition: initialScroll };

          for (const spec of keys) {
            const dispatched: Action[] = [];
            const onClose = vi.fn();

            handleHelpModeKeyDown(
              makeKeyEvent(spec),
              (action) => dispatched.push(action),
              state,
              onClose
            );

            state = applyActions(state, dispatched);
            expect(state.helpScrollPosition).toBeGreaterThanOrEqual(0);

            const expectsClose = spec.key === 'Escape' || (spec.key === 'Enter' && !!spec.shiftKey);
            expect(onClose).toHaveBeenCalledTimes(expectsClose ? 1 : 0);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleSortModeKeyDown transitions deterministically for every sort/linemode key and leaves unknown keys idle', () => {
    const SORT_EXPECTED: Record<
      string,
      { by: SortBy; defaultDir: SortDirection; reverseDir: SortDirection; linemode?: Linemode }
    > = {
      n: { by: 'natural', defaultDir: 'asc', reverseDir: 'desc' },
      a: { by: 'alphabetical', defaultDir: 'asc', reverseDir: 'desc' },
      m: { by: 'modified', defaultDir: 'desc', reverseDir: 'asc', linemode: 'mtime' },
      s: { by: 'size', defaultDir: 'desc', reverseDir: 'asc', linemode: 'size' },
      e: { by: 'extension', defaultDir: 'asc', reverseDir: 'desc' },
    };
    const linemodeOrder: Linemode[] = ['none', 'size', 'mtime', 'permissions'];

    const arbSortKey = constantFrom(
      'Escape',
      'l',
      '-',
      'n',
      'N',
      'a',
      'A',
      'm',
      'M',
      's',
      'S',
      'e',
      'E',
      'x',
      'z',
      '?'
    );

    assert(
      property(
        constantFrom<SortBy>('natural', 'alphabetical', 'modified', 'size', 'extension'),
        constantFrom<SortDirection>('asc', 'desc'),
        constantFrom<Linemode>('none', 'size', 'mtime', 'permissions'),
        arbSortKey,
        boolean(),
        (sortBy, sortDirection, linemode, rawKey, extraShift) => {
          const shiftKey = rawKey !== rawKey.toLowerCase() ? true : extraShift;
          const initial: GameState = {
            ...createBootState(1),
            mode: 'sort',
            acceptNextKeyForSort: true,
            sortBy,
            sortDirection,
            linemode,
          };

          const dispatched: Action[] = [];
          handleSortModeKeyDown(
            makeKeyEvent({ key: rawKey, shiftKey }),
            (action) => dispatched.push(action),
            initial
          );
          const next = applyActions(initial, dispatched);

          if (rawKey === 'Escape') {
            expect(next.mode).toBe('normal');
            expect(next.acceptNextKeyForSort).toBe(false);
            expect(next.sortBy).toBe(sortBy);
            return;
          }

          if (rawKey === 'l') {
            expect(next.mode).toBe('normal');
            expect(next.acceptNextKeyForSort).toBe(false);
            const expectedMode =
              linemodeOrder[(linemodeOrder.indexOf(linemode) + 1) % linemodeOrder.length];
            expect(next.linemode).toBe(expectedMode);
            return;
          }

          if (rawKey === '-') {
            expect(next.mode).toBe('normal');
            expect(next.acceptNextKeyForSort).toBe(false);
            expect(next.linemode).toBe('none');
            return;
          }

          const spec = SORT_EXPECTED[rawKey.toLowerCase()];
          if (spec) {
            expect(next.mode).toBe('normal');
            expect(next.acceptNextKeyForSort).toBe(false);
            expect(next.sortBy).toBe(spec.by);
            expect(next.sortDirection).toBe(shiftKey ? spec.reverseDir : spec.defaultDir);
            expect(next.linemode).toBe(spec.linemode ?? linemode);
            return;
          }

          expect(dispatched).toEqual([]);
          expect(next.mode).toBe('sort');
          expect(next.acceptNextKeyForSort).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handleFuzzyModeKeyDown keeps selection indices bounded and navigates/exits cleanly', () => {
    const fuzzyNavKeys: KeySpec[] = [
      { key: 'ArrowDown' },
      { key: 'n', ctrlKey: true },
      { key: 'j', ctrlKey: true },
      { key: 'ArrowUp' },
      { key: 'p', ctrlKey: true },
      { key: 'k', ctrlKey: true },
    ];

    assert(
      property(
        constantFrom<'zoxide-jump' | 'fzf-current'>('zoxide-jump', 'fzf-current'),
        constantFrom('', 'log', 'conf', 'workspace', 'nonexistent_zzz'),
        array(constantFrom(...fuzzyNavKeys), { minLength: 1, maxLength: 12 }),
        boolean(),
        (mode, query, navKeys, pressEnter) => {
          let state: GameState = {
            ...createBootState(6),
            mode,
            inputBuffer: query,
            fuzzySelectedIndex: 0,
          };

          const candidates = getFuzzyCandidates(state);
          for (const spec of navKeys) {
            const dispatched: Action[] = [];
            handleFuzzyModeKeyDown(makeKeyEvent(spec), state, (action) => dispatched.push(action));
            state = applyActions(state, dispatched);

            if (candidates.length === 0) {
              expect(dispatched).toEqual([]);
            } else {
              expect(state.fuzzySelectedIndex).toBeGreaterThanOrEqual(0);
              expect(state.fuzzySelectedIndex).toBeLessThan(candidates.length);
            }
          }

          const finalActions: Action[] = [];
          handleFuzzyModeKeyDown(
            makeKeyEvent({ key: pressEnter ? 'Enter' : 'Escape' }),
            state,
            (action) => finalActions.push(action)
          );
          const finalState = applyActions(state, finalActions);

          if (!pressEnter) {
            expect(finalState.mode).toBe('normal');
            expect(finalState.inputBuffer).toBe('');
            return;
          }

          if (candidates.length > 0) {
            expect(getNodeByPath(finalState.fs, finalState.currentPath)).toBeDefined();
            expect(finalState.mode).toBe('normal');
            if (mode === 'zoxide-jump') {
              expect(finalState.stats.fuzzyJumps).toBe(state.stats.fuzzyJumps + 1);
            } else {
              expect(finalState.stats.fzfFinds).toBe(state.stats.fzfFinds + 1);
            }
          }
        }
      ),
      { numRuns: 60 }
    );
  });
});
