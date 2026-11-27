import {
  assert,
  array,
  boolean,
  constantFrom,
  integer,
  option,
  property,
  record,
  stringMatching,
} from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import { BASE_TIME, day } from '../../constants/timings';
import type { FileNode, GameState } from '../../types';
import { getNodeByPath } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import {
  makeBootState,
  makeKey,
  makeNormalContext,
  runDispatched,
  type KeySpec,
} from '../../../tests/helpers/keyboardHarness';
import { gameReducer } from '../gameReducer';
import {
  checkLevel11Scouting,
  getLevel11LegacyThought,
  handleLevel13NodeSwitch,
} from './handleNarrativeTriggers';
import { handleNavigationKeyDown } from './handleNavigation';
import { handleNormalModeKeyDown } from './handleNormalMode';

const NAV_KEYS: KeySpec[] = [
  { key: 'j' },
  { key: 'ArrowDown' },
  { key: 'k' },
  { key: 'ArrowUp' },
  { key: 'J', shiftKey: true },
  { key: 'K', shiftKey: true },
  { key: 'G', shiftKey: true },
  { key: 'g' },
  { key: 'h' },
  { key: 'ArrowLeft' },
  { key: 'l' },
  { key: 'o' },
  { key: 'Enter' },
  { key: 'ArrowRight' },
  { key: 'H', shiftKey: true },
  { key: 'L', shiftKey: true },
  { key: 'q' },
];

const ENTER_KEYS: KeySpec[] = [{ key: 'l' }, { key: 'o' }, { key: 'Enter' }, { key: 'ArrowRight' }];

const BACK_KEYS: KeySpec[] = [{ key: 'h' }, { key: 'ArrowLeft' }];

const VERTICAL_KEYS = new Set(['j', 'k', 'ArrowUp', 'ArrowDown', 'G']);

const expectedBlockingModal = (
  hasFilter: boolean,
  hasSearch: boolean,
  sortBlocks: boolean,
  hiddenBlocks: boolean
): 'filterWarning' | 'searchWarning' | 'sortWarning' | 'hiddenWarning' | null => {
  if (hasFilter) return 'filterWarning';
  if (hasSearch) return 'searchWarning';
  if (sortBlocks) return 'sortWarning';
  if (hiddenBlocks) return 'hiddenWarning';
  return null;
};

