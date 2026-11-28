// @vitest-environment jsdom
import { assert, property, array, boolean, constantFrom, integer, string } from 'fast-check';
import { describe, it, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { FileNode, GameState } from '../../types';
import { createInitialState } from '../initialState';
import {
  buildDeleteModalData,
  dispatchBaselineReset,
  runGameLoopKeyDown,
  type GameLoopDeps,
} from './gameLoopHelpers';
import { getActionIntensity } from './utils';

const NUM_RUNS = 150;

const WARN_PATCHES: Record<
  'none' | 'filter-mode' | 'filterWarn' | 'searchWarn' | 'sortWarn' | 'hiddenWarn',
  Partial<GameState>
> = {
  none: {},
  'filter-mode': { mode: 'filter-warning' },
  filterWarn: { showFilterWarning: true },
  searchWarn: { showSearchWarning: true },
  sortWarn: { showSortWarning: true },
  hiddenWarn: { showHiddenWarning: true },
};

const makeKey = (key: string, ctrlKey = false): KeyboardEvent =>
  ({
    key,
    ctrlKey,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    target: document.body,
    preventDefault: vi.fn(),
  }) as unknown as KeyboardEvent;

const makeDeps = (
  stateOverrides: Partial<GameState> = {},
  levelIndex = 0
): { deps: GameLoopDeps; dispatches: Array<{ type: string; weighted?: boolean }> } => {
  const baseState = createInitialState();
  const gameState: GameState = {
    ...baseState,
    isBooting: false,
    showEpisodeIntro: false,
    isGameOver: false,
    mode: 'normal',
    ...stateOverrides,
  };
  const dispatches: Array<{ type: string; weighted?: boolean }> = [];
  const deps: GameLoopDeps = {
    gameState,
    currentLevel: LEVELS[levelIndex],
    isLastLevel: false,
    filePaneEl: null,
    visibleItems: [],
    parent: null,
    currentItem: null,
    dispatch: (action) => dispatches.push(action as { type: string; weighted?: boolean }),
    advanceLevel: vi.fn(),
    showNotification: vi.fn(),
    checkAllTasksComplete: () => false,
  };
  return { deps, dispatches };
};

describe('property: gameLoopHelpers invariants', () => {
  it('blocks all gameplay dispatches while booting, in intro, at outro, game over, or in non-gameplay modes', () => {
    assert(
      property(
        constantFrom(
          'booting',
          'intro',
          'last',
          'gameover',
          'filter',
          'input-file',
          'rename',
          'search'
        ),
        constantFrom('j', 'k', 'l', 'd', 'y', 'p', 'Escape', 'Enter'),
        (gate, key) => {
          const statePatch: Partial<GameState> =
            gate === 'booting'
              ? { isBooting: true }
              : gate === 'intro'
                ? { showEpisodeIntro: true }
                : gate === 'gameover'
                  ? { isGameOver: true }
                  : gate === 'last'
                    ? {}
                    : { mode: gate };
          const { deps, dispatches } = makeDeps(statePatch);
          deps.isLastLevel = gate === 'last';

          const result = runGameLoopKeyDown(makeKey(key), deps);
          return result === undefined && dispatches.length === 0;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('never counts ignored keys (case-insensitively) or events under open protocol warnings', () => {
    assert(
      property(
        constantFrom(
          'Shift',
          'shift',
          'Control',
          'control',
          'Alt',
          'alt',
          'Tab',
          'tab',
          'Escape',
          'escape',
          '?',
          'm',
          'M',
          'h',
          'H'
        ),
        constantFrom('none', 'filter-mode', 'filterWarn', 'searchWarn', 'sortWarn', 'hiddenWarn'),
        (ignoredKey, warningState) => {
          const warnPatch = WARN_PATCHES[warningState];

          const { deps: ignoredDeps, dispatches: ignoredDispatches } = makeDeps(warnPatch, 11);
          runGameLoopKeyDown(makeKey(ignoredKey), ignoredDeps);
          if (ignoredDispatches.some((a) => a.type === 'INCREMENT_KEYSTROKES')) return false;

          if (warningState === 'none') return true;
          const { deps: warnDeps, dispatches: warnDispatches } = makeDeps(warnPatch, 11);
          runGameLoopKeyDown(makeKey('j'), warnDeps);
          return !warnDispatches.some((a) => a.type === 'INCREMENT_KEYSTROKES');
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('dispatches INCREMENT_KEYSTROKES with exact level-11+ weighted noise flag on active keys', () => {
    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        constantFrom('j', 'k', 'f', 's', 'x', 'p', 'd', 'y'),
        boolean(),
        (levelIdx, key, ctrlKey) => {
          const { deps, dispatches } = makeDeps({ mode: 'normal' }, levelIdx);
          runGameLoopKeyDown(makeKey(key, ctrlKey), deps);

          const inc = dispatches.find((a) => a.type === 'INCREMENT_KEYSTROKES');
          if (!inc) return false;

          const expectedWeighted =
            LEVELS[levelIdx].id >= 11 && getActionIntensity(key, ctrlKey) > 1;
          return inc.weighted === expectedWeighted;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('buildDeleteModalData derives itemKind oracle and well-formed item paths without double slashes', () => {
    const arbItemSpec = constantFrom(
      'dir' as const,
      'file' as const,
      'archive' as const,
      'missing' as const
    );
    assert(
      property(array(arbItemSpec, { minLength: 0, maxLength: 6 }), boolean(), (specs, atRoot) => {
        const visibleList: FileNode[] = [];
        const pendingDeleteIds: string[] = [];

        specs.forEach((kind, idx) => {
          const id = `item-${idx}`;
          pendingDeleteIds.push(id);
          if (kind !== 'missing') {
            visibleList.push({
              id,
              name: `name_${idx}`,
              type: kind,
              parentId: atRoot ? 'root' : 'sub',
            });
          }
        });

        const rootNode: FileNode = atRoot
          ? { id: 'root', name: 'root', type: 'dir', children: visibleList }
          : {
              id: 'root',
              name: 'root',
              type: 'dir',
              children: [
                { id: 'sub', name: 'sub', type: 'dir', parentId: 'root', children: visibleList },
              ],
            };

        const state = {
          ...createInitialState(),
          fs: rootNode,
          currentPath: atRoot ? ['root'] : ['root', 'sub'],
          pendingDeleteIds,
        };
        const { itemKind, itemsToDelete } = buildDeleteModalData(state, visibleList);

        const allDirs = visibleList.length > 0 && visibleList.every((n) => n.type === 'dir');
        const allFiles = visibleList.length > 0 && visibleList.every((n) => n.type !== 'dir');
        const expectedKind = allDirs ? 'folder' : allFiles ? 'file' : 'item';

        return (
          itemKind === expectedKind &&
          itemsToDelete.length === pendingDeleteIds.length &&
          itemsToDelete.every((p) => !p.startsWith('//'))
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('stays total across arbitrary non-control strings without throwing', () => {
    assert(
      property(string({ minLength: 1, maxLength: 8 }), boolean(), (rawKey, isBooting) => {
        const { deps } = makeDeps({ isBooting });
        const result = runGameLoopKeyDown(makeKey(rawKey), deps);
        return result === undefined || result === true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('dispatchBaselineReset emits exact actions needed to clear hidden, sort, filter, and search violations', () => {
    assert(
      property(
        boolean(),
        boolean(),
        boolean(),
        boolean(),
        (showHidden, customSort, hasFilter, hasSearch) => {
          const base = createInitialState();
          const dirId = base.currentPath[base.currentPath.length - 1];
          const state: GameState = {
            ...base,
            showHidden,
            sortBy: customSort ? 'modified' : 'natural',
            sortDirection: customSort ? 'desc' : 'asc',
            filters: hasFilter ? { [dirId]: 'err' } : {},
            searchQuery: hasSearch ? '\\.log$' : null,
          };
          const dispatched: string[] = [];
          dispatchBaselineReset(state, (a) => dispatched.push(a.type));

          return (
            dispatched.includes('TOGGLE_HIDDEN') === showHidden &&
            dispatched.includes('SET_SORT') === customSort &&
            dispatched.includes('CLEAR_FILTER') === hasFilter &&
            dispatched.includes('SET_SEARCH') === hasSearch
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
