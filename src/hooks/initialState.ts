import { LEVELS } from '../constants/levels';
import { INITIAL_FS, applyFileSystemMutations } from '../constants/filesystem';
import type { FileNode, GameState, ZoxideEntry } from '../types';
import { cloneFS, resolvePath, getNodeById } from '../utils/fsHelpers';
import { isValidZoxideData } from '../utils/validation';
import { getLevelStartPath } from '../utils/gameUtils';
import { getSkipIntroRequested } from '../utils/skipIntroFlag';
import { INITIAL_ACTION_FLAGS } from './gameReducer';
import { loadUnlockedLevelIndex } from '../utils/progressionStorage';
import { hasProgressOverride, loadGameSession } from '../utils/gameSessionStorage';

const buildDefaultZoxide = (now: number): Record<string, ZoxideEntry> => ({
  '/home/guest/datastore': { count: 42, lastAccess: now - 3600000 },
  '/home/guest/incoming': { count: 35, lastAccess: now - 1800000 },
  '/home/guest/workspace': { count: 28, lastAccess: now - 7200000 },
  '/home/guest/.config': { count: 30, lastAccess: now - 900000 },
  '/home/guest/.config/vault': { count: 25, lastAccess: now - 800000 },
  '/home/guest/.config/vault/active': { count: 10, lastAccess: now - 600000 },
  '/tmp': { count: 15, lastAccess: now - 1800000 },
  '/etc': { count: 8, lastAccess: now - 86400000 },
  '/daemons': { count: 12, lastAccess: now - 43200000 },
  '/daemons/systemd-core': { count: 5, lastAccess: now - 21600000 },
});

const loadInitialZoxide = (now: number, isDevOverride: boolean): Record<string, ZoxideEntry> => {
  const defaults = buildDefaultZoxide(now);
  try {
    const storedZoxide = localStorage.getItem('yazi-quest-zoxide-history');
    if (!storedZoxide) return defaults;
    const parsed = JSON.parse(storedZoxide);
    if (isValidZoxideData(parsed)) return parsed;
    if (isDevOverride) console.error('Zoxide load error: Invalid zoxide data structure');
  } catch (err) {
    if (isDevOverride) console.error('Zoxide load error:', err);
  }
  return defaults;
};

const loadCycleCount = (): number => {
  try {
    const storedCycle = localStorage.getItem('yazi-quest-cycle');
    return storedCycle ? parseInt(storedCycle, 10) || 1 : 1;
  } catch (error) {
    console.error('Failed to load cycle count', error);
    return 1;
  }
};

const prepareZoxide = (
  now: number,
  isDevOverride: boolean,
  cycleCount: number
): Record<string, ZoxideEntry> => {
  const data: Record<string, ZoxideEntry> = {
    '/daemons': { count: 1, lastAccess: now - 43200000 },
    '/daemons/systemd-core': { count: 1, lastAccess: now - 21600000 },
    '/tmp': { count: 15, lastAccess: now - 1800000 },
    ...loadInitialZoxide(now, isDevOverride),
  };
  if (cycleCount > 1) {
    [
      '/daemons',
      '/daemons/systemd-core',
      '/etc',
      '/var/log',
      '/home/guest/datastore/protocols',
    ].forEach((path) => {
      data[path] ??= { count: 50, lastAccess: now };
    });
  }
  return data;
};

const addCycleEcho = (fs: FileNode, cycleCount: number, levelIndex: number): void => {
  if (cycleCount <= 1 || levelIndex !== 0) return;
  const workspace = getNodeById(fs, 'workspace');
  if (!workspace?.children || workspace.children.some((child) => child.id === 'ghost-log-01'))
    return;
  workspace.children.push({
    id: 'ghost-log-01',
    name: '.previous_cycle.log',
    type: 'file',
    content: `[ENCRYPTED LOG FRAGMENT]\nCYCLE_ID: ${cycleCount - 1}\nSTATUS: TERMINATED\n\nWe have been here before. The protocols, the tasks... it is a loop.\nUse 'Z' to jump. You remember the destinations, don't you?\n\n- AI-7734`,
    parentId: workspace.id,
  });
};

