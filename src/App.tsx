import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { LEVELS } from './constants/levels';
import { INITIAL_FS, applyFileSystemMutations } from './constants/filesystem';
import { EPISODE_LORE, ECHO_EPISODE_1_LORE } from './constants/narrative';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from './constants/protocols';
import { getPlayerIdentity } from './constants/identity';
import { buildEpisodes } from './utils/episodes';
import { InputModal } from './components/InputModal';
import {
  getNodeByPath,
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
import { checkAllTasksComplete, getLevelStartPath } from './utils/gameUtils';
import StatusBar from './components/StatusBar';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { QuestMapModal } from './components/QuestMapModal';
import { EpisodeIntro } from './components/EpisodeIntro';
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
import { GCommandDialog } from './components/GCommandDialog';
import { DiegeticPrompt } from './components/ui/DiegeticPrompt';
import { GlitchOverlay } from './components/ui/GlitchOverlay';
import { useConsciousness } from './hooks/useConsciousness';
import { gameReducer, type Action } from './hooks/gameReducer';
import { MemoizedFileSystemPane as FileSystemPane } from './components/FileSystemPane';
import { MemoizedPreviewPane as PreviewPane } from './components/PreviewPane';
import { reportError } from './utils/error';
import { measure } from './utils/perf';
import { cancelDelete, confirmDelete } from './hooks/keyboard/handleDeleteMode';
import { handleHelpModeKeyDown } from './hooks/keyboard/handleHelpMode';
import { handleOverwriteConfirmKeyDown } from './hooks/keyboard/handleOverwriteMode';
import { handleQuestMapModeKeyDown } from './hooks/keyboard/handleQuestMapMode';
import { useGameTimer } from './hooks/useGameTimer';
import { useReduceMotion } from './hooks/useReduceMotion';
import { useFileManagerView, useTouchOnly } from './hooks/useViewportFloor';
import { ViewportGate } from './components/ViewportGate';
import {
  buildDeleteModalData,
  handleSortWarningKey,
  runGameLoopKeyDown,
} from './hooks/keyboard/gameLoopHelpers';
import {
  hasBaselineViolation,
  hasSearchViolation,
  isProtocolWarningOpen,
} from './hooks/keyboard/utils';
import { useGlobalInput } from './GlobalInputContext';
import { useNarrativeSystem } from './hooks/useNarrativeSystem';
import { createInitialState } from './hooks/initialState';
import {
  getSkipIntroRequested,
  setSkipIntroRequested,
  resetSkipIntroRequested,
} from './utils/skipIntroFlag';
import './glitch.css';
import './glitch-thought.css';
import type { FileNode, GameState } from './types';
import { persistUnlockedLevelIndex, resetUnlockedLevel } from './utils/progressionStorage';
import { hasProgressOverride, resetGameSession, saveGameSession } from './utils/gameSessionStorage';

const HelpModal = lazy(() =>
  import('./components/HelpModal').then((m) => ({ default: m.HelpModal }))
);
const OutroSequence = lazy(() =>
  import('./components/OutroSequence').then((m) => ({ default: m.OutroSequence }))
);
const BiosBoot = lazy(() => import('./components/BiosBoot').then((m) => ({ default: m.BiosBoot })));
const FuzzyFinder = lazy(() =>
  import('./components/FuzzyFinder').then((m) => ({ default: m.FuzzyFinder }))
);

const EPISODES = buildEpisodes(LEVELS);

const hideHiddenSearchResults = (results: FileNode[], showHidden: boolean): FileNode[] => {
  if (showHidden) return results;
  return results.filter((item) => {
    const path = item.displayPath ?? item.display;
    return path
      ? !path.split('/').some((part) => part.startsWith('.'))
      : !item.name.startsWith('.');
  });
};

const shouldPersistFromUrl = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return !hasProgressOverride(params);
};

const useKeyboardFocusRing = (): boolean => {
  const [hasKeyboardInteraction, setHasKeyboardInteraction] = useState(false);
  useEffect(() => {
    const enableFocusRing = () => setHasKeyboardInteraction(true);
    window.addEventListener('keydown', enableFocusRing, { capture: true, once: true });
    return () => window.removeEventListener('keydown', enableFocusRing, true);
  }, []);
  return hasKeyboardInteraction;
};

