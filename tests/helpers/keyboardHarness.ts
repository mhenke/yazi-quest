import type React from 'react';
import { vi } from 'vitest';
import { INITIAL_FS, applyFileSystemMutations } from '../../src/constants/filesystem';
import { LEVELS } from '../../src/constants/levels';
import { BASE_TIME } from '../../src/constants/timings';
import { INITIAL_ACTION_FLAGS, gameReducer, type Action } from '../../src/hooks/gameReducer';
import type { KeyInput, NormalModeContext } from '../../src/hooks/keyboard/types';
import type { GameState } from '../../src/types';
import { cloneFS, getParentNode, resolvePath } from '../../src/utils/fsHelpers';
import { getLevelStartPath } from '../../src/utils/gameUtils';
import { getVisibleItems } from '../../src/utils/viewHelpers';

export interface KeySpec {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export const makeKey = ({
  key,
  shiftKey = false,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
}: KeySpec): KeyInput => ({
  key,
  shiftKey,
  ctrlKey,
  metaKey,
  altKey,
  preventDefault: vi.fn(),
});

export const makeBootState = (levelId = 1, overrides: Partial<GameState> = {}): GameState => {
  const idx = Math.max(
    0,
    LEVELS.findIndex((level) => level.id === levelId)
  );
  const level = LEVELS[idx];
  const completedTaskIds: Record<number, string[]> = {};
  LEVELS.forEach((entry, entryIdx) => {
    completedTaskIds[entry.id] = entryIdx < idx ? entry.tasks.map((task) => task.id) : [];
  });

  const fs = applyFileSystemMutations(cloneFS(INITIAL_FS), level.id, { levelIndex: idx });
  const currentPath = getLevelStartPath(fs, level);
  const startStr = resolvePath(fs, currentPath);

  const base: GameState = {
    currentPath,
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
    loadedDirIds: [],
    alerts: [],
    dismissedAlertIds: [],
    previewScroll: 0,
    zoxideData: {
      '/home/guest/datastore': { count: 42, lastAccess: BASE_TIME - 3600000 },
      '/home/guest/incoming': { count: 35, lastAccess: BASE_TIME - 1800000 },
      '/home/guest/workspace': { count: 28, lastAccess: BASE_TIME - 7200000 },
      '/home/guest/.config': { count: 30, lastAccess: BASE_TIME - 900000 },
      '/tmp': { count: 15, lastAccess: BASE_TIME - 1800000 },
      '/daemons': { count: 12, lastAccess: BASE_TIME - 43200000 },
      [startStr]: { count: 1, lastAccess: BASE_TIME },
    },
    levelIndex: idx,
    unlockedLevelIndex: idx,
    fs,
    levelStartFS: overrides.levelStartFS ?? cloneFS(overrides.fs ?? fs),
    levelStartPath: [...currentPath],
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
    timeLeft: level.timeLimit || null,
    keystrokes: 0,
    isGameOver: false,
    gameOverReason: undefined,
    stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
    settings: { soundEnabled: true, narrativeEffects: 'full' },
    consciousnessLevel: 0,
    fuzzySelectedIndex: 0,
    ...INITIAL_ACTION_FLAGS,
    acceptNextKeyForSort: false,
    completedTaskIds,
    ignoreEpisodeIntro: false,
    cycleCount: 1,
    threatLevel: 0,
    threatStatus: 'CALM',
    searchQuery: null,
    searchResults: [],
    weightedKeystrokes: 0,
    lastActionIntensity: 0,
    startTime: BASE_TIME,
    helpScrollPosition: 0,
    questMapTab: 0,
    questMapMissionIdx: 0,
    showHiddenWarning: false,
    showSortWarning: false,
    showFilterWarning: false,
    showSearchWarning: false,
    showThreatAlert: false,
    alertMessage: '',
    showSuccessToast: false,
    isBooting: false,
    ...overrides,
  };
  return base;
};

const applyActions = (initial: GameState, actions: Action[]): GameState =>
  actions.reduce((state, action) => gameReducer(state, action), initial);

export const runDispatched = <T>(
  initial: GameState,
  invoke: (dispatch: React.Dispatch<Action>) => T
): { result: T; state: GameState; actions: Action[] } => {
  const actions: Action[] = [];
  const result = invoke((action) => actions.push(action));
  return { result, actions, state: applyActions(initial, actions) };
};

export const makeNormalContext = (
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  overrides: Partial<NormalModeContext> = {}
): NormalModeContext => {
  const items = overrides.items ?? getVisibleItems(gameState);
  const currentItem = overrides.currentItem ?? items[gameState.cursorIndex] ?? null;
  return {
    gameState,
    dispatch,
    currentLevel: overrides.currentLevel ?? LEVELS[gameState.levelIndex],
    items,
    parent: overrides.parent ?? getParentNode(gameState.fs, gameState.currentPath),
    currentItem,
    advanceLevel: overrides.advanceLevel ?? vi.fn(),
    showNotification: overrides.showNotification ?? vi.fn(),
  };
};