describe('property: navigation, normal mode, and narrative trigger handlers', () => {
  it('keeps currentPath resolvable, cursor in bounds, and previewScroll >= 0 across arbitrary navigation sequences', () => {
    assert(
      property(array(constantFrom(...NAV_KEYS), { minLength: 1, maxLength: 25 }), (keys) => {
        let state = makeBootState(1);

        for (const spec of keys) {
          const step = runDispatched(state, (dispatch) =>
            handleNavigationKeyDown(makeKey(spec), makeNormalContext(state, dispatch))
          );
          state = step.state;
          if (state.mode === 'g-command') {
            state = gameReducer(state, { type: 'SET_MODE', mode: 'normal' });
          }

          expect(getNodeByPath(state.fs, state.currentPath)).toBeDefined();
          const nextItems = getVisibleItems(state);
          expect(state.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(state.cursorIndex).toBeLessThanOrEqual(Math.max(0, nextItems.length - 1));
          expect(state.previewScroll).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 80 }
    );
  });

  it('round-trips currentPath when entering and exiting an unprotected directory', () => {
    assert(
      property(constantFrom(...ENTER_KEYS), constantFrom(...BACK_KEYS), (enterSpec, backSpec) => {
        const initial = makeBootState(1);
        const items = getVisibleItems(initial);
        const targetIdx = items.findIndex(
          (node) => node.type === 'dir' && node.name !== 'workspace'
        );
        expect(targetIdx).not.toBe(-1);

        const atDir = gameReducer(initial, { type: 'SET_CURSOR', index: targetIdx });
        const entered = runDispatched(atDir, (dispatch) =>
          handleNavigationKeyDown(makeKey(enterSpec), makeNormalContext(atDir, dispatch))
        ).state;
        expect(entered.currentPath).toEqual([...initial.currentPath, items[targetIdx].id]);

        const returned = runDispatched(entered, (dispatch) =>
          handleNavigationKeyDown(makeKey(backSpec), makeNormalContext(entered, dispatch))
        ).state;
        expect(returned.currentPath).toEqual(initial.currentPath);
      }),
      { numRuns: 50 }
    );
  });

  it('blocks entry into quarantined workspace directory with a lock notification', () => {
    assert(
      property(constantFrom(...ENTER_KEYS), (enterSpec) => {
        const initial = makeBootState(1);
        const items = getVisibleItems(initial);
        const wsIdx = items.findIndex((node) => node.name === 'workspace');
        expect(wsIdx).not.toBe(-1);

        const atWs = gameReducer(initial, { type: 'SET_CURSOR', index: wsIdx });
        const showNotification = vi.fn();
        const run = runDispatched(atWs, (dispatch) =>
          handleNavigationKeyDown(
            makeKey(enterSpec),
            makeNormalContext(atWs, dispatch, { showNotification })
          )
        );

        expect(run.result).toBe(true);
        expect(run.actions).toEqual([]);
        expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('🔒'), 4000);
      }),
      { numRuns: 20 }
    );
  });

  it('enforces protocol violation precedence (Filter > Search > Sort > Hidden) and vertical-nav exception', () => {
    const checkKeys: KeySpec[] = [
      { key: 'j' },
      { key: 'k' },
      { key: 'ArrowDown' },
      { key: 'ArrowUp' },
      { key: 'G', shiftKey: true },
      { key: 'h' },
      { key: 'l' },
      { key: 'Enter' },
      { key: 'H', shiftKey: true },
      { key: 'L', shiftKey: true },
    ];

    assert(
      property(
        boolean(),
        boolean(),
        boolean(),
        boolean(),
        boolean(),
        constantFrom(...checkKeys),
        (hasFilter, hasSearch, hasSort, showHidden, allComplete, spec) => {
          const base = makeBootState(1);
          const dirId = base.currentPath[base.currentPath.length - 1];
          const state: GameState = {
            ...base,
            filters: hasFilter ? { [dirId]: 'a' } : {},
            searchQuery: hasSearch ? 'a' : null,
            searchResults: [],
            sortBy: hasSort ? 'size' : 'natural',
            sortDirection: hasSort ? 'desc' : 'asc',
            showHidden,
            completedTaskIds: {
              ...base.completedTaskIds,
              [LEVELS[0].id]: allComplete ? LEVELS[0].tasks.map((task) => task.id) : [],
            },
          };

          const sortBlocks = hasSort && !VERTICAL_KEYS.has(spec.key);
          const expectedModal = expectedBlockingModal(
            hasFilter,
            hasSearch,
            sortBlocks,
            showHidden && allComplete
          );

          const run = runDispatched(state, (dispatch) =>
            handleNavigationKeyDown(makeKey(spec), makeNormalContext(state, dispatch))
          );
          const modalActions = run.actions.filter((a) => a.type === 'SET_MODAL_VISIBILITY');

          if (!expectedModal) {
            expect(modalActions).toEqual([]);
          } else {
            expect(modalActions).toEqual([
              { type: 'SET_MODAL_VISIBILITY', modal: expectedModal, visible: true },
            ]);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('advances level on Shift+Enter iff all tasks are complete and hidden files are off', () => {
    assert(
      property(boolean(), boolean(), (allComplete, showHidden) => {
        const base = makeBootState(1);
        const state: GameState = {
          ...base,
          showHidden,
          completedTaskIds: {
            ...base.completedTaskIds,
            [LEVELS[0].id]: allComplete ? LEVELS[0].tasks.map((task) => task.id) : [],
          },
        };
        const advanceLevel = vi.fn();

        handleNavigationKeyDown(
          makeKey({ key: 'Enter', shiftKey: true }),
          makeNormalContext(state, vi.fn(), { advanceLevel })
        );

        expect(advanceLevel).toHaveBeenCalledTimes(allComplete && !showHidden ? 1 : 0);
      }),
      { numRuns: 20 }
    );
  });

  it('normal mode blocks non-dismiss keys during warning modals and delegates normal keys', () => {
    const blockedKeys = constantFrom(
      { key: 'j' },
      { key: 'k' },
      { key: 'h' },
      { key: 'l' },
      { key: 'Enter', shiftKey: false },
      { key: 'd' },
      { key: '1' }
    );
    const warningField = constantFrom(
      'showFilterWarning',
      'showSearchWarning',
      'showSortWarning',
      'showHiddenWarning'
    );

    assert(
      property(warningField, blockedKeys, (modalField, spec) => {
        const state = makeBootState(13, { [modalField]: true });
        const run = runDispatched(state, (dispatch) =>
          handleNormalModeKeyDown(makeKey(spec), makeNormalContext(state, dispatch))
        );
        expect(run.result).toBe(true);
        expect(run.actions).toEqual([]);
      }),
      { numRuns: 50 }
    );

    // Clear-mode delegation across navigation, clipboard/create, and system params
    assert(
      property(
        constantFrom<KeySpec>({ key: 'j' }, { key: 'a' }, { key: 'f' }, { key: 'q' }),
        (spec) => {
          const state = makeBootState(1);
          const run = runDispatched(state, (dispatch) =>
            handleNormalModeKeyDown(makeKey(spec), makeNormalContext(state, dispatch))
          );
          if (spec.key === 'q') {
            expect(run.result).toBe(false);
            expect(run.actions).toEqual([]);
          } else {
            expect(run.result).toBe(true);
            expect(run.actions.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  it('narrative trigger helpers enforce Level 13 node switch and Level 11 scouting/legacy rules', () => {
    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        constantFrom('1', '2', '3', '4', 'j', 'a'),
        (levelIndex, key) => {
          const run = runDispatched(makeBootState(1), (dispatch) =>
            handleLevel13NodeSwitch(makeKey({ key }), levelIndex, dispatch)
          );
          const shouldHandle = levelIndex === 12 && ['1', '2', '3'].includes(key);
          expect(run.result).toBe(shouldHandle);
          expect(run.actions.some((a) => a.type === 'NAVIGATE')).toBe(shouldHandle);
        }
      ),
      { numRuns: 60 }
    );

    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        boolean(),
        option(stringMatching(/^[a-z0-9-]{1,10}$/), { nil: undefined }),
        array(stringMatching(/^[a-z0-9-]{1,10}$/), { maxLength: 4 }),
        (levelIndex, showInfoPanel, itemId, existingScouted) => {
          const flags: NonNullable<GameState['level11Flags']> = {
            triggeredHoneypot: false,
            selectedModern: false,
            scoutedFiles: existingScouted,
          };
          const state = makeBootState(1, { levelIndex, showInfoPanel, level11Flags: flags });
          const item: FileNode | null =
            itemId !== undefined ? { id: itemId, name: `${itemId}.service`, type: 'file' } : null;

          const nextFlags = checkLevel11Scouting(state, item);
          if (levelIndex === 10 && showInfoPanel && item) {
            expect(nextFlags?.scoutedFiles).toContain(item.id);
            expect(checkLevel11Scouting({ ...state, level11Flags: nextFlags }, item)).toEqual(
              nextFlags
            );
          } else {
            expect(nextFlags).toEqual(flags);
          }
        }
      ),
      { numRuns: 60 }
    );

    const arbTimestamps = array(
      record({
        name: stringMatching(/^[a-z]{1,6}\.service$/),
        offsetDays: integer({ min: -60, max: 5 }),
      }),
      { maxLength: 6 }
    );
    assert(
      property(integer({ min: 0, max: LEVELS.length - 1 }), arbTimestamps, (levelIndex, specs) => {
        const nodes: FileNode[] = specs.map((spec, idx) => ({
          id: `n-${idx}`,
          name: spec.name,
          type: 'file',
          modifiedAt: BASE_TIME + spec.offsetDays * day,
        }));
        const thought = getLevel11LegacyThought(nodes, levelIndex);
        const hasRecent = nodes.some((node) => (node.modifiedAt || 0) > BASE_TIME - 30 * day);
        expect(thought !== null).toBe(levelIndex === 10 && hasRecent);
      }),
      { numRuns: 60 }
    );
  });
});