const usePersistProgress = (
  zoxideData: GameState['zoxideData'],
  cycleCount: number | undefined,
  levelIndex: number,
  shouldPersistProgress: boolean
): void => {
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(zoxideData));
      localStorage.setItem('yazi-quest-cycle', (cycleCount ?? 1).toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [zoxideData, cycleCount]);

  useEffect(() => {
    if (shouldPersistProgress) persistUnlockedLevelIndex(levelIndex);
  }, [levelIndex, shouldPersistProgress]);
};

const usePersistSession = (gameState: GameState, enabled: boolean): boolean => {
  const current = useRef(gameState);
  const [saveFailed, setSaveFailed] = useState(false);
  useLayoutEffect(() => {
    current.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!enabled) return;
    const save = () => {
      if (current.current.levelIndex < LEVELS.length) saveGameSession(current.current);
      else resetGameSession();
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      if (gameState.levelIndex >= LEVELS.length) {
        resetGameSession();
      } else {
        setSaveFailed(!saveGameSession(gameState));
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [gameState, enabled]);
  return saveFailed;
};

const SessionSaveWarning: React.FC<{ failed: boolean }> = ({ failed }) =>
  failed ? (
    <p
      role="alert"
      className="shrink-0 border-b border-amber-500/50 bg-zinc-900 px-3 py-2 text-sm text-amber-200"
    >
      Progress is not being saved. Check browser storage. An unreadable save is preserved until you
      restart the current cycle.
    </p>
  ) : null;

const useRestartCycle = (dispatch: React.Dispatch<Action>, shouldPersistProgress: boolean) =>
  useCallback(() => {
    resetSkipIntroRequested();
    if (shouldPersistProgress) {
      resetUnlockedLevel();
      resetGameSession();
    }
    dispatch({ type: 'RESTART_CYCLE' });
  }, [dispatch, shouldPersistProgress]);

const useSearchConfirmation = (gameState: GameState, dispatch: React.Dispatch<Action>) =>
  useCallback(() => {
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

const useEpisodeBootTransition = (levelIndex: number, showEpisodeIntro: boolean) => {
  const [showBoot, setShowBoot] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(() =>
    showEpisodeIntro ? 1 : Math.ceil((levelIndex + 1) / 5)
  );

  const derivedEpisode = Math.ceil((levelIndex + 1) / 5);
  if (derivedEpisode !== currentEpisode && !showEpisodeIntro) {
    setCurrentEpisode(derivedEpisode);
    setShowBoot(true);
  }

  return { showBoot, setShowBoot, currentEpisode };
};

const SORT_MENU_OPTIONS: ReadonlyArray<{
  key: string;
  label: string;
  by: GameState['sortBy'];
  dir: GameState['sortDirection'];
}> = [
  { key: 'n', label: 'Natural', by: 'natural', dir: 'asc' },
  { key: 'N', label: 'Natural (rev)', by: 'natural', dir: 'desc' },
  { key: 'a', label: 'A-Z', by: 'alphabetical', dir: 'asc' },
  { key: 'A', label: 'Z-A', by: 'alphabetical', dir: 'desc' },
  { key: 'm', label: 'Modified (new)', by: 'modified', dir: 'desc' },
  { key: 'M', label: 'Modified (old)', by: 'modified', dir: 'asc' },
  { key: 's', label: 'Size (large)', by: 'size', dir: 'desc' },
  { key: 'S', label: 'Size (small)', by: 'size', dir: 'asc' },
  { key: 'e', label: 'Extension', by: 'extension', dir: 'asc' },
  { key: 'E', label: 'Extension (rev)', by: 'extension', dir: 'desc' },
];

const LINEMODE_MENU_OPTIONS: ReadonlyArray<[string, string]> = [
  ['l', 'Cycle Linemode'],
  ['-', 'Clear Linemode'],
];

interface SortOptionsMenuProps {
  sortBy: GameState['sortBy'];
  sortDirection: GameState['sortDirection'];
  linemode: GameState['linemode'];
}

const SortOptionsMenu: React.FC<SortOptionsMenuProps> = ({ sortBy, sortDirection, linemode }) => (
  <div className="fixed bottom-4 inset-x-4 z-20 max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-xs animate-terminal-rise sm:absolute sm:bottom-6 sm:left-auto sm:right-2 sm:w-80 sm:max-w-[calc(100%-1rem)]">
    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
        Sort Options
      </span>
      <span className="text-xs font-mono text-zinc-400">Press key · Esc cancel</span>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
      {SORT_MENU_OPTIONS.map(({ key, label, by, dir }) => {
        const isActive = sortBy === by && sortDirection === dir;
        return (
          <div key={key} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-orange-500 font-bold">{key}</span>
            <span className={isActive ? 'text-white font-bold' : 'text-zinc-400'}>{label}</span>
          </div>
        );
      })}
      <div className="col-span-2 border-t border-zinc-800 my-1" />
      {LINEMODE_MENU_OPTIONS.map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-orange-500 font-bold">{key}</span>
          <span
            className={
              key === 'l' && linemode !== 'none' ? 'text-white font-bold' : 'text-zinc-400'
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const resolveIntroEpisode = (episodeId: number, cycleCount?: number) => {
  const baseEpisode = EPISODE_LORE.find((e) => e.id === episodeId)!;
  if ((cycleCount || 1) > 1 && baseEpisode.id === 1) {
    return { ...baseEpisode, lore: ECHO_EPISODE_1_LORE };
  }
  return baseEpisode;
};

interface ProtocolWarningModalsProps {
  gameState: GameState;
  allowAutoFix: boolean;
  dismissWarning: (modal: 'sortWarning' | 'filterWarning' | 'searchWarning') => void;
  dismissHiddenWarning: () => void;
}

const ProtocolWarningModals: React.FC<ProtocolWarningModalsProps> = ({
  gameState,
  allowAutoFix,
  dismissWarning,
  dismissHiddenWarning,
}) => (
  <>
    {gameState.showHiddenWarning && (
      <HiddenFilesWarningModal allowAutoFix={allowAutoFix} onDismiss={dismissHiddenWarning} />
    )}
    {gameState.showSortWarning && (
      <SortWarningModal
        allowAutoFix={allowAutoFix}
        onDismiss={() => dismissWarning('sortWarning')}
      />
    )}
    {gameState.showFilterWarning && (
      <FilterWarningModal
        allowAutoFix={allowAutoFix}
        onDismiss={() => dismissWarning('filterWarning')}
      />
    )}
    {gameState.showSearchWarning && (
      <SearchWarningModal
        allowAutoFix={allowAutoFix}
        onDismiss={() => dismissWarning('searchWarning')}
      />
    )}
  </>
);

function useToolbarActions(
  gameState: GameState,
  setUtilityPanel: (panel: 'help' | 'hint' | 'map', visible: boolean) => void,
  dispatch: React.Dispatch<Action>,
  shouldPersistProgress: boolean,
  onReturnFocusToFiles: () => void
) {
  const handleToggleHint = useCallback(() => {
    setUtilityPanel('hint', !gameState.showHint);
    dispatch({ type: 'SET_HINT_STAGE', stage: 0 });
  }, [setUtilityPanel, gameState.showHint, dispatch]);

  const handleSelectEpisode = useCallback(
    (tab: number) => dispatch({ type: 'UPDATE_QUEST_MAP', tab, missionIdx: 0 }),
    [dispatch]
  );

  const handleToggleHelp = useCallback(
    () => setUtilityPanel('help', !gameState.showHelp),
    [setUtilityPanel, gameState.showHelp]
  );

  const handleCloseMap = useCallback(
    () => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'map', visible: false }),
    [dispatch]
  );

  const handleToggleMap = useCallback(
    () => setUtilityPanel('map', !gameState.showMap),
    [setUtilityPanel, gameState.showMap]
  );

  const handleJumpToLevel = useCallback(
    (idx: number) => {
      const lvl = LEVELS[idx];
      const scenarioOverride = new URLSearchParams(window.location.search).get('scenario');
      const fs = applyFileSystemMutations(cloneFS(INITIAL_FS), lvl.id, {
        levelIndex: gameState.levelIndex,
        level11Flags: gameState.level11Flags,
        scenarioOverride,
      });
      dispatch({
        type: 'SET_LEVEL',
        index: idx,
        fs,
        path: getLevelStartPath(fs, lvl),
        showIntro: lvl.episodeId !== LEVELS[gameState.levelIndex].episodeId,
        notification: null,
        zoxideData: gameState.zoxideData,
      });
      requestAnimationFrame(onReturnFocusToFiles);
    },
    [gameState, dispatch, onReturnFocusToFiles]
  );

  const handleDismissAlert = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ALERT', id }),
    [dispatch]
  );

  const handleResetCurrentCycle = useCallback(() => {
    if (
      !window.confirm(
        'Restart this cycle from Level 1? Current-cycle progress will be lost; the cycle number stays the same.'
      )
    ) {
      return;
    }
    resetUnlockedLevel();
    resetGameSession();
    resetSkipIntroRequested();
    dispatch({ type: 'RESET_CURRENT_CYCLE' });
  }, [dispatch]);

  return {
    handleToggleHint,
    handleSelectEpisode,
    handleToggleHelp,
    handleCloseMap,
    handleToggleMap,
    handleJumpToLevel,
    handleDismissAlert,
    onResetCycle: shouldPersistProgress ? handleResetCurrentCycle : undefined,
  };
}

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [shouldPersistProgress] = useState(shouldPersistFromUrl);
  const hasKeyboardInteraction = useKeyboardFocusRing();
  const reduceMotion = useReduceMotion(gameState.settings.narrativeEffects);
  const atFloor = useFileManagerView();
  const touchOnly = useTouchOnly();
  const filePaneRef = useRef<HTMLDivElement>(null);
  const returnFocusToFiles = useCallback(() => {
    filePaneRef.current?.focus({ preventScroll: true });
  }, []);
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
  const [isMissionDrawerOpen, setIsMissionDrawerOpen] = useState(true);
  const { showBoot, setShowBoot, currentEpisode } = useEpisodeBootTransition(
    gameState.levelIndex,
    gameState.showEpisodeIntro
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

  usePersistProgress(
    gameState.zoxideData,
    gameState.cycleCount,
    gameState.unlockedLevelIndex,
    shouldPersistProgress
  );
  const sessionSaveFailed = usePersistSession(gameState, shouldPersistProgress);

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
    gameState.mode === 'confirm-delete' ||
    gameState.mode === 'overwrite-confirm' ||
    gameState.showThreatAlert ||
    isProtocolWarningOpen(gameState)
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
        title: `${getPlayerIdentity(gameState.cycleCount ?? 1)} INITIALIZATION`,
        description: `{CONSCIOUSNESS DETECTED}. Re-image complete. Subject ${getPlayerIdentity(gameState.cycleCount ?? 1)} Online. Monitoring started.`,
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

          // Results are a snapshot from when the search ran; hidden may have changed since.
          results = hideHiddenSearchResults(results, gameState.showHidden);

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

  const parentItems = useMemo(() => {
    const items = parent?.children ? sortNodes(parent.children, 'natural', 'asc') : [];
    return gameState.showHidden ? items : items.filter((c) => !c.name.startsWith('.'));
  }, [parent, gameState.showHidden]);

  const toggleMissionDrawer = useCallback(() => {
    setIsMissionDrawerOpen((prev) => !prev);
  }, []);

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

      if (hasSearchViolation(gameState)) {
        warningActive = true;
        if (!gameState.showSearchWarning) {
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: true });
        }
      } else if (gameState.showSearchWarning) {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: false });
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
    gameState.showSearchWarning,
    gameState.searchQuery,
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

    // Priority: Hidden > Sort > Filter > Search
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
    } else if (hasSearchViolation(gameState)) {
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: true });
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
      const scenarioOverride = new URLSearchParams(window.location.search).get('scenario');
      fs = applyFileSystemMutations(fs, nextLevel.id, {
        levelIndex: gameState.levelIndex,
        level11Flags: gameState.level11Flags,
        scenarioOverride,
      });
    } catch (err) {
      reportError(err, { phase: 'applyFileSystemMutations', level: nextLevel?.id });
      onEnterError = err as Error;
    }

    const now = Date.now();
    const targetPath = getLevelStartPath(fs, nextLevel);
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

  const handleRestartCycle = useRestartCycle(dispatch, shouldPersistProgress);

  const handleBootComplete = useCallback(
    (options?: { isSkip?: boolean }) => {
      dispatch({ type: 'COMPLETE_INTRO', isSkip: options?.isSkip });
    },
    [dispatch]
  );

  const handleSearchConfirm = useSearchConfirmation(gameState, dispatch);

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

  const {
    handleToggleHint,
    handleSelectEpisode,
    handleToggleHelp,
    handleCloseMap,
    handleToggleMap,
    handleJumpToLevel,
    handleDismissAlert,
    onResetCycle,
  } = useToolbarActions(
    gameState,
    setUtilityPanel,
    dispatch,
    shouldPersistProgress,
    returnFocusToFiles
  );

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
          const nextStage = Math.min(2, gameState.hintStage + 1);
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
      if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault();
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
      handleHelpModeKeyDown(e, {
        gameState,
        dispatch,
        onClose: () => dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false }),
      });
      return true;
    },
    [gameState.showHelp, gameState, dispatch],
    { priority: 1000, enabled: gameState.showHelp, captureInput: true }
  );

  useGlobalInput(
    (e) => {
      handleQuestMapModeKeyDown(e, {
        gameState,
        dispatch,
        levels: LEVELS,
        episodes: EPISODES,
        onClose: handleCloseMap,
        onJumpToLevel: handleJumpToLevel,
      });
      return true;
    },
    [gameState, dispatch, handleCloseMap, handleJumpToLevel],
    { priority: 1000, enabled: gameState.showMap }
  );

  useGlobalInput(
    (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
        return true;
      }
      return false;
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
    if (hasSearchViolation(gameState)) {
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
    }

    setTimeout(() => dispatch({ type: 'SET_MODE', mode: 'normal' }), 1000);
  }, [gameState, dispatch]);

  const dismissWarning = useCallback((modal: 'filterWarning' | 'searchWarning' | 'sortWarning') => {
    if (modal === 'searchWarning') {
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
      dispatch({ type: 'SET_CURSOR', index: 0 });
      dispatch({ type: 'SET_SELECTION', ids: [] });
      dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'SearchCleared' });
    }
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal, visible: false });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
  }, []);

  const confirmWarningModal = useCallback(
    (modal: 'hiddenWarning' | 'filterWarning' | 'sortWarning', tasksComplete: boolean) => {
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal, visible: false });
      if (tasksComplete) {
        handleAutoFixBaseline();
      } else {
        dispatch({ type: 'SET_MODE', mode: 'normal' });
        dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
      }
    },
    [dispatch, handleAutoFixBaseline]
  );

  // Hidden Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === '.') {
        dispatch({ type: 'TOGGLE_HIDDEN' });
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        confirmWarningModal('hiddenWarning', tasksComplete);
        return true;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });
      }
      return true;
    },
    [gameState, currentLevel, checkAllTasksComplete, confirmWarningModal],
    { priority: 800, enabled: gameState.showHiddenWarning }
  );

  // Filter Warning
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        confirmWarningModal('filterWarning', tasksComplete);
        return true;
      }
      if (e.key === 'Escape') {
        dismissWarning('filterWarning');
        return true;
      }
      return true;
    },
    [gameState, currentLevel, confirmWarningModal, dismissWarning],
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
          dismissWarning('searchWarning');
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
    (e) =>
      handleSortWarningKey(e, {
        gameState,
        currentLevel,
        dispatch,
        confirmWarningModal,
        dismissWarning,
      }),
    [gameState, currentLevel, dispatch, confirmWarningModal, dismissWarning],
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
          if (hasSearchViolation(gameState)) {
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
    (e) =>
      runGameLoopKeyDown(e, {
        gameState,
        currentLevel,
        isLastLevel,
        filePaneEl: filePaneRef.current,
        visibleItems,
        parent,
        currentItem,
        dispatch,
        advanceLevel,
        showNotification,
        checkAllTasksComplete,
      }),
    [
      gameState,
      currentLevel,
      isLastLevel,
      advanceLevel,
      showNotification,
      visibleItems,
      currentItem,
      parent,
      dispatch,
      checkAllTasksComplete,
    ],
    { priority: 0, captureInput: true }
  );

  const gameShell = (
    <>
      {!gameState.showEpisodeIntro && (
        <>
          <LevelProgress
            levels={LEVELS}
            currentLevelIndex={gameState.levelIndex}
            unlockedLevelIndex={gameState.unlockedLevelIndex}
            thought={gameState.thought}
            isMapOpen={Boolean(gameState.showMap)}
            onToggleHint={handleToggleHint}
            onToggleHelp={handleToggleHelp}
            onToggleMap={handleToggleMap}
            onReturnFocusToFiles={returnFocusToFiles}
          />
          <SessionSaveWarning failed={sessionSaveFailed} />
          <main className="flex flex-col flex-1 min-h-0 min-w-0">
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

            <SystemAlerts alerts={gameState.alerts} onDismiss={handleDismissAlert} />

            <div className="flex flex-1 min-h-0 relative">
              <FileSystemPane
                items={parentItems}
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
                className={`${atFloor ? 'flex' : 'hidden'} border-r border-zinc-800 bg-zinc-950/50`}
              />

              <div className="flex-1 flex flex-col min-w-0 sm:relative">
                <FileSystemPane
                  showFocusRing={hasKeyboardInteraction && gameState.mode === 'normal'}
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
                  <SortOptionsMenu
                    sortBy={gameState.sortBy}
                    sortDirection={gameState.sortDirection}
                    linemode={gameState.linemode}
                  />
                )}

                {gameState.mode === 'g-command' && (
                  <GCommandDialog
                    levelId={currentLevel.id}
                    onClose={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
                  />
                )}

                {gameState.mode === 'search' && (
                  <InputModal
                    label="Search via fd"
                    value={gameState.inputBuffer}
                    onChange={(val) => dispatch({ type: 'SET_INPUT_BUFFER', buffer: val })}
                    onConfirm={handleSearchConfirm}
                    onCancel={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
                    borderColorClass="border-cyan-500/70"
                    labelColorClass="text-cyan-400"
                    testid="search-input"
                  />
                )}

                {gameState.mode === 'input-file' && (
                  <InputModal
                    label="Create"
                    value={gameState.inputBuffer}
                    onChange={(val) => dispatch({ type: 'SET_INPUT_BUFFER', buffer: val })}
                    onConfirm={handleInputConfirm}
                    onCancel={() => dispatch({ type: 'SET_MODE', mode: 'normal' })}
                    borderColorClass="border-green-500"
                    labelColorClass="text-green-500"
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
                      dispatch({ type: 'SET_MODE', mode: 'normal' });
                      dispatch({ type: 'INCREMENT_STAT', stat: 'filterUsage' });
                    }}
                    borderColorClass="border-purple-500"
                    labelColorClass="text-purple-400"
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
                    labelColorClass="text-cyan-400"
                    testid="rename-input"
                  />
                )}

                {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
                  <Suspense fallback={null}>
                    <FuzzyFinder gameState={gameState} dispatch={dispatch} />
                  </Suspense>
                )}
              </div>

              <PreviewPane
                node={currentItem}
                level={currentLevel}
                gameState={gameState}
                previewScroll={gameState.previewScroll}
                dispatch={dispatch}
                isMissionDrawerOpen={isMissionDrawerOpen}
                onToggleMissionDrawer={toggleMissionDrawer}
              />
            </div>
          </main>

          <StatusBar
            state={gameState}
            level={currentLevel}
            allTasksComplete={checkAllTasksComplete(gameState, currentLevel)}
            onNextLevel={advanceLevel}
            currentItem={currentItem}
          />
        </>
      )}
    </>
  );

  if (gameState.isBooting) {
    return (
      <Suspense fallback={null}>
        <BiosBoot
          onComplete={handleBootComplete}
          cycleCount={gameState.cycleCount || 1}
          reduceMotion={reduceMotion}
        />
      </Suspense>
    );
  }

  if (isLastLevel) {
    return (
      <Suspense fallback={null}>
        <OutroSequence
          onRestartCycle={handleRestartCycle}
          reduceMotion={reduceMotion}
          showFocusRing={hasKeyboardInteraction}
        />
      </Suspense>
    );
  }

  return (
    <GlitchOverlay
      threatLevel={gameState.threatLevel}
      consciousnessLevel={consciousnessLevel}
      enabled={!reduceMotion && gameState.settings.narrativeEffects === 'full'}
    >
      <div
        className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative"
        style={
          gameState.mode === 'auto-fix' && !reduceMotion ? { filter: 'url(#codrops-glitch)' } : {}
        }
      >
        {gameState.mode === 'auto-fix' && !reduceMotion && <CodropsGlitchSVG />}
        {gameState.showEpisodeIntro && !gameState.ignoreEpisodeIntro && (
          <EpisodeIntro
            showFocusRing={hasKeyboardInteraction}
            reduceMotion={reduceMotion}
            episode={resolveIntroEpisode(currentLevel.episodeId, gameState.cycleCount)}
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

        <ViewportGate
          atFloor={atFloor}
          showEpisodeIntro={gameState.showEpisodeIntro}
          isGameOver={gameState.isGameOver}
          touchOnly={touchOnly}
        >
          {gameShell}
        </ViewportGate>

        {gameState.isGameOver && (
          <GameOverModal
            reason={gameState.gameOverReason!}
            onRestart={handleRestartLevel}
            efficiencyTip={currentLevel.efficiencyTip}
            level={currentLevel}
            customMessage={gameState.notification?.message}
          />
        )}

        {gameState.showMap && (
          <QuestMapModal
            levels={LEVELS}
            episodes={EPISODES}
            activeTab={gameState.questMapTab}
            selectedMissionIdx={gameState.questMapMissionIdx}
            currentLevelIndex={gameState.levelIndex}
            unlockedLevelIndex={gameState.unlockedLevelIndex}
            onClose={handleCloseMap}
            onSelectEpisode={handleSelectEpisode}
            onJumpToLevel={handleJumpToLevel}
            onResetCycle={onResetCycle}
          />
        )}

        {gameState.showHelp && (
          <Suspense fallback={null}>
            <HelpModal
              onClose={() =>
                dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: false })
              }
              scrollPosition={gameState.helpScrollPosition || 0}
              level={currentLevel}
              gameState={gameState}
              dispatch={dispatch}
              narrativeEffects={gameState.settings.narrativeEffects}
            />
          </Suspense>
        )}

        {gameState.showHint && (
          <HintModal
            hint={currentLevel.hint}
            stage={gameState.hintStage}
            returnFocusTo={filePaneRef}
            onClose={() => {
              dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hint', visible: false });
              dispatch({ type: 'SET_HINT_STAGE', stage: 0 });
            }}
            onNextStage={() =>
              dispatch({
                type: 'SET_HINT_STAGE',
                stage: Math.min(2, gameState.hintStage + 1),
              })
            }
          />
        )}

        {gameState.showInfoPanel && (
          <InfoPanel
            file={currentItem}
            showHidden={gameState.showHidden}
            onClose={() =>
              dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'info', visible: false })
            }
          />
        )}

        {gameState.mode === 'confirm-delete' && (
          <ConfirmationModal
            deleteType={gameState.deleteType}
            {...buildDeleteModalData(gameState, visibleItems)}
            onConfirm={() => confirmDelete({ gameState, dispatch, visibleItems, currentLevel })}
            onCancel={() => cancelDelete(dispatch)}
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

        <ProtocolWarningModals
          gameState={gameState}
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          dismissWarning={dismissWarning}
          dismissHiddenWarning={() =>
            dispatch({
              type: 'SET_MODAL_VISIBILITY',
              modal: 'hiddenWarning',
              visible: false,
            })
          }
        />

        {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
          <OverwriteModal
            fileName={gameState.pendingOverwriteNode.name}
            onDecision={(key) => handleOverwriteConfirmKeyDown(key, { gameState, dispatch })}
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
      </div>
    </GlitchOverlay>
  );
}
