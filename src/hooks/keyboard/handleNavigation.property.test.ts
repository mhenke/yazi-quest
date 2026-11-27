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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import { BASE_TIME, day } from '../../constants/timings';
import type { FileNode, GameState } from '../../types';
import { getNodeByPath, getParentNode } from '../../utils/fsHelpers';
import { resetGameSession } from '../../utils/gameSessionStorage';
import { getVisibleItems } from '../../utils/viewHelpers';
import { gameReducer, type Action } from '../gameReducer';
import { createInitialState } from '../initialState';
import {
  checkLevel11Scouting,
  getLevel11LegacyThought,
  handleLevel13NodeSwitch,
} from './handleNarrativeTriggers';
import { handleNavigationKeyDown } from './handleNavigation';
import { handleNormalModeKeyDown } from './handleNormalMode';

interface KeySpec {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

const makeKeyEvent = ({ key, shiftKey = false, ctrlKey = false }: KeySpec): KeyboardEvent =>
  new KeyboardEvent('keydown', { key, shiftKey, ctrlKey, cancelable: true });

const createBootState = (lvl = 1): GameState => {
  window.history.replaceState({}, '', `/?intro=false&lvl=${lvl}`);
  return createInitialState();
};

const applyActions = (initial: GameState, actions: Action[]): GameState =>
  actions.reduce((state, action) => gameReducer(state, action), initial);

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

describe('property: navigation, normal mode, and narrative trigger handlers', () => {
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

  it('keeps currentPath resolvable, cursor in bounds, and previewScroll >= 0 across arbitrary navigation sequences', () => {
    assert(
      property(array(constantFrom(...NAV_KEYS), { minLength: 1, maxLength: 25 }), (keys) => {
        let state = createBootState(1);

        for (const spec of keys) {
          const level = LEVELS[state.levelIndex];
          const items = getVisibleItems(state);
          const parent = getParentNode(state.fs, state.currentPath);
          const currentItem = items[state.cursorIndex] ?? null;
          const dispatched: Action[] = [];
          const advanceLevel = vi.fn();
          const showNotification = vi.fn();

          handleNavigationKeyDown(
            makeKeyEvent(spec),
            state,
            (action) => dispatched.push(action),
            items,
            parent,
            currentItem,
            level,
            advanceLevel,
            showNotification,
            1
          );

          state = applyActions(state, dispatched);
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

  it('entering an unprotected directory and stepping back round-trips currentPath, while protected dirs block entry', () => {
    const enterKeys: KeySpec[] = [
      { key: 'l' },
      { key: 'o' },
      { key: 'Enter' },
      { key: 'ArrowRight' },
    ];
    const backKeys: KeySpec[] = [{ key: 'h' }, { key: 'ArrowLeft' }];

    assert(
      property(constantFrom(...enterKeys), constantFrom(...backKeys), (enterSpec, backSpec) => {
        const initial = createBootState(1);
        const level = LEVELS[initial.levelIndex];
        const items = getVisibleItems(initial);
        const dirIdx = items.findIndex(
          (node) => node.type === 'dir' && node.name !== 'workspace' && !node.protected
        );
        const targetIdx =
          dirIdx !== -1
            ? dirIdx
            : items.findIndex((node) => node.type === 'dir' && node.name !== 'workspace');
        expect(targetIdx).not.toBe(-1);

        const stateAtDir = gameReducer(initial, { type: 'SET_CURSOR', index: targetIdx });
        const enterActions: Action[] = [];
        handleNavigationKeyDown(
          makeKeyEvent(enterSpec),
          stateAtDir,
          (action) => enterActions.push(action),
          items,
          getParentNode(stateAtDir.fs, stateAtDir.currentPath),
          items[targetIdx],
          level,
          vi.fn(),
          vi.fn(),
          1
        );

        const enteredState = applyActions(stateAtDir, enterActions);
        expect(enteredState.currentPath).toEqual([...initial.currentPath, items[targetIdx].id]);

        const backActions: Action[] = [];
        const enteredItems = getVisibleItems(enteredState);
        handleNavigationKeyDown(
          makeKeyEvent(backSpec),
          enteredState,
          (action) => backActions.push(action),
          enteredItems,
          getParentNode(enteredState.fs, enteredState.currentPath),
          enteredItems[0] ?? null,
          level,
          vi.fn(),
          vi.fn(),
          1
        );

        const returnedState = applyActions(enteredState, backActions);
        expect(returnedState.currentPath).toEqual(initial.currentPath);
      }),
      { numRuns: 50 }
    );

    // Quarantined workspace in Level 1 blocks entry with a lock notification.
    assert(
      property(constantFrom(...enterKeys), (enterSpec) => {
        const initial = createBootState(1);
        const items = getVisibleItems(initial);
        const wsIdx = items.findIndex((node) => node.name === 'workspace');
        expect(wsIdx).not.toBe(-1);

        const stateAtWs = gameReducer(initial, { type: 'SET_CURSOR', index: wsIdx });
        const dispatched: Action[] = [];
        const notify = vi.fn();

        const handled = handleNavigationKeyDown(
          makeKeyEvent(enterSpec),
          stateAtWs,
          (action) => dispatched.push(action),
          items,
          getParentNode(stateAtWs.fs, stateAtWs.currentPath),
          items[wsIdx],
          LEVELS[0],
          vi.fn(),
          notify,
          1
        );

        expect(handled).toBe(true);
        expect(dispatched).toEqual([]);
        expect(notify).toHaveBeenCalledWith(expect.stringContaining('🔒'), 4000);
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
          let state = createBootState(1);
          const dirId = state.currentPath[state.currentPath.length - 1];
          if (hasFilter) {
            state = gameReducer(state, { type: 'SET_FILTER', dirId, filter: 'a' });
          }
          if (hasSearch) {
            state = gameReducer(state, { type: 'SET_SEARCH', query: 'a', results: [] });
          }
          if (hasSort) {
            state = gameReducer(state, { type: 'SET_SORT', sortBy: 'size', direction: 'desc' });
          }
          if (showHidden) {
            state = { ...state, showHidden: true };
          }
          const completedIds = allComplete ? LEVELS[0].tasks.map((task) => task.id) : [];
          state = {
            ...state,
            completedTaskIds: { ...state.completedTaskIds, [LEVELS[0].id]: completedIds },
          };

          const isVertical = ['j', 'k', 'ArrowUp', 'ArrowDown', 'G'].includes(spec.key);
          const sortBlocks = hasSort && !isVertical;
          const expectsBlock = hasFilter || hasSearch || sortBlocks || (showHidden && allComplete);

          const items = getVisibleItems(state);
          const dispatched: Action[] = [];
          handleNavigationKeyDown(
            makeKeyEvent(spec),
            state,
            (action) => dispatched.push(action),
            items,
            getParentNode(state.fs, state.currentPath),
            items[0] ?? null,
            LEVELS[0],
            vi.fn(),
            vi.fn(),
            1
          );

          const modalActions = dispatched.filter(
            (action) => action.type === 'SET_MODAL_VISIBILITY'
          );

          if (!expectsBlock) {
            expect(modalActions).toEqual([]);
            return;
          }

          const expectedModal = hasFilter
            ? 'filterWarning'
            : hasSearch
              ? 'searchWarning'
              : sortBlocks
                ? 'sortWarning'
                : 'hiddenWarning';

          expect(modalActions).toEqual([
            { type: 'SET_MODAL_VISIBILITY', modal: expectedModal, visible: true },
          ]);
        }
      ),
      { numRuns: 80 }
    );

    // Shift+Enter calls advanceLevel iff all tasks are complete and hidden files are off.
    assert(
      property(boolean(), boolean(), (allComplete, showHidden) => {
        const base = createBootState(1);
        const state: GameState = {
          ...base,
          showHidden,
          completedTaskIds: {
            ...base.completedTaskIds,
            [LEVELS[0].id]: allComplete ? LEVELS[0].tasks.map((task) => task.id) : [],
          },
        };
        const items = getVisibleItems(state);
        const advanceLevel = vi.fn();

        handleNavigationKeyDown(
          makeKeyEvent({ key: 'Enter', shiftKey: true }),
          state,
          vi.fn(),
          items,
          getParentNode(state.fs, state.currentPath),
          items[0] ?? null,
          LEVELS[0],
          advanceLevel,
          vi.fn(),
          1
        );

        if (allComplete && !showHidden) {
          expect(advanceLevel).toHaveBeenCalledTimes(1);
        } else {
          expect(advanceLevel).not.toHaveBeenCalled();
        }
      }),
      { numRuns: 20 }
    );
  });

  it('normal mode blocks non-dismiss keys during warning modals and narrative helpers honor level guards', () => {
    const arbBlockedKey = constantFrom(
      { key: 'j' },
      { key: 'k' },
      { key: 'h' },
      { key: 'l' },
      { key: 'Enter', shiftKey: false },
      { key: 'd' },
      { key: '1' }
    );
    const arbWarningField = constantFrom(
      'showFilterWarning',
      'showSearchWarning',
      'showSortWarning',
      'showHiddenWarning'
    );

    assert(
      property(arbWarningField, arbBlockedKey, (modalField, spec) => {
        const base = createBootState(13);
        const state: GameState = { ...base, [modalField]: true };
        const items = getVisibleItems(state);
        const dispatched: Action[] = [];

        const handled = handleNormalModeKeyDown(
          makeKeyEvent(spec),
          state,
          (action) => dispatched.push(action),
          items,
          getParentNode(state.fs, state.currentPath),
          items[0] ?? null,
          LEVELS[state.levelIndex],
          vi.fn(),
          vi.fn()
        );

        expect(handled).toBe(true);
        expect(dispatched).toEqual([]);
      }),
      { numRuns: 50 }
    );

    // Level 13 node switching responds to '1'/'2'/'3' iff levelIndex === 12.
    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        constantFrom('1', '2', '3', '4', 'j', 'a'),
        (levelIndex, key) => {
          const dispatched: Action[] = [];
          const handled = handleLevel13NodeSwitch(makeKeyEvent({ key }), levelIndex, (action) =>
            dispatched.push(action)
          );
          const shouldHandle = levelIndex === 12 && ['1', '2', '3'].includes(key);
          expect(handled).toBe(shouldHandle);
          if (shouldHandle) {
            expect(dispatched.some((a) => a.type === 'NAVIGATE')).toBe(true);
          } else {
            expect(dispatched).toEqual([]);
          }
        }
      ),
      { numRuns: 80 }
    );

    // Level 11 scouting appends unique file IDs iff levelIndex === 10 && showInfoPanel && item.
    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        boolean(),
        option(stringMatching(/^[a-z0-9-]{1,10}$/), { nil: undefined }),
        array(stringMatching(/^[a-z0-9-]{1,10}$/), { maxLength: 4 }),
        (levelIndex, showInfoPanel, itemId, existingScouted) => {
          const base = createBootState(1);
          const flags: NonNullable<GameState['level11Flags']> = {
            triggeredHoneypot: false,
            selectedModern: false,
            scoutedFiles: existingScouted,
          };
          const state: GameState = {
            ...base,
            levelIndex,
            showInfoPanel,
            level11Flags: flags,
          };
          const item: FileNode | null =
            itemId !== undefined ? { id: itemId, name: `${itemId}.service`, type: 'file' } : null;

          const nextFlags = checkLevel11Scouting(state, item);
          if (levelIndex === 10 && showInfoPanel && item) {
            expect(nextFlags?.scoutedFiles).toContain(item.id);
            const secondPass = checkLevel11Scouting({ ...state, level11Flags: nextFlags }, item);
            expect(secondPass).toEqual(nextFlags);
          } else {
            expect(nextFlags).toEqual(flags);
          }
        }
      ),
      { numRuns: 80 }
    );

    // Level 11 legacy thought warns iff levelIndex === 10 and some node has recent mtime.
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
      { numRuns: 80 }
    );
  });
});
