import { LEVELS } from '../constants/levels';
import type { FileNode, GameState } from '../types';
import { getNodeByPath } from './fsHelpers';
import { isRecord, isValidZoxideData } from './validation';

const SESSION_KEY = 'yazi-quest-session-v1';
let sessionBlocked = false;
const OVERRIDE_PARAMS = [
  'debug',
  'ep',
  'episode',
  'lvl',
  'level',
  'mission',
  'tasks',
  'task',
  'complete',
  'startAtTask',
];

export const hasProgressOverride = (params: URLSearchParams): boolean =>
  OVERRIDE_PARAMS.some((key) => params.has(key));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const hasOptionalFieldsOfType = (
  value: Record<string, unknown>,
  keys: string[],
  type: 'string' | 'number' | 'boolean'
): boolean => keys.every((key) => value[key] === undefined || typeof value[key] === type);

const hasValidNodeMetadata = (value: Record<string, unknown>): boolean =>
  hasOptionalFieldsOfType(value, ['content', 'permissions', 'display', 'displayPath'], 'string') &&
  hasOptionalFieldsOfType(value, ['size', 'modifiedAt', 'createdAt'], 'number') &&
  hasOptionalFieldsOfType(value, ['protected', 'isHoneypot', 'isDecoy'], 'boolean') &&
  (value.parentId === undefined || value.parentId === null || typeof value.parentId === 'string') &&
  ['path', 'actualParentPath'].every(
    (key) => value[key] === undefined || isStringArray(value[key])
  );

const isFileNode = (value: unknown): value is FileNode => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string')
    return false;
  if (!['file', 'dir', 'archive'].includes(String(value.type)) || !hasValidNodeMetadata(value))
    return false;
  return (
    value.children === undefined ||
    (Array.isArray(value.children) && value.children.every(isFileNode))
  );
};

const matchesTemplate = (value: unknown, template: unknown): boolean => {
  if (template === null) return value === null;
  if (Array.isArray(template)) return Array.isArray(value);
  if (isRecord(template)) {
    return (
      isRecord(value) &&
      Object.keys(template).every((key) => matchesTemplate(value[key], template[key]))
    );
  }
  return typeof value === typeof template && (typeof value !== 'number' || Number.isFinite(value));
};

const isLevelIndex = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value < LEVELS.length;

const hasSavedPath = (fs: unknown, path: unknown): boolean =>
  isFileNode(fs) && isStringArray(path) && !!getNodeByPath(fs, path);

const hasValidLocation = (state: Record<string, unknown>): boolean =>
  isLevelIndex(state.levelIndex) &&
  isLevelIndex(state.unlockedLevelIndex) &&
  state.unlockedLevelIndex >= state.levelIndex &&
  hasSavedPath(state.fs, state.currentPath) &&
  hasSavedPath(state.levelStartFS, state.levelStartPath);

const hasValidClipboard = (value: unknown): boolean => {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return (
    ['cut', 'yank'].includes(String(value.action)) &&
    isStringArray(value.originalPath) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isFileNode)
  );
};

const hasValidProgress = (state: Record<string, unknown>): boolean => {
  if (!isRecord(state.completedTaskIds) || !isRecord(state.filters)) return false;
  return (
    Object.values(state.completedTaskIds).every(isStringArray) &&
    Object.values(state.filters).every((item) => typeof item === 'string')
  );
};

const hasValidSearch = (state: Record<string, unknown>): boolean =>
  (state.searchQuery === null || typeof state.searchQuery === 'string') &&
  Array.isArray(state.searchResults) &&
  state.searchResults.every(isFileNode);

const hasValidCollections = (state: Record<string, unknown>): boolean => {
  if (!isValidZoxideData(state.zoxideData) || !hasValidProgress(state)) return false;
  if (
    !['selectedIds', 'loadedDirIds', 'dismissedAlertIds'].every((key) => isStringArray(state[key]))
  )
    return false;
  if (
    !['history', 'future'].every(
      (key) => Array.isArray(state[key]) && state[key].every(isStringArray)
    )
  )
    return false;
  return hasValidClipboard(state.clipboard) && hasValidSearch(state);
};

