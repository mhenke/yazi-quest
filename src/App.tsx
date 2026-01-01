import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  GameState,
  FileNode,
  Level,
  ZoxideEntry,
  calculateFrecency,
  Linemode,
  FsError,
  Result,
} from "./types";
import { LEVELS, INITIAL_FS, EPISODE_LORE } from "./constants";
import {
  getNodeByPath,
  getParentNode,
  renameNode,
  cloneFS,
  createPath,
  resolveAndCreatePath,
  getAllDirectories,
  resolvePath,
  getRecursiveContent,
} from "./utils/fsHelpers";
import { sortNodes } from "./utils/sortHelpers";
import { getVisibleItems } from "./utils/viewHelpers";
import { playSuccessSound, playTaskCompleteSound } from "./utils/sounds";
import { StatusBar } from "./components/StatusBar";
import { HelpModal } from "./components/HelpModal";
import { HintModal } from "./components/HintModal";
import { LevelProgress } from "./components/LevelProgress";
import { EpisodeIntro } from "./components/EpisodeIntro";
import { OutroSequence } from "./components/OutroSequence";
import { GameOverModal } from "./components/GameOverModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { OverwriteModal } from "./components/OverwriteModal";
import { SuccessToast } from "./components/SuccessToast";
import { ThreatAlert } from "./components/ThreatAlert";
import { HiddenFilesWarningModal } from "./components/HiddenFilesWarningModal";
import { InfoPanel } from "./components/InfoPanel";
import { GCommandDialog } from "./components/GCommandDialog";
import { FuzzyFinder } from "./components/FuzzyFinder";
import { MemoizedFileSystemPane as FileSystemPane } from "./components/FileSystemPane";
import { MemoizedPreviewPane as PreviewPane } from "./components/PreviewPane";
import { reportError } from "./utils/error";
import { measure } from "./utils/perf";
import { useKeyboardHandlers } from "./hooks/useKeyboardHandlers";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 1. Initialize Completed Tasks State
    const completedTaskIds: Record<number, string[]> = {};
    LEVELS.forEach(l => {
      completedTaskIds[l.id] = [];
    });

    // 2. Parse URL Parameters
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug");
    const epParam = params.get("ep") || params.get("episode");
    const lvlParam = params.get("lvl") || params.get("level") || params.get("mission");
    const tasksParam = params.get("tasks") || params.get("task") || params.get("complete");
    const skipIntro = params.get("intro") === "false";

    // 3. Determine Target Level
    let targetIndex = 0;
    if (debugParam === "outro") {
      targetIndex = LEVELS.length;
    } else if (lvlParam) {
      const id = parseInt(lvlParam, 10);
      const idx = LEVELS.findIndex(l => l.id === id);
      if (idx !== -1) targetIndex = idx;
    } else if (epParam) {
      const id = parseInt(epParam, 10);
      const idx = LEVELS.findIndex(l => l.episodeId === id);
      if (idx !== -1) targetIndex = idx;
    }

    // 4. Handle Task Completion (Bypass)
    if (tasksParam && targetIndex < LEVELS.length) {
      const levelId = LEVELS[targetIndex].id;
      if (tasksParam === "all") {
        completedTaskIds[levelId] = LEVELS[targetIndex].tasks.map(t => t.id);
      } else {
        const ids = tasksParam.split(",");
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

    // Initial Zoxide Data Logic - Pre-seeding for Episode II flow
    const now = Date.now();
    const initialZoxide: Record<string, ZoxideEntry> = {
      "/home/guest/datastore": { count: 42, lastAccess: now - 3600000 },
      "/home/guest/incoming": { count: 35, lastAccess: now - 1800000 },
      "/home/guest/workspace": { count: 28, lastAccess: now - 7200000 },
      "/home/guest/.config": { count: 30, lastAccess: now - 900000 },
      "/home/guest/.config/vault": { count: 25, lastAccess: now - 800000 },
      "/tmp": { count: 15, lastAccess: now - 1800000 },
      "/etc": { count: 8, lastAccess: now - 86400000 },
    };

    const initialPath = initialLevel.initialPath || ["root", "home", "guest"];

    if (initialLevel.initialPath) {
      const initialPathStr = resolvePath(INITIAL_FS, initialLevel.initialPath);
      if (!initialZoxide[initialPathStr]) {
        initialZoxide[initialPathStr] = { count: 1, lastAccess: now };
      }
    }

    // Prepare File System with Level-Specific Overrides
    // When jumping to a level via URL, replay all onEnter hooks from previous levels
    // to ensure filesystem state matches what a player would see progressing naturally
    let fs = cloneFS(INITIAL_FS);

    // Replay all onEnter hooks up to and including the target level
    for (let i = 0; i <= effectiveIndex; i++) {
      const level = LEVELS[i];
      if (level.onEnter) {
        try {
          const isFresh = JSON.stringify(fs) === JSON.stringify(INITIAL_FS);
          if (!level.seedMode || level.seedMode !== "fresh" || isFresh) {
            fs = level.onEnter(fs);
          }
        } catch (err) {
          try {
            reportError(err, { phase: "level.onEnter", level: level?.id });
          } catch {
            console.error(`Level ${level.id} onEnter failed`, err);
          }
        }
      }
    }

    return {
      currentPath: initialPath,
      cursorIndex: 0,
      clipboard: null,
      mode: "normal",
      inputBuffer: "",
      filters: {},
      sortBy: "natural",
      sortDirection: "asc",
      linemode: "size",
      history: [],
      future: [],
      previewScroll: 0,
      zoxideData: initialZoxide,
      levelIndex: targetIndex,
      fs: fs,
      levelStartFS: cloneFS(fs),
      levelStartPath: [...initialPath],
      notification: isDevOverride ? `DEV BYPASS ACTIVE` : null,
      selectedIds: [],
      pendingDeleteIds: [],
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
      usedCtrlA: false,
      usedGG: false,
      usedDown: false,
      usedUp: false,
      usedPreviewDown: false,
      usedPreviewUp: false,
      completedTaskIds,
    };
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showThreatAlert, setShowThreatAlert] = useState(false);
  const [showHiddenWarning, setShowHiddenWarning] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const currentLevelRaw = !isLastLevel ? LEVELS[gameState.levelIndex] : LEVELS[LEVELS.length - 1];

  // Derive currentLevel with completed tasks injected from state
  const currentLevel = useMemo(() => {
    return {
      ...currentLevelRaw,
      tasks: currentLevelRaw.tasks.map(t => ({
        ...t,
        completed: (gameState.completedTaskIds[currentLevelRaw.id] || []).includes(t.id),
      })),
    };
  }, [currentLevelRaw, gameState.completedTaskIds]);

  const visibleItems = React.useMemo(
    () => measure("visibleItems", () => getVisibleItems(gameState)),
    [gameState]
  );
  const currentItem = visibleItems[gameState.cursorIndex] || null;

  const parent = React.useMemo(
    () => getNodeByPath(gameState.fs, gameState.currentPath.slice(0, -1)),
    [gameState.fs, gameState.currentPath]
  );

  // Helper to show notification with auto-clear
  const showNotification = useCallback((message: string, duration: number = 3000) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setGameState(prev => ({ ...prev, notification: message }));
    notificationTimerRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, notification: null }));
      notificationTimerRef.current = null;
    }, duration);
  }, []);

  // Extract keyboard handlers to custom hook
  const {
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleNormalModeKeyDown,
  } = useKeyboardHandlers(showNotification);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // --- Task Checking & Level Progression ---
  useEffect(() => {
    if (isLastLevel || gameState.isGameOver) return;

    let changed = false;
    const newlyCompleted: string[] = [];

    currentLevel.tasks.forEach(task => {
      if (!task.completed && task.check(gameState, currentLevel)) {
        newlyCompleted.push(task.id);
        changed = true;
        playTaskCompleteSound(gameState.settings.soundEnabled);
      }
    });

    if (changed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameState(prev => ({
        ...prev,
        completedTaskIds: {
          ...prev.completedTaskIds,
          [currentLevel.id]: [...(prev.completedTaskIds[currentLevel.id] || []), ...newlyCompleted],
        },
      }));
    }

    // Check if everything is complete (including just finished ones)
    const tasksComplete = currentLevel.tasks.every(
      t => t.completed || newlyCompleted.includes(t.id)
    );

    if (tasksComplete) {
      if (gameState.showHidden) {
        // Enforce hidden files must be toggled off to complete any level
        setShowHiddenWarning(true);
        setShowSuccessToast(false);
      } else {
        setShowHiddenWarning(false);
        if (!showSuccessToast && !gameState.showEpisodeIntro) {
          playSuccessSound(gameState.settings.soundEnabled);
          setShowSuccessToast(true);
        }
      }
    } else {
      setShowHiddenWarning(false);
      setShowSuccessToast(false);
    }
  }, [gameState, currentLevel, isLastLevel, showNotification, showSuccessToast]);

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    const allTasksComplete = currentLevel.tasks.every(t => t.completed);
    if (allTasksComplete && !gameState.showHidden) return; // Pause timer only if completely finished

    if (
      !currentLevel.timeLimit ||
      isLastLevel ||
      gameState.showEpisodeIntro ||
      gameState.isGameOver
    )
      return;

    const timer = setInterval(() => {
      setGameState(prev => {
        // Check completion against state to avoid closure staleness issues with derived objects
        const levelId = LEVELS[prev.levelIndex].id;
        const tasks = LEVELS[prev.levelIndex].tasks;
        const completedIds = prev.completedTaskIds[levelId] || [];
        const isComplete = tasks.every(t => completedIds.includes(t.id));

        if (isComplete && !prev.showHidden) {
          clearInterval(timer);
          return prev;
        }

        if (prev.timeLeft === null || prev.timeLeft <= 0) {
          clearInterval(timer);
          return { ...prev, isGameOver: true, gameOverReason: "time" };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentLevel.timeLimit,
    isLastLevel,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    currentLevel,
    gameState.showHidden,
  ]);

  // Check Keystroke Limit
  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;

    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameState(prev => ({ ...prev, isGameOver: true, gameOverReason: "keystrokes" }));
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, isLastLevel, gameState.isGameOver]);

  // Trigger ThreatAlert on Level 5 start
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro) return;

    const levelId = currentLevel.id;
    if (levelId === 5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlertMessage(
        "🚨 QUARANTINE ALERT - Protocols flagged for lockdown. Evacuate immediately."
      );

      setShowThreatAlert(true);
      // No auto-dismiss; require explicit dismissal (Esc or Shift+Enter)
      return () => {};
    }
  }, [gameState.levelIndex, gameState.isGameOver, gameState.showEpisodeIntro, currentLevel.id]);

  const advanceLevel = useCallback(() => {
    setGameState(prev => {
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
          (!nextLevel.seedMode || nextLevel.seedMode !== "fresh" || isFresh)
        ) {
          fs = nextLevel.onEnter(fs);
        }
      } catch (err) {
        try {
          reportError(err, { phase: "nextLevel.onEnter", level: nextLevel?.id });
        } catch {
          console.error("nextLevel.onEnter failed", err);
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

      return {
        ...prev,
        levelIndex: nextIdx,
        fs: fs,
        levelStartFS: cloneFS(fs),
        levelStartPath: [...targetPath],
        currentPath: targetPath,
        cursorIndex: 0,
        filters: {},
        clipboard: null,
        sortBy: "natural",
        sortDirection: "asc",
        linemode: "size",
        notification: onEnterError ? "Level initialization failed" : null,
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
        usedHistoryBack: false,
        usedHistoryForward: false,
        zoxideData: newZoxideData,
        future: [],
        previewScroll: 0,
        completedTaskIds: {
          ...prev.completedTaskIds,
          [nextLevel.id]: [], // Ensure array exists for next level
        },
      };
    });
    setShowSuccessToast(false);
    setShowThreatAlert(false);
  }, []);

  const handleRestartLevel = useCallback(() => {
    setGameState(prev => {
      const restoredFS = cloneFS(prev.levelStartFS);
      const restoredPath = [...prev.levelStartPath];
      const currentLvl = LEVELS[prev.levelIndex];
      // Reset completed tasks for this level in the state map
      const newCompletedTaskIds = { ...prev.completedTaskIds, [currentLvl.id]: [] };

      return {
        ...prev,
        fs: restoredFS,
        currentPath: restoredPath,
        cursorIndex: 0,
        clipboard: null,
        mode: "normal",
        filters: {},
        notification: "System Reinitialized",
        selectedIds: [],
        pendingDeleteIds: [],
        pendingOverwriteNode: null,
        isGameOver: false,
        gameOverReason: undefined,
        timeLeft: currentLvl.timeLimit || null,
        keystrokes: 0,
        showHint: false,
        hintStage: 0,
        fuzzySelectedIndex: 0,
        usedG: false,
        usedGI: false,
        usedGC: false,
        usedCtrlA: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        future: [],
        previewScroll: 0,
        completedTaskIds: newCompletedTaskIds,
      };
    });
  }, []);

  // --- Handlers ---

  const handleFuzzyModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) => {
      // 1. Calculate Candidates - Match FuzzyFinder logic for consistency
      const isZoxide = gameState.mode === "zoxide-jump";
      let candidates: { path: string; score: number; pathIds?: string[] }[] = [];
      if (isZoxide) {
        candidates = Object.keys(gameState.zoxideData)
          .map(path => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
          .sort((a, b) => {
            const diff = b.score - a.score;
            if (Math.abs(diff) > 0.0001) return diff;
            return a.path.localeCompare(b.path);
          })
          .filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
      } else {
        candidates = getRecursiveContent(gameState.fs, gameState.currentPath)
          .filter(c => c.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()))
          .map(c => ({ path: c.display, score: 0, pathIds: c.path, type: c.type, id: c.id }));
      }

      if (e.key === "Enter") {
        const idx = gameState.fuzzySelectedIndex || 0;
        const selected = candidates[idx];
        if (selected) {
          if (isZoxide) {
            // Find path ids from string
            const allDirs = getAllDirectories(gameState.fs);
            const match = allDirs.find(d => d.display === selected.path);
            if (match) {
              const now = Date.now();

              // Add specific "Quantum" feedback for Level 7
              const isQuantum = gameState.levelIndex === 6;
              const notification = isQuantum
                ? ">> QUANTUM TUNNEL ESTABLISHED <<"
                : `Jumped to ${selected.path}`;

              setGameState(prev => ({
                ...prev,
                mode: "normal",
                currentPath: match.path,
                cursorIndex: 0,
                notification,
                inputBuffer: "",
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
              setGameState(prev => ({ ...prev, mode: "normal", inputBuffer: "" }));
            }
          } else {
            if (selected.pathIds && Array.isArray(selected.pathIds)) {
              // FZF Logic: Combine current path with selected relative pathIds
              const fullPath = [...gameState.currentPath, ...selected.pathIds];
              const targetDir = fullPath.slice(0, -1);
              const fileName = selected.pathIds[selected.pathIds.length - 1];

              // Find the index of the selected file in the parent directory
              const parentNode = getNodeByPath(gameState.fs, targetDir);

              // Calculate index based on SORTED/VISIBLE items to ensure correct highlighting
              let sortedChildren = parentNode?.children || [];
              if (!gameState.showHidden) {
                sortedChildren = sortedChildren.filter(c => !c.name.startsWith("."));
              }
              // Note: We don't apply existing filters because we are clearing them below
              sortedChildren = sortNodes(sortedChildren, gameState.sortBy, gameState.sortDirection);

              const fileIndex = sortedChildren.findIndex(c => c.id === fileName);

              setGameState(prev => {
                // CRITICAL FIX: Explicitly clear any filters for the target directory
                // so that siblings are visible when jumping to the file.
                const targetDirNode = getNodeByPath(prev.fs, targetDir);
                const newFilters = { ...prev.filters };
                if (targetDirNode) {
                  delete newFilters[targetDirNode.id];
                }

                return {
                  ...prev,
                  mode: "normal",
                  currentPath: targetDir,
                  cursorIndex: fileIndex >= 0 ? fileIndex : 0,
                  filters: newFilters,
                  inputBuffer: "",
                  history: [...prev.history, prev.currentPath],
                  future: [], // Reset future
                  notification: `Found: ${selected.path}`,
                  usedPreviewDown: false,
                  usedPreviewUp: false,
                  stats: { ...prev.stats, fzfFinds: prev.stats.fzfFinds + 1 },
                };
              });
            } else {
              setGameState(prev => ({ ...prev, mode: "normal", inputBuffer: "" }));
            }
          }
        } else {
          setGameState(prev => ({ ...prev, mode: "normal", inputBuffer: "" }));
        }
      } else if (e.key === "Escape") {
        setGameState(prev => ({ ...prev, mode: "normal", inputBuffer: "" }));
      } else if (e.key === "j" || e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
        setGameState(prev => ({
          ...prev,
          fuzzySelectedIndex: Math.min(candidates.length - 1, (prev.fuzzySelectedIndex || 0) + 1),
        }));
      } else if (e.key === "k" || e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
        setGameState(prev => ({
          ...prev,
          fuzzySelectedIndex: Math.max(0, (prev.fuzzySelectedIndex || 0) - 1),
        }));
      } else if (e.key === "Backspace") {
        setGameState(prev => ({
          ...prev,
          inputBuffer: prev.inputBuffer.slice(0, -1),
          fuzzySelectedIndex: 0,
        }));
      } else if (e.key.length === 1) {
        setGameState(prev => ({
          ...prev,
          inputBuffer: prev.inputBuffer + e.key,
          fuzzySelectedIndex: 0,
        }));
      }
    },
    []
  );

  // Global Key Down Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tasksComplete = currentLevel.tasks.every(t => t.completed);
      if (tasksComplete && !gameState.showHidden) {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          advanceLevel();
        }
        if (e.key === "Escape") {
          setShowSuccessToast(false);
        }
        return; // Block all other keys
      }

      if (showThreatAlert) {
        if (e.key === "Escape") {
          setShowThreatAlert(false);
        }
        return;
      }

      // GLOBAL MODAL BLOCKING: If help/hint/map modals are open, block everything except Esc/Tab handlers.
      if (gameState.showHelp || gameState.showHint || gameState.showMap) {
        if (e.key === "Escape") {
          setGameState(prev => ({
            ...prev,
            showHelp: false,
            showHint: false,
            showInfoPanel: false,
            showMap: false,
          }));
          e.preventDefault(); // Prevent further processing by other listeners
        }
        return; // Block all other keys from background Yazi
      }

      // If only the InfoPanel is open, block all emulator keys except Esc/Tab to close it
      if (gameState.showInfoPanel) {
        if (e.key === "Escape" || e.key === "Tab") {
          e.preventDefault();
          setGameState(prev => ({ ...prev, showInfoPanel: false }));
          return;
        }
        return; // Block all other keys while InfoPanel is open
      }

      if (
        gameState.showEpisodeIntro ||
        isLastLevel ||
        gameState.isGameOver ||
        ["input-file", "filter", "rename"].includes(gameState.mode)
      ) {
        // Let specific components handle keys or ignore
        return;
      }

      // Handle hidden files warning modal interception
      if (showHiddenWarning) {
        if (e.key === ".") {
          setGameState(prev => ({ ...prev, showHidden: !prev.showHidden }));
        }
        return; // Block other inputs
      }

      // Count keystrokes (only if no blocking modal)
      if (!["Shift", "Control", "Alt", "Tab", "Escape", "?", "m"].includes(e.key)) {
        setGameState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
      }

      if (e.key === "?" && e.altKey && gameState.mode === "normal") {
        e.preventDefault();
        setGameState(prev => ({ ...prev, showHelp: true }));
        return;
      }

      if (e.key === "h" && e.altKey && gameState.mode === "normal") {
        e.preventDefault();
        setGameState(prev => {
          if (prev.showHint) {
            const nextStage = (prev.hintStage + 1) % 3;
            return { ...prev, hintStage: nextStage };
          }
          return { ...prev, showHint: true, hintStage: 0 };
        });
        return;
      }

      // Alt+Shift+M - Toggle sound (meta command)
      if (e.key.toLowerCase() === "m" && e.altKey && e.shiftKey && gameState.mode === "normal") {
        e.preventDefault();
        setGameState(prev => ({
          ...prev,
          settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
          notification: `Sound ${!prev.settings.soundEnabled ? "Enabled" : "Disabled"}`,
        }));
        return;
      }

      // Mode dispatch
      switch (gameState.mode) {
        case "normal":
          handleNormalModeKeyDown(
            e,
            gameState,
            setGameState,
            visibleItems,
            parent,
            currentItem,
            currentLevel,
            advanceLevel
          );
          break;
        case "sort":
          handleSortModeKeyDown(e, setGameState);
          break;
        case "confirm-delete":
          handleConfirmDeleteModeKeyDown(e, setGameState, visibleItems, currentLevel);
          break;
        case "zoxide-jump":
        case "fzf-current":
          handleFuzzyModeKeyDown(e, gameState, setGameState);
          break;
        case "g-command":
          handleGCommandKeyDown(e, setGameState);
          break;
        case "overwrite-confirm":
          handleOverwriteConfirmKeyDown(e, setGameState);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
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
    showHiddenWarning,
    showThreatAlert,
    visibleItems, // Added
    currentItem, // Added
    parent, // Added
  ]);

  // Logic for create/rename input handled via input element events mainly
  const handleInputConfirm = () => {
    if (gameState.mode === "input-file") {
      const input = gameState.inputBuffer || "";

      // If the input contains a path separator or references ~ or /, resolve and create the whole path
      if (input.includes("/") || input.startsWith("~") || input.startsWith("/")) {
        const {
          fs: newFs,
          targetNode,
          error,
          collision,
          collisionNode,
        } = resolveAndCreatePath(gameState.fs, gameState.currentPath, input);
        if (collision && collisionNode) {
          setGameState(prev => ({
            ...prev,
            mode: "overwrite-confirm",
            pendingOverwriteNode: collisionNode,
            notification: "Collision detected",
          }));
          return;
        }
        if (error) {
          setGameState(prev => ({ ...prev, mode: "normal", notification: error, inputBuffer: "" }));
          return;
        }
        setGameState(prev => ({
          ...prev,
          fs: newFs,
          mode: "normal",
          inputBuffer: "",
          notification: targetNode ? "PATH CREATED" : "FILE CREATED",
        }));
        return;
      }

      const {
        fs: newFs,
        error,
        collision,
        collisionNode,
      } = createPath(gameState.fs, gameState.currentPath, input);
      if (collision && collisionNode) {
        setGameState(prev => ({
          ...prev,
          mode: "overwrite-confirm",
          pendingOverwriteNode: collisionNode,
          notification: "Collision detected",
        }));
      } else if (error) {
        setGameState(prev => ({ ...prev, mode: "normal", notification: error, inputBuffer: "" }));
      } else {
        setGameState(prev => ({
          ...prev,
          fs: newFs,
          mode: "normal",
          inputBuffer: "",
          notification: "FILE CREATED",
        }));
      }
    }
  };

  const handleRenameConfirm = () => {
    if (currentItem) {
      const res = renameNode(
        gameState.fs,
        gameState.currentPath,
        currentItem.id,
        gameState.inputBuffer,
        gameState.levelIndex
      );
      if (!res.ok) {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          notification: `Rename failed: ${(res as { ok: false; error: FsError }).error}`,
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          fs: res.value,
          mode: "normal",
          notification: "Renamed",
          stats: { ...prev.stats, renames: prev.stats.renames + 1 },
        }));
      }
    }
  };

  if (isLastLevel) {
    return <OutroSequence />;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {gameState.showEpisodeIntro && (
        <EpisodeIntro
          episode={EPISODE_LORE.find(e => e.id === currentLevel.episodeId)!}
          onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))}
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
        <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() => setGameState(prev => ({ ...prev, showHint: false, hintStage: 0 }))}
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => setGameState(prev => ({ ...prev, showInfoPanel: false }))}
        />
      )}

      {gameState.mode === "confirm-delete" && (
        <ConfirmationModal
          title="Confirm Delete"
          detail={`Permanently delete ${
            gameState.selectedIds.length > 0
              ? gameState.selectedIds.length + " items"
              : currentItem?.name
          }?`}
        />
      )}

      {showSuccessToast && (
        <SuccessToast
          message={currentLevel.successMessage || "Sector Cleared"}
          levelTitle={currentLevel.title}
          onDismiss={advanceLevel}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {showThreatAlert && (
        <ThreatAlert message={alertMessage} onDismiss={() => setShowThreatAlert(false)} />
      )}

      {showHiddenWarning && <HiddenFilesWarningModal />}

      {gameState.mode === "overwrite-confirm" && gameState.pendingOverwriteNode && (
        <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        <LevelProgress
          levels={LEVELS}
          currentLevelIndex={gameState.levelIndex}
          onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
          onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
          onToggleMap={() => setGameState(prev => ({ ...prev, showMap: !prev.showMap }))}
          onJumpToLevel={idx => {
            const lvl = LEVELS[idx];
            let fs = cloneFS(INITIAL_FS);
            if (lvl.onEnter) fs = lvl.onEnter(fs);
            setGameState(prev => ({
              ...prev,
              levelIndex: idx,
              fs,
              currentPath: lvl.initialPath || ["root", "home", "guest"],
              showEpisodeIntro: false,
              future: [],
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
              // Also reset completedTaskIds for the jumped level if we treat it as a fresh start,
              // but usually jump preserves state. Let's keep it simple.
            }));
          }}
        />

        <div
          className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 transition-opacity duration-200"
          style={{
            opacity: gameState.mode === "zoxide-jump" || gameState.mode === "fzf-current" ? 0.3 : 1,
          }}
        >
          <div className="font-mono text-sm text-zinc-400">
            {resolvePath(gameState.fs, gameState.currentPath).replace("/home/guest", "~")}
            {(() => {
              const dir = getNodeByPath(gameState.fs, gameState.currentPath);
              const filter = dir ? gameState.filters[dir.id] : null;
              return filter ? <span className="text-cyan-400"> (filter: {filter})</span> : null;
            })()}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative">
          <FileSystemPane
            items={(() => {
              const parent = getParentNode(gameState.fs, gameState.currentPath);
              return parent && parent.children ? sortNodes(parent.children, "natural", "asc") : [];
            })()}
            isActive={false}
            isParent={true}
            selectedIds={[]}
            clipboard={null}
            linemode={gameState.linemode}
            className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
          />

          <div className="flex-1 flex flex-col relative min-w-0">
            {gameState.mode === "sort" && (
              <div className="absolute bottom-6 right-0 m-2 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Sort Options
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">Which-Key</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">n</span>{" "}
                    <span className="text-zinc-400">Natural</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">N</span>{" "}
                    <span className="text-zinc-400">Natural (rev)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">a</span>{" "}
                    <span className="text-zinc-400">A-Z</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">A</span>{" "}
                    <span className="text-zinc-400">Z-A</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">m</span>{" "}
                    <span className="text-zinc-400">Modified (new)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">M</span>{" "}
                    <span className="text-zinc-400">Modified (old)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">s</span>{" "}
                    <span className="text-zinc-400">Size (large)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">S</span>{" "}
                    <span className="text-zinc-400">Size (small)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">e</span>{" "}
                    <span className="text-zinc-400">Extension</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">E</span>{" "}
                    <span className="text-zinc-400">Extension (rev)</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-800 my-1"></div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">l</span>{" "}
                    <span className="text-zinc-400">Cycle Linemode</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">-</span>{" "}
                    <span className="text-zinc-400">Clear Linemode</span>
                  </div>
                </div>
              </div>
            )}

            {gameState.mode === "g-command" && (
              <GCommandDialog onClose={() => setGameState(p => ({ ...p, mode: "normal" }))} />
            )}

            {gameState.mode === "filter" && (
              <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                    Filter:
                  </span>
                  <input
                    type="text"
                    value={gameState.inputBuffer}
                    onChange={e => {
                      const val = e.target.value;
                      setGameState(prev => {
                        const dir = getNodeByPath(prev.fs, prev.currentPath);
                        const newFilters = { ...prev.filters };
                        if (dir) newFilters[dir.id] = val;
                        return { ...prev, inputBuffer: val, filters: newFilters, cursorIndex: 0 };
                      });
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        setGameState(p => ({
                          ...p,
                          mode: "normal",
                          inputBuffer: "",
                          stats: { ...p.stats, filterUsage: p.stats.filterUsage + 1 },
                        }));
                        e.stopPropagation();
                      }
                    }}
                    className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">
                  Type to filter • Enter/Esc to close • Esc again to clear filter
                </div>
              </div>
            )}

            {gameState.mode === "input-file" && (
              <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                    Create:
                  </span>
                  <input
                    type="text"
                    value={gameState.inputBuffer}
                    onChange={e => setGameState(prev => ({ ...prev, inputBuffer: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleInputConfirm();
                      if (e.key === "Escape") setGameState(prev => ({ ...prev, mode: "normal" }));
                      e.stopPropagation();
                    }}
                    className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-2 font-mono">
                  Enter filename (end with / for folder) • Enter to confirm • Esc to cancel
                </div>
              </div>
            )}

            <FileSystemPane
              items={visibleItems}
              isActive={true}
              cursorIndex={gameState.cursorIndex}
              selectedIds={gameState.selectedIds}
              clipboard={gameState.clipboard}
              linemode={gameState.linemode}
              renameState={{
                isRenaming: gameState.mode === "rename",
                inputBuffer: gameState.inputBuffer,
              }}
              onRenameChange={val => setGameState(prev => ({ ...prev, inputBuffer: val }))}
              onRenameSubmit={handleRenameConfirm}
              onRenameCancel={() => setGameState(prev => ({ ...prev, mode: "normal" }))}
            />

            {(gameState.mode === "zoxide-jump" || gameState.mode === "fzf-current") && (
              <FuzzyFinder
                gameState={gameState}
                onSelect={(path, isZoxide) => {
                  if (isZoxide) {
                    const allDirs = getAllDirectories(gameState.fs);
                    const match = allDirs.find(d => d.display === path);
                    if (match) {
                      const now = Date.now();
                      const quantumMsg =
                        gameState.levelIndex === 6
                          ? ">> QUANTUM TUNNEL ESTABLISHED <<"
                          : `Jumped to ${path}`;
                      setGameState(prev => ({
                        ...prev,
                        mode: "normal",
                        currentPath: match.path,
                        cursorIndex: 0,
                        notification: quantumMsg,
                        stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                        zoxideData: {
                          ...prev.zoxideData,
                          [path]: {
                            count: (prev.zoxideData[path]?.count || 0) + 1,
                            lastAccess: now,
                          },
                        },
                        future: [],
                        previewScroll: 0,
                        usedPreviewDown: false,
                        usedPreviewUp: false,
                      }));
                    } else {
                      setGameState(prev => ({ ...prev, mode: "normal" }));
                    }
                  } else {
                    // FZF handling logic (inline inside component or here if lifted)
                    // For now the fuzzy finder component uses callback for FZF to navigate
                  }
                }}
                onClose={() => setGameState(p => ({ ...p, mode: "normal" }))}
              />
            )}
          </div>

          <PreviewPane
            node={currentItem}
            level={currentLevel}
            previewScroll={gameState.previewScroll}
          />
        </div>

        <StatusBar
          state={gameState}
          level={currentLevel}
          allTasksComplete={currentLevel.tasks.every(t => t.completed) && !gameState.showHidden}
          onNextLevel={advanceLevel}
          currentItem={currentItem}
        />
      </div>
    </div>
  );
}