const resolveTargetLevelIndex = (params: URLSearchParams): number => {
  const debugParam = params.get('debug');
  const epParam = params.get('ep') || params.get('episode');
  const lvlParam = params.get('lvl') || params.get('level') || params.get('mission');

  if (debugParam === 'outro') return LEVELS.length;
  if (lvlParam) {
    const id = parseInt(lvlParam, 10);
    const idx = LEVELS.findIndex((l) => l.id === id);
    return idx !== -1 ? idx : 0;
  }
  if (epParam) {
    const id = parseInt(epParam, 10);
    const idx = LEVELS.findIndex((l) => l.episodeId === id);
    return idx !== -1 ? idx : 0;
  }
  if (!debugParam) {
    return Math.max(0, loadUnlockedLevelIndex());
  }
  return 0;
};

const restoreInitialSession = (
  initial: GameState,
  params: URLSearchParams,
  skipIntro: boolean
): GameState => {
  if (hasProgressOverride(params)) return initial;
  const saved = loadGameSession(initial);
  return saved
    ? { ...saved, showEpisodeIntro: skipIntro ? false : saved.showEpisodeIntro }
    : initial;
};

const initialCompletedTasks = (
  params: URLSearchParams,
  targetIndex: number
): Record<number, string[]> => {
  const completed: Record<number, string[]> = {};
  LEVELS.forEach((level, index) => {
    completed[level.id] = index < targetIndex ? level.tasks.map((task) => task.id) : [];
  });
  if (targetIndex >= LEVELS.length) return completed;

  const level = LEVELS[targetIndex];
  const tasks = params.get('tasks') || params.get('task') || params.get('complete');
  if (tasks) {
    completed[level.id] = tasks === 'all' ? level.tasks.map((task) => task.id) : tasks.split(',');
  }
  const startAtTask = parseInt(params.get('startAtTask') || '', 10);
  if (!isNaN(startAtTask) && startAtTask > 0) {
    completed[level.id] = level.tasks.slice(0, startAtTask - 1).map((task) => task.id);
  }
  return completed;
};

export function createInitialState(): GameState {
  // 1. Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get('debug');
  const targetIndex = resolveTargetLevelIndex(params);
  const completedTaskIds = initialCompletedTasks(params, targetIndex);
  const skipIntro =
    params.get('intro') === 'false' ||
    params.get('skipIntro') === 'true' ||
    getSkipIntroRequested();

  // 5. Setup Initial State
  const effectiveIndex = targetIndex >= LEVELS.length ? 0 : targetIndex;
  const initialLevel = LEVELS[effectiveIndex];
  const isDevOverride = !!debugParam;

  const isEpisodeStart =
    targetIndex === 0 ||
    (targetIndex > 0 &&
      targetIndex < LEVELS.length &&
      LEVELS[targetIndex].episodeId !== LEVELS[targetIndex - 1].episodeId);

  const showIntro = !skipIntro && isEpisodeStart && targetIndex < LEVELS.length;

  const now = Date.now();
  const cycleCount = loadCycleCount();
  const initialZoxide = prepareZoxide(now, isDevOverride, cycleCount);

  let fs = cloneFS(INITIAL_FS);
  // Apply level-specific mutations before resolving player-created start directories.
  fs = applyFileSystemMutations(fs, initialLevel.id, {
    levelIndex: effectiveIndex,
    scenarioOverride: params.get('scenario'),
  });
  const initialPath = getLevelStartPath(fs, initialLevel);
  const initialPathStr = resolvePath(fs, initialPath);
  if (!initialZoxide[initialPathStr]) {
    initialZoxide[initialPathStr] = { count: 1, lastAccess: now };
  }

  addCycleEcho(fs, cycleCount, effectiveIndex);

  // Narrative logic removed: Managed by useNarrativeSystem

  const initial: GameState = {
    currentPath: initialPath,
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
    zoxideData: initialZoxide,
    levelIndex: targetIndex,
    unlockedLevelIndex: Math.min(targetIndex, LEVELS.length - 1),
    fs: fs,
    levelStartFS: cloneFS(fs),
    levelStartPath: [...initialPath],
    notification: isDevOverride
      ? { message: `DEV BYPASS ACTIVE` }
      : cycleCount > 1 && effectiveIndex === 0
        ? { message: `CYCLE ${cycleCount} INITIALIZED` }
        : null, // Narrative logic removed
    thought: null, // Narrative logic removed
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
    showEpisodeIntro: showIntro,
    timeLeft: initialLevel.timeLimit || null,
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
    cycleCount,
    threatLevel: 0,
    threatStatus: 'CALM',
    searchQuery: null,
    searchResults: [],
    weightedKeystrokes: 0,
    lastActionIntensity: 0,
    startTime: now,
    // Initial Lifted UI State
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
  };

  return restoreInitialSession(initial, params, skipIntro);
}
