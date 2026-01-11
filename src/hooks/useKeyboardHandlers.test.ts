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
  usedGR: false,
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
      LEVELS[0],
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
      LEVELS[0],
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

  // ============================================================
  // Navigation Tests
  // ============================================================

  it('should handle "h" to navigate to parent directory', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'h' });

    // Setup a mock parent node
    const mockParent = { id: 'home', name: 'home', type: 'dir' as const, children: [] };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      mockParent, // parent exists
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    // Should slice off last path element
    expect(newState.currentPath.length).toBe(initialGameState.currentPath.length - 1);
    expect(newState.history).toContain(initialGameState.currentPath);
  });

  it('should handle "l" to enter a directory', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'l' });

    const mockDir = { id: 'docs', name: 'docs', type: 'dir' as const, children: [] };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      mockDir, // currentItem is a directory
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.currentPath).toContain(mockDir.id);
  });

  it('should handle "Enter" to enter a directory', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });

    const mockDir = { id: 'docs', name: 'docs', type: 'dir' as const, children: [] };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      mockDir,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.currentPath).toContain(mockDir.id);
  });

  it('should handle "o" to enter a directory (alias for l)', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'o' });

    const mockDir = { id: 'workspace', name: 'workspace', type: 'dir' as const, children: [] };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      mockDir,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
  });

  it('should handle entering an archive', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'l' });

    const mockArchive = {
      id: 'backup',
      name: 'backup.zip',
      type: 'archive' as const,
      children: [],
    };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [],
      null,
      mockArchive,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.currentPath).toContain(mockArchive.id);
  });

  // ============================================================
  // Toggle Tests
  // ============================================================

  it('should toggle info panel with "Tab"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'Tab' });

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

    expect(newState.showInfoPanel).toBe(true);
  });

  it('should toggle hidden files with "."', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: '.' });

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

    expect(newState.showHidden).toBe(true);
    expect(mockShowNotification).toHaveBeenCalled();
  });

  // ============================================================
  // Delete Mode Tests
  // ============================================================

  it('should enter confirm-delete mode with "d"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'd' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.mode).toBe('confirm-delete');
    expect(newState.pendingDeleteIds).toContain(mockFile.id);
    expect(newState.deleteType).toBe('trash');
  });

  it('should enter confirm-delete mode with "D" for permanent delete', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'D', shiftKey: true });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.mode).toBe('confirm-delete');
    expect(newState.deleteType).toBe('permanent');
  });

  it('should cancel delete with "n" in confirm-delete mode', () => {
    const { result } = getHook();
    const state: GameState = {
      ...initialGameState,
      mode: 'confirm-delete',
      pendingDeleteIds: ['some-id'],
    };

    result.current.handleConfirmDeleteModeKeyDown(
      new KeyboardEvent('keydown', { key: 'n' }),
      mockSetGameState,
      [],
      LEVELS[0],
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.mode).toBe('normal');
    expect(newState.pendingDeleteIds).toEqual([]);
  });

  it('should cancel delete with "Escape" in confirm-delete mode', () => {
    const { result } = getHook();

    result.current.handleConfirmDeleteModeKeyDown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      mockSetGameState,
      [],
      LEVELS[0],
    );

    expect(mockSetGameState).toHaveBeenCalled();
  });

  // ============================================================
  // Clipboard Tests
  // ============================================================

  it('should yank current item with "y"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'y' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.clipboard?.action).toBe('yank');
    expect(newState.clipboard?.nodes).toHaveLength(1);
    expect(newState.clipboard?.nodes[0].id).toBe(mockFile.id);
  });

  it('should cut current item with "x"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'x' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.clipboard?.action).toBe('cut');
    expect(newState.clipboard?.nodes[0].id).toBe(mockFile.id);
  });

  it('should yank multiple selected items with "y"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'y' });

    // Create a modified fs with files in the current directory
    const testFiles = [
      { id: 'file1', name: 'a.txt', type: 'file' as const, content: '' },
      { id: 'file2', name: 'b.txt', type: 'file' as const, content: '' },
    ];

    // Modify the fs to include these files in the guest directory
    const modifiedFs = JSON.parse(JSON.stringify(initialGameState.fs));
    // Clear existing children and add our test files
    modifiedFs.children[0].children[0].children = testFiles;

    const stateWithSelection: GameState = {
      ...initialGameState,
      fs: modifiedFs,
      selectedIds: ['file1', 'file2'],
    };

    result.current.handleNormalModeKeyDown(
      event,
      stateWithSelection,
      mockSetGameState,
      testFiles,
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(stateWithSelection);

    expect(newState.clipboard?.nodes).toHaveLength(2);
    expect(newState.selectedIds).toEqual([]);
  });

  // ============================================================
  // Input Mode Tests
  // ============================================================

  it('should enter input-file mode with "a"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'a' });

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

    expect(newState.mode).toBe('input-file');
    expect(newState.inputBuffer).toBe('');
  });

  it('should select all with "Ctrl+A"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });

    const mockFiles = [
      { id: 'file1', name: 'a.txt', type: 'file' as const, content: '' },
      { id: 'file2', name: 'b.txt', type: 'file' as const, content: '' },
    ];

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      mockFiles,
      null,
      null,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.selectedIds).toEqual(['file1', 'file2']);
    expect(newState.usedCtrlA).toBe(true);
  });

  it('should enter rename mode with "r"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'r' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.mode).toBe('rename');
    expect(newState.inputBuffer).toBe('test.txt');
  });

  it('should enter filter mode with "f"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: 'f' });

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

    expect(newState.mode).toBe('filter');
  });

  // ============================================================
  // Selection Tests
  // ============================================================

  it('should toggle selection with "Space"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: ' ' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };

    result.current.handleNormalModeKeyDown(
      event,
      initialGameState,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(initialGameState);

    expect(newState.selectedIds).toContain('file1');
  });

  it('should deselect already selected item with "Space"', () => {
    const { result } = getHook();
    const event = new KeyboardEvent('keydown', { key: ' ' });

    const mockFile = { id: 'file1', name: 'test.txt', type: 'file' as const, content: '' };
    const stateWithSelection: GameState = {
      ...initialGameState,
      selectedIds: ['file1'],
    };

    result.current.handleNormalModeKeyDown(
      event,
      stateWithSelection,
      mockSetGameState,
      [mockFile],
      null,
      mockFile,
      LEVELS[0],
      vi.fn(),
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(stateWithSelection);

    expect(newState.selectedIds).not.toContain('file1');
  });

  // ============================================================
  // G-Command Tests
  // ============================================================

  it('should handle "gi" to jump to incoming', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'i' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    expect(mockSetGameState).toHaveBeenCalled();
    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root', 'home', 'guest', 'incoming']);
    expect(newState.mode).toBe('normal');
    expect(newState.usedGI).toBe(true);
  });

  it('should handle "gd" to jump to datastore', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'd' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root', 'home', 'guest', 'datastore']);
  });

  it('should handle "gc" to jump to config', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'c' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root', 'home', 'guest', '.config']);
    expect(newState.usedGC).toBe(true);
  });

  it('should handle "gt" to jump to tmp', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 't' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root', 'tmp']);
  });

  it('should handle "gr" to jump to root', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'r' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root']);
    // Regression: usedGR flag must be set for Level 7 nav-to-root task
    expect(newState.usedGR).toBe(true);
  });

  it('should handle "gw" to jump to workspace', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    // Workspace is protected until Level 7 (index 6), so use that level
    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'w' }),
      mockSetGameState,
      state,
      LEVELS[6],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.currentPath).toEqual(['root', 'home', 'guest', 'workspace']);
  });

  it('should exit g-command mode on unknown key', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'x' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.mode).toBe('normal');
  });

  it('should exit g-command mode on Escape', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'g-command' };

    result.current.handleGCommandKeyDown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      mockSetGameState,
      state,
      LEVELS[0],
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.mode).toBe('normal');
  });

  // ============================================================
  // Sort Mode Tests
  // ============================================================

  it('should handle sort mode key "n" for natural sort', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'n' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.sortBy).toBe('natural');
    expect(newState.sortDirection).toBe('asc');
  });

  it('should handle sort mode key "m" for modified sort', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'm' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.sortBy).toBe('modified');
    expect(newState.sortDirection).toBe('desc'); // Modified defaults to desc
    expect(newState.linemode).toBe('mtime');
  });

  it('should handle sort mode key "s" for size sort', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 's' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.sortBy).toBe('size');
    expect(newState.linemode).toBe('size');
  });

  it('should handle sort mode key "e" for extension sort', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'e' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.sortBy).toBe('extension');
  });

  it('should exit sort mode on Escape', () => {
    const { result } = getHook();
    const state: GameState = { ...initialGameState, mode: 'sort', acceptNextKeyForSort: true };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.mode).toBe('normal');
    expect(newState.acceptNextKeyForSort).toBe(false);
  });

  it('should handle sort mode key "l" to cycle linemode', () => {
    const { result } = getHook();
    const state: GameState = {
      ...initialGameState,
      mode: 'sort',
      acceptNextKeyForSort: true,
      linemode: 'size',
    };

    result.current.handleSortModeKeyDown(
      new KeyboardEvent('keydown', { key: 'l' }),
      mockSetGameState,
    );

    const updateFn = mockSetGameState.mock.calls[0][0];
    const newState = updateFn(state);

    expect(newState.linemode).toBe('mtime'); // size -> mtime
    expect(newState.mode).toBe('normal');
  });
});
