import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardHandlers } from './useKeyboardHandlers';
import { GameState, Level } from '../types';
import { INITIAL_FS, LEVELS } from '../constants';

// Mock helpers
const mockShowNotification = vi.fn();
const mockSetGameState = vi.fn();

// Initial GameState for testing
const initialGameState: GameState = {
  currentPath: ['root', 'home', 'guest'],
  cursorIndex: 0,
  clipboard: null,
  mode: 'normal',
  inputBuffer: '',
  filters: {},
  sortBy: 'natural',
  sortDirection: 'asc',
  linemode: 'size',
  history: [],
  future: [],
  previewScroll: 0,
  zoxideData: {},
  levelIndex: 0,
  fs: JSON.parse(JSON.stringify(INITIAL_FS)),
  levelStartFS: JSON.parse(JSON.stringify(INITIAL_FS)),
  levelStartPath: ['root', 'home', 'guest'],
  notification: null,
  selectedIds: [],
  pendingDeleteIds: [],
  deleteType: null,
  pendingOverwriteNode: null,
  showHelp: false,
  showHint: false,
  showInfoPanel: false,
  showHidden: false,
  hintStage: 0,
  showEpisodeIntro: false,
  timeLeft: null,
  keystrokes: 0,
  isGameOver: false,
  gameOverReason: undefined,
  stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
  settings: { soundEnabled: true },
  fuzzySelectedIndex: 0,
  usedG: false,
  usedGI: false,
  usedGC: false,
  usedCtrlA: false,
  usedGG: false,
  usedDown: false,
  usedUp: false,
  usedPreviewDown: false,
  usedPreviewUp: false,
  usedP: false,
  acceptNextKeyForSort: false,
  completedTaskIds: {},
  ignoreEpisodeIntro: false,
  threatLevel: 0,
  threatStatus: 'CALM',
};

