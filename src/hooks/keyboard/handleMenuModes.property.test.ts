import { assert, array, boolean, constantFrom, integer, property } from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { Linemode, SortBy, SortDirection } from '../../types';
import { buildEpisodes } from '../../utils/episodes';
import { getNodeByPath } from '../../utils/fsHelpers';
import { getFuzzyCandidates } from '../../utils/fuzzyHelpers';
import {
  makeBootState,
  makeKey,
  runDispatched,
  type KeySpec,
} from '../../../tests/helpers/keyboardHarness';
import { handleFuzzyModeKeyDown } from './handleFuzzyMode';
import { handleHelpModeKeyDown } from './handleHelpMode';
import { handleQuestMapModeKeyDown } from './handleQuestMapMode';
import { handleSortModeKeyDown } from './handleSortMode';

const EPISODES = buildEpisodes(LEVELS);

const QUEST_NAV_KEYS: KeySpec[] = [
  { key: 'h' },
  { key: 'l' },
  { key: 'j' },
  { key: 'k' },
  { key: 'J', shiftKey: true },
  { key: 'K', shiftKey: true },
];

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

const LINEMODE_ORDER: Linemode[] = ['none', 'size', 'mtime', 'permissions'];

describe('property: quest map, help, sort, and fuzzy menu handlers', () => {
  it('handleQuestMapModeKeyDown keeps tab and mission indices bounded across navigation sequences', () => {
    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        array(constantFrom(...QUEST_NAV_KEYS), { minLength: 1, maxLength: 20 }),
        (unlockedLevelIndex, keys) => {
          let state = makeBootState(1, {
            unlockedLevelIndex,
            questMapTab: 0,
            questMapMissionIdx: 0,
          });

          for (const spec of keys) {
            state = runDispatched(state, (dispatch) =>
              handleQuestMapModeKeyDown(makeKey(spec), {
                gameState: state,
                dispatch,
                levels: LEVELS,
                episodes: EPISODES,
                onClose: vi.fn(),
                onJumpToLevel: vi.fn(),
              })
            ).state;

            const tab = state.questMapTab ?? 0;
            const missionIdx = state.questMapMissionIdx ?? 0;
            expect(tab).toBeGreaterThanOrEqual(0);
            expect(tab).toBeLessThan(EPISODES.length);
            expect(missionIdx).toBeGreaterThanOrEqual(0);
            expect(missionIdx).toBeLessThan(EPISODES[tab].levels.length);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleQuestMapModeKeyDown gates Enter jumps on unlockedLevelIndex and closes on Escape or Shift+Enter', () => {
    assert(
      property(
        integer({ min: 0, max: EPISODES.length - 1 }),
        integer({ min: 0, max: 10 }),
        integer({ min: 0, max: LEVELS.length - 1 }),
        constantFrom<KeySpec>(
          { key: 'Enter' },
          { key: 'Enter', shiftKey: true },
          { key: 'Escape' }
        ),
        (tab, rawMissionIdx, unlockedLevelIndex, spec) => {
          const ep = EPISODES[tab];
          const missionIdx = rawMissionIdx % ep.levels.length;
          const selectedLevel = ep.levels[missionIdx];
          const globalIdx = LEVELS.findIndex((level) => level.id === selectedLevel.id);

          const state = makeBootState(1, {
            unlockedLevelIndex,
            questMapTab: tab,
            questMapMissionIdx: missionIdx,
          });
          const onClose = vi.fn();
          const onJumpToLevel = vi.fn();

          handleQuestMapModeKeyDown(makeKey(spec), {
            gameState: state,
            dispatch: vi.fn(),
            levels: LEVELS,
            episodes: EPISODES,
            onClose,
            onJumpToLevel,
          });

          if (spec.key === 'Escape' || spec.shiftKey) {
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onJumpToLevel).not.toHaveBeenCalled();
            return;
          }

          if (globalIdx <= unlockedLevelIndex) {
            expect(onJumpToLevel).toHaveBeenCalledWith(globalIdx);
            expect(onClose).toHaveBeenCalledTimes(1);
          } else {
            expect(onJumpToLevel).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
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
          let state = makeBootState(1, { helpScrollPosition: initialScroll });

          for (const spec of keys) {
            const onClose = vi.fn();
            state = runDispatched(state, (dispatch) =>
              handleHelpModeKeyDown(makeKey(spec), { gameState: state, dispatch, onClose })
            ).state;

            expect(state.helpScrollPosition).toBeGreaterThanOrEqual(0);
            const expectsClose = spec.key === 'Escape' || (spec.key === 'Enter' && !!spec.shiftKey);
            expect(onClose).toHaveBeenCalledTimes(expectsClose ? 1 : 0);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleSortModeKeyDown maps sort keys and linemode controls cleanly', () => {
    const arbSortBy = constantFrom<SortBy>(
      'natural',
      'alphabetical',
      'modified',
      'size',
      'extension'
    );
    const arbDir = constantFrom<SortDirection>('asc', 'desc');
    const arbLine = constantFrom<Linemode>('none', 'size', 'mtime', 'permissions');

    assert(
      property(
        arbSortBy,
        arbDir,
        arbLine,
        constantFrom('n', 'N', 'a', 'A', 'm', 'M', 's', 'S', 'e', 'E'),
        boolean(),
        (sortBy, sortDirection, linemode, rawKey, extraShift) => {
          const shiftKey = rawKey !== rawKey.toLowerCase() ? true : extraShift;
          const initial = makeBootState(1, {
            mode: 'sort',
            acceptNextKeyForSort: true,
            sortBy,
            sortDirection,
            linemode,
          });
          const next = runDispatched(initial, (dispatch) =>
            handleSortModeKeyDown(makeKey({ key: rawKey, shiftKey }), {
              gameState: initial,
              dispatch,
            })
          ).state;

          const spec = SORT_EXPECTED[rawKey.toLowerCase()];
          expect(next.mode).toBe('normal');
          expect(next.acceptNextKeyForSort).toBe(false);
          expect(next.sortBy).toBe(spec.by);
          expect(next.sortDirection).toBe(shiftKey ? spec.reverseDir : spec.defaultDir);
          expect(next.linemode).toBe(spec.linemode ?? linemode);
        }
      ),
      { numRuns: 80 }
    );

    assert(
      property(arbLine, constantFrom('l', '-', 'Escape', 'x', 'z'), (linemode, key) => {
        const initial = makeBootState(1, { mode: 'sort', acceptNextKeyForSort: true, linemode });
        const run = runDispatched(initial, (dispatch) =>
          handleSortModeKeyDown(makeKey({ key }), { gameState: initial, dispatch })
        );

        if (key === 'x' || key === 'z') {
          expect(run.actions).toEqual([]);
          expect(run.state.mode).toBe('sort');
          return;
        }

        expect(run.state.mode).toBe('normal');
        expect(run.state.acceptNextKeyForSort).toBe(false);
        if (key === 'l') {
          expect(run.state.linemode).toBe(
            LINEMODE_ORDER[(LINEMODE_ORDER.indexOf(linemode) + 1) % LINEMODE_ORDER.length]
          );
        } else if (key === '-') {
          expect(run.state.linemode).toBe('none');
        }
      }),
      { numRuns: 60 }
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
          let state = makeBootState(6, { mode, inputBuffer: query, fuzzySelectedIndex: 0 });
          const candidates = getFuzzyCandidates(state);

          for (const spec of navKeys) {
            const step = runDispatched(state, (dispatch) =>
              handleFuzzyModeKeyDown(makeKey(spec), { gameState: state, dispatch })
            );
            state = step.state;
            if (candidates.length === 0) {
              expect(step.actions).toEqual([]);
            } else {
              expect(state.fuzzySelectedIndex).toBeGreaterThanOrEqual(0);
              expect(state.fuzzySelectedIndex).toBeLessThan(candidates.length);
            }
          }

          const finalState = runDispatched(state, (dispatch) =>
            handleFuzzyModeKeyDown(makeKey({ key: pressEnter ? 'Enter' : 'Escape' }), {
              gameState: state,
              dispatch,
            })
          ).state;

          if (!pressEnter) {
            expect(finalState.mode).toBe('normal');
            expect(finalState.inputBuffer).toBe('');
          } else if (candidates.length > 0) {
            expect(getNodeByPath(finalState.fs, finalState.currentPath)).toBeDefined();
            expect(finalState.mode).toBe('normal');
            const statKey = mode === 'zoxide-jump' ? 'fuzzyJumps' : 'fzfFinds';
            expect(finalState.stats[statKey]).toBe(state.stats[statKey] + 1);
          }
        }
      ),
      { numRuns: 60 }
    );
  });
});
