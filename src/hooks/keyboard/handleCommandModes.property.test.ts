import { assert, boolean, constantFrom, integer, property, stringMatching } from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { JUMP_TARGETS } from '../../constants/keybindings';
import { LEVELS } from '../../constants/levels';
import type { FileNode, GameState } from '../../types';
import { addNode, getNodeById, getNodeByPath } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import {
  makeBootState,
  makeKey,
  makeNormalContext,
  runDispatched,
} from '../../../tests/helpers/keyboardHarness';
import { handleGCommandKeyDown } from './handleGCommandMode';
import { handleOverwriteConfirmKeyDown } from './handleOverwriteMode';
import { handleSystemParamsKeyDown } from './handleSystemParams';

describe('property: system params, g-command, and overwrite mode handlers', () => {
  it('handleSystemParamsKeyDown clears mode/modals on Escape and preserves selections only when clearing a filter', () => {
    assert(
      property(
        boolean(),
        constantFrom<string | null>(null, '', 'readme'),
        boolean(),
        (hasFilter, searchQuery, startInfoOpen) => {
          const base = makeBootState(1);
          const dirId = base.currentPath[base.currentPath.length - 1];
          const items = getVisibleItems(base);
          const initialSelections = items.slice(0, 2).map((item) => item.id);

          const state: GameState = {
            ...base,
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

          const run = runDispatched(state, (dispatch) =>
            handleSystemParamsKeyDown(
              makeKey({ key: 'Escape' }),
              makeNormalContext(state, dispatch)
            )
          );
          expect(run.result).toBe(true);
          const next = run.state;

          expect(next.mode).toBe('normal');
          expect(next.inputBuffer).toBe('');
          expect(next.showFilterWarning).toBe(false);
          expect(next.showSearchWarning).toBe(false);
          expect(next.showSortWarning).toBe(false);
          expect(next.showHiddenWarning).toBe(false);
          expect(next.selectedIds).toEqual(hasFilter ? initialSelections : []);

          if (hasFilter) expect(next.filters[dirId]).toBeUndefined();
          if (searchQuery !== null) {
            expect(next.searchQuery).toBeNull();
            expect(next.searchResults).toEqual([]);
            expect(next.cursorIndex).toBe(0);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleSystemParamsKeyDown handles dot involution, mode switches, Tab protection, and z/Z gating', () => {
    assert(
      property(boolean(), boolean(), (startHidden, ctrlOrMeta) => {
        const base = makeBootState(1, { showHidden: startHidden });

        const once = runDispatched(base, (dispatch) =>
          handleSystemParamsKeyDown(makeKey({ key: '.' }), makeNormalContext(base, dispatch))
        ).state;
        const twice = runDispatched(once, (dispatch) =>
          handleSystemParamsKeyDown(makeKey({ key: '.' }), makeNormalContext(once, dispatch))
        ).state;
        expect(twice.showHidden).toBe(startHidden);

        const fRun = runDispatched(base, (dispatch) =>
          handleSystemParamsKeyDown(
            makeKey({ key: 'f', ctrlKey: ctrlOrMeta }),
            makeNormalContext(base, dispatch)
          )
        );
        expect(fRun.result).toBe(!ctrlOrMeta);
        if (!ctrlOrMeta) expect(fRun.state.mode).toBe('filter');

        const filteredBase: GameState = { ...base, filters: { guest: 'abc' } };
        const sState = runDispatched(filteredBase, (dispatch) =>
          handleSystemParamsKeyDown(
            makeKey({ key: 's' }),
            makeNormalContext(filteredBase, dispatch)
          )
        ).state;
        expect(sState.mode).toBe('search');
        expect(sState.filters).toEqual({});

        const commaState = runDispatched(base, (dispatch) =>
          handleSystemParamsKeyDown(makeKey({ key: ',' }), makeNormalContext(base, dispatch))
        ).state;
        expect(commaState.mode).toBe('sort');
        expect(commaState.acceptNextKeyForSort).toBe(true);
      }),
      { numRuns: 40 }
    );

    const base = makeBootState(1);
    const ws = getVisibleItems(base).find((node) => node.name === 'workspace') ?? null;
    if (ws) {
      const showNotification = vi.fn();
      const tabRun = runDispatched(base, (dispatch) =>
        handleSystemParamsKeyDown(
          makeKey({ key: 'Tab' }),
          makeNormalContext(base, dispatch, { currentItem: ws, showNotification })
        )
      );
      expect(tabRun.actions).toEqual([]);
      expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('🔒'), 4000);
    }

    assert(
      property(boolean(), boolean(), (hasFilter, useZoxide) => {
        const lvl6 = makeBootState(6);
        const dirId = lvl6.currentPath[lvl6.currentPath.length - 1];
        const state: GameState = hasFilter ? { ...lvl6, filters: { [dirId]: 'a' } } : lvl6;
        const next = runDispatched(state, (dispatch) =>
          handleSystemParamsKeyDown(
            makeKey({ key: useZoxide ? 'Z' : 'z', shiftKey: useZoxide }),
            makeNormalContext(state, dispatch)
          )
        ).state;

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

  const gSubKeys = [...Object.keys(JUMP_TARGETS), 'G', 'Escape', 'x', 'q'];

  it('handleGCommandKeyDown locks navigation shortcuts on Level 1', () => {
    assert(
      property(constantFrom(...gSubKeys), (key) => {
        const state = makeBootState(1, { mode: 'g-command' });
        const run = runDispatched(state, (dispatch) =>
          handleGCommandKeyDown(makeKey({ key, shiftKey: key === 'G' }), {
            gameState: state,
            dispatch,
            currentLevel: LEVELS[0],
          })
        );
        expect(run.state.mode).toBe('normal');
        expect(run.actions.some((a) => a.type === 'NAVIGATE')).toBe(false);
        if (key !== 'g' && key !== 'Escape') {
          expect(run.state.notification?.message).toContain('Shortcuts disabled in Level 1');
        }
      }),
      { numRuns: 40 }
    );
  });

  it('handleGCommandKeyDown exits cleanly on Escape/unknown and resolves or blocks jumps on Levels 2+', () => {
    assert(
      property(
        integer({ min: 1, max: LEVELS.length - 1 }),
        constantFrom('Escape', 'x', 'q', 'g', 'G'),
        boolean(),
        boolean(),
        (levelIdx, key, hasFilter, hasSort) => {
          const base = makeBootState(LEVELS[levelIdx].id, { mode: 'g-command' });
          const dirId = base.currentPath[base.currentPath.length - 1];
          const state: GameState = {
            ...base,
            filters: hasFilter ? { [dirId]: 'x' } : {},
            sortBy: hasSort ? 'size' : 'natural',
            sortDirection: hasSort ? 'asc' : 'asc',
          };

          const run = runDispatched(state, (dispatch) =>
            handleGCommandKeyDown(makeKey({ key, shiftKey: key === 'G' }), {
              gameState: state,
              dispatch,
              currentLevel: LEVELS[levelIdx],
            })
          );

          expect(run.state.mode).toBe('normal');
          if (key === 'Escape' || key === 'x' || key === 'q') {
            expect(run.actions.some((a) => a.type === 'NAVIGATE')).toBe(false);
          } else {
            expect(run.state.showFilterWarning).toBe(hasFilter);
            expect(run.state.showSortWarning).toBe(false);
          }
        }
      ),
      { numRuns: 80 }
    );

    const jumpKeys = Object.keys(JUMP_TARGETS).filter((k) => k !== 'g');
    assert(
      property(
        integer({ min: 1, max: LEVELS.length - 1 }),
        constantFrom(...jumpKeys),
        boolean(),
        boolean(),
        (levelIdx, key, hasFilter, hasSort) => {
          const base = makeBootState(LEVELS[levelIdx].id, { mode: 'g-command' });
          const dirId = base.currentPath[base.currentPath.length - 1];
          const state: GameState = {
            ...base,
            filters: hasFilter ? { [dirId]: 'x' } : {},
            sortBy: hasSort ? 'size' : 'natural',
            sortDirection: 'asc',
          };

          const run = runDispatched(state, (dispatch) =>
            handleGCommandKeyDown(makeKey({ key }), {
              gameState: state,
              dispatch,
              currentLevel: LEVELS[levelIdx],
            })
          );

          // Regression guard: even on protocol violations, g-command always returns to normal.
          expect(run.state.mode).toBe('normal');
          expect(getNodeByPath(run.state.fs, run.state.currentPath)).toBeDefined();

          if (hasFilter || hasSort) {
            expect(run.actions.some((a) => a.type === 'NAVIGATE')).toBe(false);
            expect(run.state.showFilterWarning || run.state.showSortWarning).toBe(true);
            return;
          }

          if (!getNodeByPath(state.fs, JUMP_TARGETS[key].path)) {
            expect(run.actions.some((a) => a.type === 'NAVIGATE')).toBe(false);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('handleOverwriteConfirmKeyDown preserves state on cancel/idle and traps honeypots or replaces on y', () => {
    assert(
      property(constantFrom('n', 'Escape', 'x', 'a', '1'), (key) => {
        const base = makeBootState(1);
        const existing = getVisibleItems(base).find((node) => node.type === 'file') ?? null;
        const state = makeBootState(1, {
          mode: 'overwrite-confirm',
          pendingOverwriteNode: existing,
          inputBuffer: existing?.name ?? 'new.txt',
        });

        const run = runDispatched(state, (dispatch) =>
          handleOverwriteConfirmKeyDown(key, { gameState: state, dispatch })
        );

        if (key === 'n' || key === 'Escape') {
          expect(run.state.mode).toBe('normal');
          expect(run.state.pendingOverwriteNode).toBeNull();
          expect(run.state.fs).toEqual(state.fs);
        } else {
          expect(run.actions).toEqual([]);
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
          const base = makeBootState(8);
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
          const next = runDispatched(state, (dispatch) =>
            handleOverwriteConfirmKeyDown('y', { gameState: state, dispatch })
          ).state;

          expect(JSON.stringify(state.fs)).toBe(snapshot);
          expect(next.mode).toBe('normal');
          expect(next.pendingOverwriteNode).toBeNull();

          if (!hasPending) {
            expect(next.isGameOver).toBe(false);
          } else if (hasTrapClipboard) {
            expect(next.isGameOver).toBe(true);
            expect(next.gameOverReason).toBe('honeypot');
          } else {
            expect(next.isGameOver).toBe(false);
            expect(next.inputBuffer).toBe('');
            expect(getNodeById(next.fs, victim.id)).toBeUndefined();
            const currentDir = getNodeByPath(next.fs, next.currentPath);
            expect(currentDir?.children?.some((child) => child.name === fileName)).toBe(true);
          }
        }
      ),
      { numRuns: 60 }
    );
  });
});
