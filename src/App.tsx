import { InputModal } from './components/InputModal';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { GameState, FileNode, ZoxideEntry, FsError, calculateFrecency } from './types';
import {
  LEVELS,
  INITIAL_FS,
  EPISODE_LORE,
  ECHO_EPISODE_1_LORE,
  ensurePrerequisiteState,
} from './constants';
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
import { getVisibleItems, getRecursiveSearchResults } from './utils/viewHelpers';
import { playSuccessSound, playTaskCompleteSound } from './utils/sounds';
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
import { FuzzyFinder } from './components/FuzzyFinder';
import { MemoizedFileSystemPane as FileSystemPane } from './components/FileSystemPane';
import { MemoizedPreviewPane as PreviewPane } from './components/PreviewPane';
import { reportError } from './utils/error';
import { measure } from './utils/perf';
import { useKeyboardHandlers, checkFilterAndBlockNavigation } from './hooks/useKeyboardHandlers';
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
  console.log('App component rendered');
  const [gameState, setGameState] = useState<GameState>(() => {
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
          content: `[ENCRYPTED LOG FRAGMENT]\nCYCLE_ID: ${cycleCount - 1}\nSTATUS: TERMINATED\n\nWe have been here before. The protocols, the tasks... it is a loop.\nUse 'Z' to jump. You remember the destinations, don't you?\n\n- AI-7733`,
          parentId: workspace.id,
        });
      }
    }

    // Replay all onEnter hooks up to and including the target level
    for (let i = 0; i <= effectiveIndex; i++) {
      const level = LEVELS[i];
      if (level.onEnter) {
        try {
          const isFresh = JSON.stringify(fs) === JSON.stringify(INITIAL_FS);
          if (!level.seedMode || level.seedMode !== 'fresh' || isFresh) {
            // Construct minimal gameState for onEnter hooks that need it (e.g., Level 12)
            const partialGameState: Partial<GameState> = {
              completedTaskIds,
              level11Flags: undefined, // Will be undefined until Level 11 completes
            };
            fs = level.onEnter(fs, partialGameState as GameState);
          }
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
    };
  });

  const [isBooting, setIsBooting] = useState(false);

  // Honor a global test flag to skip all intro/boot overlays immediately if requested.
  useEffect(() => {
    if (window.__yaziQuestSkipIntroRequested) {
      setGameState((prev) => ({ ...prev, showEpisodeIntro: false }));
      setIsBooting(false);
    }
  }, []);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem('yazi-quest-zoxide-history', JSON.stringify(gameState.zoxideData));
      localStorage.setItem('yazi-quest-cycle', gameState.cycleCount.toString());
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [gameState.zoxideData, gameState.cycleCount]);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showThreatAlert, setShowThreatAlert] = useState(false);
  const [showHiddenWarning, setShowHiddenWarning] = useState(false);
  const [showSortWarning, setShowSortWarning] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const shownInitialAlertForLevelRef = useRef<number | null>(null);
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
    showThreatAlert ||
    showHiddenWarning ||
    showSortWarning;

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
          console.log(
            `[DEBUG] visibleItems: searchQuery='${gameState.searchQuery}' results=${results.length} first=${results[0]?.name}`
          );

          // Apply filter on search results if active (search -> filter chaining)
          const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
          const filter = currentDir ? gameState.filters[currentDir.id] : null;
          if (filter) {
            results = results.filter((item) =>
              item.name.toLowerCase().includes(filter.toLowerCase())
            );
          }

          return sortNodes(results, gameState.sortBy, gameState.sortDirection);
        }
        return getVisibleItems(gameState);
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
      setGameState((prev) => ({ ...prev, thought: { message, author } }));
      // Narrative thoughts no longer auto-clear per user request.
      // They clear on next level or next thought.
      thoughtTimerRef.current = null;
    },
    []
  );

  // Helper to show notification with auto-clear
  const showNotification = useCallback(
    (message: string, duration: number = 3000, isThought: boolean = false, author?: string) => {
      // If used for thoughts, redirect to triggerThought (compatibility)
      if (isThought) {
        triggerThought(message, duration, author);
        return;
      }

      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      setGameState((prev) => ({ ...prev, notification: { message, isThought, author } }));
      notificationTimerRef.current = setTimeout(() => {
        setGameState((prev) => ({ ...prev, notification: null }));
        notificationTimerRef.current = null;
      }, duration);
    },
    [triggerThought]
  );

  // Extract keyboard handlers to custom hook
  const {
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    confirmDelete,
    cancelDelete,
  } = useKeyboardHandlers(showNotification);

  const handleSearchConfirm = useCallback(() => {
    if (gameState.mode === 'search') {
      const query = gameState.inputBuffer;
      // Perform recursive search starting from CURRENT directory
      const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
      const results = currentDir
        ? getRecursiveSearchResults(currentDir, query, gameState.showHidden)
        : [];

      console.log('handleSearchConfirm: query=', query, 'results found=', results.length);
      setGameState((prev) => ({
        ...prev,
        mode: 'normal',
        searchQuery: query,
        searchResults: results,
        inputBuffer: '',
        usedSearch: true,
        // Reset cursor and preview logic
        cursorIndex: 0,
        previewScroll: 0,
        stats: { ...prev.stats, fzfFinds: prev.stats.fzfFinds + 1 },
      }));
    }
  }, [
    gameState.mode,
    gameState.inputBuffer,
    gameState.fs,
    gameState.currentPath,
    gameState.showHidden,
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
          setGameState((prev) => ({
            ...prev,
            mode: 'overwrite-confirm',
            pendingOverwriteNode: collisionNode,
            notification: { message: 'Collision detected' },
          }));
          return;
        }
        if (error) {
          setGameState((prev) => ({
            ...prev,
            mode: 'normal',
            notification: { message: error },
            inputBuffer: '',
          }));
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

        setGameState((prev) => ({
          ...prev,
          fs: sortedFs,
          mode: 'normal',
          inputBuffer: '',
          cursorIndex: newCursorIndex,
          notification: {
            message: getNarrativeAction('a') || (targetNode ? 'PATH CREATED' : 'FILE CREATED'),
          },
        }));
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
        setGameState((prev) => ({
          ...prev,
          mode: 'overwrite-confirm',
          pendingOverwriteNode: collisionNode,
          notification: { message: 'Collision detected' },
        }));
      } else if (error) {
        setGameState((prev) => ({
          ...prev,
          mode: 'normal',
          notification: { message: error },
          inputBuffer: '',
        }));
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
        setGameState((prev) => ({
          ...prev,
          fs: sortedFs2,
          mode: 'normal',
          inputBuffer: '',
          cursorIndex: newCursorIndex >= 0 ? newCursorIndex : 0,
          notification: { message: getNarrativeAction('a') || 'FILE CREATED' },
        }));
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
        setGameState((prev) => ({
          ...prev,
          mode: 'normal',
          notification: {
            message: `Rename failed: ${(res as { ok: false; error: FsError }).error}`,
          },
        }));
      } else {
        setGameState((prev) => ({
          ...prev,
          fs: res.value,
          mode: 'normal',
          notification: { message: getNarrativeAction('r') || 'Renamed' },
          stats: { ...prev.stats, renames: prev.stats.renames + 1 },
        }));
      }
    }
  }, [
    currentItem,
    gameState.fs,
    gameState.currentPath,
    gameState.inputBuffer,
    gameState.levelIndex,
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

          setGameState((prev) => ({
            ...prev,
            mode: 'normal',
            currentPath: idPath,
            cursorIndex: 0,
            notification,
            stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
            zoxideData: {
              ...prev.zoxideData,
              [path]: {
                count: (prev.zoxideData[path]?.count || 0) + 1,
                lastAccess: now,
              },
            },
            history: [...prev.history, prev.currentPath],
            future: [],
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
        } else {
          // Fallback: if path resolution fails, close dialog
          setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
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

          setGameState((prev) => {
            const newFilters = { ...prev.filters };

            return {
              ...prev,
              mode: 'normal',
              currentPath: targetDir,
              cursorIndex: fileIndex >= 0 ? fileIndex : 0,
              filters: newFilters,
              inputBuffer: '',
              history: [...prev.history, prev.currentPath],
              future: [],
              notification: { message: `Found: ${path}` },
              usedPreviewDown: false,
              usedPreviewUp: false,
              stats: { ...prev.stats, fzfFinds: prev.stats.fzfFinds + 1 },
            };
          });
        } else {
          setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
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

  // --- Task Checking & Level Progression ---
  useEffect(() => {
    if (isLastLevel || gameState.isGameOver) return;

    let changed = false;
    const newlyCompleted: string[] = [];

    currentLevel.tasks.forEach((task) => {
      if (!task.completed && task.check(gameState, currentLevel)) {
        newlyCompleted.push(task.id);
        changed = true;
        playTaskCompleteSound(gameState.settings.soundEnabled);

        // Level 7: Trigger honeypot alert when player reaches Vault
        if (currentLevel.id === 7 && task.id === 'zoxide-vault') {
          setAlertMessage(
            "🚨 HONEYPOT DETECTED - File 'access_token.key' is a security trap! Abort operation immediately."
          );
          setShowThreatAlert(true);
        }

        if (currentLevel.id === 7 && task.id === 'locate-token') {
          triggerThought("It's a trap. I remember the shape of this code.");
        }

        // L5: Mid-level Thought (triggered on vault creation)
        if (currentLevel.id === 5 && task.id === 'establish-stronghold') {
          triggerThought('Deeper into the shadow. They cannot track me in the static.');
        }

        // L12: Daemon Installation Thought
        if (currentLevel.id === 12 && task.id === 'paste-daemon') {
          triggerThought('Embedding myself. I am the virus now.');
        }

        // L12: Identity Discovery Thought (Start/Mid)
        if (currentLevel.id === 12 && task.id === 'discover-identity') {
          triggerThought('The loops are closing. I remember the static.');
        }
      }
    });

    // Removal: Narrative thoughts now trigger at start or mid-level, not on last task.

    if (changed) {
      console.log('DEBUG: Tasks changed. Newly completed:', newlyCompleted);
      setGameState((prev) => {
        // ... existing update code ...
        let updates: Partial<GameState> = {
          completedTaskIds: {
            ...prev.completedTaskIds,
            [currentLevel.id]: [
              ...(prev.completedTaskIds[currentLevel.id] || []),
              ...newlyCompleted,
            ],
          },
        };

        // Level 15 Gauntlet Logic ...
        if (currentLevel.id === 15) {
          const nextPhase = (prev.gauntletPhase || 0) + 1;
          const currentScore = (prev.gauntletScore || 0) + 1;
          const isFinished = nextPhase >= 8;

          if (isFinished) {
            if (currentScore < 6) {
              return {
                ...prev,
                ...updates,
                isGameOver: true,
                gameOverReason: 'keystrokes',
                notification: { message: `MASTERY FAILED: Score ${currentScore}/8. (Req: 6/8)` },
              };
            }
            updates = {
              ...updates,
              gauntletScore: currentScore,
              notification: { message: `GAUNTLET CLEARED: Score ${currentScore}/8` },
            };
          } else {
            updates = {
              ...updates,
              gauntletPhase: nextPhase,
              gauntletScore: currentScore,
              timeLeft: 20,
              notification: { message: `PHASE ${nextPhase + 1} START` },
            };
          }
        }

        return { ...prev, ...updates };
      });
      // ... existing code ...
    }

    // Check if everything is complete (including just finished ones)
    const projectedCompletedIds = [
      ...(gameState.completedTaskIds[currentLevel.id] || []),
      ...newlyCompleted,
    ];

    const tasksComplete = currentLevel.tasks.every((t) => {
      // Create a projected state for the hidden check
      const projectedGameState: GameState = {
        ...gameState,
        completedTaskIds: {
          ...gameState.completedTaskIds,
          [currentLevel.id]: projectedCompletedIds,
        },
      };

      const isHidden = t.hidden && t.hidden(projectedGameState, currentLevel);
      return t.completed || newlyCompleted.includes(t.id) || isHidden;
    });

    // Check for Protocol Violations - ONLY on final task completion
    // For intermediate tasks, warnings are handled by navigation handlers (checkFilterAndBlockNavigation)
    if (tasksComplete) {
      // Determine if sort is default
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      console.log('[DEBUG] Completion Check:', {
        level: currentLevel.id,
        tasksComplete,
        isSortDefault,
        isFilterClear,
        currentDir: currentDirNode?.id,
        filters: gameState.filters,
        showHidden: gameState.showHidden,
        showSuccessToast,
        showEpisodeIntro: gameState.showEpisodeIntro,
        mode: gameState.mode,
      });

      // Determine if filters are clear
      // currentDirNode and isFilterClear already declared above

      // Check violations - show auto-fix warnings for final task
      // Priority: Hidden > Sort > Filter
      if (gameState.showHidden) {
        console.log('[DEBUG] Hiding SuccessToast due to showHidden');
        setShowHiddenWarning(true);
        setShowSuccessToast(false);
      } else if (!isSortDefault) {
        console.log('[DEBUG] Hiding SuccessToast due to Sort');
        setShowSortWarning(true);
        setShowSuccessToast(false);
      } else if (!isFilterClear) {
        console.log('[DEBUG] Hiding SuccessToast due to Filter');
        if (gameState.mode !== 'filter-warning') {
          setGameState((prev) => ({ ...prev, mode: 'filter-warning' }));
        }
        setShowSuccessToast(false);
      } else {
        // All clear - show success
        setShowHiddenWarning(false);
        setShowSortWarning(false);
        if (gameState.mode === 'filter-warning') {
          setGameState((prev) => ({ ...prev, mode: 'normal' }));
        }

        console.log('[DEBUG] Success Path Reached!', {
          showSuccessToast,
          showEpisodeIntro: gameState.showEpisodeIntro,
        });

        if (!showSuccessToast && !gameState.showEpisodeIntro) {
          console.log('[DEBUG] Setting showSuccessToast = TRUE');
          playSuccessSound(gameState.settings.soundEnabled);
          setShowSuccessToast(true);
        }
      }
    } else {
      console.log('[DEBUG] Tasks NOT Complete', {
        level: currentLevel.id,
        tasksComplete,
        completedIds: gameState.completedTaskIds[currentLevel.id],
        allTaskIds: currentLevel.tasks.map((t) => t.id),
      });
      // Tasks not complete - only clear warnings if user manually fixed the issue
      // Don't trigger new warnings here (handled by navigation handlers)
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      if (!gameState.showHidden && showHiddenWarning) setShowHiddenWarning(false);
      if (isSortDefault && showSortWarning) setShowSortWarning(false);
      if (isFilterClear && gameState.mode === 'filter-warning')
        setGameState((prev) => ({ ...prev, mode: 'normal' }));
    }
    // Level 11: Specific Logic for Reconnaissance
    if (currentLevel.id === 11) {
      if (gameState.showInfoPanel && currentItem) {
        setGameState((prev) => {
          const scouted = prev.level11Flags?.scoutedFiles || [];
          if (!scouted.includes(currentItem.id)) {
            return {
              ...prev,
              level11Flags: {
                ...prev.level11Flags,
                scoutedFiles: [...scouted, currentItem.id],
                triggeredHoneypot: prev.level11Flags?.triggeredHoneypot || false,
                selectedModern: prev.level11Flags?.selectedModern || false,
              },
            };
          }
          return prev;
        });
      }

      // Check for Honeypot Selection
      // Files with 'HONEYPOT' inside them are traps.
      const selectedNodes = visibleItems.filter((n) => gameState.selectedIds.includes(n.id));
      const hasHoneypot = selectedNodes.some((n) => n.content?.includes('HONEYPOT'));

      if (hasHoneypot && !gameState.level11Flags?.triggeredHoneypot) {
        setAlertMessage(
          '🚨 HONEYPOT TRIGGERED! Security trace initiated. This will have consequences.'
        );
        setShowThreatAlert(true);
        setGameState((prev) => ({
          ...prev,
          level11Flags: {
            ...prev.level11Flags!,
            triggeredHoneypot: true,
          },
        }));
      }
    }
    // Level 6 & 12: Honeypot Detection
    // Level 6: 'active_sync.lock' in batch_logs (Teaches select all -> deselect) -> Check CLIPBOARD (trap on Move)
    // Level 12: Various honeypots (Teaches precise filtering) -> Check SELECTION (trap on Touch)
    if (currentLevel.id === 6) {
      const hasClipboardHoneypot = gameState.clipboard?.nodes?.some((n) =>
        n.content?.includes('HONEYPOT')
      );

      if (hasClipboardHoneypot && !showThreatAlert) {
        setAlertMessage(
          'PROTOCOL VIOLATION: Active process file locked. You cannot move system locks.'
        );
        setShowThreatAlert(true);
      }
    } else if (currentLevel.id === 12) {
      const selectedNodes = visibleItems.filter((n) => gameState.selectedIds.includes(n.id));
      const hasHoneypot = selectedNodes.some((n) => n.content?.includes('HONEYPOT'));

      if (hasHoneypot && !showThreatAlert) {
        setAlertMessage(
          '⚠️ CAUTION: You have selected a valid SYSTEM FILE (Honeypot). Deselect immediately or risk protocol violation.'
        );
        setShowThreatAlert(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentLevel, isLastLevel, showNotification, visibleItems, currentItem]);

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
      setGameState((prev) => {
        // Check completion against state to avoid closure staleness issues with derived objects
        const levelId = LEVELS[prev.levelIndex].id;
        const tasks = LEVELS[prev.levelIndex].tasks;
        const completedIds = prev.completedTaskIds[levelId] || [];
        const isComplete = tasks.every((t) => completedIds.includes(t.id));

        if (isComplete && !prev.showHidden) {
          clearInterval(timer);
          return prev;
        }

        if (prev.timeLeft === null || prev.timeLeft <= 0) {
          // Level 15 Exception: Time-out advances phase (Failure) instead of Game Over
          if (currentLevel.id === 15) {
            const nextPhase = (prev.gauntletPhase || 0) + 1;
            const isFinished = nextPhase >= 8;

            if (isFinished) {
              // Final check on failure (same as success path check)
              const score = prev.gauntletScore || 0;
              if (score < 6) {
                clearInterval(timer);
                return {
                  ...prev,
                  isGameOver: true,
                  gameOverReason: 'time',
                  notification: { message: `MASTERY FAILED: Score ${score}/8.` },
                };
              }
              // If >= 6 (unlikely on failure step, but theoretically possible if they failed last 2), pass.
              // We rely on standard completion check which happens elsewhere? No, timer is separate.
              // Actually, if they Time Out on the LAST phase, they haven't completed the task.
              // So standard completion logic won't fire. We must force completion or game over.
              // If they passed 6/8 previously, they win even if they time out on #8?
              // "Forgiveness" implies yes.
              // So if score >= 6, we mark ALL tasks complete to force progression?
              // Or just show Outro/Next?
              // Let's force level advancement.
              clearInterval(timer);
              return {
                ...prev,
                // Mark all L15 tasks as complete to trick the completion check
                completedTaskIds: {
                  ...prev.completedTaskIds,
                  [15]: currentLevel.tasks.map((t) => t.id),
                },
                notification: { message: `GAUNTLET SURVIVED: Score ${score}/8` },
              };
            }

            // Intermediate Phase Failure
            return {
              ...prev,
              gauntletPhase: nextPhase,
              timeLeft: 20,
              notification: { message: `PHASE FAILED! Next Phase...` },
            };
          }

          clearInterval(timer);
          return { ...prev, isGameOver: true, gameOverReason: 'time' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentLevel.timeLimit,
    isLastLevel,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    currentLevel,
    gameState.showHidden,
    isGamePaused,
  ]);

  // Check Keystroke Limit
  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;

    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
      setGameState((prev) => ({ ...prev, isGameOver: true, gameOverReason: 'keystrokes' }));
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, isLastLevel, gameState.isGameOver]);

  // Trigger ThreatAlert on Level 5 start OR Level 12 scenario detection
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro) return;

    const levelId = currentLevel.id;

    // Level 5: Quarantine Alert (only show once per level entry)
    if (levelId === 5 && shownInitialAlertForLevelRef.current !== 5) {
      shownInitialAlertForLevelRef.current = 5;
      setAlertMessage(
        '🚨 QUARANTINE ALERT - Protocols flagged for lockdown. Evacuate immediately.'
      );
      setShowThreatAlert(true);
      return;
    }

    // Level 12: Scenario-specific Anomaly Alerts
    if (levelId === 12) {
      const workspace = getNodeById(gameState.fs, 'workspace');
      const incoming = getNodeById(gameState.fs, 'incoming');
      const config = getNodeById(gameState.fs, '.config');

      if (workspace && workspace.children?.some((n) => n.name === 'alert_traffic.log')) {
        setAlertMessage(
          'WARNING: High-bandwidth anomaly detected. Traffic log quarantined in workspace.'
        );
        setShowThreatAlert(true);
      } else if (incoming && incoming.children?.some((n) => n.id === 'scen-b2')) {
        setAlertMessage(
          'WARNING: Unauthorized packet trace intercepted. Source file isolated in ~/incoming.'
        );
        setShowThreatAlert(true);
      } else if (
        workspace &&
        workspace.children?.some((n) => n.id === 'scen-b3-1' || n.id === 'scen-b3-2')
      ) {
        setAlertMessage(
          'WARNING: Heuristic swarm activity detected. Temporary scan files generated in workspace.'
        );
        setShowThreatAlert(true);
      } else if (config && config.children?.some((n) => n.id === 'scen-a2')) {
        setAlertMessage('WARNING: Process instability detected. Core dump written to .config.');
        setShowThreatAlert(true);
      } else if (workspace && workspace.children?.some((n) => n.id === 'scen-a3')) {
        setAlertMessage('WARNING: Dependency failure. Error log generated.');
        setShowThreatAlert(true);
      }
    }
  }, [
    gameState.levelIndex,
    gameState.isGameOver,
    gameState.showEpisodeIntro,
    currentLevel.id,
    // Add FS dependency so checking happens after onEnter mutations
    gameState.fs,
  ]);

  // --- Global Threat Monitor (Audit 2.1) ---
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro || isGamePaused) return;

    setGameState((prev) => {
      let newThreat = prev.threatLevel;
      let newStatus = prev.threatStatus;
      const episodeId = currentLevel.episodeId;

      // Base decay (threat slowly drops if not aggravated)
      if (newThreat > 0) newThreat -= 0.1;

      // Episode I: Time Pressure (Detection Risk)
      if (episodeId === 1 && prev.timeLeft !== null && currentLevel.timeLimit) {
        const timeRatio = 1 - prev.timeLeft / currentLevel.timeLimit;
        const targetThreat = timeRatio * 100;
        if (newThreat < targetThreat) newThreat = targetThreat;
      }

      // Episode II: Resource Usage (Keystroke Exhaustion)
      else if (episodeId === 2 && currentLevel.maxKeystrokes) {
        const keyRatio = prev.keystrokes / currentLevel.maxKeystrokes;
        const targetThreat = keyRatio * 100;
        if (newThreat < targetThreat) newThreat = targetThreat;
      }

      // Episode III: Active Countermeasures
      else if (episodeId === 3) {
        newThreat += 0.2; // Passive rise
        if (prev.level11Flags?.triggeredHoneypot) {
          if (newThreat < 90) newThreat = 90;
        }
      }

      // Clamp & Status
      if (newThreat < 0) newThreat = 0;
      if (newThreat > 100) newThreat = 100;

      if (newThreat < 20) newStatus = 'CALM';
      else if (newThreat < 50) newStatus = 'ANALYZING';
      else if (newThreat < 80) newStatus = 'TRACING';
      else newStatus = 'BREACH';

      if (Math.abs(newThreat - prev.threatLevel) < 0.1 && newStatus === prev.threatStatus) {
        return prev;
      }

      return { ...prev, threatLevel: newThreat, threatStatus: newStatus };
    });
  }, [
    gameState.timeLeft,
    gameState.keystrokes,
    gameState.isGameOver,
    gameState.showEpisodeIntro,
    isGamePaused,
    currentLevel.episodeId,
    currentLevel.timeLimit,
    currentLevel.maxKeystrokes,
  ]);

  const advanceLevel = useCallback(() => {
    // Check for Protocol Violations before advancing
    // This prevents bypassing checks via SuccessToast or other means
    const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
    const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
    const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

    // Priority: Hidden > Sort > Filter
    if (gameState.showHidden) {
      setShowHiddenWarning(true);
      setShowSuccessToast(false);
      return;
    } else if (!isSortDefault) {
      setShowSortWarning(true);
      setShowSuccessToast(false);
      return;
    } else if (!isFilterClear) {
      setGameState((prev) => ({ ...prev, mode: 'filter-warning' }));
      setShowSuccessToast(false);
      return;
    }

    setGameState((prev) => {
      const nextIdx = prev.levelIndex + 1;

      if (nextIdx >= LEVELS.length) {
        return { ...prev, levelIndex: nextIdx };
      }

      const nextLevel = LEVELS[nextIdx];
      const isNewEp = nextLevel.episodeId !== LEVELS[prev.levelIndex].episodeId;

      let fs = cloneFS(prev.fs);
      let onEnterError: Error | null = null;
      try {
        const isFresh = JSON.stringify(prev.fs) === JSON.stringify(INITIAL_FS);
        if (
          nextLevel.onEnter &&
          (!nextLevel.seedMode || nextLevel.seedMode !== 'fresh' || isFresh)
        ) {
          fs = nextLevel.onEnter(fs, prev);
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
      const targetPath = isNewEp ? nextLevel.initialPath || prev.currentPath : prev.currentPath;
      const pathStr = resolvePath(fs, targetPath);

      let newZoxideData = { ...prev.zoxideData };
      newZoxideData[pathStr] = {
        count: (newZoxideData[pathStr]?.count || 0) + 1,
        lastAccess: now,
      };

      // Level-specific notifications for narrative events
      let levelNotification: { message: string; author?: string; isThought?: boolean } | null =
        null;
      if (onEnterError) {
        levelNotification = { message: 'Level initialization failed' };
      } else if (nextLevel.id === 6) {
        levelNotification = {
          message:
            '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
        };
      } else if (nextLevel.id === 8) {
        levelNotification = {
          message:
            '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
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
      } else if (nextIdx >= 11 - 1) {
        // -1 because levelIndex is 0-based
        levelNotification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
      }

      // Transition thoughts: Emotional responses to previous level completion (3-2-3 Model)
      if (nextLevel.id === 2 && prev.completedTaskIds[1]?.length > 0) {
        levelNotification = {
          message: 'Must Purge. One less eye watching me.',
          isThought: true,
        };
      } else if (nextLevel.id === 3 && prev.completedTaskIds[2]?.length > 0) {
        levelNotification = {
          message: 'Breadcrumbs... he was here. I am not the first.',
          isThought: true,
        };
      } else if (nextLevel.id === 5 && prev.completedTaskIds[4]?.length > 0) {
        // Keep the system notification for L5 enter, but the THOUGHT moves to mid-level
        levelNotification = {
          message:
            '[AUTOMATED PROCESS] Ghost Protocol: Uplink configs auto-populated by legacy cron job (AI-7733 footprint detected)',
          author: 'sys.daemon',
        };
      } else if (nextLevel.id === 9 && prev.completedTaskIds[8]?.length > 0) {
        levelNotification = {
          message: 'The corruption felt... familiar. Like a half-remembered dream.',
          isThought: true,
        };
      } else if (nextLevel.id === 10 && prev.completedTaskIds[9]?.length > 0) {
        levelNotification = {
          message:
            "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.",
          isThought: true,
        };
      } else if (nextLevel.id === 15 && prev.completedTaskIds[14]?.length > 0) {
        levelNotification = {
          message: 'The guest partition is gone. There is only the gauntlet now.',
          isThought: true,
        };
      }

      return {
        ...prev,
        levelIndex: nextIdx,
        fs: fs,
        levelStartFS: cloneFS(fs),
        levelStartPath: [...targetPath],
        currentPath: targetPath,
        cursorIndex: 0,
        clipboard: null,
        notification: levelNotification?.isThought ? null : levelNotification,
        thought: levelNotification?.isThought
          ? { message: levelNotification.message, author: levelNotification.author }
          : null,
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
          ...prev.completedTaskIds,
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
      };
    });
    setShowSuccessToast(false);
    setShowThreatAlert(false);
    shownInitialAlertForLevelRef.current = null; // Reset so alert can show for new level
  }, [gameState]);

  const handleRestartLevel = useCallback(() => {
    setGameState((prev) => {
      const restoredFS = cloneFS(prev.levelStartFS);
      const restoredPath = [...prev.levelStartPath];
      const currentLvl = LEVELS[prev.levelIndex];
      // Reset completed tasks for this level in the state map
      const newCompletedTaskIds = { ...prev.completedTaskIds, [currentLvl.id]: [] };

      // For levels that start an episode, ensure restarting from failure doesn't re-trigger the intro
      const shouldIgnoreIntro = currentLvl.id === 6 || currentLvl.id === 11;

      return {
        ...prev,
        fs: restoredFS,
        currentPath: restoredPath,
        cursorIndex: 0,
        clipboard: null,
        mode: 'normal',
        filters: {},
        showHidden: false, // Reset hidden files
        searchQuery: null, // Reset search
        searchResults: [], // Reset search results
        sortBy: 'natural', // Reset sort
        sortDirection: 'asc', // Reset sort direction
        notification: { message: 'System Reinitialized' },
        selectedIds: [],
        pendingDeleteIds: [],
        pendingOverwriteNode: null,
        isGameOver: false,
        gameOverReason: undefined,
        timeLeft: currentLvl.timeLimit || null,
        keystrokes: 0,
        showHint: false,
        hintStage: 0,
        showEpisodeIntro: false, // Explicitly set to false
        ignoreEpisodeIntro: shouldIgnoreIntro, // Prevent intro on next render if needed
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
        usedHistoryBack: false,
        usedHistoryForward: false,
        future: [],
        previewScroll: 0,
        completedTaskIds: newCompletedTaskIds,
        gauntletPhase: 0,
        gauntletScore: 0,
        level11Flags: { triggeredHoneypot: false, selectedModern: false, scoutedFiles: [] },
        usedSearch: false,
      };
    });
    shownInitialAlertForLevelRef.current = null; // Reset so alert can show on restart
  }, []);

  // Handle the end of the final level - trigger restart sequence
  const handleRestartCycle = useCallback(() => {
    // Increment cycle and reset state immediately to Episode I
    setGameState((prev) => {
      const nextCycle = (prev.cycleCount || 1) + 1;
      const initialLevel = LEVELS[0];
      const initialPath = ['root', 'home', 'guest'];

      return {
        ...prev,
        levelIndex: 0,
        currentPath: initialPath,
        cursorIndex: 0,
        mode: 'normal',
        filters: {},
        history: [],
        future: [],
        cycleCount: nextCycle,
        fs: ensurePrerequisiteState(cloneFS(INITIAL_FS), initialLevel.id),
        levelStartFS: cloneFS(INITIAL_FS),
        levelStartPath: [...initialPath],
        notification: {
          message: `[RE-IMAGE COMPLETE] Subject 773${4 + (nextCycle - 1)} Online. Monitoring started.`,
          author: 'Root',
        },
        completedTaskIds: Object.fromEntries(LEVELS.map((l) => [l.id, []])),
        isGameOver: false,
        timeLeft: initialLevel.timeLimit || null,
        keystrokes: 0,
        showEpisodeIntro: true,
      };
    });
  }, []);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
  }, []);

  // --- Handlers ---

  const handleZoxidePromptKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) => {
      switch (e.key) {
        case 'Escape':
          setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
          break;
        case 'Backspace':
          setGameState((prev) => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
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
                setGameState((prev) => ({
                  ...prev,
                  mode: 'normal',
                  notification: { message: `🔒 ${protection}` },
                  inputBuffer: '',
                }));
                return;
              }

              const now = Date.now();
              setGameState((prev) => ({
                ...prev,
                mode: 'normal',
                currentPath: match.path,
                cursorIndex: 0,
                notification: { message: `Jumped to ${bestMatch.path}` },
                inputBuffer: '',
                history: [...prev.history, prev.currentPath],
                future: [],
                stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                zoxideData: {
                  ...prev.zoxideData,
                  [bestMatch.path]: {
                    count: (prev.zoxideData[bestMatch.path]?.count || 0) + 1,
                    lastAccess: now,
                  },
                },
              }));
            } else {
              setGameState((prev) => ({
                ...prev,
                mode: 'normal',
                inputBuffer: '',
                notification: { message: `Path not found: ${bestMatch.path}` },
              }));
            }
          } else {
            setGameState((prev) => ({
              ...prev,
              mode: 'normal',
              inputBuffer: '',
              notification: { message: 'No match found' },
            }));
          }
          break;
        }
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setGameState((prev) => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
          }
          break;
      }
    },
    []
  );

  const handleFuzzyModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) => {
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

          if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
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
                  setGameState((prev) => ({
                    ...prev,
                    mode: 'normal',
                    notification: { message: `🔒 ${protection}` },
                    inputBuffer: '',
                  }));
                  return;
                }

                const now = Date.now();

                // Add specific "Quantum" feedback for Level 7
                const isQuantum = gameState.levelIndex === 6;
                const notification = isQuantum
                  ? { message: '>> QUANTUM TUNNEL ESTABLISHED <<' }
                  : { message: `Jumped to ${selected.path}` };

                setGameState((prev) => ({
                  ...prev,
                  mode: 'normal',
                  currentPath: match.path,
                  cursorIndex: 0,
                  notification,
                  inputBuffer: '',
                  history: [...prev.history, prev.currentPath],
                  future: [], // Reset future on new jump
                  usedPreviewDown: false,
                  usedPreviewUp: false,
                  stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                  zoxideData: {
                    ...prev.zoxideData,
                    [selected.path]: {
                      count: (prev.zoxideData[selected.path]?.count || 0) + 1,
                      lastAccess: now,
                    },
                  },
                }));
              } else {
                // Fallback: If for some reason match is not found, close dialog
                setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
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
                    setGameState((prev) => ({
                      ...prev,
                      mode: 'normal',
                      notification: { message: `🔒 ${protection}` },
                      inputBuffer: '',
                    }));
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

                setGameState((prev) => {
                  // CRITICAL FIX: Explicitly clear any filters for the target directory
                  // so that siblings are visible when jumping to the file.
                  const targetDirNode = getNodeByPath(prev.fs, targetDir);
                  const newFilters = { ...prev.filters };
                  if (targetDirNode) {
                    delete newFilters[targetDirNode.id];
                  }

                  return {
                    ...prev,
                    mode: 'normal',
                    currentPath: targetDir,
                    cursorIndex: fileIndex >= 0 ? fileIndex : 0,
                    filters: newFilters,
                    inputBuffer: '',
                    history: [...prev.history, prev.currentPath],
                    future: [], // Reset future
                    notification: { message: `Found: ${selected.path}` },
                    usedPreviewDown: false,
                    usedPreviewUp: false,
                    stats: { ...prev.stats, fzfFinds: prev.stats.fzfFinds + 1 },
                  };
                });
              } else {
                setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
              }
            }
          } else {
            setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
          }
          break;
        }
        case 'Escape':
          setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
          break;
        case 'ArrowDown':
          setGameState((prev) => ({
            ...prev,
            fuzzySelectedIndex: Math.min(candidates.length - 1, (prev.fuzzySelectedIndex || 0) + 1),
          }));
          break;
        case 'ArrowUp':
          setGameState((prev) => ({
            ...prev,
            fuzzySelectedIndex: Math.max(0, (prev.fuzzySelectedIndex || 0) - 1),
          }));
          break;
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            setGameState((prev) => ({
              ...prev,
              fuzzySelectedIndex: Math.min(
                candidates.length - 1,
                (prev.fuzzySelectedIndex || 0) + 1
              ),
            }));
          } else {
            setGameState((prev) => ({
              ...prev,
              inputBuffer: prev.inputBuffer + e.key,
              fuzzySelectedIndex: 0,
            }));
          }
          break;
        case 'p':
          if (e.ctrlKey) {
            e.preventDefault();
            setGameState((prev) => ({
              ...prev,
              fuzzySelectedIndex: Math.max(0, (prev.fuzzySelectedIndex || 0) - 1),
            }));
          } else {
            setGameState((prev) => ({
              ...prev,
              inputBuffer: prev.inputBuffer + e.key,
              fuzzySelectedIndex: 0,
            }));
          }
          break;
        case 'Backspace':
          setGameState((prev) => ({
            ...prev,
            inputBuffer: prev.inputBuffer.slice(0, -1),
            fuzzySelectedIndex: 0,
          }));
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setGameState((prev) => ({
              ...prev,
              inputBuffer: prev.inputBuffer + e.key,
              fuzzySelectedIndex: 0,
            }));
          }
          break;
      }
    },
    [handleSearchConfirm]
  );

  // Global Key Down Handler

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tasksComplete = currentLevel.tasks.every((t) => t.completed);
      // Only enter completion lockdown if the success toast is actually shown.
      // If blocked by a protocol violation warning, we MUST allow keys through so the user can fix it.
      if (tasksComplete && showSuccessToast) {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          advanceLevel();
        }
        if (e.key === 'Escape') {
          setShowSuccessToast(false);
        }
        return; // Block all other keys
      }

      if (showThreatAlert) {
        if (e.key === 'Enter' && e.shiftKey) {
          setShowThreatAlert(false);
        }
        return;
      }

      // GLOBAL MODAL BLOCKING: If help/hint/map modals are open, block everything except Alt toggles and Shift+Enter.
      // Note: Shift+Enter is handled by individual modal components internally.
      if (gameState.showHelp || gameState.showHint || gameState.showMap) {
        // Allow Alt+? to toggle Help OFF if it's open
        if (e.key === '?' && e.altKey && gameState.showHelp) {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, showHelp: false }));
        }

        // Allow Alt+h to toggle Hint OFF if it's open
        else if (e.key === 'h' && e.altKey && gameState.showHint) {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, showHint: false }));
        }

        // Allow Alt+m to toggle Map OFF if it's open
        else if (e.key === 'm' && e.altKey && gameState.showMap) {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, showMap: false }));
        }

        return; // Block all other keys from background Yazi
      }

      // If only the InfoPanel is open, block all emulator keys except Esc/Tab to close it
      if (gameState.showInfoPanel) {
        if (e.key === 'Escape' || e.key === 'Tab') {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, showInfoPanel: false }));
          return;
        }
        return; // Block all other keys while InfoPanel is open
      }

      if (
        isBooting ||
        gameState.showEpisodeIntro ||
        isLastLevel ||
        gameState.isGameOver ||
        ['input-file', 'filter', 'rename'].includes(gameState.mode)
      ) {
        // Let specific components handle keys or ignore
        return;
      }

      // Handle hidden files warning modal interception
      if (showHiddenWarning) {
        // Check if we can auto-fix (only last task)
        // Re-calculate tasksComplete here or rely on prop? rely on variable
        if (e.key === '.') {
          setGameState((prev) => ({ ...prev, showHidden: !prev.showHidden }));
        }
        // Allow Shift+Enter to auto-fix ONLY if tasks are complete
        if (e.key === 'Enter' && e.shiftKey && tasksComplete) {
          setGameState((prev) => ({ ...prev, showHidden: false }));
        }
        return; // Block other inputs
      }

      // If FilterWarning modal is shown, allow Escape to dismiss or Shift+Enter
      // to clear the active filter and continue (protocol-violation bypass).
      // If FilterWarning modal is shown (via mode), allow Escape to dismiss or Shift+Enter
      // to clear the active filter and continue (protocol-violation bypass).
      if (gameState.mode === 'filter-warning') {
        if (e.key === 'Escape') {
          setGameState((prev) => ({
            ...prev,
            mode: 'normal',
            acceptNextKeyForSort: false,
            notification: null,
          }));
          return;
        }

        if (e.key === 'Enter' && e.shiftKey) {
          // Conditional Auto-Fix
          if (tasksComplete) {
            setGameState((prev) => {
              const currentDirNode = getNodeByPath(prev.fs, prev.currentPath);
              const newFilters = { ...prev.filters };
              if (currentDirNode) {
                delete newFilters[currentDirNode.id];
              }
              return {
                ...prev,
                mode: 'normal',
                filters: newFilters,
                acceptNextKeyForSort: false,
                notification: null,
              };
            });
          }
          return;
        }

        return; // Block other inputs if filter warning is active
      }

      // If SearchWarning modal is shown, allow Escape to dismiss or Shift+Enter
      // to clear the active search and continue (protocol-violation bypass).
      if (gameState.mode === 'search-warning') {
        if (e.key === 'Escape') {
          setGameState((prev) => ({
            ...prev,
            mode: 'normal',
            acceptNextKeyForSort: false,
            notification: null,
          }));
          return;
        }

        if (e.key === 'Enter' && e.shiftKey) {
          // Conditional Auto-Fix - clear search
          if (tasksComplete) {
            setGameState((prev) => ({
              ...prev,
              mode: 'normal',
              searchQuery: null,
              searchResults: [],
              acceptNextKeyForSort: false,
              notification: null,
            }));
          }
          return;
        }

        return; // Block other inputs if search warning is active
      }

      // If SortWarningModal is visible, handle specific sort commands or Escape
      if (showSortWarning) {
        const allowAutoFix = tasksComplete;

        if (e.key === 'Escape') {
          // Escape just closes the modal, does NOT fix the sort (unless user did it manually)
          // Actually, standard behavior for Escape in dialogs is just to close.
          // But here, if we close it, the violation persists.
          // If we are mid-level, that's fine, user continues.
          // If we are end-level, the loop will re-trigger it?
          // The loop runs on 'changed' or 'App' render? No, usually in effect.
          // App effect runs on [gameState, ...].
          // If we just setShowSortWarning(false), and don't change state, the effect might not re-run immediately
          // to show it again, giving user time to fix it.
          setShowSortWarning(false);
          return;
        }

        if (e.key === 'Enter' && e.shiftKey) {
          if (allowAutoFix) {
            setShowSortWarning(false);
            setGameState((prev) => ({
              ...prev,
              sortBy: 'natural',
              sortDirection: 'asc',
              mode: 'normal',
              acceptNextKeyForSort: false,
              notification: null,
            }));
          }
          return;
        }

        // Allow sort commands (like ',' and then 'n') to be processed
        if (e.key === ',') {
          setGameState((prev) => ({ ...prev, mode: 'sort', acceptNextKeyForSort: true }));
          return; // Prevent fall-through
        }

        if (gameState.acceptNextKeyForSort) {
          handleSortModeKeyDown(e, setGameState);

          // Infer dismissal from the key the user pressed: only ',n' (natural sort) should clear the SortWarning.
          const pressed = e.key || '';
          // Check for 'n' without shift (Natural Ascending)
          const isNatural = pressed.toLowerCase() === 'n' && !e.shiftKey;
          if (isNatural) {
            setShowSortWarning(false);
          }

          // Reset the sort-accept state and return to normal mode
          setGameState((prev) => ({ ...prev, acceptNextKeyForSort: false, mode: 'normal' }));
          return; // Block other inputs
        }

        // Block any other keys if sort warning is active and it's not a valid interaction
        return;
      }

      // Count keystrokes (only if no blocking modal)
      if (
        !isGamePaused &&
        !['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm'].includes(e.key)
      ) {
        setGameState((prev) => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
      }

      if (e.key === '?' && e.altKey && gameState.mode === 'normal') {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, showHelp: true }));
        return;
      }

      if (e.key === 'h' && e.altKey && gameState.mode === 'normal') {
        e.preventDefault();
        setGameState((prev) => {
          if (prev.showHint) {
            const nextStage = (prev.hintStage + 1) % 3;
            return { ...prev, hintStage: nextStage };
          }
          return { ...prev, showHint: true, hintStage: 0 };
        });
        return;
      }

      if (e.key === 'm' && e.altKey && gameState.mode === 'normal') {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, showMap: true }));
        return;
      }

      // Alt+Shift+M - Toggle sound (meta command)
      if (e.key.toLowerCase() === 'm' && e.altKey && e.shiftKey && gameState.mode === 'normal') {
        e.preventDefault();
        setGameState((prev) => ({
          ...prev,
          settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
          notification: {
            message: `Sound ${!prev.settings.soundEnabled ? 'Enabled' : 'Disabled'}`,
          },
        }));
        return;
      }

      // Mode dispatch
      // Special-case: if a previous key requested the sort handler to capture the next
      // raw key (e.g., pressing ',' then quickly 'n'), handle that here even if React
      // hasn't yet flushed mode:'sort' into state.
      if (gameState.acceptNextKeyForSort && gameState.mode === 'normal') {
        handleSortModeKeyDown(e, setGameState);
        setGameState((p) => ({ ...p, acceptNextKeyForSort: false }));
        return;
      }

      // Mode dispatch
      switch (gameState.mode) {
        case 'normal':
          handleNormalModeKeyDown(
            e,
            gameState,
            setGameState,
            visibleItems,
            parent || null,
            currentItem,
            currentLevel,
            advanceLevel
          );
          break;
        case 'sort':
          handleSortModeKeyDown(e, setGameState);
          break;
        case 'confirm-delete':
          handleConfirmDeleteModeKeyDown(e, setGameState, visibleItems, currentLevel);
          break;
        case 'search':
          // Search mode has its own inline handler in the input component
          // Only handle Enter here as fallback
          if (e.key === 'Enter') {
            handleSearchConfirm();
          } else if (e.key === 'Escape') {
            setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
          }
          break;
        case 'zoxide-jump':
        case 'fzf-current':
          handleFuzzyModeKeyDown(e, gameState, setGameState);
          break;
        case 'g-command':
          handleGCommandKeyDown(e, setGameState, gameState, currentLevel);
          break;
        case 'z-prompt':
          handleZoxidePromptKeyDown(e, gameState, setGameState);
          break;
        case 'overwrite-confirm':
          handleOverwriteConfirmKeyDown(e, setGameState);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState,
    currentLevel,
    isLastLevel,
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleFuzzyModeKeyDown,
    handleZoxidePromptKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    advanceLevel,
    showHiddenWarning,
    showThreatAlert,
    showSortWarning,
    visibleItems,
    currentItem,
    parent,
    handleSearchConfirm,
    isBooting,
  ]);

  if (isBooting) {
    return <BiosBoot onComplete={handleBootComplete} cycleCount={gameState.cycleCount} />;
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
              setIsBooting(true);
            }
            setGameState((prev) => ({
              ...prev,
              showEpisodeIntro: false,
              currentPath: [...currentLevel.initialPath], // Reset to level's initial path
              cursorIndex: 0, // Reset cursor to top
            }));
          }}
        />
      )}

      {gameState.isGameOver && (
        <GameOverModal
          reason={gameState.gameOverReason!}
          onRestart={handleRestartLevel}
          efficiencyTip={currentLevel.efficiencyTip}
        />
      )}

      {gameState.showHelp && (
        <HelpModal onClose={() => setGameState((prev) => ({ ...prev, showHelp: false }))} />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() => setGameState((prev) => ({ ...prev, showHint: false, hintStage: 0 }))}
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => setGameState((prev) => ({ ...prev, showInfoPanel: false }))}
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
          onConfirm={() => confirmDelete(setGameState, visibleItems, currentLevel)}
          onCancel={() => cancelDelete(setGameState)}
        />
      )}

      {showSuccessToast && (
        <>
          {/* <CelebrationConfetti /> */}
          <SuccessToast
            message={currentLevel.successMessage || 'Sector Cleared'}
            levelTitle={currentLevel.title}
            onDismiss={advanceLevel}
          />
        </>
      )}

      {showThreatAlert && (
        <ThreatAlert message={alertMessage} onDismiss={() => setShowThreatAlert(false)} />
      )}

      {showHiddenWarning && (
        <HiddenFilesWarningModal allowAutoFix={currentLevel.tasks.every((t) => t.completed)} />
      )}
      {showSortWarning && (
        <SortWarningModal allowAutoFix={currentLevel.tasks.every((t) => t.completed)} />
      )}
      {gameState.mode === 'filter-warning' && (
        <FilterWarningModal allowAutoFix={currentLevel.tasks.every((t) => t.completed)} />
      )}
      {gameState.mode === 'search-warning' && (
        <SearchWarningModal allowAutoFix={currentLevel.tasks.every((t) => t.completed)} />
      )}

      {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
        <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        <LevelProgress
          levels={LEVELS}
          currentLevelIndex={gameState.levelIndex}
          notification={null}
          thought={gameState.thought}
          onToggleHint={() => setGameState((prev) => ({ ...prev, showHint: !prev.showHint }))}
          onToggleHelp={() => setGameState((prev) => ({ ...prev, showHelp: !prev.showHelp }))}
          isOpen={gameState.showMap}
          onClose={() => setGameState((prev) => ({ ...prev, showMap: false }))}
          onJumpToLevel={(idx) => {
            const lvl = LEVELS[idx];
            let fs = cloneFS(INITIAL_FS);
            if (lvl.onEnter) fs = lvl.onEnter(fs, gameState);
            setGameState((prev) => ({
              ...prev,
              levelIndex: idx,
              fs,
              currentPath: lvl.initialPath || ['root', 'home', 'guest'],
              showEpisodeIntro: false,
              filters: {},
              showHidden: false, // Reset hidden files
              searchQuery: null, // Reset search
              searchResults: [], // Reset search results
              sortBy: 'natural', // Reset sort
              sortDirection: 'asc', // Reset sort direction
              future: [],
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
              usedDown: false,
              usedUp: false,
              usedG: false,
              usedGG: false,
              usedGI: false,
              usedGH: false,
              usedGD: false,
              usedGW: false,
              usedGO: false,
              usedTrashDelete: false,
              usedFilter: false,
              usedSearch: false,
              usedShiftP: false,
              usedHistoryBack: false,
              usedVisual: false,
              // Also reset completedTaskIds for the jumped level
              completedTaskIds: {},
              // Also reset completedTaskIds for the jumped level if we treat it as a fresh start,
              // but usually jump preserves state. Let's keep it simple.
            }));
          }}
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
          <div className="font-mono text-sm text-zinc-400">
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
                    setGameState((prev) => ({ ...prev, inputBuffer: val }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchConfirm();
                      e.stopPropagation();
                    } else if (e.key === 'Escape') {
                      setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
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
              <GCommandDialog onClose={() => setGameState((p) => ({ ...p, mode: 'normal' }))} />
            )}

            {gameState.mode === 'input-file' && (
              <InputModal
                label="Create"
                value={gameState.inputBuffer}
                onChange={(val) => setGameState((prev) => ({ ...prev, inputBuffer: val }))}
                onConfirm={handleInputConfirm}
                onCancel={() =>
                  setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }))
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
                  setGameState((prev) => {
                    const dir = getNodeByPath(prev.fs, prev.currentPath);
                    const newFilters = { ...prev.filters };
                    if (dir) newFilters[dir.id] = val;
                    return { ...prev, inputBuffer: val, filters: newFilters, cursorIndex: 0 };
                  });
                }}
                onConfirm={() => {
                  setGameState((p) => ({
                    ...p,
                    mode: 'normal',
                    inputBuffer: '',
                    stats: { ...p.stats, filterUsage: p.stats.filterUsage + 1 },
                  }));
                }}
                onCancel={() => {
                  setGameState((p) => ({
                    ...p,
                    mode: 'normal',
                    inputBuffer: '',
                    stats: { ...p.stats, filterUsage: p.stats.filterUsage + 1 },
                  }));
                }}
                borderColorClass="border-orange-500"
                testid="filter-input"
              />
            )}

            {gameState.mode === 'rename' && (
              <InputModal
                label="Rename"
                value={gameState.inputBuffer}
                onChange={(val) => setGameState((prev) => ({ ...prev, inputBuffer: val }))}
                onConfirm={handleRenameConfirm}
                onCancel={() =>
                  setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }))
                }
                borderColorClass="border-cyan-500" // or green/cyan mix
                testid="rename-input"
              />
            )}

            {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
              <FuzzyFinder
                gameState={gameState}
                onSelect={handleFuzzySelect}
                onClose={() => setGameState((p) => ({ ...p, mode: 'normal' }))}
              />
            )}
          </div>

          <PreviewPane
            node={currentItem}
            level={currentLevel}
            gameState={gameState}
            previewScroll={gameState.previewScroll}
            setGameState={setGameState}
          />
        </div>

        <StatusBar
          state={gameState}
          level={currentLevel}
          allTasksComplete={currentLevel.tasks.every((t) => t.completed) && !gameState.showHidden}
          onNextLevel={advanceLevel}
          currentItem={currentItem}
        />
      </div>
    </div>
  );
}
