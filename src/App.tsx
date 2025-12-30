

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  GameState,
  FileNode,
  Level,
  ZoxideEntry,
  calculateFrecency,
  Linemode,
  FsError,
  Result,
} from '../types';
import { LEVELS, INITIAL_FS, EPISODE_LORE } from './constants';
import {
  getNodeByPath,
  getParentNode,
  deleteNode,
  addNode,
  renameNode,
  cloneFS,
  createPath,
  isProtected,
  getAllDirectories,
  resolvePath,
  getRecursiveContent,
} from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { getVisibleItems } from './utils/viewHelpers';
import { playSuccessSound, playTaskCompleteSound } from '../utils/sounds';
import { StatusBar } from '../components/StatusBar';
import { HelpModal } from '../components/HelpModal';
import { HintModal } from '../components/HintModal';
import { LevelProgress } from '../components/LevelProgress';
import { EpisodeIntro } from '../components/EpisodeIntro';
import { OutroSequence } from '../components/OutroSequence';
import { GameOverModal } from '../components/GameOverModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { OverwriteModal } from '../components/OverwriteModal';
import { SuccessToast } from '../components/SuccessToast';
import { ThreatAlert } from '../components/ThreatAlert';
import { InfoPanel } from '../components/InfoPanel';
import { GCommandDialog } from '../components/GCommandDialog';
import { FuzzyFinder } from '../components/FuzzyFinder';
import { MemoizedFileSystemPane } from '../components/FileSystemPane';
import { MemoizedPreviewPane } from '../components/PreviewPane';
import { reportError } from '../utils/error';
import { measure } from '../utils/perf';