const hasValidSettings = (state: Record<string, unknown>): boolean => {
  if (
    !['natural', 'alphabetical', 'modified', 'size', 'extension'].includes(String(state.sortBy)) ||
    !['asc', 'desc'].includes(String(state.sortDirection)) ||
    !['none', 'size', 'mtime', 'permissions'].includes(String(state.linemode))
  )
    return false;
  if (
    !isRecord(state.settings) ||
    typeof state.settings.soundEnabled !== 'boolean' ||
    !['full', 'reduced', 'minimal'].includes(String(state.settings.narrativeEffects))
  )
    return false;
  return (
    state.timeLeft === null ||
    (typeof state.timeLeft === 'number' && Number.isFinite(state.timeLeft))
  );
};

const hasValidChallenge = (state: Record<string, unknown>): boolean => {
  if (
    state.isGameOver &&
    !['time', 'keystrokes', 'honeypot', 'criticalFile'].includes(String(state.gameOverReason))
  )
    return false;
  if (
    !['lastHistoryBackPath', 'lastHistoryBackClipboardIds'].every(
      (key) => state[key] === undefined || state[key] === null || isStringArray(state[key])
    )
  )
    return false;
  if (
    !['gauntletPhase', 'gauntletScore', 'phaseStartTime'].every(
      (key) =>
        state[key] === undefined || (typeof state[key] === 'number' && Number.isFinite(state[key]))
    )
  )
    return false;
  return (
    state.level11Flags === undefined ||
    (isRecord(state.level11Flags) &&
      typeof state.level11Flags.triggeredHoneypot === 'boolean' &&
      typeof state.level11Flags.selectedModern === 'boolean' &&
      isStringArray(state.level11Flags.scoutedFiles))
  );
};

const isSavedState = (state: unknown, initial: GameState): state is GameState => {
  if (
    !isRecord(state) ||
    !hasValidLocation(state) ||
    !hasValidCollections(state) ||
    !hasValidSettings(state) ||
    !hasValidChallenge(state)
  )
    return false;
  const checkedSeparately: Record<string, true> = {
    fs: true,
    levelStartFS: true,
    currentPath: true,
    levelStartPath: true,
    zoxideData: true,
    completedTaskIds: true,
    filters: true,
    selectedIds: true,
    loadedDirIds: true,
    history: true,
    future: true,
    clipboard: true,
    settings: true,
    timeLeft: true,
    notification: true,
    thought: true,
    pendingOverwriteNode: true,
    deleteType: true,
    searchQuery: true,
    searchResults: true,
    alerts: true,
    dismissedAlertIds: true,
    pendingDeleteIds: true,
    lastHistoryBackPath: true,
    lastHistoryBackClipboardIds: true,
  };
  return Object.entries(initial).every(
    ([key, template]) =>
      checkedSeparately[key] || template === undefined || matchesTemplate(state[key], template)
  );
};

export const loadGameSession = (initial: GameState): GameState | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      sessionBlocked = false;
      return null;
    }
    const saved: unknown = JSON.parse(raw);
    if (
      !isRecord(saved) ||
      saved.version !== 1 ||
      !isSavedState(saved.state, initial) ||
      (saved.state.cycleCount ?? 1) !== (initial.cycleCount ?? 1)
    ) {
      sessionBlocked = true;
      return null;
    }
    sessionBlocked = false;
    return {
      ...initial,
      ...saved.state,
      unlockedLevelIndex: Math.max(initial.unlockedLevelIndex, saved.state.unlockedLevelIndex),
      mode: 'normal',
      inputBuffer: '',
      pendingDeleteIds: [],
      deleteType: null,
      pendingOverwriteNode: null,
      notification: null,
      thought: null,
      alerts: [],
      toast: undefined,
      showHelp: false,
      showMap: false,
      showHint: false,
      showInfoPanel: false,
      showHiddenWarning: false,
      showSortWarning: false,
      showFilterWarning: false,
      showSearchWarning: false,
      showThreatAlert: false,
      showSuccessToast: false,
      acceptNextKeyForSort: false,
      isBooting: false,
    };
  } catch {
    sessionBlocked = true;
    return null;
  }
};

export const saveGameSession = (state: GameState): boolean => {
  if (sessionBlocked) return false;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 1, state }));
    return true;
  } catch (error) {
    console.error('Failed to save current level', error);
    return false;
  }
};

export const resetGameSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionBlocked = false;
  } catch (error) {
    console.error('Failed to clear saved level', error);
  }
};
