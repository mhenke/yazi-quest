// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { FileNode, GameState } from '../../types';
import { createInitialState } from '../initialState';
import { buildDeleteModalData, handleSortWarningKey, runGameLoopKeyDown } from './gameLoopHelpers';
import { isProtocolWarningOpen } from './utils';

const makeKey = (key: string, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent =>
  ({
    key,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    target: document.body,
    preventDefault: vi.fn(),
    ...overrides,
  }) as unknown as KeyboardEvent;

const makeDeps = (
  stateOverrides: Partial<GameState> = {},
  depOverrides: Record<string, unknown> = {}
) => {
  const baseState = createInitialState();
  const gameState: GameState = {
    ...baseState,
    isBooting: false,
    showEpisodeIntro: false,
    isGameOver: false,
    mode: 'normal',
    ...stateOverrides,
  };
  return {
    gameState,
    currentLevel: LEVELS[0],
    isLastLevel: false,
    filePaneEl: null,
    visibleItems: [],
    parent: null,
    currentItem: null,
    dispatch: vi.fn(),
    advanceLevel: vi.fn(),
    showNotification: vi.fn(),
    checkAllTasksComplete: vi.fn(() => false),
    ...depOverrides,
  };
};

describe('runGameLoopKeyDown', () => {
  it('ignores events when booting, in intro, at outro, or game over', () => {
    for (const [s, last] of [
      [{ isBooting: true }, false],
      [{ showEpisodeIntro: true }, false],
      [{ isGameOver: true }, false],
      [{}, true],
    ] as Array<[Partial<GameState>, boolean]>) {
      const deps = makeDeps(s, { isLastLevel: last });
      expect(runGameLoopKeyDown(makeKey('j'), deps)).toBeUndefined();
      expect(deps.dispatch).not.toHaveBeenCalled();
    }
  });

  it('skips non-gameplay modes, fuzzy non-input keys, and modified/non-normal Tab', () => {
    for (const mode of ['filter', 'input-file', 'rename', 'search'] as const) {
      const deps = makeDeps({ mode });
      expect(runGameLoopKeyDown(makeKey('j'), deps)).toBeUndefined();
    }

    const fuzzyBlocked = makeDeps({ mode: 'zoxide-jump' });
    expect(
      runGameLoopKeyDown(makeKey('j', { target: document.body }), fuzzyBlocked)
    ).toBeUndefined();

    const fuzzyInput = document.createElement('input');
    const fuzzyAllowed = makeDeps({ mode: 'fzf-current' });
    runGameLoopKeyDown(makeKey('j', { target: fuzzyInput }), fuzzyAllowed);
    expect(fuzzyAllowed.dispatch).toHaveBeenCalled();

    const tabInSort = makeDeps({ mode: 'sort' });
    expect(runGameLoopKeyDown(makeKey('Tab'), tabInSort)).toBeUndefined();

    const shiftTab = makeDeps({ mode: 'normal' });
    expect(runGameLoopKeyDown(makeKey('Tab', { shiftKey: true }), shiftTab)).toBeUndefined();
  });

  it('skips targets outside filePaneEl except body/documentElement/hintModal and Escape in pending command', () => {
    const filePane = document.createElement('div');
    const outsideBtn = document.createElement('button');
    const hintWrapper = document.createElement('div');
    hintWrapper.setAttribute('data-testid', 'hint-modal');
    const hintBtn = document.createElement('button');
    hintWrapper.appendChild(hintBtn);
    document.body.append(filePane, outsideBtn, hintWrapper);

    const outsideDeps = makeDeps({ mode: 'normal' }, { filePaneEl: filePane });
    expect(runGameLoopKeyDown(makeKey('j', { target: outsideBtn }), outsideDeps)).toBeUndefined();
    expect(outsideDeps.dispatch).not.toHaveBeenCalled();

    const hintBtnEnter = makeDeps({ mode: 'normal' }, { filePaneEl: filePane });
    expect(runGameLoopKeyDown(makeKey('Enter', { target: hintBtn }), hintBtnEnter)).toBeUndefined();

    const sortEscape = makeDeps({ mode: 'sort' }, { filePaneEl: filePane });
    runGameLoopKeyDown(makeKey('Escape', { target: outsideBtn }), sortEscape);
    expect(sortEscape.dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'normal' });
    expect(sortEscape.dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT_KEY_HANDLER',
      accept: false,
    });

    filePane.remove();
    outsideBtn.remove();
    hintWrapper.remove();
  });

  it('blocks gameplay when success toast is shown without baseline violation and handles Alt+Shift+M', () => {
    const toastDeps = makeDeps(
      { showSuccessToast: true },
      { checkAllTasksComplete: vi.fn(() => true) }
    );
    expect(runGameLoopKeyDown(makeKey('j'), toastDeps)).toBe(true);
    expect(toastDeps.dispatch).not.toHaveBeenCalled();

    const muteDeps = makeDeps({ settings: { soundEnabled: true, narrativeEffects: 'full' } });
    expect(runGameLoopKeyDown(makeKey('M', { altKey: true, shiftKey: true }), muteDeps)).toBe(true);
    expect(muteDeps.dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_SOUND' });
    expect(muteDeps.dispatch).toHaveBeenCalledWith({
      type: 'SET_NOTIFICATION',
      message: 'Sound Disabled',
    });

    const unmuteDeps = makeDeps({ settings: { soundEnabled: false, narrativeEffects: 'full' } });
    expect(runGameLoopKeyDown(makeKey('m', { altKey: true, shiftKey: true }), unmuteDeps)).toBe(
      true
    );
    expect(unmuteDeps.dispatch).toHaveBeenCalledWith({
      type: 'SET_NOTIFICATION',
      message: 'Sound Enabled',
    });
  });

  it('tracks keystrokes (including level 11+ weighted noise) and dispatches every mode', () => {
    const ep3Level = LEVELS.find((l) => l.id >= 11) ?? LEVELS[0];
    const normalDeps = makeDeps({ mode: 'normal' }, { currentLevel: ep3Level });
    expect(runGameLoopKeyDown(makeKey('j', { target: document.documentElement }), normalDeps)).toBe(
      true
    );
    expect(normalDeps.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INCREMENT_KEYSTROKES' })
    );
    expect(normalDeps.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_CURSOR' })
    );

    const sortDeps = makeDeps({ mode: 'sort' });
    runGameLoopKeyDown(makeKey('a'), sortDeps);
    expect(sortDeps.dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sortBy: 'alphabetical',
      direction: 'asc',
    });

    const deleteDeps = makeDeps({ mode: 'confirm-delete' });
    runGameLoopKeyDown(makeKey('n'), deleteDeps);
    expect(deleteDeps.dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'normal' });
    expect(deleteDeps.dispatch).toHaveBeenCalledWith({ type: 'SET_DELETE_PENDING', ids: [] });

    const gDeps = makeDeps({ mode: 'g-command' }, { currentLevel: LEVELS[1] });
    runGameLoopKeyDown(makeKey('h'), gDeps);
    expect(gDeps.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'NAVIGATE' }));

    const overwriteDeps = makeDeps({ mode: 'overwrite-confirm' });
    runGameLoopKeyDown(makeKey('y'), overwriteDeps);
    expect(overwriteDeps.dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'normal' });

    const fuzzyEscapeDeps = makeDeps({ mode: 'zoxide-jump' });
    runGameLoopKeyDown(makeKey('Escape'), fuzzyEscapeDeps);
    expect(fuzzyEscapeDeps.dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'normal' });
  });

  it('detects open protocol warnings and skips keystroke counting while a warning is open', () => {
    const baseState = createInitialState();
    expect(isProtocolWarningOpen(baseState)).toBe(false);
    expect(isProtocolWarningOpen({ ...baseState, mode: 'filter-warning' })).toBe(true);
    expect(isProtocolWarningOpen({ ...baseState, showFilterWarning: true })).toBe(true);
    expect(isProtocolWarningOpen({ ...baseState, showSearchWarning: true })).toBe(true);
    expect(isProtocolWarningOpen({ ...baseState, showSortWarning: true })).toBe(true);
    expect(isProtocolWarningOpen({ ...baseState, showHiddenWarning: true })).toBe(true);

    const warningDeps = makeDeps({ showSearchWarning: true });
    runGameLoopKeyDown(makeKey('j'), warningDeps);
    expect(warningDeps.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INCREMENT_KEYSTROKES' })
    );
  });
});