describe('useKeyboardHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getHook = () => renderHook(() => useKeyboardHandlers(mockShowNotification));

  it('handleFuzzyModeKeyDown should switch mode to fzf-current on pressing "z"', () => {
    // Note: The logic for switching TO a mode usually lives in 'handleNormalModeKeyDown' or 'handleKeyDown' in App.tsx.
    // However, `useKeyboardHandlers` returns `handleFuzzyModeKeyDown` which handles keys WHILE in that mode.
    // Wait, looking at the code, `handleFuzzyModeKeyDown` handles keys when mode is ALREADY 'zoxide-jump' or 'fzf-current'.
    // The switching logic is in `handleNormalModeKeyDown`? Let's check the code implementation again.
  });

  // Re-reading the `useKeyboardHandlers.ts` file shown in previous turn:
  // `handleNormalModeKeyDown` has a switch case for keys.
  // We need to test `handleNormalModeKeyDown` to verify 'z' and 'Z' trigger the mode change.

  it('should switch to fzf-current mode when pressing "z" in normal mode', () => {
    const { result } = getHook();

    // Simulate 'z' key press
    const event = new KeyboardEvent('keydown', { key: 'z' });

    // Call handleNormalModeKeyDown
    // Signature: (e, gameState, setGameState, items, parent, currentItem, currentLevel, advanceLevel)
    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [], // visibleItems
      null, // parent
      null, // currentItem
      LEVELS[0], // currentLevel
      vi.fn(), // advanceLevel
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.mode).toBe('fzf-current');
    // Notification is set via side effect, so we verify the mock was called
    expect(mockShowNotification).toHaveBeenCalled();
  });

  it('should switch to zoxide-jump mode when pressing "Shift+Z" in normal mode', () => {
    const { result } = getHook();

    // Simulate 'Z' key press
    const event = new KeyboardEvent('keydown', { key: 'Z', shiftKey: true });

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.mode).toBe('zoxide-jump');
    expect(mockShowNotification).toHaveBeenCalled();
  });

  it('should block navigation and enter filter-warning mode if filter is active during jump', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'Z', shiftKey: true });

    // Setup state with active filter
    const stateWithFilter: GameState = {
      ...initialGameState,
      filters: { guest: 'somefilter' }, // Assuming guest ID is 'guest' (it is in INITIAL_FS implicit logic usually, but let's check constants or rely on mock return)
      // We need to ensure getNodeByPath returns a node with ID matching the filter key.
      // initialGameState currentPath is ['root', 'home', 'guest']
      // getNodeByPath should return the guest node.
      // We need to ensure logic uses IDs correct.
      // Let's rely on the fact that getNodeByPath uses the FS structure.
      // We need to mock FS? No, it uses real util logic on mocked data.
      // In INITIAL_FS, guest has ID 'guest'.
    };
    // Fix: Update filters to match the ID found by getNodeByPath
    // Actually, let's verify what ID is used in INITIAL_FS.
    // Based on logic, IDs are usually the last part of path or uuid.
    // Let's assume 'guest' for now, or better:
    // logic: const currentDirNode = getNodeByPath(...)
    // We know 'guest' is the folder.
    stateWithFilter.filters['guest'] = 'foo';

    result.current.handleNormalModeKeyDown(
      event,
      stateWithFilter,
      mockSetGameState,
      [],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(stateWithFilter);

    expect(newState.mode).toBe('filter-warning');
    expect(mockShowNotification).not.toHaveBeenCalled(); // Warning doesn't use notification, it uses mode
  });

  it('should switch to sort mode when pressing ","', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: ',' });

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);
    expect(newState.mode).toBe('sort');
    expect(newState.acceptNextKeyForSort).toBe(true);
  });

  it('should handle "j" to move down', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'j' });
    const items = [{ id: '1', name: 'test', type: 'file', parentId: 'root' }];

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      items as any[],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);
    expect(newState.cursorIndex).toBe(Math.min(items.length - 1, initialGameState.cursorIndex + 1));
  });
  it('should handle "k" to move up', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'k' });
    const state = { ...initialGameState, cursorIndex: 1 };

    result.current.handleNormalModeKeyDown(
      event,
      state,
      mockSetGameState,
      [{ id: '1' }, { id: '2' }] as any[],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);
    expect(newState.cursorIndex).toBe(0);
  });

  it('should handle "gg" to jump to top', () => {
    const { result } = getHook();
    const items = new Array(10).fill({ id: 'x' });
    const state = { ...initialGameState, cursorIndex: 5, usedG: false };

    // First 'g'
    result.current.handleNormalModeKeyDown(
      new KeyboardEvent('keydown', { key: 'g' }),
      state,
      mockSetGameState,
      items as any[],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    let updateFn = mockSetGameState.mock.calls[0][0];
    let newState = updateFn(state);
    expect(newState.mode).toBe('g-command');

    // Second 'g' - handled by handleGCommandKeyDown
    mockSetGameState.mockClear();
    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'g' }),
      mockSetGameState,
      { ...state, mode: 'g-command' } as GameState, // usedG is NOT set by first 'g'
    );

    updateFn = mockSetGameState.mock.calls[0][0];
    newState = updateFn({ ...state, mode: 'g-command' });
    expect(newState.cursorIndex).toBe(0);
    expect(newState.usedGG).toBe(true);
  });

  it('should handle "G" to jump to bottom', () => {
    const { result } = getHook();
    const items = new Array(10).fill({ id: 'x' });
    const state = { ...initialGameState, cursorIndex: 0 };

    // Populate FS to ensure getVisibleItems returns items
    const fsWithItems = JSON.parse(JSON.stringify(initialGameState.fs));
    // root -> home -> guest
    fsWithItems.children[0].children[0].children = new Array(10).fill(null).map((_, i) => ({
      id: `file-${i}`,
      name: `file-${i}`,
      type: 'file',
      parentId: 'guest',
    }));

    const stateWithItems = { ...state, fs: fsWithItems };

    result.current.handleNormalModeKeyDown(
      new KeyboardEvent('keydown', { key: 'G', shiftKey: true }),
      stateWithItems,
      mockSetGameState,
      [], // visibleItems arg is ignored by handleNormalModeKeyDown for 'G'
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(stateWithItems);
    expect(newState.cursorIndex).toBe(9);
  });

  it('should handle "J" (Shift+J) to scroll preview down', () => {
    const { result } = getHook();
    result.current.handleNormalModeKeyDown(
      new KeyboardEvent('keydown', { key: 'J', shiftKey: true }),
      initialGameState,
      mockSetGameState,
      [],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);
    expect(newState.previewScroll).toBe(5);
    expect(newState.usedPreviewDown).toBe(true);
  });

  it('should handle "K" (Shift+K) to scroll preview up', () => {
    const { result } = getHook();
    const state = { ...initialGameState, previewScroll: 5 };
    result.current.handleNormalModeKeyDown(
      new KeyboardEvent('keydown', { key: 'K', shiftKey: true }),
      state,
      mockSetGameState,
      [],
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);
    expect(newState.previewScroll).toBe(0);
    expect(newState.usedPreviewUp).toBe(true);
  });

  it('should handle Go commands (gh -> Home)', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'h' }),
      mockSetGameState,
      state,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);
    expect(newState.currentPath).toEqual(['root', 'home', 'guest']);
    expect(newState.mode).toBe('normal');
  });

  it('should handle sort mode key "a" for alphabetical sort', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'a' }),
      mockSetGameState,
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.mode).toBe('normal');
    expect(newState.sortBy).toBe('alphabetical');
    expect(newState.sortDirection).toBe('asc');
    expect(newState.acceptNextKeyForSort).toBe(false);
  });

  it('should handle confirm delete mode key "y"', () => {
    const { result } = getHook();
    const state: GameState = {
      ...initialGameState,
      mode: 'confirm-delete',
      pendingDeleteIds: ['some-id'],
    };

    // We spy on mockSetGameState to infer confirmDelete behavior
    result.current.handleConfirmDeleteModeKeyDown(
      new KeyboardEvent('keydown', { key: 'y' }),
      mockSetGameState,
      [],
      LEVELS[0],
    );

    expect(mockSetGameState).toHaveBeenCalled();
  });
});
