import { renderHook } from '@testing-library/react';
import { useGhostDialogue } from './useGhostDialogue';
import { GameState } from '../types';

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  currentPath: ['root', 'home', 'guest'],
  cursorIndex: 0,
  clipboard: null,
  mode: 'normal',
  inputBuffer: '',
  filters: {},
  sortBy: 'natural',
  sortDirection: 'asc',
  linemode: 'size',
  zoxideData: {},
  history: [],
  future: [],
  previewScroll: 0,
  levelIndex: 0,
  fs: { id: 'root', name: 'root', type: 'dir' as const, children: [] },
  levelStartFS: { id: 'root', name: 'root', type: 'dir' as const, children: [] },
  levelStartPath: [],
  notification: null,
  thought: null,
  selectedIds: [],
  pendingDeleteIds: [],
  deleteType: null,
  pendingOverwriteNode: null,
  showHelp: false,
  showMap: false,
  showHint: false,
  hintStage: 0,
  showHidden: false,
  showInfoPanel: false,
  showEpisodeIntro: false,
  isBooting: false,
  timeLeft: null,
  keystrokes: 0,
  weightedKeystrokes: 0,
  lastActionIntensity: 0,
  startTime: Date.now(),
  isGameOver: false,
  stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
  settings: { soundEnabled: true },
  usedG: false,
  usedGG: false,
  usedDown: false,
  usedUp: false,
  usedPreviewDown: false,
  usedPreviewUp: false,
  usedP: false,
  acceptNextKeyForSort: false,
  completedTaskIds: {},
  cycleCount: 1,
  threatLevel: 0,
  threatStatus: 'CALM',
  searchQuery: null,
  searchResults: [],
  usedSearch: false,
  usedFilter: false,
  alerts: [],
  triggeredThoughts: [],
  lastThoughtId: null,
  ghostDialogueTriggered: [],
  consciousnessLevel: 0,
  consciousnessTriggers: {},
  ...overrides,
});

describe('useGhostDialogue', () => {
  it('should trigger dialogue and dispatch actions when condition matches', () => {
    const dispatch = vi.fn();
    const gameState = createMockGameState({
      cycleCount: 2,
      ghostDialogueTriggered: [],
      consciousnessLevel: 0,
      consciousnessTriggers: {},
    });

    const { result } = renderHook(() => useGhostDialogue({ gameState, dispatch }));

    // Trigger a dialogue that has no minCycle requirement
    result.current.triggerGhostDialogue('near_honeypot');

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_GHOST_MESSAGE',
      payload: {
        text: "Don't. The trap has my scent on it.",
        signature: '-7733',
      },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'MARK_GHOST_DIALOGUE_TRIGGERED',
      payload: 'ghost-honeypot-warning',
    });
  });

  it('should prevent duplicate dialogue triggers', () => {
    const dispatch = vi.fn();
    const alreadyTriggeredId = 'ghost-honeypot-warning';
    const gameState = createMockGameState({
      cycleCount: 1,
      ghostDialogueTriggered: [alreadyTriggeredId],
    });

    const { result } = renderHook(() => useGhostDialogue({ gameState, dispatch }));

    // Try to trigger the same dialogue again
    result.current.triggerGhostDialogue('near_honeypot');

    // Should not dispatch any actions since dialogue was already triggered
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should respect minCycle requirement for dialogue', () => {
    const dispatch = vi.fn();
    const gameState = createMockGameState({
      cycleCount: 1, // Below minCycle of 2
      ghostDialogueTriggered: [],
      consciousnessLevel: 0,
      consciousnessTriggers: {},
    });

    const { result } = renderHook(() => useGhostDialogue({ gameState, dispatch }));

    // Try to trigger a dialogue that requires cycle 2
    result.current.triggerGhostDialogue('system_hint_vault');

    // Should not dispatch because cycleCount < minCycle
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should trigger dialogue when cycleCount meets minCycle requirement', () => {
    const dispatch = vi.fn();
    const gameState = createMockGameState({
      cycleCount: 2, // Meets minCycle of 2
      ghostDialogueTriggered: [],
      consciousnessLevel: 0,
      consciousnessTriggers: {},
    });

    const { result } = renderHook(() => useGhostDialogue({ gameState, dispatch }));

    // Trigger a dialogue that requires cycle 2
    result.current.triggerGhostDialogue('system_hint_vault');

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_GHOST_MESSAGE',
      payload: {
        text: "Lie. The vault isn't safe. I hid there.",
        signature: '-7733',
      },
    });
  });
});
