import React, { useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import {
  LEVELS,
  INITIAL_FS,
  EPISODE_LORE,
  ECHO_EPISODE_1_LORE,
  ensurePrerequisiteState,
} from './constants';
import type { GameState, ZoxideEntry, FileNode, FsError } from './types';
import type { Action } from './hooks/gameReducer';
import { InputModal } from './components/InputModal';
import { calculateFrecency } from './types';
import {
  getNodeByPath,
  getParentNode,
  getNodeById,
  renameNode,
  cloneFS,
  createPath,
  resolveAndCreatePath,
  getAllDirectoriesWithPaths,
  resolvePath,
  getRecursiveContent,
  isProtected,
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
import { checkFilterAndBlockNavigation, getActionIntensity } from './hooks/keyboard/utils';
import { useGlobalInput } from './hooks/useGlobalInput';
import { useNarrative } from './hooks/useNarrative';
import { getLevelEntryNarrative } from './utils/narrativeUtils';
import { InputPriority } from './GlobalInputContext';
import { KEYBINDINGS } from './constants/keybindings';
import './glitch.css';
import './glitch-text-3.css';
import './glitch-thought.css';

// Helper to get a random element from an array
const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// Find the narrative description for a given key
const getNarrativeAction = (key: string): string | null => {
  const binding = KEYBINDINGS.find((b) => b.keys.includes(key));
  if (binding && binding.narrativeDescription) {
    if (Array.isArray(binding.narrativeDescription)) {
      return getRandomElement(binding.narrativeDescription);
    }
    return binding.narrativeDescription as string;
  }
  return null;
};

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
    const { notification: initialNotification, thought: initialThought } = getLevelEntryNarrative(
      initialLevel,
      { completedTaskIds },
      isDevOverride
    );

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
            : initialNotification,
      thought:
        (targetIndex === 0 || isEpisodeStart) && !skipIntro ? null : initialThought,
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
  });

  // Honor a global test flag to skip all intro/boot overlays immediately if requested.
  useEffect(() => {
    if (window.__yaziQuestSkipIntroRequested) {
      dispatch({ type: 'UPDATE_UI_STATE', updates: { showEpisodeIntro: false, isBooting: false } });
    }
  }, [dispatch]);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(gameState.zoxideData));
      localStorage.setItem('yazi-quest-cycle', gameState.cycleCount.toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [gameState.zoxideData, gameState.cycleCount]);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thoughtTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const triggerThought = useCallback(
    (message: string, _duration: number = 4000, author?: string) => {
      if (thoughtTimerRef.current) {
        clearTimeout(thoughtTimerRef.current);
      }
      dispatch({ type: 'SET_THOUGHT', message: message, author: author });
      // Narrative thoughts no longer auto-clear per user request.
      thoughtTimerRef.current = null;
    },
    [dispatch]
  );

  // Helper to show notification with auto-clear
  const showNotification = useCallback(
    (message: string, duration: number = 2000, isThought: boolean = false, author?: string) => {
      // If used for thoughts, redirect to triggerThought (compatibility)
      if (isThought) {
        triggerThought(message, duration, author);
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
    [dispatch, triggerThought]
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

  const handleSearchConfirm = useCallback(() => {
    if (gameState.mode === 'search') {
      const query = gameState.inputBuffer;
      // Perform recursive search starting from CURRENT directory
      const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
      const results = currentDir
        ? getRecursiveSearchResults(currentDir, query, gameState.showHidden)
        : [];

      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'normal',
          searchQuery: query,
          searchResults: results,
          inputBuffer: '',
          usedSearch: true,
          cursorIndex: 0,
          previewScroll: 0,
          stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 },
        },
      });
    }
  }, [
    gameState.mode,
    gameState.inputBuffer,
    gameState.fs,
    gameState.currentPath,
    gameState.showHidden,
    gameState.stats,
    dispatch,
  ]);

  const handleInputConfirm = useCallback(() => {
    if (gameState.mode === 'input-file') {
      const input = gameState.inputBuffer || '';

      // If the input contains a path separator or references ~ or /, resolve and create the whole path
      if (input.includes('/') || input.startsWith('~') || input.startsWith('/')) {
        const {
          fs: newFs,
          targetNode,
          error,
          collision,
          collisionNode,
        } = resolveAndCreatePath(gameState.fs, gameState.currentPath, input);
        if (collision && collisionNode) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'overwrite-confirm',
              pendingOverwriteNode: collisionNode,
              notification: { message: 'Collision detected' },
            },
          });
          return;
        }
        if (error) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              notification: { message: error },
              inputBuffer: '',
            },
          });
          return;
        }
        // Ensure the newly created node appears in the UI according to the current sort
        const sortedFs = cloneFS(newFs);

        // 1. Sort the immediate parent of the created node (deep sort)
        if (targetNode) {
          const parentNode = getNodeById(sortedFs, targetNode.parentId as string);
          if (parentNode && parentNode.children) {
            parentNode.children = sortNodes(
              parentNode.children,
              gameState.sortBy,
              gameState.sortDirection
            );
          }
        }

        // 2. Determine which node in the CURRENT view to highlight
        let nodeToHighlightId: string | undefined;
        if (targetNode) {
          // Robustly find the child in the current view that leads to targetNode
          const currentDirId = gameState.currentPath[gameState.currentPath.length - 1];

          let candidate: FileNode | undefined = targetNode;
          // Traverse up from targetNode until we find a node whose parent is the current directory
          while (candidate && candidate.parentId !== currentDirId) {
            // Look up parent
            candidate = getNodeById(sortedFs, candidate.parentId as string);
            // Safety break for root or detached nodes
            if (!candidate || candidate.id === sortedFs.id) break;
          }

          if (candidate && candidate.parentId === currentDirId) {
            nodeToHighlightId = candidate.id;
          }
        }

        // 3. Sort the CURRENT directory (visible view) and find index
        const currentDirNode = getNodeByPath(sortedFs, gameState.currentPath);
        let newCursorIndex = 0;

        if (currentDirNode && currentDirNode.children) {
          // Sort current directory
          currentDirNode.children = sortNodes(
            currentDirNode.children,
            gameState.sortBy,
            gameState.sortDirection
          );

          // Find cursor index
          if (nodeToHighlightId) {
            let visibleChildren = currentDirNode.children;
            if (!gameState.showHidden) {
              visibleChildren = visibleChildren.filter((c) => !c.name.startsWith('.'));
            }
            const idx = visibleChildren.findIndex((c) => c.id === nodeToHighlightId);
            if (idx >= 0) newCursorIndex = idx;
          }
        }

        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: sortedFs,
            mode: 'normal',
            inputBuffer: '',
            cursorIndex: newCursorIndex,
            notification: {
              message: getNarrativeAction('a') || (targetNode ? 'PATH CREATED' : 'FILE CREATED'),
            },
          },
        });
        return;
      }

      const {
        fs: newFs,
        error,
        collision,
        collisionNode,
        newNodeId,
      } = createPath(gameState.fs, gameState.currentPath, input);
      if (collision && collisionNode) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'overwrite-confirm',
            pendingOverwriteNode: collisionNode,
            notification: { message: 'Collision detected' },
          },
        });
      } else if (error) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            notification: { message: error },
            inputBuffer: '',
          },
        });
      } else {
        // Ensure created node shows up in the expected sorted position
        const sortedFs2 = cloneFS(newFs);
        const parentNode2 = getNodeByPath(sortedFs2, gameState.currentPath);
        if (parentNode2 && parentNode2.children) {
          parentNode2.children = sortNodes(
            parentNode2.children,
            gameState.sortBy,
            gameState.sortDirection
          );
        }
        // Find the index of the newly created item to position cursor on it
        // Need to account for hidden files filtering in the visible list
        let visibleChildren = parentNode2?.children || [];
        if (!gameState.showHidden) {
          visibleChildren = visibleChildren.filter((c) => !c.name.startsWith('.'));
        }
        const newCursorIndex = visibleChildren.findIndex((c) => c.id === newNodeId);
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: sortedFs2,
            mode: 'normal',
            inputBuffer: '',
            cursorIndex: newCursorIndex >= 0 ? newCursorIndex : 0,
            notification: { message: getNarrativeAction('a') || 'FILE CREATED' },
          },
        });
      }
    }
  }, [
    gameState.mode,
    gameState.inputBuffer,
    gameState.fs,
    gameState.currentPath,
    gameState.sortBy,
    gameState.sortDirection,
    gameState.showHidden,
    dispatch,
  ]);

  const handleRenameConfirm = useCallback(() => {
    if (currentItem) {
      const res = renameNode(
        gameState.fs,
        gameState.currentPath,
        currentItem.id,
        gameState.inputBuffer,
        gameState.levelIndex
      );
      if (!res.ok) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            notification: {
              message: `Rename failed: ${(res as { ok: false; error: FsError }).error}`,
            },
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: res.value,
            mode: 'normal',
            notification: { message: getNarrativeAction('r') || 'Renamed' },
            stats: { ...gameState.stats, renames: gameState.stats.renames + 1 },
          },
        });
      }
    }
  }, [
    currentItem,
    gameState.fs,
    gameState.currentPath,
    gameState.inputBuffer,
    gameState.levelIndex,
    gameState.stats,
    dispatch,
  ]);

  const handleFuzzySelect = useCallback(
    (path: string, isZoxide: boolean, pathIds?: string[]) => {
      if (isZoxide) {
        // Resolve a path string like "/tmp" or "/home/guest/.config" into node ID path
        const parts = path.split('/').filter(Boolean);
        let cur: FileNode | undefined = gameState.fs;
        const idPath: string[] = [gameState.fs.id];
        let found = true;
        for (const part of parts) {
          if (!cur?.children) {
            found = false;
            break;
          }
          const next = cur.children.find((c: FileNode) => c.name === part);
          if (!next) {
            found = false;
            break;
          }
          idPath.push(next.id);
          cur = next;
        }

        if (found) {
          const now = Date.now();
          const notification =
            gameState.levelIndex === 6
              ? { message: '>> QUANTUM TUNNEL ESTABLISHED <<' }
              : { message: `Jumped to ${path}` };

          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              currentPath: idPath,
              cursorIndex: 0,
              notification,
              stats: { ...gameState.stats, fuzzyJumps: gameState.stats.fuzzyJumps + 1 },
              zoxideData: {
                ...gameState.zoxideData,
                [path]: {
                  count: (gameState.zoxideData[path]?.count || 0) + 1,
                  lastAccess: now,
                },
              },
              history: [...gameState.history, gameState.currentPath],
              future: [],
              usedPreviewDown: false,
              usedPreviewUp: false,
            },
          });
        } else {
          // Fallback: if path resolution fails, close dialog
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
        }
      } else {
        // FZF click/select handling: pathIds contains node id path relative to currentPath
        if (pathIds && Array.isArray(pathIds)) {
          const fullPathAbs =
            Array.isArray(pathIds) && pathIds[0] === gameState.fs.id
              ? pathIds
              : [...gameState.currentPath, ...pathIds];
          const targetDir = fullPathAbs.slice(0, -1);
          const fileId = fullPathAbs[fullPathAbs.length - 1];

          const parentNode = getNodeByPath(gameState.fs, targetDir);

          let sortedChildren = parentNode?.children || [];
          if (!gameState.showHidden) {
            sortedChildren = sortedChildren.filter((c) => !c.name.startsWith('.'));
          }
          sortedChildren = sortNodes(sortedChildren, gameState.sortBy, gameState.sortDirection);

          const fileIndex = sortedChildren.findIndex((c) => c.id === fileId);

          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              currentPath: targetDir,
              cursorIndex: fileIndex >= 0 ? fileIndex : 0,
              filters: { ...gameState.filters },
              inputBuffer: '',
              history: [...gameState.history, gameState.currentPath],
              future: [],
              notification: { message: `Found: ${path}` },
              usedPreviewDown: false,
              usedPreviewUp: false,
              stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 },
            },
          });
        } else {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
        }
      }
    },
    [
      gameState.fs,
      gameState.levelIndex,
      gameState.currentPath,
      gameState.showHidden,
      gameState.sortBy,
      gameState.sortDirection,
      gameState.stats,
      gameState.history,
      gameState.filters,
      gameState.zoxideData,
      dispatch,
    ]
  );

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      if (thoughtTimerRef.current) {
        clearTimeout(thoughtTimerRef.current);
      }
    };
  }, []);

  const { resetLevelAlerts } = useNarrative(gameState, dispatch, currentLevel, visibleItems);

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
          type: 'UPDATE_UI_STATE',
          updates: { showHiddenWarning: true, showSuccessToast: false },
        });
      } else if (!isSortDefault) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showSortWarning: true, showSuccessToast: false },
        });
      } else if (!isFilterClear) {
        if (gameState.mode !== 'filter-warning') {
          dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
        }
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showSuccessToast: false } });
      } else {
        let uiUpdates: Partial<GameState> = {
          showHiddenWarning: false,
          showSortWarning: false,
        };
        if (gameState.mode === 'filter-warning') {
          uiUpdates.mode = 'normal';
        }

        if (!gameState.showSuccessToast && !gameState.showEpisodeIntro) {
          playSuccessSound(gameState.settings.soundEnabled);
          uiUpdates.showSuccessToast = true;
        }
        dispatch({ type: 'UPDATE_UI_STATE', updates: uiUpdates });
      }
    } else {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      let uiUpdates: Partial<GameState> = {};
      if (!gameState.showHidden && gameState.showHiddenWarning) uiUpdates.showHiddenWarning = false;
      if (isSortDefault && gameState.showSortWarning) uiUpdates.showSortWarning = false;
      if (isFilterClear && gameState.mode === 'filter-warning') {
        uiUpdates.mode = 'normal';
      }
      if (Object.keys(uiUpdates).length > 0) {
        dispatch({ type: 'UPDATE_UI_STATE', updates: uiUpdates });
      }
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


  const advanceLevel = useCallback(() => {
    // Check for Protocol Violations before advancing
    // This prevents bypassing checks via SuccessToast or other means
    const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
    const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
    const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

    // Priority: Hidden > Sort > Filter
    if (gameState.showHidden) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { showHiddenWarning: true, showSuccessToast: false },
      });
      return;
    } else if (!isSortDefault) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { showSortWarning: true, showSuccessToast: false },
      });
      return;
    } else if (!isFilterClear) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { mode: 'filter-warning', showSuccessToast: false },
      });
      return;
    }

    // Calculate next state
    const nextIdx = gameState.levelIndex + 1;

    if (nextIdx >= LEVELS.length) {
      dispatch({ type: 'UPDATE_UI_STATE', updates: { levelIndex: nextIdx } });
      return;
    }

    const nextLevel = LEVELS[nextIdx];
    const isNewEp = nextLevel.episodeId !== LEVELS[gameState.levelIndex].episodeId;

    let fs = cloneFS(gameState.fs);
    let onEnterError: Error | null = null;
    try {
      const isFresh = JSON.stringify(gameState.fs) === JSON.stringify(INITIAL_FS);
      if (nextLevel.onEnter && (!nextLevel.seedMode || nextLevel.seedMode !== 'fresh' || isFresh)) {
        fs = nextLevel.onEnter(fs, gameState);
      }
    } catch (err) {
      try {
        reportError(err, { phase: 'nextLevel.onEnter', level: nextLevel?.id });
      } catch {
        console.error('nextLevel.onEnter failed', err);
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

    // Level-specific notifications for narrative events
    const { notification: levelNotification, thought: levelThought } = getLevelEntryNarrative(
      nextLevel,
      gameState,
      false
    );

    const finalNotification = onEnterError
      ? { message: 'Level initialization failed' }
      : levelNotification;

    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        levelIndex: nextIdx,
        fs: fs,
        levelStartFS: cloneFS(fs),
        levelStartPath: [...targetPath],
        currentPath: targetPath,
        cursorIndex: 0,
        clipboard: null,
        notification: finalNotification || null,
        thought: levelThought || null,
        selectedIds: [],
        showHint: false,
        hintStage: 0,
        showEpisodeIntro: isNewEp,
        timeLeft: nextLevel.timeLimit || null,
        keystrokes: 0,
        usedG: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        acceptNextKeyForSort: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        zoxideData: newZoxideData,
        future: [],
        previewScroll: 0,
        completedTaskIds: {
          ...gameState.completedTaskIds,
          [nextLevel.id]: [], // Ensure array exists for next level
        },
        // Ensure sort and filters are reset at the beginning of each level
        sortBy: 'natural',
        sortDirection: 'asc',
        filters: {},
        ignoreEpisodeIntro: false, // Reset the flag on successful level advance
        gauntletPhase: 0, // Reset gauntlet phase
        gauntletScore: 0,
        level11Flags: { triggeredHoneypot: false, selectedModern: false, scoutedFiles: [] },
        showSuccessToast: false,
        showThreatAlert: false,
      },
    });

    resetLevelAlerts(); // Reset so alert can show for new level
  }, [gameState, dispatch, resetLevelAlerts]);

  const handleRestartLevel = useCallback(() => {
    dispatch({
      type: 'SET_LEVEL',
      index: gameState.levelIndex,
      fs: cloneFS(gameState.levelStartFS),
      path: [...gameState.levelStartPath],
    });
    resetLevelAlerts(); // Reset so alert can show on restart
  }, [gameState.levelIndex, gameState.levelStartFS, gameState.levelStartPath, dispatch, resetLevelAlerts]);

  // Handle the end of the final level - trigger restart sequence
  const handleRestartCycle = useCallback(() => {
    dispatch({ type: 'RESTART_CYCLE' });
  }, [dispatch]);

  const handleBootComplete = useCallback(() => {
    dispatch({ type: 'UPDATE_UI_STATE', updates: { isBooting: false } });
  }, [dispatch]);

  // --- Handlers ---

  const handleZoxidePromptKeyDown = useCallback(
    (e: KeyboardEvent, gameState: GameState, dispatch: React.Dispatch<Action>) => {
      switch (e.key) {
        case 'Escape':
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          break;
        case 'Backspace':
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { inputBuffer: gameState.inputBuffer.slice(0, -1) },
          });
          break;
        case 'Enter': {
          const { zoxideData, inputBuffer } = gameState;
          const candidates = Object.keys(zoxideData)
            .map((path) => ({ path, score: calculateFrecency(zoxideData[path]) }))
            .sort((a, b) => b.score - a.score);
          const bestMatch = candidates.find((c) =>
            c.path.toLowerCase().includes(inputBuffer.toLowerCase())
          );

          if (bestMatch) {
            const currentLevel = LEVELS[gameState.levelIndex];
            const allDirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel).map((d) => ({
              node: d.node,
              path: d.path,
              display: resolvePath(gameState.fs, d.path),
            }));
            const match = allDirs.find((d) => d.display === bestMatch.path);
            if (match) {
              const protection = isProtected(
                gameState.fs,
                gameState.currentPath,
                match.node,
                currentLevel,
                'jump'
              );
              if (protection) {
                dispatch({
                  type: 'UPDATE_UI_STATE',
                  updates: {
                    mode: 'normal',
                    notification: { message: `🔒 ${protection}` },
                    inputBuffer: '',
                  },
                });
                return;
              }

              const now = Date.now();
              dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  mode: 'normal',
                  currentPath: match.path,
                  cursorIndex: 0,
                  notification: { message: `Jumped to ${bestMatch.path}` },
                  inputBuffer: '',
                  history: [...gameState.history, gameState.currentPath],
                  future: [],
                  stats: { ...gameState.stats, fuzzyJumps: gameState.stats.fuzzyJumps + 1 },
                  zoxideData: {
                    ...gameState.zoxideData,
                    [bestMatch.path]: {
                      count: (gameState.zoxideData[bestMatch.path]?.count || 0) + 1,
                      lastAccess: now,
                    },
                  },
                },
              });
            } else {
              dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  mode: 'normal',
                  inputBuffer: '',
                  notification: { message: `Path not found: ${bestMatch.path}` },
                },
              });
            }
          } else {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                mode: 'normal',
                inputBuffer: '',
                notification: { message: 'No match found' },
              },
            });
          }
          break;
        }
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: { inputBuffer: gameState.inputBuffer + e.key },
            });
          }
          break;
      }
    },
    []
  );

  const handleFuzzyModeKeyDown = useCallback(
    (e: KeyboardEvent, gameState: GameState, dispatch: React.Dispatch<Action>) => {
      // Match FuzzyFinder logic for consistency
      const isZoxide = gameState.mode === 'zoxide-jump';
      let candidates: { path: string; score: number; pathIds?: string[] }[] = [];
      if (isZoxide) {
        const currentLevel = LEVELS[gameState.levelIndex];
        candidates = Object.keys(gameState.zoxideData)
          .map((path) => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
          .sort((a, b) => {
            const diff = b.score - a.score;
            if (Math.abs(diff) > 0.0001) return diff;
            return a.path.localeCompare(b.path);
          })
          .filter((c) => {
            const dir = getAllDirectoriesWithPaths(gameState.fs, currentLevel).find(
              (d) => resolvePath(gameState.fs, d.path) === c.path
            );
            return dir && c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase());
          });
      } else {
        const currentLevel = LEVELS[gameState.levelIndex];
        candidates = getRecursiveContent(gameState.fs, gameState.currentPath, currentLevel)
          .filter((c: FileNode) => {
            const d = c.display;
            return (
              typeof d === 'string' && d.toLowerCase().includes(gameState.inputBuffer.toLowerCase())
            );
          })
          .map((c: FileNode) => ({
            path: String(c.display || ''),
            score: 0,
            pathIds: c.path,
            type: c.type,
            id: c.id,
          }));
      }

      switch (e.key) {
        case 'Enter': {
          if (gameState.mode === 'search') {
            handleSearchConfirm();
            return;
          }

          if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
            return;
          }

          const idx = gameState.fuzzySelectedIndex || 0;
          const selected = candidates[idx];
          if (selected) {
            if (isZoxide) {
              const currentLevel = LEVELS[gameState.levelIndex];
              // Find path ids from string
              const allDirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel).map((d) => {
                return {
                  ...d.node,
                  path: d.path,
                  display: resolvePath(gameState.fs, d.path),
                };
              });
              const match = allDirs.find((d) => d.display === selected.path);
              if (match) {
                const protection = isProtected(
                  gameState.fs,
                  gameState.currentPath,
                  match,
                  currentLevel,
                  'jump'
                );

                if (protection) {
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                      mode: 'normal',
                      notification: { message: `🔒 ${protection}` },
                      inputBuffer: '',
                    },
                  });
                  return;
                }

                const now = Date.now();

                // Add specific "Quantum" feedback for Level 7
                const isQuantum = gameState.levelIndex === 6;
                const notification = isQuantum
                  ? { message: '>> QUANTUM TUNNEL ESTABLISHED <<' }
                  : { message: `Jumped to ${selected.path}` };

                dispatch({
                  type: 'UPDATE_UI_STATE',
                  updates: {
                    mode: 'normal',
                    currentPath: match.path,
                    cursorIndex: 0,
                    notification,
                    inputBuffer: '',
                    history: [...gameState.history, gameState.currentPath],
                    future: [], // Reset future on new jump
                    usedPreviewDown: false,
                    usedPreviewUp: false,
                    stats: { ...gameState.stats, fuzzyJumps: gameState.stats.fuzzyJumps + 1 },
                    zoxideData: {
                      ...gameState.zoxideData,
                      [selected.path]: {
                        count: (gameState.zoxideData[selected.path]?.count || 0) + 1,
                        lastAccess: now,
                      },
                    },
                  },
                });
              } else {
                // Fallback: If for some reason match is not found, close dialog
                dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
              }
            } else {
              if (selected.pathIds && Array.isArray(selected.pathIds)) {
                // FZF Logic: pathIds from getRecursiveContent are absolute (start with fs.id),
                // but be defensive and handle relative arrays too.
                const fullPath =
                  Array.isArray(selected.pathIds) && selected.pathIds[0] === gameState.fs.id
                    ? selected.pathIds
                    : [...gameState.currentPath, ...(selected.pathIds || [])];

                const targetNode = getNodeByPath(gameState.fs, fullPath);
                if (targetNode) {
                  const currentLevel = LEVELS[gameState.levelIndex];
                  const protection = isProtected(
                    gameState.fs,
                    gameState.currentPath,
                    targetNode,
                    currentLevel,
                    'jump'
                  );
                  if (protection) {
                    dispatch({
                      type: 'UPDATE_UI_STATE',
                      updates: {
                        mode: 'normal',
                        notification: { message: `🔒 ${protection}` },
                        inputBuffer: '',
                      },
                    });
                    return;
                  }
                }

                const targetDir = fullPath.slice(0, -1);
                const fileName = fullPath[fullPath.length - 1];

                // Find the index of the selected file in the parent directory
                const parentNode = getNodeByPath(gameState.fs, targetDir);

                // Calculate index based on SORTED/VISIBLE items to ensure correct highlighting
                let sortedChildren = parentNode?.children || [];
                if (!gameState.showHidden) {
                  sortedChildren = sortedChildren.filter((c) => !c.name.startsWith('.'));
                }
                // Note: We don't apply existing filters because we are clearing them below
                sortedChildren = sortNodes(
                  sortedChildren,
                  gameState.sortBy,
                  gameState.sortDirection
                );

                const fileIndex = sortedChildren.findIndex((c) => c.id === fileName);

                // CRITICAL FIX: Explicitly clear any filters for the target directory
                // so that siblings are visible when jumping to the file.
                const targetDirNode = getNodeByPath(gameState.fs, targetDir);
                const newFilters = { ...gameState.filters };
                if (targetDirNode) {
                  delete newFilters[targetDirNode.id];
                }

                dispatch({
                  type: 'UPDATE_UI_STATE',
                  updates: {
                    mode: 'normal',
                    currentPath: targetDir,
                    cursorIndex: fileIndex >= 0 ? fileIndex : 0,
                    filters: newFilters,
                    inputBuffer: '',
                    history: [...gameState.history, gameState.currentPath],
                    future: [], // Reset future
                    notification: { message: `Found: ${selected.path}` },
                    usedPreviewDown: false,
                    usedPreviewUp: false,
                    stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 },
                  },
                });
              } else {
                dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
              }
            }
          } else {
            dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          }
          break;
        }
        case 'Escape':
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          break;
        case 'ArrowDown':
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              fuzzySelectedIndex: Math.min(
                candidates.length - 1,
                (gameState.fuzzySelectedIndex || 0) + 1
              ),
            },
          });
          break;
        case 'ArrowUp':
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              fuzzySelectedIndex: Math.max(0, (gameState.fuzzySelectedIndex || 0) - 1),
            },
          });
          break;
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                fuzzySelectedIndex: Math.min(
                  candidates.length - 1,
                  (gameState.fuzzySelectedIndex || 0) + 1
                ),
              },
            });
          } else {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                inputBuffer: gameState.inputBuffer + e.key,
                fuzzySelectedIndex: 0,
              },
            });
          }
          break;
        case 'p':
          if (e.ctrlKey) {
            e.preventDefault();
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                fuzzySelectedIndex: Math.max(0, (gameState.fuzzySelectedIndex || 0) - 1),
              },
            });
          } else {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                inputBuffer: gameState.inputBuffer + e.key,
                fuzzySelectedIndex: 0,
              },
            });
          }
          break;
        case 'Backspace':
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              inputBuffer: gameState.inputBuffer.slice(0, -1),
              fuzzySelectedIndex: 0,
            },
          });
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                inputBuffer: gameState.inputBuffer + e.key,
                fuzzySelectedIndex: 0,
              },
            });
          }
          break;
      }
    },
    [handleSearchConfirm]
  );

  // --- Input Handlers (Refactored to Arbiter Pattern) ---

  // 1. Global Meta Keys (Priority: GLOBAL)
  useGlobalInput(
    (e) => {
      // Toggle Help
      if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey)) && e.altKey) {
        e.preventDefault();
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showHelp: !gameState.showHelp, showHint: false, showMap: false },
        });
        return true;
      }
      // Toggle Hint
      if ((e.key.toLowerCase() === 'h' || e.code === 'KeyH') && e.altKey) {
        e.preventDefault();
        if (gameState.showHint) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { showHint: false, showHelp: false, showMap: false },
          });
        } else {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { showHint: true, hintStage: 0, showHelp: false, showMap: false },
          });
        }
        return true;
      }
      // Toggle Map
      if ((e.key.toLowerCase() === 'm' || e.code === 'KeyM') && e.altKey && !e.shiftKey) {
        e.preventDefault();
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showMap: !gameState.showMap, showHelp: false, showHint: false },
        });
        return true;
      }
      // Toggle Sound
      if (e.key.toLowerCase() === 'm' && e.altKey && e.shiftKey && gameState.mode === 'normal') {
        e.preventDefault();
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            settings: { ...gameState.settings, soundEnabled: !gameState.settings.soundEnabled },
            notification: {
              message: `Sound ${!gameState.settings.soundEnabled ? 'Enabled' : 'Disabled'}`,
            },
          },
        });
        return true;
      }
    },
    InputPriority.GLOBAL
  );

  // 2. Help Modal (Priority: MODAL)
  useGlobalInput(
    (e) => {
      handleHelpModeKeyDown(e, gameState, () =>
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: false } })
      );
      return true; // Block lower
    },
    InputPriority.MODAL,
    { disabled: !gameState.showHelp }
  );

  // 3. Quest Map (Priority: MODAL)
  useGlobalInput(
    (e) => {
      // Derive episodes for the handler
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
        () => dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: false } }),
        (globalIdx: number) => {
          const lvl = LEVELS[globalIdx];
          let fs = cloneFS(INITIAL_FS);
          if (lvl.onEnter) fs = lvl.onEnter(fs, gameState);
          dispatch({
            type: 'SET_LEVEL',
            index: globalIdx,
            fs,
            path: lvl.initialPath || ['root', 'home', 'guest'],
          });
        }
      );
      return true;
    },
    InputPriority.MODAL,
    { disabled: !gameState.showMap }
  );

  // 4. Hint Modal (Priority: MODAL)
  useGlobalInput(
    (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: false } });
        return true;
      }
      return true; // Block
    },
    InputPriority.MODAL,
    { disabled: !gameState.showHint }
  );

  // 5. Threat Alert (Priority: MODAL)
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showThreatAlert: false } });
      }
      return true;
    },
    InputPriority.MODAL,
    { disabled: !gameState.showThreatAlert }
  );

  // 6. Info Panel (Priority: MODAL)
  useGlobalInput(
    (e) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showInfoPanel: false } });
      }
      return true;
    },
    InputPriority.MODAL,
    { disabled: !gameState.showInfoPanel }
  );

  // 7. Hidden Warning (Priority: MODAL)
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === '.') {
        dispatch({ type: 'TOGGLE_HIDDEN' });
      }
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { showHidden: false, showHiddenWarning: false },
          });
        } else {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { showHiddenWarning: false } });
        }
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showHiddenWarning: false } });
      }
      return true;
    },
    InputPriority.MODAL,
    { disabled: !gameState.showHiddenWarning }
  );

  // 8. Filter Warning (Priority: MODAL)
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
          const newFilters = { ...gameState.filters };
          if (currentDirNode) {
            delete newFilters[currentDirNode.id];
          }
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              filters: newFilters,
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        }
        return true;
      }

      if (e.key === 'Escape') {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            acceptNextKeyForSort: false,
            notification: null,
          },
        });
        return true;
      }
      return true;
    },
    InputPriority.MODAL,
    { disabled: gameState.mode !== 'filter-warning' }
  );

  // 9. Search Warning (Priority: MODAL)
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              searchQuery: null,
              searchResults: [],
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        }
        return true;
      }

      if (e.key === 'Escape') {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            acceptNextKeyForSort: false,
            notification: null,
          },
        });
        return true;
      }
      return true;
    },
    InputPriority.MODAL,
    { disabled: gameState.mode !== 'search-warning' }
  );

  // 10. Sort Warning (Priority: MODAL)
  useGlobalInput(
    (e) => {
      const tasksComplete = checkAllTasksComplete(gameState, currentLevel);

      if (e.key === 'Enter' && e.shiftKey) {
        if (tasksComplete) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              showSortWarning: false,
              sortBy: 'natural',
              sortDirection: 'asc',
              mode: 'normal',
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              showSortWarning: false,
              mode: 'normal',
              acceptNextKeyForSort: false,
              notification: null,
            },
          });
        }
        return true;
      }

      if (e.key === ',') {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { mode: 'sort', acceptNextKeyForSort: true },
        });
        return true;
      }

      if (gameState.acceptNextKeyForSort) {
        handleSortModeKeyDown(e, gameState);
        const pressed = e.key || '';
        const isNatural = pressed.toLowerCase() === 'n' && !e.shiftKey;
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            showSortWarning: !isNatural,
            acceptNextKeyForSort: false,
            mode: 'normal',
          },
        });
        return true;
      }

      if (e.key === 'Escape') {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            showSortWarning: false,
            mode: 'normal',
            acceptNextKeyForSort: false,
            notification: null,
          },
        });
        return true;
      }

      return true;
    },
    InputPriority.MODAL,
    { disabled: !gameState.showSortWarning }
  );

  // 11. Game Loop (Priority: GAME)
  useGlobalInput(
    (e) => {
      // Input elements check
      if (
        ['filter', 'input-file', 'rename'].includes(gameState.mode) &&
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      // Count keystrokes
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
          handleNormalModeKeyDown(
            e,
            gameState,
            visibleItems,
            parent || null,
            currentItem,
            currentLevel,
            advanceLevel
          );
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
            dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          }
          break;
        case 'zoxide-jump':
        case 'fzf-current':
          handleFuzzyModeKeyDown(e as unknown as KeyboardEvent, gameState, dispatch);
          break;
        case 'g-command':
          handleGCommandKeyDown(e, gameState, currentLevel);
          break;
        case 'z-prompt':
          handleZoxidePromptKeyDown(e, gameState, dispatch);
          break;
        case 'overwrite-confirm':
          handleOverwriteConfirmKeyDown(e, gameState);
          break;
        case 'filter':
        case 'input-file':
        case 'rename':
          // When in input modes, the InputModal handles all input
          // Don't process any keys in the main handler to avoid interference
          break;
        default:
          break;
      }
    },
    InputPriority.GAME
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
          onComplete={() => {
            if (currentLevel.episodeId === 1) {
              dispatch({ type: 'UPDATE_UI_STATE', updates: { isBooting: true } });
            }
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                showEpisodeIntro: false,
                currentPath: [...currentLevel.initialPath], // Reset to level's initial path
                cursorIndex: 0, // Reset cursor to top
              },
            });
          }}
        />
      )}

      {gameState.isGameOver && (
        <GameOverModal
          reason={gameState.gameOverReason!}
          onRestart={handleRestartLevel}
          efficiencyTip={currentLevel.efficiencyTip}
          level={currentLevel}
        />
      )}

      {gameState.showHelp && (
        <HelpModal
          onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: false } })}
          scrollPosition={gameState.helpScrollPosition || 0}
        />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: false, hintStage: 0 } })
          }
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showInfoPanel: false } })}
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
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHiddenWarning: false } })
          }
        />
      )}
      {gameState.showSortWarning && (
        <SortWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showSortWarning: false } })
          }
        />
      )}
      {gameState.mode === 'filter-warning' &&
        (() => {
          return (
            <FilterWarningModal
              allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
              onDismiss={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
            />
          );
        })()}
      {gameState.mode === 'search-warning' && (
        <SearchWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
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
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showThreatAlert: false } })
          }
        />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        <LevelProgress
          levels={LEVELS}
          currentLevelIndex={gameState.levelIndex}
          notification={null}
          thought={gameState.thought}
          onToggleHint={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: !gameState.showHint } })
          }
          onToggleHelp={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: !gameState.showHelp } })
          }
          isOpen={gameState.showMap}
          onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: false } })}
          onToggleMap={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: !gameState.showMap } })
          }
          onJumpToLevel={(idx) => {
            const lvl = LEVELS[idx];
            let fs = cloneFS(INITIAL_FS);
            if (lvl.onEnter) fs = lvl.onEnter(fs, gameState);
            dispatch({
              type: 'SET_LEVEL',
              index: idx,
              fs,
              path: lvl.initialPath || ['root', 'home', 'guest'],
            });
          }}
          activeTab={gameState.questMapTab}
          selectedMissionIdx={gameState.questMapMissionIdx}
        />

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
                    dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchConfirm();
                      e.stopPropagation();
                    } else if (e.key === 'Escape') {
                      dispatch({
                        type: 'UPDATE_UI_STATE',
                        updates: { mode: 'normal', inputBuffer: '' },
                      });
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
              <GCommandDialog
                onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
              />
            )}

            {gameState.mode === 'input-file' && (
              <InputModal
                label="Create"
                value={gameState.inputBuffer}
                onChange={(val) =>
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } })
                }
                onConfirm={handleInputConfirm}
                onCancel={() =>
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', inputBuffer: '' },
                  })
                }
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
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } });
                }}
                onConfirm={() => {
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                      mode: 'normal',
                      inputBuffer: '',
                      stats: { ...gameState.stats, filterUsage: gameState.stats.filterUsage + 1 },
                    },
                  });
                }}
                onCancel={() => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  if (dir) {
                    dispatch({ type: 'CLEAR_FILTER', dirId: dir.id });
                  }
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                      mode: 'normal',
                      inputBuffer: '',
                      stats: {
                        ...gameState.stats,
                        filterUsage: gameState.stats.filterUsage + 1,
                      },
                    },
                  });
                }}
                borderColorClass="border-orange-500"
                testid="filter-input"
              />
            )}

            {gameState.mode === 'rename' && (
              <InputModal
                label="Rename"
                value={gameState.inputBuffer}
                onChange={(val) =>
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } })
                }
                onConfirm={handleRenameConfirm}
                onCancel={() =>
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', inputBuffer: '' },
                  })
                }
                borderColorClass="border-cyan-500" // or green/cyan mix
                testid="rename-input"
              />
            )}

            {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
              <FuzzyFinder
                gameState={gameState}
                onSelect={handleFuzzySelect}
                onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
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

        <StatusBar
          state={gameState}
          level={currentLevel}
          allTasksComplete={checkAllTasksComplete(gameState, currentLevel) && !gameState.showHidden}
          onNextLevel={advanceLevel}
          currentItem={currentItem}
        />
      </div>
    </div>
  );
}
