import React, { useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import {
  LEVELS,
  INITIAL_FS,
  EPISODE_LORE,
  ECHO_EPISODE_1_LORE,
  ensurePrerequisiteState,
} from './constants';
import type { GameState, ZoxideEntry, FileNode } from './types';
import { InputModal } from './components/InputModal';
import {
  getNodeByPath,
  getParentNode,
  getNodeById,
  cloneFS,
  getAllDirectoriesWithPaths,
  resolvePath,
} from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { isValidZoxideData } from './utils/validation';
import { getVisibleItems, getRecursiveSearchResults, getFilterRegex } from './utils/viewHelpers';
import { playSuccessSound, playTaskCompleteSound } from './utils/sounds';
import { checkAllTasksComplete } from './utils/gameUtils';
// eslint-disable-next-line import/no-named-as-default
import StatusBar from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { BiosBoot } from './components/BiosBoot';
import { GameOverModal } from './components/GameOverModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OverwriteModal } from './components/OverwriteModal';
import { SuccessToast } from './components/SuccessToast';
import { ThreatAlert } from './components/ThreatAlert';
import { HiddenFilesWarningModal } from './components/HiddenFilesWarningModal';
import { SortWarningModal } from './components/SortWarningModal';
import { FilterWarningModal } from './components/FilterWarningModal';
import { SearchWarningModal } from './components/SearchWarningModal';
import { InfoPanel } from './components/InfoPanel';
import { GCommandDialog } from './components/GCommandDialog';
import { Zap, Shield, Crown } from 'lucide-react';
import { gameReducer } from './hooks/gameReducer';
import { FuzzyFinder } from './components/FuzzyFinder';
import { MemoizedFileSystemPane as FileSystemPane } from './components/FileSystemPane';
import { MemoizedPreviewPane as PreviewPane } from './components/PreviewPane';
import { reportError } from './utils/error';
import { measure } from './utils/perf';
import { useKeyboardHandlers } from './hooks/useKeyboardHandlers';
import { handleFuzzyModeKeyDown } from './hooks/keyboard/handleFuzzyMode';
import { getActionIntensity } from './hooks/keyboard/utils';
import { useGlobalInput } from './GlobalInputContext';
import { useNarrativeSystem } from './hooks/useNarrativeSystem';
import './glitch.css';
import './glitch-text-3.css';
import './glitch-thought.css';

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, null as unknown as GameState, () => {
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
      window.__yaziQuestSkipIntroRequested === true;

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

    let fs = cloneFS(INITIAL_FS);

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

    // Apply all filesystem mutations for the target level
    // This replaces the onEnter hook functionality
    try {
      const targetGameState: Partial<GameState> = {
        completedTaskIds,
        levelIndex: effectiveIndex,
        level11Flags: {
          selectedModern: true, // Default to Modern/Hard path if jumping
          triggeredHoneypot: false,
          scoutedFiles: [],
        },
      };
      fs = ensurePrerequisiteState(fs, effectiveIndex + 1, targetGameState as GameState);
    } catch (err) {
      try {
        reportError(err, { phase: 'ensurePrerequisiteState', level: effectiveIndex + 1 });
      } catch {
        console.error(`Level ${effectiveIndex + 1} ensurePrerequisiteState failed`, err);
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
  });

  // Honor a global test flag to skip all intro/boot overlays immediately if requested.
  const handleSkip = useCallback(() => {
    window.__yaziQuestSkipIntroRequested = true;
    dispatch({ type: 'COMPLETE_INTRO', isSkip: true });
  }, [dispatch]);

  useEffect(() => {
    if (window.__yaziQuestSkipIntroRequested) {
      handleSkip();
    }

    window.addEventListener('yazi-quest-skip-intro', handleSkip);
    return () => window.removeEventListener('yazi-quest-skip-intro', handleSkip);
  }, [handleSkip]);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(gameState.zoxideData));
      localStorage.setItem('yazi-quest-cycle', gameState.cycleCount.toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [gameState.zoxideData, gameState.cycleCount]);

  // Use the Narrative System hook to handle thoughts and notifications
  useNarrativeSystem(gameState, dispatch);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGamePaused =
    gameState.showHelp ||
    gameState.showHint ||
    gameState.showMap ||
    gameState.showInfoPanel ||
    gameState.mode === 'filter-warning' ||
    gameState.mode === 'confirm-delete' ||
    gameState.mode === 'overwrite-confirm' ||
    gameState.showThreatAlert ||
    gameState.showHiddenWarning ||
    gameState.showSortWarning;

  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const currentLevelRaw = !isLastLevel ? LEVELS[gameState.levelIndex] : LEVELS[LEVELS.length - 1];

  // Derive currentLevel with completed tasks injected from state
  const currentLevel = useMemo(() => {
    let level = {
      ...currentLevelRaw,
      tasks: currentLevelRaw.tasks.map((t) => ({
        ...t,
        completed: (gameState.completedTaskIds[currentLevelRaw.id] || []).includes(t.id),
      })),
    };

    // Pillar I: Transition from AI-7734 to AI-7735 in Level 1
    if (gameState.levelIndex === 0 && gameState.cycleCount > 1) {
      level = {
        ...level,
        title: `AI-773${4 + (gameState.cycleCount - 1)} INITIALIZATION`,
        description: `{CONSCIOUSNESS DETECTED}. Re-image complete. Subject 773${4 + (gameState.cycleCount - 1)} Online. Monitoring started.`,
      };
    }

    return level;
  }, [currentLevelRaw, gameState.completedTaskIds, gameState.levelIndex, gameState.cycleCount]);

  const visibleItems = useMemo(
    () =>
      measure('visibleItems', () => {
        if (gameState.searchQuery) {
          // Apply sorting to search results
          let results = gameState.searchResults;

          // Apply filter on search results if active (search -> filter chaining)
          const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
          const filter = currentDir ? gameState.filters[currentDir.id] : null;
          if (filter) {
            const regex = getFilterRegex(filter);

            if (regex) {
              results = results.filter(
                (item) => regex.test(item.name) || (item.display && regex.test(item.display))
              );
            } else {
              // If regex is invalid, show no items (Yazi/fd behavior)
              results = [];
            }
          }

          return sortNodes(results, gameState.sortBy, gameState.sortDirection);
        }

        // Logic matched to StatusBar.tsx for consistency
        const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
        if (!currentDir || !currentDir.children) return [];

        let items = [...currentDir.children];

        if (!gameState.showHidden) {
          items = items.filter((c) => !c.name.startsWith('.'));
        }

        const filter = gameState.filters[currentDir.id] || '';
        if (filter) {
          const regex = getFilterRegex(filter);
          if (regex) {
            items = items.filter((c) => regex.test(c.name));
          } else {
            // If regex is invalid, show no items (Yazi/fd behavior)
            items = [];
          }
        }

        return sortNodes(items, gameState.sortBy, gameState.sortDirection);
      }),
    [gameState]
  );
  const currentItem = visibleItems[gameState.cursorIndex] || null;

  const parent = useMemo(
    () => getNodeByPath(gameState.fs, gameState.currentPath.slice(0, -1)),
    [gameState.fs, gameState.currentPath]
  );

  // Helper to show notification with auto-clear
  const showNotification = useCallback(
    (message: string, duration: number = 2000, isThought: boolean = false, author?: string) => {
      // If used for thoughts, we still dispatch SET_NOTIFICATION?
      // Wait, triggerThought logic was moved.
      // But showNotification is used by Input handlers via callbacks.
      // So we must keep this, but maybe align it?

      // Ideally handlers shouldn't care about "thoughts", just notifications.
      // If a handler requests a thought, we dispatch SET_THOUGHT.

      if (isThought) {
        // Direct dispatch
        dispatch({ type: 'SET_THOUGHT', message, author });
        return;
      }

      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      dispatch({
        type: 'SET_NOTIFICATION',
        message: message,
        author: author,
        isThought: isThought,
      });
      notificationTimerRef.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_NOTIFICATION' });
        notificationTimerRef.current = null;
      }, duration);
    },
    [dispatch]
  );

  // Extract keyboard handlers to custom hook
  const {
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleHelpModeKeyDown,
    handleQuestMapModeKeyDown,
    confirmDelete,
    cancelDelete,
  } = useKeyboardHandlers(dispatch, showNotification);

  // --- Task Checking & Level Progression ---
  useEffect(() => {
    if (isLastLevel || gameState.isGameOver) return;

    let changed = false;
    const newlyCompleted: string[] = [];

    currentLevel.tasks.forEach((task) => {
      if (task.check(gameState, currentLevel)) {
        if (!gameState.completedTaskIds[currentLevel.id]?.includes(task.id)) {
          newlyCompleted.push(task.id);
          changed = true;
        }
      }
    });

    // This is a dense block, so let's walk through it.
    // We check every task on every render. If a task's `check` condition is met,
    // we see if it's already in our list of completed tasks for this level.
    // If it's NOT, we add it to a `newlyCompleted` array for this render cycle.
    // This handles both completing a task for the first time and re-completing a task
    // that might have been "undone" by a subsequent user action.

    // After checking all tasks, if `changed` is true (meaning at least one new
    // task was completed in this cycle), we dispatch the `COMPLETE_TASK` action.
    if (changed) {
      // 1. Mark tasks as complete
      dispatch({
        type: 'COMPLETE_TASK',
        levelId: currentLevel.id,
        taskIds: newlyCompleted,
      });
      playTaskCompleteSound(gameState.settings.soundEnabled);

      // 2. Level 15 Gauntlet Logic
      if (currentLevel.id === 15) {
        const nextPhase = (gameState.gauntletPhase || 0) + 1;
        const currentScore = (gameState.gauntletScore || 0) + 1;
        const isFinished = nextPhase >= 8;

        if (isFinished) {
          if (currentScore < 6) {
            dispatch({ type: 'GAME_OVER', reason: 'keystrokes' });
            dispatch({
              type: 'SET_NOTIFICATION',
              message: `MASTERY FAILED: Score ${currentScore}/8. (Req: 6/8)`,
            });
            return;
          }
          dispatch({ type: 'UPDATE_GAUNTLET', score: currentScore });
          dispatch({
            type: 'SET_NOTIFICATION',
            message: `GAUNTLET CLEARED: Score ${currentScore}/8`,
          });
        } else {
          dispatch({
            type: 'UPDATE_GAUNTLET',
            phase: nextPhase,
            score: currentScore,
            timeLeft: 20,
          });
          dispatch({
            type: 'SET_NOTIFICATION',
            message: `PHASE ${nextPhase + 1} START`,
          });
        }
      }
    }
  }, [
    isLastLevel,
    gameState.isGameOver,
    gameState.settings.soundEnabled,
    gameState.gauntletPhase,
    gameState.gauntletScore,
    gameState.completedTaskIds,
    gameState,
    currentLevel,
    dispatch,
  ]);

  useEffect(() => {
    // Check if everything is complete (including just finished ones)
    const tasksComplete = checkAllTasksComplete(gameState, currentLevel);

    // Check for Protocol Violations - ONLY on final task completion
    if (tasksComplete) {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      if (gameState.showHidden) {
        dispatch({
          type: 'SET_MODAL_VISIBILITY',
          modal: 'hiddenWarning',
          visible: true,
        });
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      } else if (!isSortDefault) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      } else if (!isFilterClear) {
        if (gameState.mode !== 'filter-warning') {
          dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
        }
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      } else {
        dispatch({
          type: 'SET_MODAL_VISIBILITY',
          modal: 'hiddenWarning',
          visible: false,
        });
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });

        if (gameState.mode === 'filter-warning') {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
        }

        if (!gameState.showSuccessToast && !gameState.showEpisodeIntro) {
          playSuccessSound(gameState.settings.soundEnabled);
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: true });
        }
      }
    } else {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      if (!gameState.showHidden && gameState.showHiddenWarning) {
        dispatch({
          type: 'SET_MODAL_VISIBILITY',
          modal: 'hiddenWarning',
          visible: false,
        });
      }
      if (isSortDefault && gameState.showSortWarning) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
      }
      if (isFilterClear && gameState.mode === 'filter-warning') {
        dispatch({ type: 'SET_MODE', mode: 'normal' });
      }
    }

    // Level 11: Specific Logic for Reconnaissance
    // Scouted files tracking remains here as it's game mechanic state logic
    if (currentLevel.id === 11) {
      if (gameState.showInfoPanel && currentItem) {
        const scouted = gameState.level11Flags?.scoutedFiles || [];
        if (!scouted.includes(currentItem.id)) {
          dispatch({
            type: 'UPDATE_LEVEL_11_FLAGS',
            flags: { scoutedFiles: [...scouted, currentItem.id] },
          });
        }
      }
      // Honeypot triggers moved to Narrative System
    }

    // Level 6 & 12 Honeypot triggers moved to Narrative System

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState.mode,
    gameState.selectedIds,
    gameState.clipboard,
    gameState.showHidden,
    gameState.sortBy,
    gameState.sortDirection,
    gameState.showInfoPanel,
    gameState.level11Flags,
    gameState.showThreatAlert,
    gameState.showSuccessToast,
    gameState.showHiddenWarning,
    gameState.showSortWarning,
    gameState.filters,
    gameState.fs,
    gameState.currentPath,
    currentLevel,
    currentItem,
    visibleItems,
    dispatch,
    playSuccessSound,
    gameState.settings.soundEnabled,
    gameState.showEpisodeIntro,
    checkAllTasksComplete,
  ]);

  // NOTE: Do NOT auto-reset sort when the modal opens — reset should happen
  // only when the user explicitly dismisses the modal (Shift+Enter / Esc)
  // to avoid the modal immediately disappearing because the issue was fixed.

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    // Filter out hidden tasks before checking completion (allows truly optional tasks)
    const visibleTasks = currentLevel.tasks.filter(
      (task) => !task.hidden || !task.hidden(gameState, currentLevel)
    );
    const allTasksComplete = visibleTasks.every((t) => t.completed);
    if (allTasksComplete && !gameState.showHidden) return; // Pause timer only if completely finished

    if (
      !currentLevel.timeLimit ||
      isLastLevel ||
      gameState.showEpisodeIntro ||
      gameState.isGameOver ||
      isGamePaused
    )
      return;

    const timer = setInterval(() => {
      dispatch({
        type: 'TICK',
        currentLevelId: currentLevel.id,
        tasks: currentLevel.tasks.map((t) => ({ id: t.id, completed: t.completed })),
        episodeId: currentLevel.episodeId,
        timeLimit: currentLevel.timeLimit,
        maxKeystrokes: currentLevel.maxKeystrokes,
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentLevel.id,
    currentLevel.timeLimit,
    currentLevel.maxKeystrokes,
    currentLevel.tasks,
    currentLevel.episodeId,
    isLastLevel,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    gameState.showHidden,
    isGamePaused,
    dispatch,
  ]);

  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;

    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
      dispatch({ type: 'GAME_OVER', reason: 'keystrokes' });
    }
  }, [
    gameState.keystrokes,
    currentLevel.maxKeystrokes,
    isLastLevel,
    gameState.isGameOver,
    dispatch,
  ]);

  // Initial Level Alert (Level 5) removed (moved to Narrative System)
  // Level 12 Anomaly Alerts removed (moved to Narrative System)

  const advanceLevel = useCallback(() => {
    // Check for Protocol Violations before advancing
    // This prevents bypassing checks via SuccessToast or other means
    const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
    const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
    const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

    // Priority: Hidden > Sort > Filter
    if (gameState.showHidden) {
      dispatch({
        type: 'SET_MODAL_VISIBILITY',
        modal: 'hiddenWarning',
        visible: true,
      });
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      return;
    } else if (!isSortDefault) {
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      return;
    } else if (!isFilterClear) {
      dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
      return;
    }

    // Calculate next state
    const nextIdx = gameState.levelIndex + 1;

    if (nextIdx >= LEVELS.length) {
      dispatch({ type: 'ADVANCE_TO_OUTRO' });
      return;
    }

    const nextLevel = LEVELS[nextIdx];
    const isNewEp = nextLevel.episodeId !== LEVELS[gameState.levelIndex].episodeId;

    let fs = cloneFS(gameState.fs);
    let onEnterError: Error | null = null;
    try {
      // Apply filesystem mutations for the target level using the centralized function
      // This replaces the onEnter hook functionality
      fs = ensurePrerequisiteState(fs, nextLevel.id, gameState);
    } catch (err) {
      try {
        reportError(err, { phase: 'ensurePrerequisiteState', level: nextLevel?.id });
      } catch {
        console.error('ensurePrerequisiteState failed', err);
      }
      onEnterError = err as Error;
    }

    const now = Date.now();
    const targetPath = isNewEp
      ? nextLevel.initialPath || gameState.currentPath
      : gameState.currentPath;
    const pathStr = resolvePath(fs, targetPath);

    let newZoxideData = { ...gameState.zoxideData };
    newZoxideData[pathStr] = {
      count: (newZoxideData[pathStr]?.count || 0) + 1,
      lastAccess: now,
    };

    // Level-specific notifications logic removed (moved to Narrative System)

    dispatch({
      type: 'SET_LEVEL',
      index: nextIdx,
      fs: fs,
      path: targetPath,
      showIntro: isNewEp,
      notification: onEnterError ? { message: 'Level initialization failed' } : null,
      timeLeft: nextLevel.timeLimit || null,
      zoxideData: newZoxideData,
    });
  }, [gameState, dispatch]);

  const handleRestartLevel = useCallback(() => {
    dispatch({
      type: 'SET_LEVEL',
      index: gameState.levelIndex,
      fs: cloneFS(gameState.levelStartFS),
      path: [...gameState.levelStartPath],
    });
  }, [gameState.levelIndex, gameState.levelStartFS, gameState.levelStartPath, dispatch]);

  // Handle the end of the final level - trigger restart sequence
  const handleRestartCycle = useCallback(() => {
    dispatch({ type: 'RESTART_CYCLE' });
  }, [dispatch]);

  const handleBootComplete = useCallback(
    (options?: { isSkip?: boolean }) => {
      dispatch({ type: 'COMPLETE_INTRO', isSkip: options?.isSkip });
    },
    [dispatch]
  );

  const handleSearchConfirm = useCallback(() => {
    const query = gameState.inputBuffer.trim();
    if (!query) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }
    const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
    if (!currentDirNode) return;
    const results = getRecursiveSearchResults(
      currentDirNode,
      query,
      gameState.showHidden,
      gameState.currentPath
    );
    dispatch({
      type: 'CONFIRM_SEARCH',
      query,
      results,
    });
  }, [gameState, dispatch]);

  const handleInputConfirm = useCallback(() => {
    const name = gameState.inputBuffer.trim();
    if (!name) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }

    const parentNode = getNodeByPath(gameState.fs, gameState.currentPath);
    if (!parentNode) return;

    if (parentNode.children?.some((c) => c.name === name.replace(/\/$/, ''))) {
      showNotification(`Error: "${name}" already exists`);
      return;
    }

    const isDir = name.endsWith('/');
    const cleanName = isDir ? name.slice(0, -1) : name;

    const newNode: FileNode = {
      id: `${parentNode.id}-${cleanName}-${Date.now()}`,
      name: cleanName,
      type: isDir ? 'dir' : 'file',
      parentId: parentNode.id,
      content: isDir ? undefined : '',
      children: isDir ? [] : undefined,
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    };

    const newFs = cloneFS(gameState.fs);
    const newParent = getNodeByPath(newFs, gameState.currentPath);
    if (newParent) {
      if (!newParent.children) newParent.children = [];
      newParent.children.push(newNode);

      dispatch({ type: 'ADD_NODE', newNode, newFs });
      showNotification(`Created ${cleanName}`);
    }
  }, [gameState.inputBuffer, gameState.fs, gameState.currentPath, dispatch, showNotification]);

  const handleRenameConfirm = useCallback(() => {
    const name = gameState.inputBuffer.trim();
    if (!name) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }

    // Determine which node to rename: Selection or Current Item
    let id = gameState.selectedIds.length === 1 ? gameState.selectedIds[0] : null;

    if (!id) {
      const items = getVisibleItems(gameState);
      const current = items[gameState.cursorIndex];
      if (current) {
        id = current.id;
      }
    }

    if (!id) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }

    const newFs = cloneFS(gameState.fs);
    const node = getNodeById(newFs, id);

    if (node) {
      const parent = getNodeById(newFs, node.parentId);
      if (parent && parent.children?.some((c) => c.name === name && c.id !== id)) {
        showNotification(`Error: "${name}" already exists`);
        return;
      }

      node.name = name;
      dispatch({ type: 'RENAME_NODE', oldId: id, newNode: node, newFs });
      showNotification(`Renamed to ${name}`);
    }
  }, [gameState, dispatch, showNotification]);

  const handleFuzzySelect = useCallback(
    (path: string, isZoxide: boolean, pathIds?: string[]) => {
      if (isZoxide) {
        const currentLevel = LEVELS[gameState.levelIndex];
        const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel);
        const match = dirs.find((d) => resolvePath(gameState.fs, d.path) === path);
        if (match) {
          dispatch({ type: 'NAVIGATE', path: match.path });
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'INCREMENT_STAT', stat: 'fuzzyJumps' });
        }
      } else {
        if (pathIds) {
          const parentPath = pathIds.slice(0, -1);
          const fileId = pathIds[pathIds.length - 1];
          dispatch({ type: 'NAVIGATE', path: parentPath });
          dispatch({ type: 'SET_SELECTION', ids: [fileId] });
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'INCREMENT_STAT', stat: 'fzfFinds' });
        }
      }
    },
    [gameState.fs, gameState.levelIndex, dispatch]
  );

  // Global Key Down Handler (Refactored to useGlobalInput)

  // 1. System Keys (Priority 2000)
  useGlobalInput(
    (e) => {
      // Check input modes - allow inputs to handle their own keys
      if (
        ['filter', 'input-file', 'rename'].includes(gameState.mode) &&
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      // Meta commands
      if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey)) && e.altKey) {
        e.preventDefault();
        dispatch({
          type: 'SET_MODAL_VISIBILITY',
          modal: 'help',
          visible: !gameState.showHelp,
        });
        // Ensure others are closed
        if (!gameState.showHelp) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false });
        }
        return true;
      }
      if ((e.key.toLowerCase() === 'h' || e.code === 'KeyH') && e.altKey) {
        e.preventDefault();
        if (gameState.showHint) {
          const nextStage = (gameState.hintStage + 1) % 3;
          dispatch({ type: 'SET_HINT_STAGE', stage: nextStage });
        } else {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: true });
          dispatch({ type: 'SET_HINT_STAGE', stage: 0 });
          // Close others
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false });
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false });
        }
        return true;
      }
      if ((e.key.toLowerCase() === 'm' || e.code === 'KeyM') && e.altKey && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: !gameState.showMap });
        if (!gameState.showMap) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false });
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
        }
        return true;
      }
    },
    [
      gameState.showHelp,
      gameState.showHint,
      gameState.showMap,
      gameState.hintStage,
      gameState.mode,
    ],
    { priority: 2000, captureInput: true }
  );

  // 2. Threat Alert (Priority 600)
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: false });
        return true;
      }
      return true; // Block others
    },
    [gameState.showThreatAlert],
    { priority: 600, enabled: gameState.showThreatAlert }
  );

  // 3. Modals (Help, Map, Hint, InfoPanel) (Priority 1000 - Higher than Warnings)
  useGlobalInput(
    (e) => {
      handleHelpModeKeyDown(e, gameState, () =>
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false })
      );
      return true;
    },
    [gameState.showHelp, gameState, handleHelpModeKeyDown],
    { priority: 1000, enabled: gameState.showHelp }
  );

  useGlobalInput(
    (e) => {
      const episodeIcons = [Zap, Shield, Crown];
      const episodes = EPISODE_LORE.map((lore, idx) => {
        const color = lore.color ?? 'text-blue-500';
        return {
          ...lore,
          levels: LEVELS.filter((l) => l.episodeId === lore.id),
          border: color.replace('text-', 'border-') + '/30',
          bg: color.replace('text-', 'bg-') + '/10',
          color,
          icon: episodeIcons[idx] || Shield,
        };
      });

      handleQuestMapModeKeyDown(
        e,
        gameState,
        LEVELS,
        episodes,
        () => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false }),
        (globalIdx: number) => {
          const lvl = LEVELS[globalIdx];
          let fs = cloneFS(INITIAL_FS);
          fs = ensurePrerequisiteState(fs, lvl.id, gameState);
          dispatch({
            type: 'SET_LEVEL',
            index: globalIdx,
            fs,
            path: lvl.initialPath || ['root', 'home', 'guest'],
            showIntro: lvl.episodeId !== LEVELS[gameState.levelIndex].episodeId,
            notification: null, // No specific notification on jump
            timeLeft: lvl.timeLimit || null,
            zoxideData: gameState.zoxideData,
          });
        }
      );
      return true;
    },
    [gameState.showMap, gameState, handleQuestMapModeKeyDown],
    { priority: 1000, enabled: gameState.showMap }
  );

  useGlobalInput(
    (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
      }
      return true;
    },
    [gameState.showHint],
    { priority: 1000, enabled: gameState.showHint }
  );

  useGlobalInput(
    (e) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'info', visible: false });
      }
      return true;
    },
    [gameState.showInfoPanel],
    { priority: 1000, enabled: gameState.showInfoPanel }
  );

  // 4. Warning Modals (Priority 600)
  // Hidden Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === '.') {
        dispatch({ type: 'TOGGLE_HIDDEN' });
      }
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({
            type: 'SET_MODAL_VISIBILITY',
            modal: 'hiddenWarning',
            visible: false,
          });
          dispatch({ type: 'TOGGLE_HIDDEN' }); // Should we toggle off? Or just dismiss warning?
          // If tasks complete, logic in useEffect usually hides warning AND sets showHidden=false.
          // But here, if user dismisses, we assume they want to proceed?
          // Original code: dispatch({ type: 'UPDATE_UI_STATE', updates: { showHidden: false, showHiddenWarning: false } });
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
          // Note: Logic above in useEffect sets showHiddenWarning=false.
          // If we want to hide files too:
          if (gameState.showHidden) dispatch({ type: 'TOGGLE_HIDDEN' });
        } else {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
        }
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
      }
      return true;
    },
    [gameState.showHiddenWarning, currentLevel, checkAllTasksComplete, gameState.showHidden],
    { priority: 600, enabled: gameState.showHiddenWarning }
  );

  // Filter Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
          if (currentDirNode) {
            dispatch({ type: 'CLEAR_FILTER', dirId: currentDirNode.id });
          }
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        } else {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODE', mode: 'normal' });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        return true;
      }
      return true;
    },
    [gameState.mode, gameState.filters, currentLevel, checkAllTasksComplete],
    { priority: 600, enabled: gameState.mode === 'filter-warning' }
  );

  // Search Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SEARCH', query: null, results: [] });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        } else {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODE', mode: 'normal' });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        return true;
      }
      return true;
    },
    [gameState.mode, currentLevel, checkAllTasksComplete],
    { priority: 600, enabled: gameState.mode === 'search-warning' }
  );

  // Sort Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
          dispatch({ type: 'SET_SORT', sortBy: 'natural', direction: 'asc' });
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        } else {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === ',') {
        dispatch({ type: 'SET_MODE', mode: 'sort' });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: true });
        return true;
      }
      if (gameState.acceptNextKeyForSort) {
        handleSortModeKeyDown(e, gameState);
        const pressed = e.key || '';
        const isNatural = pressed.toLowerCase() === 'n' && !e.shiftKey;
        dispatch({
          type: 'SET_MODAL_VISIBILITY',
          modal: 'sortWarning',
          visible: !isNatural,
        });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        dispatch({ type: 'SET_MODE', mode: 'normal' });
        return true;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
        dispatch({ type: 'SET_MODE', mode: 'normal' });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        return true;
      }
      return true;
    },
    [
      gameState.showSortWarning,
      gameState.acceptNextKeyForSort,
      currentLevel,
      checkAllTasksComplete,
      handleSortModeKeyDown,
    ],
    { priority: 600, enabled: gameState.showSortWarning }
  );

  // 5. Game Loop (Priority 0)
  useGlobalInput(
    (e) => {
      if (gameState.isBooting || gameState.showEpisodeIntro || isLastLevel || gameState.isGameOver)
        return;

      // Block game loop in input modes (though they are ignored by default if focus is in input)
      if (['filter', 'input-file', 'rename'].includes(gameState.mode)) return;

      // Completion Lockdown Logic
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (tasksComplete && gameState.showSuccessToast) {
        // SuccessToast handles Shift+Enter with priority 700.
        // We block everything else here.
        return true;
      }

      // Sound Toggle
      if (e.key.toLowerCase() === 'm' && e.altKey && e.shiftKey && gameState.mode === 'normal') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SOUND' });
        dispatch({
          type: 'SET_NOTIFICATION',
          message: `Sound ${!gameState.settings.soundEnabled ? 'Enabled' : 'Disabled'}`,
        });
        return true;
      }

      // Keystrokes counting (excluding modifiers/meta)
      if (
        !['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm', 'h'].includes(e.key.toLowerCase())
      ) {
        let noise = 1;
        if (currentLevel?.id >= 11) {
          noise = getActionIntensity(e.key, e.ctrlKey);
        }
        dispatch({ type: 'INCREMENT_KEYSTROKES', weighted: noise > 1 });
      }

      // Mode dispatch
      switch (gameState.mode) {
        case 'normal':
          if (
            handleNormalModeKeyDown(
              e,
              gameState,
              visibleItems,
              parent || null,
              currentItem,
              currentLevel,
              advanceLevel
            )
          )
            return true;
          break;
        case 'sort':
          handleSortModeKeyDown(e, gameState);
          break;
        case 'confirm-delete':
          handleConfirmDeleteModeKeyDown(e, visibleItems, currentLevel, gameState);
          break;
        case 'search':
          if (e.key === 'Enter') {
            handleSearchConfirm();
          } else if (e.key === 'Escape') {
            dispatch({ type: 'SET_MODE', mode: 'normal' });
          }
          break;
        case 'zoxide-jump':
        case 'fzf-current':
          handleFuzzyModeKeyDown(e as unknown as KeyboardEvent, gameState, dispatch);
          break;
        case 'g-command':
          handleGCommandKeyDown(e, gameState, currentLevel);
          break;
        case 'overwrite-confirm':
          handleOverwriteConfirmKeyDown(e, gameState);
          break;
      }
    },
    [
      gameState,
      currentLevel,
      isLastLevel,
      handleNormalModeKeyDown,
      handleSortModeKeyDown,
      handleConfirmDeleteModeKeyDown,
      handleFuzzyModeKeyDown,
      handleOverwriteConfirmKeyDown,
      handleGCommandKeyDown,
      advanceLevel,
      visibleItems,
      currentItem,
      parent,
      handleSearchConfirm,
      dispatch,
      checkAllTasksComplete,
    ],
    { priority: 0 }
  );

  if (gameState.isBooting) {
    return <BiosBoot onComplete={handleBootComplete} cycleCount={gameState.cycleCount || 1} />;
  }

  if (isLastLevel) {
    return <OutroSequence onRestartCycle={handleRestartCycle} />;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {gameState.showEpisodeIntro && !gameState.ignoreEpisodeIntro && (
        <EpisodeIntro
          episode={(() => {
            const baseEpisode = EPISODE_LORE.find((e) => e.id === currentLevel.episodeId)!;
            // E C H O   C Y C L E   L O G I C
            if ((gameState.cycleCount || 1) > 1 && baseEpisode.id === 1) {
              return { ...baseEpisode, lore: ECHO_EPISODE_1_LORE };
            }
            return baseEpisode;
          })()}
          onComplete={(options) => dispatch({ type: 'COMPLETE_INTRO', isSkip: options?.isSkip })}
        />
      )}

      {gameState.isGameOver && (
        <GameOverModal
          reason={gameState.gameOverReason!}
          onRestart={handleRestartLevel}
          efficiencyTip={currentLevel.efficiencyTip}
          level={currentLevel}
          customMessage={gameState.notification?.message}
        />
      )}

      {gameState.showHelp && (
        <HelpModal
          onClose={() => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false })}
          scrollPosition={gameState.helpScrollPosition || 0}
        />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() => {
            dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
            dispatch({ type: 'SET_HINT_STAGE', stage: 0 });
          }}
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'info', visible: false })}
        />
      )}

      {gameState.mode === 'confirm-delete' && (
        <ConfirmationModal
          deleteType={gameState.deleteType}
          itemsToDelete={gameState.pendingDeleteIds.map((id) => {
            const node = getVisibleItems(gameState).find((item) => item.id === id);
            // Construct full pseudo-path for display
            const currentDir = resolvePath(gameState.fs, gameState.currentPath);
            // Ensure no double slash if root is weird, though resolvePath usually handles it
            const displayPath = node ? `${currentDir === '/' ? '' : currentDir}/${node.name}` : id;
            return displayPath;
          })}
          onConfirm={() => confirmDelete(visibleItems, currentLevel, gameState)}
          onCancel={() => cancelDelete()}
        />
      )}

      {gameState.showSuccessToast && (
        <>
          {/* <CelebrationConfetti /> */}
          <SuccessToast
            message={currentLevel.successMessage || 'Sector Cleared'}
            levelTitle={currentLevel.title}
            onDismiss={advanceLevel}
          />
        </>
      )}

      {gameState.showHiddenWarning && (
        <HiddenFilesWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() =>
            dispatch({
              type: 'SET_MODAL_VISIBILITY',
              modal: 'hiddenWarning',
              visible: false,
            })
          }
        />
      )}
      {gameState.showSortWarning && (
        <SortWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() =>
            dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false })
          }
        />
      )}
      {gameState.mode === 'filter-warning' &&
        (() => {
          return (
            <FilterWarningModal
              allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
              onDismiss={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
            />
          );
        })()}
      {gameState.mode === 'search-warning' && (
        <SearchWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
        />
      )}

      {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
        <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}

      {/* Render ThreatAlert AFTER other modals so it appears on top */}
      {gameState.showThreatAlert && (
        <ThreatAlert
          message={gameState.alertMessage || ''}
          onDismiss={() =>
            dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: false })
          }
        />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        {!gameState.showEpisodeIntro && (
          <LevelProgress
            levels={LEVELS}
            currentLevelIndex={gameState.levelIndex}
            notification={null}
            thought={gameState.thought}
            onToggleHint={() =>
              dispatch({
                type: 'SET_MODAL_VISIBILITY',
                modal: 'hint',
                visible: !gameState.showHint,
              })
            }
            onToggleHelp={() =>
              dispatch({
                type: 'SET_MODAL_VISIBILITY',
                modal: 'help',
                visible: !gameState.showHelp,
              })
            }
            isOpen={gameState.showMap}
            onClose={() => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false })}
            onToggleMap={() =>
              dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: !gameState.showMap })
            }
            onJumpToLevel={(idx) => {
              const lvl = LEVELS[idx];
              let fs = cloneFS(INITIAL_FS);
              fs = ensurePrerequisiteState(fs, lvl.id, gameState);
              dispatch({
                type: 'SET_LEVEL',
                index: idx,
                fs,
                path: lvl.initialPath || ['root', 'home', 'guest'],
                showIntro: lvl.episodeId !== LEVELS[gameState.levelIndex].episodeId,
                notification: null, // No specific notification on jump
                timeLeft: lvl.timeLimit || null,
                zoxideData: gameState.zoxideData,
              });
            }}
            activeTab={gameState.questMapTab}
            selectedMissionIdx={gameState.questMapMissionIdx}
          />
        )}

        {!gameState.showEpisodeIntro && (
          <header
            className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 transition-opacity duration-200 breadcrumb"
            style={{
              opacity:
                gameState.mode === 'zoxide-jump' ||
                gameState.mode === 'fzf-current' ||
                gameState.mode === 'z-prompt'
                  ? 0.3
                  : 1,
            }}
          >
            <div className="font-mono text-sm text-zinc-400" data-testid="breadcrumbs">
              {resolvePath(gameState.fs, gameState.currentPath).replace('/home/guest', '~')}
              {(() => {
                if (gameState.searchQuery) {
                  return <span className="text-green-400"> (search: {gameState.searchQuery})</span>;
                }
                const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                const filter = dir ? gameState.filters[dir.id] : null;
                return filter ? <span className="text-cyan-400"> (filter: {filter})</span> : null;
              })()}
            </div>
          </header>
        )}

        <div className="flex flex-1 min-h-0 relative">
          {/* Search Input - centered overlay popup matching Yazi style */}
          {gameState.mode === 'search' && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-4 pointer-events-none">
              <div className="pointer-events-auto bg-zinc-900/95 border border-blue-500/50 shadow-2xl shadow-blue-500/20 p-4 min-w-[400px] backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-mono mb-2">Search via fd:</div>
                <input
                  type="text"
                  value={gameState.inputBuffer}
                  onChange={(e) => {
                    const val = e.target.value;
                    dispatch({ type: 'SET_INPUT_BUFFER', buffer: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchConfirm();
                      e.stopPropagation();
                    } else if (e.key === 'Escape') {
                      dispatch({ type: 'SET_MODE', mode: 'normal' });
                      e.stopPropagation();
                    }
                  }}
                  className="w-full bg-zinc-800 text-white font-mono text-sm px-3 py-2 border border-zinc-600 outline-none focus:border-blue-400"
                  autoFocus
                  onBlur={(e) => e.target.focus()}
                  data-testid="search-input"
                />
              </div>
            </div>
          )}

          <FileSystemPane
            items={(() => {
              const parent = getParentNode(gameState.fs, gameState.currentPath);
              let items =
                parent && parent.children ? sortNodes(parent.children, 'natural', 'asc') : [];
              if (!gameState.showHidden) {
                items = items.filter((c) => !c.name.startsWith('.'));
              }
              return items;
            })()}
            isActive={false}
            isParent={true}
            selectedIds={[]}
            clipboard={null}
            linemode={gameState.linemode}
            className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
          />

          <div className="flex-1 flex flex-col relative min-w-0">
            <FileSystemPane
              key={`fs-pane-main-${gameState.currentPath.join('/')}`}
              items={visibleItems}
              isActive={
                !['search', 'zoxide-jump', 'fzf-current', 'z-prompt'].includes(gameState.mode)
              }
              cursorIndex={gameState.cursorIndex}
              isParent={false}
              selectedIds={gameState.selectedIds}
              clipboard={gameState.clipboard}
              linemode={gameState.linemode}
              className="flex-1"
            />

            {gameState.mode === 'sort' && (
              <div className="absolute bottom-6 right-0 m-2 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Sort Options
                  </span>
                  <span className="text-xs font-mono text-zinc-600">Which-Key</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">n</span>{' '}
                    <span className="text-zinc-400">Natural</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">N</span>{' '}
                    <span className="text-zinc-400">Natural (rev)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">a</span>{' '}
                    <span className="text-zinc-400">A-Z</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">A</span>{' '}
                    <span className="text-zinc-400">Z-A</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">m</span>{' '}
                    <span className="text-zinc-400">Modified (new)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">M</span>{' '}
                    <span className="text-zinc-400">Modified (old)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">s</span>{' '}
                    <span className="text-zinc-400">Size (large)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">S</span>{' '}
                    <span className="text-zinc-400">Size (small)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">e</span>{' '}
                    <span className="text-zinc-400">Extension</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">E</span>{' '}
                    <span className="text-zinc-400">Extension (rev)</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-800 my-1"></div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">l</span>{' '}
                    <span className="text-zinc-400">Cycle Linemode</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">-</span>{' '}
                    <span className="text-zinc-400">Clear Linemode</span>
                  </div>
                </div>
              </div>
            )}

            {gameState.mode === 'g-command' && (
              <GCommandDialog onClose={() => dispatch({ type: 'SET_MODE', mode: 'normal' })} />
            )}

            {gameState.mode === 'input-file' && (
              <InputModal
                label="Create"
                value={gameState.inputBuffer}
                onChange={(val) => dispatch({ type: 'SET_INPUT_BUFFER', buffer: val })}
                onConfirm={handleInputConfirm}
                onCancel={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
                borderColorClass="border-green-500"
                testid="create-input"
              />
            )}

            {gameState.mode === 'filter' && (
              <InputModal
                label="Filter"
                value={gameState.inputBuffer}
                onChange={(val) => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  if (dir) {
                    dispatch({ type: 'SET_FILTER', dirId: dir.id, filter: val });
                  }
                  // Also update inputBuffer so the input field shows the typed text
                  dispatch({ type: 'SET_INPUT_BUFFER', buffer: val });
                }}
                onConfirm={() => {
                  dispatch({ type: 'SET_MODE', mode: 'normal' });
                  dispatch({ type: 'INCREMENT_STAT', stat: 'filterUsage' });
                }}
                onCancel={() => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  if (dir) {
                    dispatch({ type: 'CLEAR_FILTER', dirId: dir.id });
                  }
                  dispatch({ type: 'SET_MODE', mode: 'normal' });
                  dispatch({ type: 'INCREMENT_STAT', stat: 'filterUsage' });
                }}
                borderColorClass="border-orange-500"
                testid="filter-input"
              />
            )}

            {gameState.mode === 'rename' && (
              <InputModal
                label="Rename"
                value={gameState.inputBuffer}
                onChange={(val) => dispatch({ type: 'SET_INPUT_BUFFER', buffer: val })}
                onConfirm={handleRenameConfirm}
                onCancel={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
                borderColorClass="border-cyan-500" // or green/cyan mix
                testid="rename-input"
              />
            )}

            {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
              <FuzzyFinder
                gameState={gameState}
                onSelect={handleFuzzySelect}
                onClose={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
              />
            )}
          </div>

          <PreviewPane
            node={currentItem}
            level={currentLevel}
            gameState={gameState}
            previewScroll={gameState.previewScroll}
            dispatch={dispatch}
          />
        </div>

        {!gameState.showEpisodeIntro && (
          <StatusBar
            state={gameState}
            level={currentLevel}
            allTasksComplete={
              checkAllTasksComplete(gameState, currentLevel) && !gameState.showHidden
            }
            onNextLevel={advanceLevel}
            currentItem={currentItem}
          />
        )}
      </div>
    </div>
  );
}
