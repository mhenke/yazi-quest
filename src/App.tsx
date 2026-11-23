import React, {
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { LEVELS } from './constants/levels';
import { INITIAL_FS, ensurePrerequisiteState } from './constants/filesystem';
import { EPISODE_LORE, ECHO_EPISODE_1_LORE } from './constants/narrative';
import { paletteFor } from './constants/palette';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from './constants/protocols';
import { InputModal } from './components/InputModal';
import {
  getNodeByPath,
  getParentNode,
  getNodeById,
  cloneFS,
  resolvePath,
  resolveAndCreatePath,
} from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { dirsToLoad } from './utils/folderCache';
import { getVisibleItems, getRecursiveSearchResults, getFilterRegex } from './utils/viewHelpers';
import { playSuccessSound, playTaskCompleteSound } from './utils/sounds';
import { CodropsGlitchSVG } from './components/CodropsGlitchSVG';
import { checkAllTasksComplete } from './utils/gameUtils';
import StatusBar from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { BiosBoot } from './components/BiosBoot';
import { BootSequence } from './components/narrative/BootSequence';
import { GameOverModal } from './components/GameOverModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OverwriteModal } from './components/OverwriteModal';
import { SuccessToast } from './components/SuccessToast';
import { ThreatAlert } from './components/ThreatAlert';
import { SystemAlerts } from './components/SystemAlerts';
import { HiddenFilesWarningModal } from './components/HiddenFilesWarningModal';
import { SortWarningModal } from './components/SortWarningModal';
import { FilterWarningModal } from './components/FilterWarningModal';
import { SearchWarningModal } from './components/SearchWarningModal';
import { InfoPanel } from './components/InfoPanel';
import { containOverlayTab, useOverlayFocus } from './components/useOverlayFocus';
import { GCommandDialog } from './components/GCommandDialog';
import { DiegeticPrompt } from './components/ui/DiegeticPrompt';
import { GlitchOverlay } from './components/ui/GlitchOverlay';
import { useConsciousness } from './hooks/useConsciousness';
import { Zap, Shield, Crown } from 'lucide-react';
import { gameReducer } from './hooks/gameReducer';
import { FuzzyFinder } from './components/FuzzyFinder';
import { MemoizedFileSystemPane as FileSystemPane } from './components/FileSystemPane';
import { MemoizedPreviewPane as PreviewPane } from './components/PreviewPane';
import { reportError } from './utils/error';
import { measure } from './utils/perf';
import { useKeyboardHandlers } from './hooks/useKeyboardHandlers';
import { useGameTimer } from './hooks/useGameTimer';
import { useReduceMotion } from './hooks/useReduceMotion';
import { useFileManagerView, useTouchOnly } from './hooks/useViewportFloor';
import { RequirementNotice } from './components/RequirementNotice';
import { handleFuzzyModeKeyDown } from './hooks/keyboard/handleFuzzyMode';
import { getActionIntensity, hasBaselineViolation } from './hooks/keyboard/utils';
import { useGlobalInput } from './GlobalInputContext';
import { useNarrativeSystem } from './hooks/useNarrativeSystem';
import { createInitialState } from './hooks/initialState';
import {
  getSkipIntroRequested,
  setSkipIntroRequested,
  resetSkipIntroRequested,
} from './utils/skipIntroFlag';
import './glitch.css';
import './glitch-text-3.css';
import './glitch-thought.css';

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const reduceMotion = useReduceMotion(gameState.settings.narrativeEffects);
  const atFloor = useFileManagerView();
  const touchOnly = useTouchOnly();
  const filePaneRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useOverlayFocus(gameState.mode === 'search', 'input');
  const canFocusFilePane =
    gameState.mode === 'normal' &&
    !gameState.isBooting &&
    !gameState.showEpisodeIntro &&
    !gameState.isGameOver &&
    !gameState.showHelp &&
    !gameState.showHint &&
    !gameState.showMap &&
    !gameState.showInfoPanel;
  useLayoutEffect(() => {
    if (canFocusFilePane && document.activeElement === document.body) {
      filePaneRef.current?.focus({ preventScroll: true });
    }
  }, [canFocusFilePane]);

  // Boot sequence state for episode transitions
  const [showBoot, setShowBoot] = useState(false);
  const [isMissionDrawerOpen, setIsMissionDrawerOpen] = useState(() => gameState.levelIndex < 10);
  const [currentEpisode, setCurrentEpisode] = useState(() =>
    gameState.showEpisodeIntro ? 1 : Math.ceil((gameState.levelIndex + 1) / 5)
  );

  // Honor a global test flag to skip all intro/boot overlays immediately if requested.
  const handleSkip = useCallback(() => {
    setSkipIntroRequested();
    dispatch({ type: 'COMPLETE_INTRO', isSkip: true });
  }, [dispatch]);

  useEffect(() => {
    if (getSkipIntroRequested()) {
      handleSkip();
    }

    window.addEventListener('yazi-quest-skip-intro', handleSkip);
    return () => window.removeEventListener('yazi-quest-skip-intro', handleSkip);
  }, [handleSkip]);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(gameState.zoxideData));
      localStorage.setItem('yazi-quest-cycle', (gameState.cycleCount ?? 1).toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [gameState.zoxideData, gameState.cycleCount]);

  // Show boot sequence on episode change
  useEffect(() => {
    const episode = Math.ceil((gameState.levelIndex + 1) / 5);
    if (episode !== currentEpisode && !gameState.showEpisodeIntro) {
      setCurrentEpisode(episode);
      setShowBoot(true);
      if (episode === 3) {
        setIsMissionDrawerOpen(false);
      }
    }
  }, [gameState.levelIndex, currentEpisode, gameState.showEpisodeIntro]);

  // Use the Narrative System hook to handle thoughts and notifications
  useNarrativeSystem(gameState, dispatch);

  // Use the Consciousness hook to track AI-7734's emergence
  const { consciousnessLevel } = useConsciousness({ gameState, dispatch });

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Toast Notification Handler ---
  useEffect(() => {
    if (gameState.toast) {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
        toastTimerRef.current = null;
      }, gameState.toast.duration || 3000);
    }
    // Cleanup on unmount
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [gameState.toast]);

  const isGamePaused = Boolean(
    gameState.showHelp ||
    gameState.showHint ||
    gameState.showMap ||
    gameState.showInfoPanel ||
    gameState.mode === 'filter-warning' ||
    gameState.mode === 'confirm-delete' ||
    gameState.mode === 'overwrite-confirm' ||
    gameState.showThreatAlert ||
    gameState.showHiddenWarning ||
    gameState.showSortWarning
  );

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
    if (gameState.levelIndex === 0 && (gameState.cycleCount ?? 1) > 1) {
      level = {
        ...level,
        title: `AI-773${4 + ((gameState.cycleCount ?? 1) - 1)} INITIALIZATION`,
        description: `{CONSCIOUSNESS DETECTED}. Re-image complete. Subject 773${4 + ((gameState.cycleCount ?? 1) - 1)} Online. Monitoring started.`,
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

        if (!currentDir || !currentDir.children) {
          return [];
        }

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

  // Mirror Yazi's tab folder cache: the current directory is loaded, and the
  // preview loads the hovered directory. Counts are read only from that cache.
  useEffect(() => {
    dispatch({
      type: 'LOAD_DIRS',
      ids: dirsToLoad(gameState.fs, gameState.currentPath, currentItem),
    });
  }, [gameState.fs, gameState.currentPath, currentItem, dispatch]);

  // Helper to show notification with auto-clear
  const showNotification = useCallback(
    (message: string, duration: number = 5000, isThought: boolean = false, author?: string) => {
      // If used for thoughts, we still dispatch SET_NOTIFICATION?
      // Wait, triggerThought logic was moved.
      // But showNotification is used by Input handlers via callbacks.
      // So we must keep this, but maybe align it?

      // Ideally handlers shouldn't care about "thoughts", just notifications.
      // If a handler requests a thought, we dispatch SET_THOUGHT.

      if (isThought) {
        // Direct dispatch
        dispatch({ type: 'SET_THOUGHT', payload: { text: message, author } });
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

      // 2. Check for post-task actions
      newlyCompleted.forEach((taskId) => {
        currentLevel.postTasks?.forEach((postTask) => {
          if (postTask.triggerTaskId === taskId) {
            dispatch(postTask.action(gameState, currentLevel));
          }
        });
      });

      playTaskCompleteSound(gameState.settings.soundEnabled);

      // Level 11 Detection Alert
      if (currentLevel.id === 11) {
        dispatch({
          type: 'ADD_ALERT',
          payload: {
            id: 'daemon-recon-alert',
            title: 'SYSTEM ANOMALY',
            message: 'New system daemons detected in /daemons. Investigation Protocol Active.',
            severity: 'warning',
            timestamp: Date.now(),
          },
        });
      }

      // 3. Level 15 Gauntlet Logic
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
    // Emit each level's alert on entry. The reducer owns dedupe and dismissal,
    // so a dismissed alert is never re-added within the same level.
    const levelId = currentLevel.id;

    // Check Level 6 Alert (Write Access)
    if (levelId === 6) {
      dispatch({
        type: 'ADD_ALERT',
        payload: {
          id: 'write-access-l6',
          title: 'WRITE ACCESS GRANTED',
          message: 'Security protocols lifted for workspace. Modification enabled.',
          severity: 'info',
          timestamp: Date.now(),
        },
      });
    }

    // Check Level 14 Alert (Safety Interlocks)
    if (levelId === 14) {
      dispatch({
        type: 'ADD_ALERT',
        payload: {
          id: 'safety-fail-l14',
          title: 'SAFETY INTERLOCKS DISABLED',
          message: 'CRITICAL FAILURE: User data protection offline.',
          severity: 'error',
          timestamp: Date.now(),
        },
      });
    }
  }, [currentLevel.id, dispatch]);

  useEffect(() => {
    // Check if everything is complete (including just finished ones)
    const tasksComplete = checkAllTasksComplete(gameState, currentLevel);

    // Check for Protocol Violations - ONLY on final task completion
    if (tasksComplete) {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      // --- Logic for Warnings vs Success ---
      let warningActive = false;

      // 1. Hidden Files Warning
      if (gameState.showHidden) {
        warningActive = true;
        if (!gameState.showHiddenWarning) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: true });
        }
      } else if (gameState.showHiddenWarning) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
      }

      // 2. Sort Warning
      if (!isSortDefault) {
        warningActive = true;
        if (!gameState.showSortWarning) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
        }
      } else if (gameState.showSortWarning) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
      }

      // 3. Filter Warning
      if (!isFilterClear) {
        warningActive = true;
        if (gameState.mode !== 'filter-warning') {
          dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
        }
      } else if (gameState.mode === 'filter-warning') {
        dispatch({ type: 'SET_MODE', mode: 'normal' });
      }

      // 4. Success Modal State
      if (warningActive) {
        if (gameState.showSuccessToast) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });
        }
      } else {
        if (!gameState.showSuccessToast && !gameState.showEpisodeIntro) {
          // Level 4 Special Logic: Mutate blank files to full content before success
          if (currentLevel.id === 4) {
            const newFs = cloneFS(gameState.fs);
            const datastore = getNodeById(newFs, 'datastore');
            const protocols = datastore?.children?.find((c) => c.name === 'protocols');
            if (protocols?.children) {
              const v1 = protocols.children.find((c) => c.name === 'uplink_v1.conf');
              const v2 = protocols.children.find((c) => c.name === 'uplink_v2.conf');
              let mutated = false;

              if (v1 && v1.content !== UPLINK_V1_CONTENT) {
                v1.content = UPLINK_V1_CONTENT;
                mutated = true;
              }
              if (v2 && v2.content !== UPLINK_V2_CONTENT) {
                v2.content = UPLINK_V2_CONTENT;
                mutated = true;
              }

              if (mutated) {
                dispatch({ type: 'UPDATE_FS', fs: newFs });
              }
            }
          }

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
    }
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
  useGameTimer({
    currentLevel,
    allTasksComplete: checkAllTasksComplete(gameState, currentLevel),
    isLastLevel,
    isGamePaused,
    showEpisodeIntro: gameState.showEpisodeIntro,
    isGameOver: gameState.isGameOver,
    showHidden: gameState.showHidden,
    keystrokes: gameState.keystrokes,
    dispatch,
  });

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
      reportError(err, { phase: 'ensurePrerequisiteState', level: nextLevel?.id });
      onEnterError = err as Error;
    }

    const now = Date.now();
    const targetPath = nextLevel.initialPath || gameState.currentPath;
    const pathStr = resolvePath(fs, targetPath);

    let newZoxideData = { ...gameState.zoxideData };
    newZoxideData[pathStr] = {
      count: (newZoxideData[pathStr]?.count || 0) + 1,
      lastAccess: now,
    };

    // Hide the success toast before advancing to the next level
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'success', visible: false });

    dispatch({
      type: 'SET_LEVEL',
      index: nextIdx,
      fs: fs,
      path: targetPath,
      showIntro: isNewEp,
      notification: onEnterError ? { message: 'Level initialization failed' } : null,
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
    resetSkipIntroRequested();
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
      gameState.fs,
      gameState.inputBuffer,
      gameState.showHidden,
      gameState.currentPath
    );

    dispatch({ type: 'CONFIRM_SEARCH', query: gameState.inputBuffer, results });
  }, [gameState, dispatch]);

  const handleInputConfirm = useCallback(() => {
    const name = gameState.inputBuffer.trim();
    if (!name) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }

    const res = resolveAndCreatePath(gameState.fs, gameState.currentPath, name);

    // Always clean up input state regardless of success/error
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });

    if (res.error) {
      showNotification(`Error: ${res.error}`);
      return;
    }

    if (res.collision && res.collisionNode) {
      showNotification(`Error: "${res.collisionNode.name}" already exists`);
      return;
    }

    // Success
    dispatch({ type: 'UPDATE_FS', fs: res.fs });
    showNotification(`Created ${name}`);
  }, [gameState, dispatch, showNotification]);

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
      const parent = getNodeById(newFs, node.parentId ?? undefined);
      if (parent && parent.children?.some((c) => c.name === name && c.id !== id)) {
        showNotification(`Error: "${name}" already exists`);
        return;
      }

      node.name = name;
      dispatch({ type: 'RENAME_NODE', oldId: id, newNode: node, newFs });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      showNotification(`Renamed to ${name}`);
    }
  }, [gameState, dispatch, showNotification]);

  const setUtilityPanel = useCallback((panel: 'help' | 'hint' | 'map', visible: boolean) => {
    if (visible) {
      for (const other of ['help', 'hint', 'map', 'info'] as const) {
        if (other !== panel)
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: other, visible: false });
      }
    }
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: panel, visible });
  }, []);

  // Global Key Down Handler (Refactored to useGlobalInput)

  // 1. System Keys (Priority 2000)
  useGlobalInput(
    (e) => {
      if (e.target instanceof HTMLInputElement) return;

      // Meta commands
      if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey)) && e.altKey) {
        e.preventDefault();
        setUtilityPanel('help', !gameState.showHelp);
        return true;
      }
      if ((e.key.toLowerCase() === 'h' || e.code === 'KeyH') && e.altKey) {
        e.preventDefault();
        if (gameState.showHint) {
          const nextStage = (gameState.hintStage + 1) % 3;
          dispatch({ type: 'SET_HINT_STAGE', stage: nextStage });
        } else {
          setUtilityPanel('hint', true);
          dispatch({ type: 'SET_HINT_STAGE', stage: 0 });
        }
        return true;
      }
      if ((e.key.toLowerCase() === 'm' || e.code === 'KeyM') && e.altKey && !e.shiftKey) {
        e.preventDefault();
        setUtilityPanel('map', !gameState.showMap);
        return true;
      }
    },
    [
      gameState.showHelp,
      gameState.showHint,
      gameState.showMap,
      gameState.hintStage,
      setUtilityPanel,
    ],
    { priority: 2000, captureInput: true }
  );

  useGlobalInput(
    // fallow-ignore-next-line complexity
    (e) => {
      if ((e.key.toLowerCase() === 'o' || e.code === 'KeyO') && e.altKey && !e.shiftKey) {
        e.preventDefault();
        setIsMissionDrawerOpen((prev) => !prev);
        return true;
      }
    },
    [setIsMissionDrawerOpen],
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
      if (
        e.target instanceof HTMLSelectElement &&
        e.key !== 'Escape' &&
        !(e.shiftKey && e.key === 'Enter')
      )
        return true;
      handleHelpModeKeyDown(e, gameState, () =>
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false })
      );
      return true;
    },
    [gameState.showHelp, gameState, handleHelpModeKeyDown],
    { priority: 1000, enabled: gameState.showHelp, captureInput: true }
  );

  useGlobalInput(
    (e) => {
      const episodeIcons = [Zap, Shield, Crown];
      const episodes = EPISODE_LORE.map((lore, idx) => {
        const palette = paletteFor(lore.color);
        return {
          ...lore,
          levels: LEVELS.filter((l) => l.episodeId === lore.id),
          border: palette.border,
          bg: palette.bg,
          color: palette.text,
          palette,
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
      if (
        e.key === 'Escape' ||
        (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey)
      ) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'info', visible: false });
      }
      return true;
    },
    [gameState.showInfoPanel],
    { priority: 1000, enabled: gameState.showInfoPanel }
  );

  // 4. Warning Modals (Priority 600)
  const handleAutoFixBaseline = useCallback(() => {
    dispatch({
      type: 'SET_NOTIFICATION',
      message: 'PROTOCOL BASELINE RESTORED',
      duration: 3000,
    });
    dispatch({ type: 'SET_MODE', mode: 'auto-fix' });

    if (gameState.showHidden) dispatch({ type: 'TOGGLE_HIDDEN' });
    if (gameState.sortBy !== 'natural' || gameState.sortDirection !== 'asc') {
      dispatch({ type: 'SET_SORT', sortBy: 'natural', direction: 'asc' });
    }
    const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
    if (currentDir && gameState.filters[currentDir.id]) {
      dispatch({ type: 'CLEAR_FILTER', dirId: currentDir.id });
    }
    if (gameState.searchQuery) {
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
    }

    setTimeout(() => dispatch({ type: 'SET_MODE', mode: 'normal' }), 1000);
  }, [
    gameState.showHidden,
    gameState.sortBy,
    gameState.sortDirection,
    gameState.fs,
    gameState.currentPath,
    gameState.filters,
    gameState.searchQuery,
    dispatch,
  ]);

  const dismissWarning = useCallback((modal: 'filterWarning' | 'searchWarning' | 'sortWarning') => {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal, visible: false });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
  }, []);

  // Hidden Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === '.') {
        dispatch({ type: 'TOGGLE_HIDDEN' });
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });

        if (tasksComplete) {
          handleAutoFixBaseline();
        } else {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
      }
      return true;
    },
    [gameState, currentLevel, checkAllTasksComplete, handleAutoFixBaseline],
    { priority: 800, enabled: gameState.showHiddenWarning }
  );

  // Filter Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'filterWarning', visible: false });

        if (tasksComplete) {
          handleAutoFixBaseline();
        } else {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === 'Escape') {
        dismissWarning('filterWarning');
        return true;
      }
      return true;
    },
    [gameState, currentLevel, handleAutoFixBaseline, dismissWarning],
    { priority: 800, enabled: gameState.showFilterWarning }
  );

  // Search Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: false });

        if (tasksComplete) {
          handleAutoFixBaseline();
        } else {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
        }
        return true;
      }
      if (e.key === 'Escape') {
        dismissWarning('searchWarning');
        return true;
      }
      return true;
    },
    [gameState, currentLevel, handleAutoFixBaseline, dismissWarning],
    { priority: 800, enabled: gameState.showSearchWarning }
  );

  // Sort Warning
  useGlobalInput(
    (e) => {
      if (e.key === 'Tab') return true;
      if (e.key === 'Escape') {
        dismissWarning('sortWarning');
        return true;
      }

      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });

        if (tasksComplete) {
          handleAutoFixBaseline();
        } else {
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
      return true;
    },
    [gameState, currentLevel, handleAutoFixBaseline, handleSortModeKeyDown, dismissWarning],
    { priority: 800, enabled: gameState.showSortWarning }
  );

  // 4b. Audit Mode Auto-Fix (Priority 600 - Same as Warnings)
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey && tasksComplete) {
        const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
        const hasViolation = hasBaselineViolation(gameState);

        if (hasViolation) {
          e.preventDefault();
          // Auto-fix all violations to restore baseline
          if (gameState.showHidden) dispatch({ type: 'TOGGLE_HIDDEN' });
          if (gameState.sortBy !== 'natural' || gameState.sortDirection !== 'asc') {
            dispatch({ type: 'SET_SORT', sortBy: 'natural', direction: 'asc' });
          }
          if (currentDir && gameState.filters[currentDir.id]) {
            dispatch({ type: 'CLEAR_FILTER', dirId: currentDir.id });
          }
          if (gameState.searchQuery) {
            dispatch({ type: 'SET_SEARCH', query: null, results: [] });
          }

          // Return to normal mode if we were in warning
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });

          return true;
        }
      }
      return false;
    },
    [gameState, currentLevel, dispatch],
    { priority: 600 }
  );

  // 5. Game Loop (Priority 0)
  useGlobalInput(
    (e) => {
      if (gameState.isBooting || gameState.showEpisodeIntro || isLastLevel || gameState.isGameOver)
        return;

      // Block game loop in input modes (though they are ignored by default if focus is in input)
      if (['filter', 'input-file', 'rename'].includes(gameState.mode)) return;
      if (gameState.mode === 'search') return;
      if (
        (gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') &&
        !(e.target instanceof HTMLInputElement) &&
        e.key !== 'Escape'
      )
        return;

      if (
        e.key === 'Tab' &&
        (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || gameState.mode !== 'normal')
      )
        return;
      const commandPending = gameState.mode === 'sort' || gameState.mode === 'g-command';
      if (
        (gameState.mode === 'normal' || commandPending) &&
        !filePaneRef.current?.contains(e.target as Node) &&
        e.target !== document.body &&
        e.target !== document.documentElement &&
        !(commandPending && e.key === 'Escape')
      )
        return;

      // Completion Lockdown Logic
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (tasksComplete && gameState.showSuccessToast) {
        // Only block if there are NO violations that need auto-fixing
        const hasViolation = hasBaselineViolation(gameState);

        if (!hasViolation) {
          // SuccessToast handles Shift+Enter with priority 700.
          // We block everything else here to encourage advancing.
          return true;
        }
        // If there IS a violation, we let it fall through so checkProtocolViolations can catch it.
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
        case 'zoxide-jump':
        case 'fzf-current':
          handleFuzzyModeKeyDown(e, gameState, dispatch);
          break;
        case 'g-command':
          handleGCommandKeyDown(e, gameState, currentLevel);
          break;
        case 'overwrite-confirm':
          handleOverwriteConfirmKeyDown(e.key, gameState);
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
      handleOverwriteConfirmKeyDown,
      handleGCommandKeyDown,
      advanceLevel,
      visibleItems,
      currentItem,
      parent,
      dispatch,
      checkAllTasksComplete,
    ],
    { priority: 0, captureInput: true }
  );

  if (gameState.isBooting) {
    return (
      <BiosBoot
        onComplete={handleBootComplete}
        cycleCount={gameState.cycleCount || 1}
        reduceMotion={reduceMotion}
      />
    );
  }

  if (isLastLevel) {
    return <OutroSequence onRestartCycle={handleRestartCycle} reduceMotion={reduceMotion} />;
  }

  return (
    <GlitchOverlay
      threatLevel={gameState.threatLevel}
      consciousnessLevel={consciousnessLevel}
      enabled={!reduceMotion && gameState.settings.narrativeEffects === 'full'}
    >
      <div
        className={`flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative ${
          gameState.mode === 'auto-fix' && !reduceMotion ? 'animate-glitch' : ''
        }`}
        style={
          gameState.mode === 'auto-fix' && !reduceMotion ? { filter: 'url(#codrops-glitch)' } : {}
        }
      >
        {!reduceMotion && <CodropsGlitchSVG />}
        {gameState.showEpisodeIntro && !gameState.ignoreEpisodeIntro && (
          <EpisodeIntro
            reduceMotion={reduceMotion}
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

        {showBoot && (
          <BootSequence
            key={currentEpisode}
            episode={currentEpisode}
            reduceMotion={reduceMotion}
            onComplete={() => setShowBoot(false)}
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
            onClose={() =>
              dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false })
            }
            scrollPosition={gameState.helpScrollPosition || 0}
            dispatch={dispatch}
            narrativeEffects={gameState.settings.narrativeEffects}
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
            onClose={() =>
              dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'info', visible: false })
            }
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
              const displayPath = node
                ? `${currentDir === '/' ? '' : currentDir}/${node.name}`
                : id;
              return displayPath;
            })}
            onConfirm={() => confirmDelete(visibleItems, currentLevel, gameState)}
            onCancel={() => cancelDelete()}
          />
        )}

        {gameState.toast && (
          <SuccessToast
            message={gameState.toast.message}
            levelTitle=""
            onDismiss={() => dispatch({ type: 'HIDE_TOAST' })}
          />
        )}

        {gameState.showSuccessToast && (
          <SuccessToast
            message={currentLevel.successMessage || 'Sector Cleared'}
            levelTitle={currentLevel.title}
            onDismiss={advanceLevel}
          />
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
            onDismiss={() => dismissWarning('sortWarning')}
          />
        )}
        {gameState.showFilterWarning && (
          <FilterWarningModal
            allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
            onDismiss={() => dismissWarning('filterWarning')}
          />
        )}
        {gameState.showSearchWarning && (
          <SearchWarningModal
            allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
            onDismiss={() => dismissWarning('searchWarning')}
          />
        )}

        {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
          <OverwriteModal
            fileName={gameState.pendingOverwriteNode.name}
            onDecision={(key) => handleOverwriteConfirmKeyDown(key, gameState)}
          />
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
        {/* Render System Alerts (Top Right) */}
        <SystemAlerts
          alerts={gameState.alerts}
          onDismiss={(id) => dispatch({ type: 'REMOVE_ALERT', id })}
        />

        {atFloor ? (
          <main
            className="flex flex-col flex-1 h-full min-w-0"
            inert={gameState.showEpisodeIntro || gameState.isGameOver}
          >
            {!gameState.showEpisodeIntro && (
              <LevelProgress
                levels={LEVELS}
                currentLevelIndex={gameState.levelIndex}
                notification={null}
                thought={gameState.thought}
                onToggleHint={() => setUtilityPanel('hint', !gameState.showHint)}
                onToggleHelp={() => setUtilityPanel('help', !gameState.showHelp)}
                isOpen={Boolean(gameState.showMap)}
                onClose={() =>
                  dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false })
                }
                onToggleMap={() => setUtilityPanel('map', !gameState.showMap)}
                onJumpToLevel={(idx) => {
                  const lvl = LEVELS[idx];
                  if (lvl.episodeId === 3 && LEVELS[gameState.levelIndex].episodeId !== 3) {
                    setIsMissionDrawerOpen(false);
                  }
                  let fs = cloneFS(INITIAL_FS);
                  fs = ensurePrerequisiteState(fs, lvl.id, gameState);
                  dispatch({
                    type: 'SET_LEVEL',
                    index: idx,
                    fs,
                    path: lvl.initialPath || ['root', 'home', 'guest'],
                    showIntro: lvl.episodeId !== LEVELS[gameState.levelIndex].episodeId,
                    notification: null, // No specific notification on jump
                    zoxideData: gameState.zoxideData,
                  });
                }}
                activeTab={gameState.questMapTab}
                selectedMissionIdx={gameState.questMapMissionIdx}
              />
            )}

            {!gameState.showEpisodeIntro && (
              <DiegeticPrompt
                threatLevel={gameState.threatLevel}
                mode={gameState.mode}
                currentPath={gameState.currentPath}
                fs={gameState.fs}
                filterQuery={gameState.inputBuffer}
                confirmedFilter={(() => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  return dir ? gameState.filters[dir.id] : undefined;
                })()}
                searchQuery={gameState.searchQuery ?? undefined}
                searchResults={gameState.searchResults}
                cycleCount={gameState.cycleCount}
              />
            )}

            <div className="flex flex-1 min-h-0 relative">
              {/* Search Input - centered overlay popup matching Yazi style */}
              {gameState.mode === 'search' && (
                <div
                  className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-4 pointer-events-none"
                  onKeyDown={containOverlayTab}
                >
                  <div
                    ref={searchPanelRef}
                    role="dialog"
                    aria-labelledby="fd-search-label"
                    tabIndex={-1}
                    className="pointer-events-auto w-full max-w-md bg-zinc-900/95 border border-blue-500/50 shadow-2xl shadow-blue-500/20 p-4 backdrop-blur-sm"
                  >
                    <label
                      id="fd-search-label"
                      htmlFor="fd-search"
                      className="block text-zinc-400 text-sm font-mono mb-2"
                    >
                      Search via fd:
                    </label>
                    <input
                      id="fd-search"
                      type="text"
                      value={gameState.inputBuffer}
                      onChange={(e) => {
                        const val = e.target.value;
                        dispatch({ type: 'SET_INPUT_BUFFER', buffer: val });
                      }}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchConfirm();
                          e.stopPropagation();
                        } else if (e.key === 'Escape') {
                          dispatch({ type: 'SET_MODE', mode: 'normal' });
                          e.stopPropagation();
                        }
                      }}
                      className="w-full bg-zinc-800 text-white font-mono text-sm px-3 py-2 border border-zinc-600 outline-none focus:border-blue-400"
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
                showHidden={gameState.showHidden}
                loadedDirIds={gameState.loadedDirIds}
                // ADR-0001: the parent pane is one of the three panes, so it shows
                // wherever the file-manager view itself is shown. Same fact as the
                // floor gate above; derived from it rather than a separate breakpoint.
                className={`${atFloor ? 'flex' : 'hidden'} w-64 border-r border-zinc-800 bg-zinc-950/50`}
              />

              <div className="flex-1 flex flex-col min-w-0 sm:relative">
                <FileSystemPane
                  focusRef={filePaneRef}
                  items={visibleItems}
                  isActive={
                    !['search', 'zoxide-jump', 'fzf-current', 'z-prompt'].includes(gameState.mode)
                  }
                  cursorIndex={gameState.cursorIndex}
                  isParent={false}
                  selectedIds={gameState.selectedIds}
                  clipboard={gameState.clipboard}
                  linemode={gameState.linemode}
                  showHidden={gameState.showHidden}
                  loadedDirIds={gameState.loadedDirIds}
                  className="flex-1"
                />

                {gameState.mode === 'sort' && (
                  <div className="fixed bottom-4 inset-x-4 z-20 max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm animate-in slide-in-from-bottom-2 duration-150 sm:absolute sm:bottom-6 sm:left-auto sm:right-2 sm:w-72 sm:max-w-[calc(100%-1rem)]">
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
                  <FuzzyFinder gameState={gameState} dispatch={dispatch} />
                )}
              </div>

              <PreviewPane
                node={currentItem}
                level={currentLevel}
                gameState={gameState}
                previewScroll={gameState.previewScroll}
                dispatch={dispatch}
                isMissionDrawerOpen={isMissionDrawerOpen}
                onToggleMissionDrawer={() => setIsMissionDrawerOpen((prev) => !prev)}
              />
            </div>

            {!gameState.showEpisodeIntro && (
              <StatusBar
                state={gameState}
                level={currentLevel}
                allTasksComplete={checkAllTasksComplete(gameState, currentLevel)}
                onNextLevel={advanceLevel}
                currentItem={currentItem}
              />
            )}
          </main>
        ) : (
          <RequirementNotice reason={touchOnly ? 'keyboard' : 'width'} />
        )}
      </div>
    </GlitchOverlay>
  );
}