const FileSystemPane = MemoizedFileSystemPane;
const PreviewPane = MemoizedPreviewPane;

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 1. Initialize Completed Tasks State
    const completedTaskIds: Record<number, string[]> = {};
    LEVELS.forEach((l) => { completedTaskIds[l.id] = []; });

    // 2. Parse URL Parameters
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug');
    const epParam = params.get('ep') || params.get('episode');
    const lvlParam = params.get('lvl') || params.get('level') || params.get('mission');
    const tasksParam = params.get('tasks') || params.get('task') || params.get('complete');
    const skipIntro = params.get('intro') === 'false';

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

    // Initial Zoxide Data Logic - Pre-seeding for Episode II flow
    const now = Date.now();
    const initialZoxide: Record<string, ZoxideEntry> = {
      '/home/guest/datastore': { count: 42, lastAccess: now - 3600000 },
      '/home/guest/incoming': { count: 35, lastAccess: now - 1800000 },
      '/home/guest/workspace': { count: 28, lastAccess: now - 7200000 },
      '/home/guest/.config': { count: 30, lastAccess: now - 900000 },
      '/home/guest/.config/vault': { count: 25, lastAccess: now - 800000 },
      '/tmp': { count: 15, lastAccess: now - 1800000 },
      '/etc': { count: 8, lastAccess: now - 86400000 },
    };

    const initialPath = initialLevel.initialPath || ['root', 'home', 'guest'];

    if (initialLevel.initialPath) {
      const initialPathStr = resolvePath(INITIAL_FS, initialLevel.initialPath);
      if (!initialZoxide[initialPathStr]) {
        initialZoxide[initialPathStr] = { count: 1, lastAccess: now };
      }
    }

    // Prepare File System with Level-Specific Overrides
    let fs = cloneFS(INITIAL_FS);
    if (initialLevel.onEnter) {
      try {
        // Only run 'fresh' seed hooks when starting from an untouched INITIAL_FS
        const isFreshStart = JSON.stringify(fs) === JSON.stringify(INITIAL_FS);
        if (!initialLevel.seedMode || initialLevel.seedMode !== 'fresh' || isFreshStart) {
          fs = initialLevel.onEnter(fs);
        }
      } catch (err) {
        try { reportError(err, { phase: 'initialLevel.onEnter', level: initialLevel?.id }); } catch(e) { console.error('initialLevel.onEnter failed', err); }
      }
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
      usedGG: false,
      usedDown: false,
      usedUp: false,
      completedTaskIds,
    };
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showThreatAlert, setShowThreatAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const prevAllTasksCompleteRef = useRef(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const currentLevelRaw = !isLastLevel ? LEVELS[gameState.levelIndex] : LEVELS[LEVELS.length - 1];

  // Derive currentLevel with completed tasks injected from state
  const currentLevel = useMemo(() => {
    return {
      ...currentLevelRaw,
      tasks: currentLevelRaw.tasks.map((t) => ({
        ...t,
        completed: (gameState.completedTaskIds[currentLevelRaw.id] || []).includes(t.id),
      })),
    };
  }, [currentLevelRaw, gameState.completedTaskIds]);

  const visibleItems = React.useMemo(() => measure('visibleItems', () => getVisibleItems(gameState)), [gameState]);
  const currentItem = visibleItems[gameState.cursorIndex] || null;

  // Helper to show notification with auto-clear
  const showNotification = useCallback((message: string, duration: number = 3000) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setGameState((prev) => ({ ...prev, notification: message }));
    notificationTimerRef.current = setTimeout(() => {
      setGameState((prev) => ({ ...prev, notification: null }));
      notificationTimerRef.current = null;
    }, duration);
  }, []);

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

    currentLevel.tasks.forEach((task) => {
      if (!task.completed && task.check(gameState, currentLevel)) {
        newlyCompleted.push(task.id);
        changed = true;
        playTaskCompleteSound(gameState.settings.soundEnabled);
      }
    });

    if (changed) {
      setGameState((prev) => ({
         ...prev,
         completedTaskIds: {
           ...prev.completedTaskIds,
           [currentLevel.id]: [...(prev.completedTaskIds[currentLevel.id] || []), ...newlyCompleted]
         }
      }));
    }

    // Check if everything is complete (including just finished ones)
    const tasksComplete = currentLevel.tasks.every((t) => t.completed || newlyCompleted.includes(t.id));

    if (tasksComplete) {
      if (gameState.showHidden) {
        // Enforce hidden files must be toggled off to complete any level
        if (gameState.notification !== 'Toggle hidden files off (.) to complete mission') {
          showNotification('Toggle hidden files off (.) to complete mission', 3000);
        }
      } else if (!prevAllTasksCompleteRef.current) {
        playSuccessSound(gameState.settings.soundEnabled);
        setShowSuccessToast(true);
      }
    }

    // Only set ref to true if tasks are complete AND showHidden is false
    prevAllTasksCompleteRef.current = tasksComplete && !gameState.showHidden;
  }, [gameState, currentLevel, isLastLevel, showNotification]);

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    const allTasksComplete = currentLevel.tasks.every((t) => t.completed);
    if (allTasksComplete && !gameState.showHidden) return; // Pause timer only if completely finished

    if (
      !currentLevel.timeLimit ||
      isLastLevel ||
      gameState.showEpisodeIntro ||
      gameState.isGameOver
    )
      return;

    const timer = setInterval(() => {
      setGameState((prev) => {
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
          return { ...prev, isGameOver: true, gameOverReason: 'time' };
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
    gameState.showHidden
  ]);

  // Check Keystroke Limit
  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;

    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
      setGameState((prev) => ({ ...prev, isGameOver: true, gameOverReason: 'keystrokes' }));
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, isLastLevel, gameState.isGameOver]);

  // Trigger ThreatAlert on Level 5 start
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro) return;
    
    const levelId = currentLevel.id;
    if (levelId === 5) {
      const timer = setTimeout(() => {
        setAlertMessage("🚨 QUARANTINE ALERT - Protocols flagged for lockdown. Evacuate immediately.");
        setShowThreatAlert(true);
        setTimeout(() => setShowThreatAlert(false), 10000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.levelIndex, gameState.isGameOver, gameState.showEpisodeIntro, currentLevel.id]);

  const advanceLevel = useCallback(() => {
    setGameState((prev) => {
      const nextIdx = prev.levelIndex + 1;

      if (nextIdx >= LEVELS.length) {
        return { ...prev, levelIndex: nextIdx };
      }

      const nextLevel = LEVELS[nextIdx];
      const isNewEp = nextLevel.episodeId !== LEVELS[prev.levelIndex].episodeId;

      let fs = cloneFS(prev.fs);
      let onEnterError: any = null;
      try {
        const isFresh = JSON.stringify(prev.fs) === JSON.stringify(INITIAL_FS);
        if (
          nextLevel.onEnter &&
          (!nextLevel.seedMode || nextLevel.seedMode !== 'fresh' || isFresh)
        ) {
          fs = nextLevel.onEnter(fs);
        }
      } catch (err) {
        try { reportError(err, { phase: 'nextLevel.onEnter', level: nextLevel?.id }); } catch(e) { console.error('nextLevel.onEnter failed', err); }
        onEnterError = err;
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
        sortBy: 'natural',
        sortDirection: 'asc',
        linemode: 'size',
        notification: onEnterError ? 'Level initialization failed' : null,
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
        zoxideData: newZoxideData,
        future: [],
        previewScroll: 0,
        completedTaskIds: {
            ...prev.completedTaskIds,
            [nextLevel.id]: [] // Ensure array exists for next level
        }
      };
    });
    setShowSuccessToast(false);
    setShowThreatAlert(false);
  }, []);

  const handleRestartLevel = useCallback(() => {
    setGameState((prev) => {
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
        mode: 'normal',
        filters: {},
        notification: 'System Reinitialized',
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
        usedGG: false,
        usedDown: false,
        usedUp: false,
        future: [],
        previewScroll: 0,
        completedTaskIds: newCompletedTaskIds,
      };
    });
  }, []);

  // --- Handlers ---
  
  const handleSortModeKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      const key = e.key;
      const shift = e.shiftKey;
      
      if (key === 'n' || key === 'N') {
          setGameState(prev => ({ ...prev, mode: 'normal', sortBy: 'natural', sortDirection: shift ? 'desc' : 'asc', notification: `Sort: Natural ${shift ? '(rev)' : ''}` }));
      } else if (key === 'a' || key === 'A') {
          setGameState(prev => ({ ...prev, mode: 'normal', sortBy: 'alphabetical', sortDirection: shift ? 'desc' : 'asc', notification: `Sort: A-Z ${shift ? '(rev)' : ''}` }));
      } else if (key === 'm' || key === 'M') {
          setGameState(prev => ({ ...prev, mode: 'normal', sortBy: 'modified', sortDirection: shift ? 'asc' : 'desc', linemode: 'mtime', notification: `Sort: Modified ${shift ? '(old)' : '(new)'}` }));
      } else if (key === 's' || key === 'S') {
          setGameState(prev => ({ ...prev, mode: 'normal', sortBy: 'size', sortDirection: shift ? 'asc' : 'desc', linemode: 'size', notification: `Sort: Size ${shift ? '(small)' : '(large)'}` }));
      } else if (key === 'e' || key === 'E') {
          setGameState(prev => ({ ...prev, mode: 'normal', sortBy: 'extension', sortDirection: shift ? 'desc' : 'asc', notification: `Sort: Extension ${shift ? '(rev)' : ''}` }));
      } else if (key === 'l') {
          setGameState(prev => {
              const modes: Linemode[] = ['none', 'size', 'mtime', 'permissions'];
              const nextIndex = (modes.indexOf(prev.linemode) + 1) % modes.length;
              return { ...prev, mode: 'normal', linemode: modes[nextIndex] };
          });
      } else if (key === '-') {
          setGameState(prev => ({ ...prev, mode: 'normal', linemode: 'none' }));
      } else if (key === 'Escape') {
          setGameState(prev => ({ ...prev, mode: 'normal' }));
      }
    }, []
  );

  const handleConfirmDeleteModeKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>, visibleItems: FileNode[]) => {
      if (e.key === 'y' || e.key === 'Enter') {
         setGameState(prev => {
            let newFs = prev.fs;
            let errorMsg: string | null | undefined = null;
            
            // Check protection
            for (const id of prev.pendingDeleteIds) {
                const node = visibleItems.find(n => n.id === id);
                if (node) {
                    const protection = isProtected(prev.fs, prev.currentPath, node, prev.levelIndex, 'delete');
                    if (protection) {
                        errorMsg = protection;
                        break;
                    }
                    const res = deleteNode(newFs, prev.currentPath, id, prev.levelIndex);
                    if (!res.ok) {
                        errorMsg = (res as { ok: false; error: FsError }).error;
                        break;
                    }
                    newFs = res.value;
                }
            }
            
            if (errorMsg) {
                return { ...prev, mode: 'normal', pendingDeleteIds: [], notification: `Error: ${errorMsg}` };
            }
            return { ...prev, fs: newFs, mode: 'normal', pendingDeleteIds: [], selectedIds: [], notification: 'Items deleted' };
         });
      } else if (e.key === 'n' || e.key === 'Escape') {
         setGameState(prev => ({ ...prev, mode: 'normal', pendingDeleteIds: [] }));
      }
    }, []
  );
  
  const handleOverwriteConfirmKeyDown = useCallback(
      (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
          if (e.key === 'y' || e.key === 'Enter') {
              setGameState(prev => {
                 if (!prev.pendingOverwriteNode) return { ...prev, mode: 'normal' };
                 
                 let newFs = prev.fs;
                 const deleteRes = deleteNode(newFs, prev.currentPath, prev.pendingOverwriteNode.id, prev.levelIndex);
                 if (!deleteRes.ok) return { ...prev, mode: 'normal', notification: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}` };
                 newFs = deleteRes.value;

                 const createRes = createPath(newFs, prev.currentPath, prev.inputBuffer);
                 
                 return { 
                     ...prev, 
                     fs: createRes.fs, 
                     mode: 'normal', 
                     pendingOverwriteNode: null, 
                     inputBuffer: '',
                     notification: 'Overwritten'
                 };
              });
          } else if (e.key === 'n' || e.key === 'Escape') {
              setGameState(prev => ({ ...prev, mode: 'normal', pendingOverwriteNode: null }));
          }
      }, []
  );

  const handleNormalModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      items: FileNode[],
      parent: FileNode | null,
      currentItem: FileNode | null,
      currentLevel: Level,
      advanceLevel: () => void
    ) => {
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          setGameState((prev) => ({
            ...prev,
            cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1),
            previewScroll: 0,
            usedDown: true
          }));
          break;
        case 'k':
        case 'ArrowUp':
          setGameState((prev) => ({ 
              ...prev, 
              cursorIndex: Math.max(0, prev.cursorIndex - 1), 
              previewScroll: 0,
              usedUp: true 
          }));
          break;
        case 'J':
          if (e.shiftKey) {
            setGameState((prev) => ({ ...prev, previewScroll: prev.previewScroll + 1 }));
          }
          break;
        case 'K':
          if (e.shiftKey) {
            setGameState((prev) => ({ ...prev, previewScroll: Math.max(0, prev.previewScroll - 1) }));
          }
          break;
        case 'g':
          e.preventDefault();
          setGameState((prev) => ({ ...prev, mode: 'g-command' }));
          break;
        case 'h':
          if (parent) {
            setGameState((prev) => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              previewScroll: 0
            }));
          }
          break;
        case 'H':
           if (e.shiftKey && gameState.history.length > 0) {
              setGameState(prev => {
                  const newHistory = [...prev.history];
                  const previousPath = newHistory.pop();
                  if (!previousPath) return prev;
                  
                  const newFuture = [...prev.future, prev.currentPath];

                  return {
                      ...prev,
                      history: newHistory,
                      future: newFuture,
                      currentPath: previousPath,
                      cursorIndex: 0,
                      previewScroll: 0,
                      notification: 'Navigated back'
                  };
              });
           }
           break;
        case 'L':
            if (e.shiftKey && gameState.future.length > 0) {
               setGameState(prev => {
                   const newFuture = [...prev.future];
                   const nextPath = newFuture.pop();
                   if (!nextPath) return prev;

                   const newHistory = [...prev.history, prev.currentPath];
                   
                   return {
                       ...prev,
                       history: newHistory,
                       future: newFuture,
                       currentPath: nextPath,
                       cursorIndex: 0,
                       previewScroll: 0,
                       notification: 'Navigated forward'
                   };
               });
            }
            break;
        case 'd':
          if (gameState.selectedIds.length > 0 || currentItem) {
            setGameState((prev) => ({
              ...prev,
              mode: 'confirm-delete',
              pendingDeleteIds: prev.selectedIds.length > 0 ? prev.selectedIds : [currentItem!.id],
            }));
          }
          break;
        case 'G':
          setGameState((prev) => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const inRequiredDir =
              currentDir?.name === 'datastore' || currentDir?.name === 'incoming';
            return {
              ...prev,
              cursorIndex: items.length - 1,
              usedG: inRequiredDir ? true : prev.usedG,
              previewScroll: 0
            };
          });
          break;
        case 'ArrowLeft':
          if (parent) {
            setGameState((prev) => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              previewScroll: 0
            }));
          }
          break;
        case 'l':
        case 'Enter':
        case 'ArrowRight':
          const allComplete = currentLevel.tasks.every((t) => t.completed);
          if (allComplete && !gameState.showHidden && e.key === 'Enter' && e.shiftKey) {
            advanceLevel();
            return;
          }
          if (currentItem && (currentItem.type === 'dir' || currentItem.type === 'archive')) {
            setGameState((prev) => {
              const nextPath = [...prev.currentPath, currentItem.id];
              const pathStr = resolvePath(prev.fs, nextPath);
              const now = Date.now();
              return {
                ...prev,
                currentPath: nextPath,
                cursorIndex: 0,
                usedG: false, // Reset jump tracking on navigation
                usedGG: false,
                history: [...prev.history, prev.currentPath], // Push to history
                future: [], // Clear future on new navigation
                previewScroll: 0,
                zoxideData: {
                  ...prev.zoxideData,
                  [pathStr]: {
                    count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                    lastAccess: now,
                  },
                },
              };
            });
          }
          break;
        case ' ':
          if (currentItem) {
            setGameState((prev) => {
              const newSelected = prev.selectedIds.includes(currentItem.id)
                ? prev.selectedIds.filter((id) => id !== currentItem.id)
                : [...prev.selectedIds, currentItem.id];
              return {
                ...prev,
                selectedIds: newSelected,
                cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1),
                previewScroll: 0
              };
            });
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map((item) => item.id);
            setGameState((prev) => ({ ...prev, selectedIds: allIds }));
            showNotification(`Selected all (${allIds.length} items)`, 2000);
          } else {
            e.preventDefault();
            setGameState((prev) => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map((item) => item.id);
            const inverted = allIds.filter((id) => !gameState.selectedIds.includes(id));
            setGameState((prev) => ({ ...prev, selectedIds: inverted }));
            showNotification(`Inverted selection (${inverted.length} items)`, 2000);
          } else if (gameState.selectedIds.length > 1) {
            setGameState((prev) => ({
              ...prev,
              notification: 'Batch rename not available in this version',
            }));
          } else if (currentItem) {
            e.preventDefault();
            setGameState((prev) => ({ ...prev, mode: 'rename', inputBuffer: currentItem.name }));
          }
          break;
        case 'x':
        case 'y':
          if (gameState.selectedIds.length > 0) {
            const nodes = getVisibleItems(gameState).filter((n) =>
              gameState.selectedIds.includes(n.id)
            );
            // Add path-aware protection check for CUT
            if (e.key === 'x') {
              const protectedItem = nodes
                .map((node) =>
                  isProtected(
                    gameState.fs,
                    gameState.currentPath,
                    node,
                    gameState.levelIndex,
                    'cut'
                  )
                )
                .find((res) => res !== null);
              if (protectedItem) {
                showNotification(`🔒 PROTECTED: ${protectedItem}`, 4000);
                return;
              }
            }
            setGameState((prev) => ({
              ...prev,
              clipboard: {
                nodes,
                action: e.key === 'x' ? 'cut' : 'yank',
                originalPath: prev.currentPath,
              },
              selectedIds: [],
              notification: `${nodes.length} item(s) ${e.key === 'x' ? 'cut' : 'yanked'}`,
            }));
          } else if (currentItem) {
            // Add path-aware protection check for CUT
            if (e.key === 'x') {
              const protection = isProtected(
                gameState.fs,
                gameState.currentPath,
                currentItem,
                gameState.levelIndex,
                'cut'
              );
              if (protection) {
                showNotification(`🔒 PROTECTED: ${protection}`, 4000);
                return;
              }
            }
            setGameState((prev) => ({
              ...prev,
              clipboard: {
                nodes: [currentItem],
                action: e.key === 'x' ? 'cut' : 'yank',
                originalPath: prev.currentPath,
              },
              notification: `"${currentItem.name}" ${e.key === 'x' ? 'cut' : 'yanked'}`,
            }));
          }
          break;
        case 'p':
          if (gameState.clipboard) {
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  const addResult: Result<FileNode, FsError> = addNode(newFs, gameState.currentPath, node);
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;
                  
                  if (gameState.clipboard?.action === 'cut') {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(newFs, gameState.clipboard.originalPath, node.id, gameState.levelIndex);
                    if (!deleteResult.ok) {
                        error = (deleteResult as { ok: false; error: FsError }).error;
                        errorNodeName = node.name;
                        break;
                    }
                    newFs = deleteResult.value;
                  }
                }

                if (error) {
                  showNotification(`Paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                  setGameState((prev) => ({
                    ...prev,
                    fs: newFs,
                    clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
                    notification: `Deployed ${prev.clipboard?.nodes.length} assets`,
                  }));
                }
              } catch (err) {
                try { reportError(err, { phase: 'paste', action: 'p' }); } catch(e) { console.error(err); }
                showNotification('Paste failed', 4000);
              }
            }
          }
          break;
        case 'P':
          if (e.shiftKey && gameState.clipboard) {
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  const existingNode = currentDir.children?.find(
                    (c) => c.name === node.name && c.type === node.type
                  );

                  if (existingNode) {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(newFs, gameState.currentPath, existingNode.id, gameState.levelIndex);
                    if (!deleteResult.ok) {
                      error = (deleteResult as { ok: false; error: FsError }).error;
                      errorNodeName = existingNode.name;
                      break;
                    }
                    newFs = deleteResult.value;
                  }
                  
                  const addResult: Result<FileNode, FsError> = addNode(newFs, gameState.currentPath, node);
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;

                  if (gameState.clipboard?.action === 'cut') {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(newFs, gameState.clipboard.originalPath, node.id, gameState.levelIndex);
                    if (!deleteResult.ok) {
                        error = (deleteResult as { ok: false; error: FsError }).error;
                        errorNodeName = node.name;
                        break;
                    }
                    newFs = deleteResult.value;
                  }
                }

                if (error) {
                    showNotification(`Force paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                    setGameState((prev) => ({
                      ...prev,
                      fs: newFs,
                      clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
                      notification: `Force deployed ${prev.clipboard?.nodes.length} assets`,
                    }));
                }

              } catch (err) {
                try { reportError(err, { phase: 'paste', action: 'P' }); } catch(e) { console.error(err); }
                showNotification('Force paste failed', 4000);
              }
            }
          }
          break;
        case 'f':
          e.preventDefault();
          setGameState((prev) => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const existingFilter = currentDir ? prev.filters[currentDir.id] || '' : '';
            return { ...prev, mode: 'filter', inputBuffer: existingFilter };
          });
          break;
        case '.':
          setGameState((prev) => ({ ...prev, showHidden: !prev.showHidden }));
          break;
        case ',':
          setGameState((prev) => ({ ...prev, mode: 'sort' }));
          break;
        case 'm':
          setGameState((prev) => ({
            ...prev,
            settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
            notification: `Sound ${!prev.settings.soundEnabled ? 'Enabled' : 'Disabled'}`,
          }));
          break;
        case 'Z':
          if (e.shiftKey) {
            setGameState((prev) => ({
              ...prev,
              mode: 'zoxide-jump',
              inputBuffer: '',
              fuzzySelectedIndex: 0,
            }));
          }
          break;
        case 'z':
          if (!e.shiftKey) {
            setGameState((prev) => ({
              ...prev,
              mode: 'fzf-current',
              inputBuffer: '',
              fuzzySelectedIndex: 0,
            }));
          }
          break;
        case 'Escape':
          setGameState((prev) => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const hasFilter = currentDir && prev.filters[currentDir.id];
            if (hasFilter) {
              const newFilters = { ...prev.filters };
              delete newFilters[currentDir.id];
              return { ...prev, filters: newFilters, notification: 'Scan filter deactivated' };
            }
            if (prev.selectedIds.length > 0) {
              return { ...prev, selectedIds: [], notification: 'Selection cleared' };
            }
            return prev;
          });
          break;
      }
      if (e.key === 'Y' || e.key === 'X') {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, clipboard: null }));
        showNotification('CLIPBOARD CLEARED', 2000);
      }
    },
    [showNotification]
  );
  
  const handleFuzzyModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) => {
      // 1. Calculate Candidates - Match FuzzyFinder logic for consistency
      const isZoxide = gameState.mode === 'zoxide-jump';
      let candidates: { path: string; score: number; pathIds?: string[] }[] = [];
      if (isZoxide) {
        candidates = Object.keys(gameState.zoxideData)
          .map((path) => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
          .sort((a, b) => {
            const diff = b.score - a.score;
            if (Math.abs(diff) > 0.0001) return diff;
            return a.path.localeCompare(b.path);
          })
          .filter((c) => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
      } else {
        candidates = getRecursiveContent(gameState.fs, gameState.currentPath)
          .filter((c) => c.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()))
          .map((c) => ({ path: c.display, score: 0, pathIds: c.path, type: c.type, id: c.id }));
      }

      if (e.key === 'Enter') {
        const idx = gameState.fuzzySelectedIndex || 0;
        const selected = candidates[idx];
        if (selected) {
          if (isZoxide) {
            // Find path ids from string
            const allDirs = getAllDirectories(gameState.fs);
            const match = allDirs.find((d) => d.display === selected.path);
            if (match) {
              const now = Date.now();

              // Add specific "Quantum" feedback for Level 7
              const isQuantum = gameState.levelIndex === 6;
              const notification = isQuantum
                ? '>> QUANTUM TUNNEL ESTABLISHED <<'
                : `Jumped to ${selected.path}`;

              setGameState((prev) => ({
                ...prev,
                mode: 'normal',
                currentPath: match.path,
                cursorIndex: 0,
                notification,
                inputBuffer: '',
                history: [...prev.history, prev.currentPath],
                future: [], // Reset future on new jump
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
              // FZF Logic: Combine current path with selected relative pathIds
              const fullPath = [...gameState.currentPath, ...selected.pathIds];
              const targetDir = fullPath.slice(0, -1);
              const fileName = selected.pathIds[selected.pathIds.length - 1];

              // Find the index of the selected file in the parent directory
              const parentNode = getNodeByPath(gameState.fs, targetDir);
              
              // Calculate index based on SORTED/VISIBLE items to ensure correct highlighting
              let sortedChildren = parentNode?.children || [];
              if (!gameState.showHidden) {
                  sortedChildren = sortedChildren.filter(c => !c.name.startsWith('.'));
              }
              // Note: We don't apply existing filters because we are clearing them below
              sortedChildren = sortNodes(sortedChildren, gameState.sortBy, gameState.sortDirection);
              
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
                    notification: `Found: ${selected.path}`,
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
      } else if (e.key === 'Escape') {
        setGameState((prev) => ({ ...prev, mode: 'normal', inputBuffer: '' }));
      } else if (e.key === 'j' || e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
        setGameState((prev) => ({
          ...prev,
          fuzzySelectedIndex: Math.min(candidates.length - 1, (prev.fuzzySelectedIndex || 0) + 1),
        }));
      } else if (e.key === 'k' || e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
        setGameState((prev) => ({
          ...prev,
          fuzzySelectedIndex: Math.max(0, (prev.fuzzySelectedIndex || 0) - 1),
        }));
      } else if (e.key === 'Backspace') {
        setGameState((prev) => ({
          ...prev,
          inputBuffer: prev.inputBuffer.slice(0, -1),
          fuzzySelectedIndex: 0,
        }));
      } else if (e.key.length === 1) {
        setGameState((prev) => ({
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
        if (gameState.showEpisodeIntro || isLastLevel || gameState.isGameOver || ['input-file', 'filter', 'rename'].includes(gameState.mode)) {
            // Let specific components handle keys or ignore
            return;
        }

        // Count keystrokes
        // Only count specific keys if needed, but for simplicity count mostly everything relevant
        if (!['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm'].includes(e.key)) {
            setGameState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
        }

        const items = getVisibleItems(gameState);
        const parent = getParentNode(gameState.fs, gameState.currentPath);
        const current = items[gameState.cursorIndex] || null;

        // Modal toggles
        if (e.key === 'Escape') {
             if (gameState.showHelp || gameState.showHint || gameState.showInfoPanel) {
                 setGameState(prev => ({ ...prev, showHelp: false, showHint: false, showInfoPanel: false }));
                 return;
             }
             // Handled in specific modes too
        }

        const tasksComplete = currentLevel.tasks.every(t => t.completed);
        if (tasksComplete && !gameState.showHidden && e.key === 'Enter' && e.shiftKey) {
             e.preventDefault();
             advanceLevel();
             return;
        }
        
        if (e.key === '?' && gameState.mode === 'normal') {
            setGameState(prev => ({ ...prev, showHelp: true }));
            return;
        }

        if (e.key === 'H' && e.shiftKey && gameState.mode === 'normal') {
            setGameState(prev => {
                if (prev.showHint) {
                    const nextStage = (prev.hintStage + 1) % 3;
                    return { ...prev, hintStage: nextStage };
                }
                return { ...prev, showHint: true, hintStage: 0 };
            });
            return;
        }

        if (e.key === 'Tab' && gameState.mode === 'normal') {
            setGameState(prev => ({ ...prev, showInfoPanel: true }));
            return;
        }

        // Mode dispatch
        if (gameState.mode === 'normal') {
            handleNormalModeKeyDown(e, gameState, setGameState, items, parent, current, currentLevel, advanceLevel);
        } else if (gameState.mode === 'sort') {
            handleSortModeKeyDown(e, setGameState);
        } else if (gameState.mode === 'confirm-delete') {
            handleConfirmDeleteModeKeyDown(e, setGameState, items);
        } else if (gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') {
            handleFuzzyModeKeyDown(e, gameState, setGameState);
        } else if (gameState.mode === 'g-command') {
            // Inline handling for G-command map keys as they are simple
             if (e.key === 'Escape') setGameState(prev => ({ ...prev, mode: 'normal' }));
             else if (e.key === 'g') setGameState(prev => ({ ...prev, cursorIndex: 0, mode: 'normal', usedGG: true, previewScroll: 0 }));
             else if (e.key === 'G') {
                 // gg handled above, Shift+G handled in normal mode
             }
             else if (e.key === 'h') {
                 const homePath = ['root', 'home', 'guest'];
                 setGameState(prev => ({ ...prev, currentPath: homePath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to home', future: [], previewScroll: 0 }));
             }
             else if (e.key === 'c') {
                 // goto .config
                 const path = ['root', 'home', 'guest', '.config'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to config', future: [], previewScroll: 0 }));
             }
             else if (e.key === 'w') {
                 // goto workspace
                 const path = ['root', 'home', 'guest', 'workspace'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to workspace', future: [], previewScroll: 0 }));
             }
             else if (e.key === 't') {
                 const path = ['root', 'tmp'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to tmp', future: [], previewScroll: 0 }));
             }
             else if (e.key === 'r') {
                 const path = ['root'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to root', future: [], previewScroll: 0 }));
             }
             else if (e.key === 'i') {
                 const path = ['root', 'home', 'guest', 'incoming'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to incoming', future: [], previewScroll: 0 }));
             }
             else if (e.key === 'd') {
                 const path = ['root', 'home', 'guest', 'datastore'];
                 setGameState(prev => ({ ...prev, currentPath: path, cursorIndex: 0, mode: 'normal', notification: 'Jumped to datastore', future: [], previewScroll: 0 }));
             }
             else {
                 setGameState(prev => ({ ...prev, mode: 'normal' }));
             }
        } else if (gameState.mode === 'overwrite-confirm') {
            handleOverwriteConfirmKeyDown(e, setGameState);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentLevel, isLastLevel, handleNormalModeKeyDown, handleSortModeKeyDown, handleConfirmDeleteModeKeyDown, handleFuzzyModeKeyDown, handleOverwriteConfirmKeyDown, advanceLevel]);
  
  // Logic for create/rename input handled via input element events mainly
  const handleInputConfirm = () => {
      if (gameState.mode === 'input-file') {
          const { fs: newFs, error, collision, collisionNode } = createPath(gameState.fs, gameState.currentPath, gameState.inputBuffer);
          if (collision && collisionNode) {
              setGameState(prev => ({ ...prev, mode: 'overwrite-confirm', pendingOverwriteNode: collisionNode, notification: 'Collision detected' }));
          } else if (error) {
              setGameState(prev => ({ ...prev, mode: 'normal', notification: error, inputBuffer: '' }));
          } else {
              setGameState(prev => ({ ...prev, fs: newFs, mode: 'normal', inputBuffer: '', notification: 'FILE CREATED' }));
          }
      }
  };
  
  const handleRenameConfirm = () => {
      if (currentItem) {
          const res = renameNode(gameState.fs, gameState.currentPath, currentItem.id, gameState.inputBuffer, gameState.levelIndex);
          if (!res.ok) {
              setGameState(prev => ({ ...prev, mode: 'normal', notification: `Rename failed: ${(res as { ok: false; error: FsError }).error}` }));
          } else {
              setGameState(prev => ({ ...prev, fs: res.value, mode: 'normal', notification: 'Renamed', stats: { ...prev.stats, renames: prev.stats.renames + 1 } }));
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
          title="Confirm Delete"
          detail={`Permanently delete ${
            gameState.selectedIds.length > 0
              ? gameState.selectedIds.length + ' items'
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

      {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
          <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        <LevelProgress
          levels={LEVELS}
          currentLevelIndex={gameState.levelIndex}
          onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
          onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
          onJumpToLevel={(idx) => {
             const lvl = LEVELS[idx];
             let fs = cloneFS(INITIAL_FS); 
             if (lvl.onEnter) fs = lvl.onEnter(fs);
             setGameState(prev => ({
                ...prev,
                levelIndex: idx,
                fs,
                currentPath: lvl.initialPath || ['root', 'home', 'guest'],
                showEpisodeIntro: false,
                future: [],
                previewScroll: 0,
                // Also reset completedTaskIds for the jumped level if we treat it as a fresh start, 
                // but usually jump preserves state. Let's keep it simple.
             }));
          }}
        />

        <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 transition-opacity duration-200" style={{ opacity: (gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') ? 0.3 : 1 }}>
           <div className="font-mono text-sm text-zinc-400">
             {resolvePath(gameState.fs, gameState.currentPath).replace('/home/guest', '~')}
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
                 return parent && parent.children ? sortNodes(parent.children, 'natural', 'asc') : [];
             })()}
            isActive={false}
            isParent={true}
            selectedIds={[]}
            clipboard={null}
            linemode={gameState.linemode}
            className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
          />

          <div className="flex-1 flex flex-col relative min-w-0">
             {gameState.mode !== 'normal' && !['confirm-delete', 'sort', 'g-command', 'overwrite-confirm', 'zoxide-jump', 'fzf-current'].includes(gameState.mode) && (
                 <div className="bg-zinc-800 p-2 border-b border-zinc-700 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-black bg-blue-500 px-2 rounded">
                        {gameState.mode.replace('input-', 'create ').replace('fzf-', 'find ')}
                    </span>
                    <input 
                        type="text" 
                        className="bg-transparent border-none outline-none text-sm font-mono text-white w-full"
                        value={gameState.inputBuffer}
                        autoFocus
                        readOnly
                    />
                     <div className="w-2 h-4 bg-white animate-pulse -ml-1"></div>
                 </div>
             )}

             {gameState.mode === 'sort' && (
                 <div className="absolute bottom-6 right-0 m-2 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-bottom-2 duration-150">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sort Options</span>
                        <span className="text-[10px] font-mono text-zinc-600">Which-Key</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">n</span> <span className="text-zinc-400">Natural</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">N</span> <span className="text-zinc-400">Natural (rev)</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">a</span> <span className="text-zinc-400">A-Z</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">A</span> <span className="text-zinc-400">Z-A</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">m</span> <span className="text-zinc-400">Modified (new)</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">M</span> <span className="text-zinc-400">Modified (old)</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">s</span> <span className="text-zinc-400">Size (large)</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">S</span> <span className="text-zinc-400">Size (small)</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">e</span> <span className="text-zinc-400">Extension</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">E</span> <span className="text-zinc-400">Extension (rev)</span></div>
                        <div className="col-span-2 border-t border-zinc-800 my-1"></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">l</span> <span className="text-zinc-400">Cycle Linemode</span></div>
                        <div className="flex gap-2"><span className="text-orange-500 font-bold">-</span> <span className="text-zinc-400">Clear Linemode</span></div>
                    </div>
                 </div>
             )}
             
             {gameState.mode === 'g-command' && <GCommandDialog onClose={() => setGameState(p => ({...p, mode: 'normal'}))} />}
             
             {gameState.mode === 'filter' && (
                <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                   <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Filter:</span>
                        <input
                            type="text"
                            value={gameState.inputBuffer}
                            onChange={(e) => {
                                const val = e.target.value;
                                setGameState(prev => {
                                    const dir = getNodeByPath(prev.fs, prev.currentPath);
                                    const newFilters = { ...prev.filters };
                                    if (dir) newFilters[dir.id] = val;
                                    return { ...prev, inputBuffer: val, filters: newFilters, cursorIndex: 0 };
                                });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    setGameState(p => ({ ...p, mode: 'normal', inputBuffer: '', stats: { ...p.stats, filterUsage: p.stats.filterUsage + 1 } }));
                                    e.stopPropagation();
                                }
                            }}
                            className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-orange-500"
                            autoFocus
                        />
                   </div>
                   <div className="text-[10px] text-zinc-500 mt-2 font-mono">Type to filter • Enter/Esc to close • Esc again to clear filter</div>
                </div>
             )}

             {gameState.mode === 'input-file' && (
                <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                   <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Create:</span>
                        <input
                            type="text"
                            value={gameState.inputBuffer}
                            onChange={(e) => setGameState(prev => ({...prev, inputBuffer: e.target.value}))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInputConfirm();
                                if (e.key === 'Escape') setGameState(prev => ({...prev, mode: 'normal'}));
                                e.stopPropagation();
                            }}
                            className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-blue-500"
                            autoFocus
                        />
                   </div>
                   <div className="text-[10px] text-zinc-500 mt-2 font-mono">Enter filename (end with / for folder) • Enter to confirm • Esc to cancel</div>
                </div>
             )}

             <FileSystemPane
               items={visibleItems}
               isActive={true}
               cursorIndex={gameState.cursorIndex}
               selectedIds={gameState.selectedIds}
               clipboard={gameState.clipboard}
               linemode={gameState.linemode}
               renameState={{ isRenaming: gameState.mode === 'rename', inputBuffer: gameState.inputBuffer }}
               onRenameChange={(val) => setGameState(prev => ({ ...prev, inputBuffer: val }))}
               onRenameSubmit={handleRenameConfirm}
               onRenameCancel={() => setGameState(prev => ({ ...prev, mode: 'normal' }))}
             />
             
             {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
                 <FuzzyFinder 
                    gameState={gameState}
                    onSelect={(path, isZoxide) => { 
                         if (isZoxide) {
                             const allDirs = getAllDirectories(gameState.fs);
                             const match = allDirs.find((d) => d.display === path);
                             if (match) {
                                  const now = Date.now();
                                  const quantumMsg = gameState.levelIndex === 6 ? '>> QUANTUM TUNNEL ESTABLISHED <<' : `Jumped to ${path}`;
                                  setGameState(prev => ({
                                      ...prev,
                                      mode: 'normal',
                                      currentPath: match.path,
                                      cursorIndex: 0,
                                      notification: quantumMsg,
                                      stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                                      zoxideData: { ...prev.zoxideData, [path]: { count: (prev.zoxideData[path]?.count || 0) + 1, lastAccess: now } },
                                      future: [],
                                      previewScroll: 0
                                  }));
                             } else {
                                  setGameState(prev => ({ ...prev, mode: 'normal' }));
                             }
                         } else {
                             // FZF handling logic (inline inside component or here if lifted)
                             // For now the fuzzy finder component uses callback for FZF to navigate
                         }
                    }}
                    onClose={() => setGameState(p => ({...p, mode: 'normal'}))}
                 />
             )}
          </div>

          <PreviewPane node={currentItem} level={currentLevel} previewScroll={gameState.previewScroll} />
        </div>

        <StatusBar
          state={gameState}
          level={currentLevel}
          allTasksComplete={currentLevel.tasks.every(t => t.completed)}
          onNextLevel={advanceLevel}
          currentItem={currentItem}
        />
      </div>
    </div>
  );
}
