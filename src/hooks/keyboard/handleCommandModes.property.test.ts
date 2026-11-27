import { assert, boolean, constantFrom, integer, property, stringMatching } from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JUMP_TARGETS } from '../../constants/keybindings';
import { LEVELS } from '../../constants/levels';
import type { FileNode, GameState } from '../../types';
import { addNode, getNodeById, getNodeByPath } from '../../utils/fsHelpers';
import { resetGameSession } from '../../utils/gameSessionStorage';
import { getVisibleItems } from '../../utils/viewHelpers';
import { gameReducer, type Action } from '../gameReducer';
import { createInitialState } from '../initialState';
import { handleGCommandKeyDown } from './handleGCommandMode';
import { handleOverwriteConfirmKeyDown } from './handleOverwriteMode';
import { handleSystemParamsKeyDown } from './handleSystemParams';

interface KeySpec {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

const makeKeyEvent = ({
  key,
  shiftKey = false,
  ctrlKey = false,
  metaKey = false,
}: KeySpec): KeyboardEvent =>
  new KeyboardEvent('keydown', { key, shiftKey, ctrlKey, metaKey, cancelable: true });

const applyActions = (initial: GameState, actions: Action[]): GameState =>
  actions.reduce((state, action) => gameReducer(state, action), initial);

const createBootState = (lvl = 1): GameState => {
  window.history.replaceState({}, '', `/?intro=false&lvl=${lvl}`);
  return createInitialState();
};

describe('property: system params, g-command, and overwrite mode handlers', () => {
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

  it('handleSystemParamsKeyDown preserves selections when clearing filter on Escape and respects mode/protection rules', () => {
    assert(
      property(
        boolean(),
        constantFrom<string | null>(null, '', 'readme'),
        boolean(),
        (hasFilter, searchQuery, startInfoOpen) => {
          let state = createBootState(1);
          const dirId = state.currentPath[state.currentPath.length - 1];
          const items = getVisibleItems(state);
          const initialSelections = items.slice(0, 2).map((item) => item.id);

          state = {
            ...state,
            mode: 'filter',
            inputBuffer: 'abc',
            showInfoPanel: startInfoOpen,
            selectedIds: initialSelections,
            filters: hasFilter ? { [dirId]: 'txt' } : {},
            searchQuery,
            searchResults: searchQuery !== null ? items.slice(0, 1) : [],
            cursorIndex: Math.min(1, Math.max(0, items.length - 1)),
            showFilterWarning: true,
            showSearchWarning: true,
            showSortWarning: true,
            showHiddenWarning: true,
          };

          const dispatched: Action[] = [];
          const handled = handleSystemParamsKeyDown(
            makeKeyEvent({ key: 'Escape' }),
            state,
            (action) => dispatched.push(action),
            items[0] ?? null,
            LEVELS[0],
            vi.fn()
          );

          expect(handled).toBe(true);
          const next = applyActions(state, dispatched);
          expect(next.mode).toBe('normal');
          expect(next.inputBuffer).toBe('');
          expect(next.showFilterWarning).toBe(false);
          expect(next.showSearchWarning).toBe(false);
          expect(next.showSortWarning).toBe(false);
          expect(next.showHiddenWarning).toBe(false);

          if (hasFilter) {
            expect(next.filters[dirId]).toBeUndefined();
            expect(next.selectedIds).toEqual(initialSelections);
          } else {
            expect(next.selectedIds).toEqual([]);
          }

          if (searchQuery !== null) {
            expect(next.searchQuery).toBeNull();
            expect(next.searchResults).toEqual([]);
            expect(next.cursorIndex).toBe(0);
          }
        }
      ),
      { numRuns: 80 }
    );

    // Dot toggles showHidden as an involution; f/s/, transition modes cleanly; Tab honors quarantine.
    assert(
      property(boolean(), boolean(), (startHidden, ctrlOrMeta) => {
        const base: GameState = { ...createBootState(1), showHidden: startHidden };
        const items = getVisibleItems(base);

        // Toggle '.' twice restores original showHidden
        let toggled = base;
        for (let i = 0; i < 2; i++) {
          const actions: Action[] = [];
          handleSystemParamsKeyDown(
            makeKeyEvent({ key: '.' }),
            toggled,
            (a) => actions.push(a),
            items[0] ?? null,
            LEVELS[0],
            vi.fn()
          );
          toggled = applyActions(toggled, actions);
        }
        expect(toggled.showHidden).toBe(startHidden);

        // 'f' ignores Ctrl/Meta shortcuts, enters 'filter' only cleanly
        const fActions: Action[] = [];
        const fHandled = handleSystemParamsKeyDown(
          makeKeyEvent({ key: 'f', ctrlKey: ctrlOrMeta }),
          base,
          (a) => fActions.push(a),
          items[0] ?? null,
          LEVELS[0],
          vi.fn()
        );
        expect(fHandled).toBe(!ctrlOrMeta);
        if (!ctrlOrMeta) {
          expect(applyActions(base, fActions).mode).toBe('filter');
        }

        // 's' enters search and clears filters; ',' enters sort with acceptNextKeyForSort
        const sActions: Action[] = [];
        handleSystemParamsKeyDown(
          makeKeyEvent({ key: 's' }),
          { ...base, filters: { guest: 'abc' } },
          (a) => sActions.push(a),
          items[0] ?? null,
          LEVELS[0],
          vi.fn()
        );
        const sState = applyActions(base, sActions);
        expect(sState.mode).toBe('search');
        expect(sState.filters).toEqual({});

        const commaActions: Action[] = [];
        handleSystemParamsKeyDown(
          makeKeyEvent({ key: ',' }),
          base,
          (a) => commaActions.push(a),
          items[0] ?? null,
          LEVELS[0],
          vi.fn()
        );
        const commaState = applyActions(base, commaActions);
        expect(commaState.mode).toBe('sort');
        expect(commaState.acceptNextKeyForSort).toBe(true);

        // Tab on quarantined workspace in Level 1 blocks info panel opening
        const ws = items.find((node) => node.name === 'workspace') ?? null;
        if (ws) {
          const tabActions: Action[] = [];
          const notify = vi.fn();
          handleSystemParamsKeyDown(
            makeKeyEvent({ key: 'Tab' }),
            { ...base, showInfoPanel: false },
            (a) => tabActions.push(a),
            ws,
            LEVELS[0],
            notify
          );
          expect(tabActions).toEqual([]);
          expect(notify).toHaveBeenCalledWith(expect.stringContaining('🔒'), 4000);
        }
      }),
      { numRuns: 40 }
    );

    // z / Shift+Z respect protocol violations
    assert(
      property(boolean(), boolean(), (hasFilter, useZoxide) => {
        let state = createBootState(6);
        const dirId = state.currentPath[state.currentPath.length - 1];
        if (hasFilter) {
          state = gameReducer(state, { type: 'SET_FILTER', dirId, filter: 'a' });
        }
        const actions: Action[] = [];
        handleSystemParamsKeyDown(
          makeKeyEvent({ key: useZoxide ? 'Z' : 'z', shiftKey: useZoxide }),
          state,
          (a) => actions.push(a),
          null,
          LEVELS[state.levelIndex],
          vi.fn()
        );
        const next = applyActions(state, actions);
        if (hasFilter) {
          expect(next.showFilterWarning).toBe(true);
          expect(next.mode).toBe('normal');
        } else {
          expect(next.mode).toBe(useZoxide ? 'zoxide-jump' : 'fzf-current');
          expect(next.fuzzySelectedIndex).toBe(0);
        }
      }),
      { numRuns: 30 }
    );
  });

  it('handleGCommandKeyDown locks shortcuts on Level 1 and safely resolves or blocks jumps on Levels 2+', () => {
    const gSubKeys = [...Object.keys(JUMP_TARGETS), 'G', 'Escape', 'x', 'q'];

    assert(
      property(constantFrom(...gSubKeys), (key) => {
        const state: GameState = { ...createBootState(1), mode: 'g-command' };
        const dispatched: Action[] = [];

        handleGCommandKeyDown(
          makeKeyEvent({ key, shiftKey: key === 'G' }),
          (action) => dispatched.push(action),
          state,
          LEVELS[0]
        );
        const next = applyActions(state, dispatched);

        expect(next.mode).toBe('normal');
        expect(dispatched.some((a) => a.type === 'NAVIGATE')).toBe(false);
        if (key !== 'g' && key !== 'Escape') {
          expect(next.notification?.message).toContain('Shortcuts disabled in Level 1');
        }
      }),
      { numRuns: 40 }
    );

    assert(
      property(
        integer({ min: 1, max: LEVELS.length - 1 }),
        constantFrom(...gSubKeys),
        boolean(),
        boolean(),
        (levelIdx, key, hasFilter, hasSort) => {
          let state: GameState = { ...createBootState(LEVELS[levelIdx].id), mode: 'g-command' };
          const dirId = state.currentPath[state.currentPath.length - 1];
          if (hasFilter) {
            state = gameReducer(state, { type: 'SET_FILTER', dirId, filter: 'x' });
          }
          if (hasSort) {
            state = gameReducer(state, { type: 'SET_SORT', sortBy: 'size', direction: 'asc' });
          }

          const dispatched: Action[] = [];
          handleGCommandKeyDown(
            makeKeyEvent({ key, shiftKey: key === 'G' }),
            (action) => dispatched.push(action),
            state,
            LEVELS[levelIdx]
          );
          const next = applyActions(state, dispatched);

          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();

          if (key === 'Escape' || (!JUMP_TARGETS[key] && key !== 'G')) {
            expect(next.mode).toBe('normal');
            expect(dispatched.some((a) => a.type === 'NAVIGATE')).toBe(false);
            return;
          }

          if (key === 'g' || key === 'G') {
            expect(next.mode).toBe('normal');
            if (hasFilter) {
              expect(next.showFilterWarning).toBe(true);
            } else {
              expect(next.showSortWarning).toBe(false);
            }
            return;
          }

          const target = JUMP_TARGETS[key];
          if (hasFilter || hasSort) {
            expect(dispatched.some((a) => a.type === 'NAVIGATE')).toBe(false);
            expect(next.showFilterWarning || next.showSortWarning).toBe(true);
            return;
          }

          expect(next.mode).toBe('normal');
          const targetExists = Boolean(getNodeByPath(state.fs, target.path));
          if (!targetExists) {
            expect(dispatched.some((a) => a.type === 'NAVIGATE')).toBe(false);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleOverwriteConfirmKeyDown protects existing fs on cancel, traps honeypots, and replaces safely on y', () => {
    assert(
      property(constantFrom('n', 'Escape', 'x', 'a', '1'), (key) => {
        const base = createBootState(1);
        const existing = getVisibleItems(base).find((node) => node.type === 'file') ?? null;
        const state: GameState = {
          ...base,
          mode: 'overwrite-confirm',
          pendingOverwriteNode: existing,
          inputBuffer: existing?.name ?? 'new.txt',
        };
        const dispatched: Action[] = [];

        handleOverwriteConfirmKeyDown(key, (action) => dispatched.push(action), state);
        const next = applyActions(state, dispatched);

        if (key === 'n' || key === 'Escape') {
          expect(next.mode).toBe('normal');
          expect(next.pendingOverwriteNode).toBeNull();
          expect(next.fs).toEqual(state.fs);
        } else {
          expect(dispatched).toEqual([]);
        }
      }),
      { numRuns: 40 }
    );

    assert(
      property(
        stringMatching(/^[a-z]{1,8}\.txt$/),
        boolean(),
        boolean(),
        (fileName, hasPending, hasTrapClipboard) => {
          const base = createBootState(8);
          const victim: FileNode = {
            id: `victim-${fileName}`,
            name: fileName,
            type: 'file',
            content: 'old',
          };
          const added = addNode(base.fs, base.currentPath, victim);
          expect(added.ok).toBe(true);
          if (!added.ok) return;

          const state: GameState = {
            ...base,
            fs: added.value,
            mode: 'overwrite-confirm',
            pendingOverwriteNode: hasPending ? victim : null,
            inputBuffer: fileName,
            clipboard: hasTrapClipboard
              ? {
                  action: 'yank',
                  originalPath: base.currentPath,
                  nodes: [{ id: 'trap-1', name: 'evil.trap', type: 'file', content: 'TRAP' }],
                }
              : null,
          };

          const snapshot = JSON.stringify(state.fs);
          const dispatched: Action[] = [];
          handleOverwriteConfirmKeyDown('y', (action) => dispatched.push(action), state);
          const next = applyActions(state, dispatched);

          expect(JSON.stringify(state.fs)).toBe(snapshot);
          expect(next.mode).toBe('normal');
          expect(next.pendingOverwriteNode).toBeNull();

          if (!hasPending) {
            expect(next.isGameOver).toBe(false);
            return;
          }

          if (hasTrapClipboard) {
            expect(next.isGameOver).toBe(true);
            expect(next.gameOverReason).toBe('honeypot');
            return;
          }

          expect(next.isGameOver).toBe(false);
          expect(next.inputBuffer).toBe('');
          expect(getNodeById(next.fs, victim.id)).toBeUndefined();
          const currentDir = getNodeByPath(next.fs, next.currentPath);
          expect(currentDir?.children?.some((child) => child.name === fileName)).toBe(true);
        }
      ),
      { numRuns: 60 }
    );
  });
});