describe('handleSortWarningKey', () => {
  it('handles Tab, Escape, Shift+Enter, comma, and acceptNextKeyForSort', () => {
    const baseState = createInitialState();
    const dispatch = vi.fn();
    const confirmWarningModal = vi.fn();
    const dismissWarning = vi.fn();

    const params = {
      gameState: baseState,
      currentLevel: LEVELS[0],
      dispatch,
      confirmWarningModal,
      dismissWarning,
    };

    expect(handleSortWarningKey(makeKey('Tab'), params)).toBe(true);
    expect(dismissWarning).not.toHaveBeenCalled();

    handleSortWarningKey(makeKey('Escape'), params);
    expect(dismissWarning).toHaveBeenCalledWith('sortWarning');

    handleSortWarningKey(makeKey('Enter', { shiftKey: true }), params);
    expect(confirmWarningModal).toHaveBeenCalledWith('sortWarning', false);

    handleSortWarningKey(makeKey(','), params);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'sort' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SORT_KEY_HANDLER', accept: true });

    dispatch.mockClear();
    handleSortWarningKey(makeKey('n'), {
      ...params,
      gameState: { ...baseState, acceptNextKeyForSort: true },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_SORT',
      sortBy: 'natural',
      direction: 'asc',
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_MODAL_VISIBILITY',
      modal: 'sortWarning',
      visible: false,
    });

    dispatch.mockClear();
    handleSortWarningKey(makeKey('s'), {
      ...params,
      gameState: { ...baseState, acceptNextKeyForSort: true },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_MODAL_VISIBILITY',
      modal: 'sortWarning',
      visible: true,
    });
  });
});

describe('buildDeleteModalData', () => {
  it('classifies folders, files, mixed items, root paths, and missing ids', () => {
    const folder: FileNode = { id: 'd1', name: 'logs', type: 'dir', children: [] };
    const doc: FileNode = { id: 'f1', name: 'trace.log', type: 'file' };
    const rootFs: FileNode = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [folder, doc],
    };
    const baseState = createInitialState();

    expect(
      buildDeleteModalData(
        { ...baseState, fs: rootFs, currentPath: ['root'], pendingDeleteIds: ['d1'] },
        [folder, doc]
      )
    ).toEqual({ itemKind: 'folder', itemsToDelete: ['/logs'] });

    expect(
      buildDeleteModalData(
        { ...baseState, fs: rootFs, currentPath: ['root', 'd1'], pendingDeleteIds: ['f1'] },
        [folder, doc]
      )
    ).toEqual({ itemKind: 'file', itemsToDelete: ['/logs/trace.log'] });

    expect(
      buildDeleteModalData(
        {
          ...baseState,
          fs: rootFs,
          currentPath: ['root'],
          pendingDeleteIds: ['d1', 'f1', 'missing'],
        },
        [folder, doc]
      )
    ).toEqual({ itemKind: 'item', itemsToDelete: ['/logs', '/trace.log', 'missing'] });
  });
});
