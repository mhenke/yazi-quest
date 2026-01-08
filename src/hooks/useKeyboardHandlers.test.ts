import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardHandlers } from './useKeyboardHandlers';
import { GameState, Level } from '../types';
import { INITIAL_FS, LEVELS } from '../constants';

// Mock helpers
const mockShowNotification = vi.fn();
const mockSetShowFilterWarning = vi.fn();
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
};

describe('useKeyboardHandlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const getHook = () =>
        renderHook(() => useKeyboardHandlers(mockShowNotification, mockSetShowFilterWarning));

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
            vi.fn() // advanceLevel
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
            vi.fn()
        );

        expect(mockSetGameState).toHaveBeenCalled();
        const updateFn = mockSetGameState.mock.calls[0][0];
        const newState = updateFn(initialGameState);

        expect(newState.mode).toBe('zoxide-jump');
        expect(mockShowNotification).toHaveBeenCalled();
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
            vi.fn()
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
            vi.fn()
        );

        expect(mockSetGameState).toHaveBeenCalled();
        const updateFn = mockSetGameState.mock.calls[0][0];
        const newState = updateFn(initialGameState);
        expect(newState.cursorIndex).toBe(Math.min(items.length - 1, initialGameState.cursorIndex + 1));
    });

});
