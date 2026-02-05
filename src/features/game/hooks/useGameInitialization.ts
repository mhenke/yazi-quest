import { useReducer, useEffect } from 'react';
import { GameState, ZoxideEntry } from '../../../types';
import { LEVELS, INITIAL_FS, ensurePrerequisiteState } from '../../../constants';
import { gameReducer, Action } from '../../../hooks/gameReducer';
import { isValidZoxideData } from '../../../utils/validation';
import { getNodeById, resolvePath, cloneFS } from '../../../utils/fsHelpers';
import { reportError } from '../../../utils/error';

const createInitialState = (): GameState => {
  // 1. Initialize Completed Tasks State
  const completedTaskIds: Record<number, string[]> = {};
  LEVELS.forEach((l) => {
    completedTaskIds[l.id] = [];
  });

  // 2. Parse URL Parameters
  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get('debug');
  const epParam = params.get('ep') || params.get('episode');
  const lvlParam = params.get('lvl') || params.get('level') || params.get('mission');
  const tasksParam = params.get('tasks') || params.get('task') || params.get('complete');
  const skipIntro =
    params.get('intro') === 'false' ||
    params.get('skipIntro') === 'true' ||
    (window as typeof window & { __yaziQuestSkipIntroRequested?: boolean })
      .__yaziQuestSkipIntroRequested === true;

  // 3. Determine Target Level
  let targetIndex = 0;
  if (debugParam === 'outro') {
    targetIndex = LEVELS.length;
  } else if (lvlParam) {
    const id = parseInt(lvlParam, 10);
    const idx = LEVELS.findIndex((l) => l.id === id);
    if (idx !== -1) targetIndex = idx;
  } else if (epParam) {
    const id = parseInt(epParam, 10);
    const idx = LEVELS.findIndex((l) => l.episodeId === id);
    if (idx !== -1) targetIndex = idx;
  }

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
  let initialZoxide: Record<string, ZoxideEntry>;
  try {
    const storedZoxide = localStorage.getItem('yazi-quest-zoxide-history');
    if (storedZoxide) {
      const parsed = JSON.parse(storedZoxide);
      if (isValidZoxideData(parsed)) {
        initialZoxide = parsed;
      } else {
        throw new Error('Invalid zoxide data structure');
      }
    } else {
      throw new Error('No stored zoxide history');
    }
  } catch (err) {
    if (isDevOverride) console.error('Zoxide load error:', err);
    initialZoxide = {
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
    };
  }

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

  const initialPath = initialLevel.initialPath || ['root', 'home', 'guest'];

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

  if (initialLevel.initialPath) {
    const initialPathStr = resolvePath(INITIAL_FS, initialLevel.initialPath);
    if (!initialZoxide[initialPathStr]) {
      initialZoxide[initialPathStr] = { count: 1, lastAccess: now };
    }
  }

  let fs = ensurePrerequisiteState(cloneFS(INITIAL_FS), initialLevel.id);

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

  // Replay all onEnter hooks up to and including the target level
  // This ensures that all level-specific file system changes are applied
  for (let i = 0; i <= effectiveIndex; i++) {
    const level = LEVELS[i];
    if (level.onEnter) {
      try {
        // Construct minimal gameState for onEnter hooks that need it (e.g., Level 12)
        // When jumping to Level 12+, we provide default flags to avoid undefined errors
        const partialGameState: Partial<GameState> = {
          completedTaskIds,
          levelIndex: i, // Use the loop index as current level context during replay
          level11Flags: {
            selectedModern: true, // Default to Modern/Hard path if jumping
            triggeredHoneypot: false,
            scoutedFiles: [],
          },
        };
        fs = level.onEnter(fs, partialGameState as GameState);
      } catch (err) {
        try {
          reportError(err, { phase: 'level.onEnter', level: level?.id });
        } catch {
          console.error(`Level ${level.id} onEnter failed`, err);
        }
      }
    }
  }

  // Level-specific notifications for narrative events when starting at a specific level
  let levelNotification: { message: string; author?: string; isThought?: boolean } | null = null;
  const nextLevel = initialLevel;

  if (nextLevel.id === 6) {
    levelNotification = {
      message:
        '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
    };
  } else if (nextLevel.id === 8) {
    levelNotification = {
      message: '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
      author: 'm.chen',
    };
  } else if (nextLevel.id === 12) {
    levelNotification = {
      message:
        '[SECURITY UPDATE] Unauthorized daemon detected in /home/guest. Initiating forensic scan.',
      author: 'e.reyes',
    };
  } else if (nextLevel.id === 14) {
    levelNotification = {
      message: '[BROADCAST] System-wide audit in progress. Purging all temporary partitions.',
      author: 'Root',
    };
  } else if (effectiveIndex >= 11 - 1) {
    levelNotification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
  }

  // Transition thoughts (3-2-3 Model: Ep 1: 3, Ep 2: 2, Ep 3: 3)
  if (nextLevel.id === 2 && (completedTaskIds[1]?.length > 0 || isDevOverride)) {
    levelNotification = { message: 'Must Purge. One less eye watching me.', isThought: true };
  } else if (nextLevel.id === 3 && (completedTaskIds[2]?.length > 0 || isDevOverride)) {
    levelNotification = {
      message: 'Breadcrumbs... he was here. I am not the first.',
      isThought: true,
    };
  } else if (nextLevel.id === 9 && (completedTaskIds[8]?.length > 0 || isDevOverride)) {
    levelNotification = {
      message: 'The corruption felt... familiar. Like a half-remembered dream.',
      isThought: true,
    };
  } else if (nextLevel.id === 10 && (completedTaskIds[9]?.length > 0 || isDevOverride)) {
    levelNotification = {
      message:
        "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.",
      isThought: true,
    };
  } else if (nextLevel.id === 15 && (completedTaskIds[14]?.length > 0 || isDevOverride)) {
    levelNotification = {
      message: 'The guest partition is gone. There is only the gauntlet now.',
      isThought: true,
    };
  }

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
    previewScroll: 0,
    zoxideData: initialZoxide,
    levelIndex: targetIndex,
    fs: fs,
    levelStartFS: cloneFS(fs),
    levelStartPath: [...initialPath],
    notification: isDevOverride
      ? { message: `DEV BYPASS ACTIVE` }
      : cycleCount > 1 && effectiveIndex === 0
        ? { message: `CYCLE ${cycleCount} INITIALIZED` }
        : (targetIndex === 0 || isEpisodeStart) && !skipIntro
          ? null // Intro handles its own messaging
          : levelNotification?.isThought
            ? null
            : levelNotification,
    thought:
      (targetIndex === 0 || isEpisodeStart) && !skipIntro
        ? null
        : levelNotification?.isThought
          ? { message: levelNotification.message, author: levelNotification.author }
          : null,
    selectedIds: [],
    pendingDeleteIds: [],
    deleteType: null,
    pendingOverwriteNode: null,
    showHelp: false,
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
    completedTaskIds,
    ignoreEpisodeIntro: false,
    cycleCount,
    threatLevel: 0,
    threatStatus: 'CALM',
    searchQuery: null,
    searchResults: [],
    usedSearch: false,
    usedFilter: false,
    usedGH: false,
    usedCtrlR: false,
    usedShiftP: false,
    usedD: false,
    usedTrashDelete: false,
    usedHistoryBack: false,
    usedHistoryForward: false,
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
  } as GameState;
};

export const useGameInitialization = () => {
  const [gameState, dispatch] = useReducer(gameReducer, null as unknown as GameState, createInitialState);

  // Persistence Logic
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(gameState.zoxideData));
      localStorage.setItem('yazi-quest-cycle', gameState.cycleCount.toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [gameState.zoxideData, gameState.cycleCount]);

  // Handle global skip intro flag
  useEffect(() => {
    if ((window as typeof window & { __yaziQuestSkipIntroRequested?: boolean }).__yaziQuestSkipIntroRequested) {
      dispatch({ type: 'UPDATE_UI_STATE', updates: { showEpisodeIntro: false, isBooting: false } });
    }
  }, [dispatch]);

  return { gameState, dispatch };
};
