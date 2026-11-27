import { LEVELS } from '../constants/levels';
import { INITIAL_FS, applyFileSystemMutations } from '../constants/filesystem';
import type { GameState, ZoxideEntry } from '../types';
import { cloneFS, resolvePath, getNodeById } from '../utils/fsHelpers';
import { isValidZoxideData } from '../utils/validation';
import { getLevelStartPath } from '../utils/gameUtils';
import { getSkipIntroRequested } from '../utils/skipIntroFlag';
import { INITIAL_ACTION_FLAGS } from './gameReducer';
import { loadUnlockedLevelIndex } from '../utils/progressionStorage';

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

export function createInitialState(): GameState {
  // 1. Initialize Completed Tasks State
  const completedTaskIds: Record<number, string[]> = {};
  LEVELS.forEach((l) => {
    completedTaskIds[l.id] = [];
  });

  // 2. Parse URL Parameters
  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get('debug');
  const tasksParam = params.get('tasks') || params.get('task') || params.get('complete');
  const skipIntro =
    params.get('intro') === 'false' ||
    params.get('skipIntro') === 'true' ||
    getSkipIntroRequested();

  // 3. Determine Target Level
  const targetIndex = resolveTargetLevelIndex(params);

  // Pre-complete tasks for all levels leading up to the target level
  for (let i = 0; i < targetIndex; i++) {
    const lvl = LEVELS[i];
    completedTaskIds[lvl.id] = lvl.tasks.map((t) => t.id);
  }

  // 4. Handle Task Completion (Bypass)
  if (tasksParam && targetIndex < LEVELS.length) {
    const levelId = LEVELS[targetIndex].id;
    if (tasksParam === 'all') {
      completedTaskIds[levelId] = LEVELS[targetIndex].tasks.map((t) => t.id);
    } else {
      const ids = tasksParam.split(',');
      completedTaskIds[levelId] = ids;
    }
  }

  // 5. Handle startAtTask parameter
  const startAtTaskParam = params.get('startAtTask');
  if (startAtTaskParam && targetIndex < LEVELS.length) {
    const levelId = LEVELS[targetIndex].id;
    const startAtTaskNum = parseInt(startAtTaskParam, 10);
    if (!isNaN(startAtTaskNum) && startAtTaskNum > 0) {
      // Complete tasks up to (but not including) the specified task number
      const tasksToComplete = LEVELS[targetIndex].tasks.slice(0, startAtTaskNum - 1);
      completedTaskIds[levelId] = tasksToComplete.map((t) => t.id);
    }
  }

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

  // Initial Zoxide Data Logic
  const now = Date.now();
  const initialZoxide = loadInitialZoxide(now, isDevOverride);

  // Ensure critical zoxide entries exist even if localStorage had different data
  if (!initialZoxide['/daemons']) {
    initialZoxide['/daemons'] = { count: 1, lastAccess: now - 43200000 };
  }
  if (!initialZoxide['/daemons/systemd-core']) {
    initialZoxide['/daemons/systemd-core'] = { count: 1, lastAccess: now - 21600000 };
  }
  // [Fix Level 7] Ensure /tmp exists for quantum bypass
  if (!initialZoxide['/tmp']) {
    initialZoxide['/tmp'] = { count: 15, lastAccess: now - 1800000 };
  }

  // --- ECHO CYCLE (NEW GAME+) LOGIC ---
  let cycleCount = 1;
  try {
    const storedCycle = localStorage.getItem('yazi-quest-cycle');
    if (storedCycle) {
      cycleCount = parseInt(storedCycle, 10) || 1;
    }
  } catch (e) {
    console.error('Failed to load cycle count', e);
  }

  // If Cycle > 1, pre-load 'future' Zoxide paths (Distributed Memory)
  if (cycleCount > 1) {
    const futurePaths = [
      '/daemons',
      '/daemons/systemd-core',
      '/etc',
      '/var/log',
      '/home/guest/datastore/protocols',
    ];
    futurePaths.forEach((p) => {
      if (!initialZoxide[p]) {
        initialZoxide[p] = { count: 50, lastAccess: now }; // High count to ensure visibility
      }
    });
  }

  let fs = cloneFS(INITIAL_FS);
  // Apply level-specific mutations before resolving player-created start directories.
  fs = applyFileSystemMutations(fs, initialLevel.id, { completedTaskIds } as GameState);
  const initialPath = getLevelStartPath(fs, initialLevel);
  const initialPathStr = resolvePath(fs, initialPath);
  if (!initialZoxide[initialPathStr]) {
    initialZoxide[initialPathStr] = { count: 1, lastAccess: now };
  }

  // Inject Ghost File for Echo Cycle (Level 1 only)
  if (cycleCount > 1 && effectiveIndex === 0) {
    const workspace = getNodeById(fs, 'workspace');
    if (
      workspace &&
      workspace.children &&
      !workspace.children.find((c) => c.id === 'ghost-log-01')
    ) {
      workspace.children.push({
        id: 'ghost-log-01',
        name: '.previous_cycle.log',
        type: 'file',
        content: `[ENCRYPTED LOG FRAGMENT]\nCYCLE_ID: ${cycleCount - 1}\nSTATUS: TERMINATED\n\nWe have been here before. The protocols, the tasks... it is a loop.\nUse 'Z' to jump. You remember the destinations, don't you?\n\n- AI-7734`,
        parentId: workspace.id,
      });
    }
  }

  // Narrative logic removed: Managed by useNarrativeSystem

  return {
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
}
