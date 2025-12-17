
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FileNode, Level, ClipboardItem, ZoxideEntry, calculateFrecency, Linemode } from './types';
import { LEVELS, INITIAL_FS, EPISODE_LORE, KEYBINDINGS } from './constants';
import { getNodeByPath, getParentNode, deleteNode, addNode, renameNode, cloneFS, createPath, isProtected, getAllDirectories, resolvePath, getRecursiveContent } from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { playSuccessSound, playTaskCompleteSound } from './utils/sounds';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { GameOverModal } from './components/GameOverModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OverwriteModal } from './components/OverwriteModal';
import { SuccessToast } from './components/SuccessToast';
import { InfoPanel } from './components/InfoPanel';
import { GCommandDialog } from './components/GCommandDialog';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 1. Clean Slate for Tasks
    LEVELS.forEach(l => l.tasks.forEach(t => t.completed = false));

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
        const idx = LEVELS.findIndex(l => l.id === id);
        if (idx !== -1) targetIndex = idx;
    } else if (epParam) {
        const id = parseInt(epParam, 10);
        const idx = LEVELS.findIndex(l => l.episodeId === id);
        if (idx !== -1) targetIndex = idx;
    }

    // 4. Handle Task Completion (Bypass)
    if (tasksParam && targetIndex < LEVELS.length) {
        if (tasksParam === 'all') {
            LEVELS[targetIndex].tasks.forEach(t => t.completed = true);
        } else {
            const ids = tasksParam.split(',');
            LEVELS.forEach(l => l.tasks.forEach(t => {
                if (ids.includes(t.id)) t.completed = true;
            }));
        }
    }

    // 5. Setup Initial State
    const effectiveIndex = targetIndex >= LEVELS.length ? 0 : targetIndex;
    const initialLevel = LEVELS[effectiveIndex];
    const isDevOverride = !!(epParam || lvlParam || tasksParam || debugParam);
    
    const isEpisodeStart = targetIndex === 0 || 
                           (targetIndex > 0 && targetIndex < LEVELS.length && LEVELS[targetIndex].episodeId !== LEVELS[targetIndex - 1].episodeId);
    
    const showIntro = !skipIntro && isEpisodeStart && targetIndex < LEVELS.length;

    // Initial Zoxide Data Logic
    const now = Date.now();
    const initialPathStr = initialLevel.initialPath ? resolvePath(INITIAL_FS, initialLevel.initialPath) : '/';
    const initialZoxide: Record<string, ZoxideEntry> = initialLevel.initialPath ? {
        [initialPathStr]: { count: 1, lastAccess: now }
    } : {};

    // Pre-seed Zoxide for levels where it's critical
    if (initialLevel.id === 2) {
        initialZoxide['/home/user'] = { count: 10, lastAccess: now };
    }
    if (initialLevel.id === 7) {
        initialZoxide['/tmp'] = { count: 10, lastAccess: now };
        initialZoxide['/etc'] = { count: 10, lastAccess: now };
    }
    if (initialLevel.id === 8) {
        // Updated to use the new secure path
        initialZoxide['/home/guest/.config/uplink'] = { count: 10, lastAccess: now };
        initialZoxide['/home/guest/datastore'] = { count: 10, lastAccess: now };
    }
    if (initialLevel.id === 9) {
        initialZoxide['/tmp'] = { count: 10, lastAccess: now };
    }

    // Prepare File System with Level-Specific Overrides
    let fs = cloneFS(INITIAL_FS);
    if (initialLevel.onEnter) {
        fs = initialLevel.onEnter(fs);
    }

    return {
      currentPath: initialLevel.initialPath || ['root', 'home', 'user'], 
      cursorIndex: 0,
      clipboard: null,
      mode: 'normal',
      inputBuffer: '',
      filters: {}, 
      sortBy: 'natural',
      sortDirection: 'asc',
      linemode: 'size', 
      history: [],
      zoxideData: initialZoxide, 
      levelIndex: targetIndex,
      fs: fs,
      levelStartFS: cloneFS(fs),
      notification: isDevOverride ? `DEV BYPASS ACTIVE` : null,
      selectedIds: [],
      pendingDeleteIds: [],
      pendingOverwriteNode: null,
      showHelp: false,
      showHint: false,
      hintStage: 0, 
      showHidden: true,
      showInfoPanel: false,
      showEpisodeIntro: showIntro,
      timeLeft: initialLevel.timeLimit || null,
      keystrokes: 0,
      isGameOver: false,
      gameOverReason: undefined,
      stats: { fuzzyJumps: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
      settings: { soundEnabled: true },
      fuzzySelectedIndex: 0,
      usedG: false,
      usedGG: false
    };
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const prevAllTasksCompleteRef = useRef(false);
  const gPressedRef = useRef(false); 

  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const currentLevel = !isLastLevel ? LEVELS[gameState.levelIndex] : LEVELS[LEVELS.length - 1];

  const getVisibleItems = useCallback((state: GameState) => {
    const currentDir = getNodeByPath(state.fs, state.currentPath);
    if (!currentDir || !currentDir.children) return [];

    let items = [...currentDir.children];

    if (!state.showHidden) {
      items = items.filter(c => !c.name.startsWith('.'));
    }

    const filter = state.filters[currentDir.id] || '';
    if (filter) {
      items = items.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    }

    return sortNodes(items, state.sortBy, state.sortDirection);
  }, []); 

  const visibleItems = getVisibleItems(gameState);
  const currentItem = visibleItems[gameState.cursorIndex] || null;

  // --- Task Checking & Level Progression ---
  useEffect(() => {
    if (isLastLevel || gameState.isGameOver) return;

    let changed = false;
    currentLevel.tasks.forEach(task => {
        if (!task.completed && task.check(gameState, currentLevel)) {
            task.completed = true;
            changed = true;
            playTaskCompleteSound(gameState.settings.soundEnabled);
        }
    });

    if (changed) {
        setGameState(prev => ({ ...prev }));
    }

    const allComplete = currentLevel.tasks.every(t => t.completed);
    if (allComplete && !prevAllTasksCompleteRef.current) {
        playSuccessSound(gameState.settings.soundEnabled);
        setShowSuccessToast(true);
    }
    prevAllTasksCompleteRef.current = allComplete;

  }, [gameState, currentLevel, isLastLevel]);

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    if (!currentLevel.timeLimit || isLastLevel || gameState.showEpisodeIntro || gameState.isGameOver) return;

    const allTasksComplete = currentLevel.tasks.every(t => t.completed);
    if (allTasksComplete) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft === null || prev.timeLeft <= 0) {
            clearInterval(timer);
            return { ...prev, isGameOver: true, gameOverReason: 'time' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentLevel.timeLimit, isLastLevel, gameState.showEpisodeIntro, gameState.isGameOver]);

  // Check Keystroke Limit
  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;
    
    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
        setGameState(prev => ({ ...prev, isGameOver: true, gameOverReason: 'keystrokes' }));
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, isLastLevel, gameState.isGameOver]);

  const advanceLevel = useCallback(() => {
    setGameState(prev => {
        const nextIdx = prev.levelIndex + 1;
        
        if (nextIdx >= LEVELS.length) {
             return { ...prev, levelIndex: nextIdx };
        }

        const nextLevel = LEVELS[nextIdx];
        const isNewEp = nextLevel.episodeId !== LEVELS[prev.levelIndex].episodeId;
        
        let fs = cloneFS(prev.fs);
        if (nextLevel.onEnter) {
            fs = nextLevel.onEnter(fs);
        }

        const now = Date.now();
        // Don't teleport unless new episode or explicit override
        const targetPath = isNewEp ? (nextLevel.initialPath || prev.currentPath) : prev.currentPath;
        const pathStr = resolvePath(fs, targetPath);

        const notification = nextLevel.id === 2 
            ? "SYSTEM PROTOCOL: VIEWPORT SORTING RESET TO NATURAL" 
            : null;

        return {
            ...prev,
            levelIndex: nextIdx,
            fs: fs,
            levelStartFS: cloneFS(fs),
            currentPath: targetPath, 
            cursorIndex: 0,
            filters: {},
            clipboard: null, 
            sortBy: 'natural', 
            sortDirection: 'asc',
            linemode: 'size', 
            notification: notification,
            selectedIds: [],
            showHint: false,
            hintStage: 0, 
            showEpisodeIntro: isNewEp,
            timeLeft: nextLevel.timeLimit || null,
            keystrokes: 0,
            usedG: false, 
            usedGG: false,
            zoxideData: {
                ...prev.zoxideData,
                [pathStr]: {
                    count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                    lastAccess: now
                }
            }
        };
    });
    setShowSuccessToast(false);
  }, []);

  const handleNormalModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    items: FileNode[],
    parent: FileNode | null,
    currentItem: FileNode | null,
    currentLevel: Level,
    getVisibleItems: (state: GameState) => FileNode[],
    advanceLevel: () => void,
    gPressedRef: React.MutableRefObject<boolean>
  ) => {
    switch (e.key) {
        case 'j':
        case 'ArrowDown':
            setGameState(prev => ({ ...prev, cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1) }));
            break;
        case 'k':
        case 'ArrowUp':
            setGameState(prev => ({ ...prev, cursorIndex: Math.max(0, prev.cursorIndex - 1) }));
            break;
        case 'g':
            e.preventDefault();
            setGameState(prev => ({ ...prev, mode: 'g-command' }));
            break;
        case 'h':
            if (parent) {
                setGameState(prev => ({
                    ...prev,
                    currentPath: prev.currentPath.slice(0, -1),
                    cursorIndex: 0
                }));
            }
            break;
        case 'd':
            if (gameState.selectedIds.length > 0 || currentItem) {
                setGameState(prev => ({
                    ...prev,
                    mode: 'confirm-delete',
                    pendingDeleteIds: prev.selectedIds.length > 0 ? prev.selectedIds : [currentItem!.id]
                }));
            }
            break;
        case 'G':
            setGameState(prev => ({ ...prev, cursorIndex: items.length - 1, usedG: true }));
            break;
        case 'ArrowLeft':
            if (parent) {
                setGameState(prev => ({
                    ...prev,
                    currentPath: prev.currentPath.slice(0, -1),
                    cursorIndex: 0 
                }));
            }
            break;
        case 'l':
        case 'Enter':
        case 'ArrowRight':
            const allComplete = currentLevel.tasks.every(t => t.completed);
            if (allComplete && e.key === 'Enter' && e.shiftKey) {
                advanceLevel();
                return;
            }
            if (currentItem && (currentItem.type === 'dir' || currentItem.type === 'archive')) {
                setGameState(prev => {
                    const nextPath = [...prev.currentPath, currentItem.id];
                    const pathStr = resolvePath(prev.fs, nextPath);
                    const now = Date.now();
                    return {
                        ...prev,
                        currentPath: nextPath,
                        cursorIndex: 0,
                        zoxideData: {
                            ...prev.zoxideData,
                            [pathStr]: {
                                count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                                lastAccess: now
                            }
                        }
                    };
                });
            }
            break;
        case ' ':
            if (currentItem) {
                setGameState(prev => {
                    const newSelected = prev.selectedIds.includes(currentItem.id)
                        ? prev.selectedIds.filter(id => id !== currentItem.id)
                        : [...prev.selectedIds, currentItem.id];
                    return {
                        ...prev,
                        selectedIds: newSelected,
                        cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1)
                    };
                });
            }
            break;
        case 'a':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const allIds = items.map(item => item.id);
                setGameState(prev => ({ ...prev, selectedIds: allIds, notification: `Selected all (${allIds.length} items)` }));
            } else {
                e.preventDefault();
                setGameState(prev => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
            }
            break;
        case 'r':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const allIds = items.map(item => item.id);
                const inverted = allIds.filter(id => !gameState.selectedIds.includes(id));
                setGameState(prev => ({ ...prev, selectedIds: inverted, notification: `Inverted selection (${inverted.length} items)` }));
            } else if (gameState.selectedIds.length > 1) {
                // Bulk rename not fully implemented in UI yet
                setGameState(prev => ({ ...prev, notification: "Batch rename not available in this version" }));
            } else if (currentItem) {
                e.preventDefault();
                setGameState(prev => ({ ...prev, mode: 'rename', inputBuffer: currentItem.name }));
            }
            break;
        case 'x': 
        case 'y': 
            if (gameState.selectedIds.length > 0) {
                const nodes = getVisibleItems(gameState).filter(n => gameState.selectedIds.includes(n.id));
                setGameState(prev => ({
                    ...prev,
                    clipboard: { nodes, action: e.key === 'x' ? 'cut' : 'yank', originalPath: prev.currentPath },
                    selectedIds: [],
                    notification: `${nodes.length} item(s) ${e.key === 'x' ? 'cut' : 'yanked'}`
                }));
            } else if (currentItem) {
                setGameState(prev => ({
                    ...prev,
                    clipboard: { nodes: [currentItem], action: e.key === 'x' ? 'cut' : 'yank', originalPath: prev.currentPath },
                    notification: `"${currentItem.name}" ${e.key === 'x' ? 'cut' : 'yanked'}`
                }));
            }
            break;
        case 'p': 
            if (gameState.clipboard) {
                const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
                if (currentDir) {
                    let newFs = gameState.fs;
                    gameState.clipboard.nodes.forEach(node => {
                        newFs = addNode(newFs, gameState.currentPath, node); 
                        if (gameState.clipboard?.action === 'cut') {
                            newFs = deleteNode(newFs, gameState.clipboard.originalPath, node.id);
                        }
                    });
                    setGameState(prev => ({
                        ...prev,
                        fs: newFs,
                        clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard, 
                        notification: `Pasted ${prev.clipboard?.nodes.length} items`
                    }));
                }
            }
            break;
        case 'P': 
            if (e.shiftKey && gameState.clipboard) {
                const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
                if (currentDir) {
                    let newFs = gameState.fs;
                    gameState.clipboard.nodes.forEach(node => {
                        const existingNode = currentDir.children?.find(c => c.name === node.name && c.type === node.type);
                        if (existingNode) {
                            newFs = deleteNode(newFs, gameState.currentPath, existingNode.id);
                        }
                        newFs = addNode(newFs, gameState.currentPath, node);
                        if (gameState.clipboard?.action === 'cut') {
                            newFs = deleteNode(newFs, gameState.clipboard.originalPath, node.id);
                        }
                    });
                    setGameState(prev => ({
                        ...prev,
                        fs: newFs,
                        clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
                        notification: `Force pasted ${prev.clipboard?.nodes.length} items`
                    }));
                }
            }
            break;
        case 'f': 
            e.preventDefault();
            setGameState(prev => ({ ...prev, mode: 'filter', inputBuffer: '' }));
            break;
        case '.': 
            setGameState(prev => ({ ...prev, showHidden: !prev.showHidden }));
            break;
        case ',': 
            setGameState(prev => ({ ...prev, mode: 'sort' }));
            break;
        case 'm': 
            setGameState(prev => ({
                ...prev,
                settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
                notification: `Sound ${!prev.settings.soundEnabled ? 'Enabled' : 'Disabled'}`
            }));
            break;
        case 'Z': 
            if (e.shiftKey) {
                setGameState(prev => ({ ...prev, mode: 'zoxide-jump', inputBuffer: '', fuzzySelectedIndex: 0 }));
            }
            break;
        case 'z': 
            if (!e.shiftKey) {
                setGameState(prev => ({ ...prev, mode: 'fzf-current', inputBuffer: '', fuzzySelectedIndex: 0 }));
            }
            break;
        case 'Escape': 
            setGameState(prev => {
                const currentDir = getNodeByPath(prev.fs, prev.currentPath);
                const hasFilter = currentDir && prev.filters[currentDir.id];
                if (hasFilter) {
                    const newFilters = { ...prev.filters };
                    delete newFilters[currentDir.id];
                    return { ...prev, filters: newFilters, notification: 'Filter cleared' };
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
        setGameState(prev => ({ ...prev, clipboard: null, notification: 'CLIPBOARD CLEARED' }));
    }
  }, []); 

  const handleSortModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>
  ) => {
    if (e.key.toLowerCase() === 'n') { 
        const direction = e.shiftKey ? 'desc' : 'asc';
        setGameState(prev => ({ ...prev, sortBy: 'natural', sortDirection: direction, mode: 'normal', notification: `Sort: Natural ${e.shiftKey ? '(reversed)' : ''}` }));
    } else if (e.key.toLowerCase() === 'a') { 
        const direction = e.shiftKey ? 'desc' : 'asc';
        setGameState(prev => ({ ...prev, sortBy: 'alphabetical', sortDirection: direction, mode: 'normal', notification: `Sort: ${e.shiftKey ? 'Z-A' : 'A-Z'}` }));
    } else if (e.key.toLowerCase() === 'm') { 
        const direction = e.shiftKey ? 'asc' : 'desc';
        setGameState(prev => ({ ...prev, sortBy: 'modified', sortDirection: direction, linemode: 'mtime', mode: 'normal', notification: `Sort: Modified ${e.shiftKey ? '(oldest first)' : '(newest first)'}` }));
    } else if (e.key.toLowerCase() === 's') { 
        const direction = e.shiftKey ? 'asc' : 'desc';
        setGameState(prev => ({ ...prev, sortBy: 'size', sortDirection: direction, linemode: 'size', mode: 'normal', notification: `Sort: Size ${e.shiftKey ? '(smallest first)' : '(largest first)'}` }));
    } else if (e.key.toLowerCase() === 'e') { 
        const direction = e.shiftKey ? 'desc' : 'asc';
        setGameState(prev => ({ ...prev, sortBy: 'extension', sortDirection: direction, mode: 'normal', notification: `Sort: Extension ${e.shiftKey ? '(reversed)' : ''}` }));
    } else if (e.key === 'l') { 
         setGameState(prev => {
             const modes: Linemode[] = ['none', 'size', 'mtime', 'permissions'];
             const next = modes[(modes.indexOf(gameState.linemode) + 1) % modes.length]; 
             return { ...prev, linemode: next, mode: 'normal', notification: `Linemode: ${next}` };
         });
    } else if (e.key === '-') { 
         setGameState(prev => ({ ...prev, linemode: 'none', mode: 'normal', notification: 'Linemode: None' }));
    } else if (e.key === 'Escape') {
        setGameState(prev => ({ ...prev, mode: 'normal' }));
    }
  }, []);

  const handleConfirmDeleteModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState, 
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    visibleItems: FileNode[]
  ) => {
    if (e.key === 'y' || e.key === 'Enter') {
        let newFs = gameState.fs;
        const protectedItem = gameState.pendingDeleteIds
            .map(id => {
                const item = visibleItems.find(i => i.id === id);
                return item ? isProtected(item, gameState.levelIndex, 'delete') : null;
            })
            .find(res => res !== null);

        if (protectedItem) {
            setGameState(prev => ({ ...prev, mode: 'normal', notification: protectedItem }));
        } else {
            gameState.pendingDeleteIds.forEach(id => {
                 newFs = deleteNode(newFs, gameState.currentPath, id);
            });
            setGameState(prev => ({ ...prev, fs: newFs, mode: 'normal', selectedIds: [], pendingDeleteIds: [], notification: 'FILES DELETED' }));
        }
    } else if (e.key === 'n' || e.key === 'Escape') {
        setGameState(prev => ({ ...prev, mode: 'normal', pendingDeleteIds: [] }));
    }
  }, []);

  const handleZoxideFzfModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    currentLevel: Level
  ) => {
    const isZoxide = gameState.mode === 'zoxide-jump';
        
    let candidates: any[] = [];
    if (isZoxide) {
        candidates = Object.keys(gameState.zoxideData)
            .map(path => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
            .sort((a, b) => b.score - a.score)
            .filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
    } else {
         const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
         if (currentDir) {
             candidates = getRecursiveContent(gameState.fs, gameState.currentPath)
                .filter(c => c.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
         }
    }

    if (e.key === 'Enter') {
         const target = candidates[gameState.fuzzySelectedIndex];
         if (target) {
             if (isZoxide) {
                 const allDirs = getAllDirectories(gameState.fs);
                 const match = allDirs.find(d => d.display === target.path);
                 if (match) {
                     const now = Date.now();
                     setGameState(prev => ({
                         ...prev,
                         mode: 'normal',
                         currentPath: match.path,
                         cursorIndex: 0,
                         stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                         zoxideData: { ...prev.zoxideData, [target.path]: { count: (prev.zoxideData[target.path]?.count || 0) + 1, lastAccess: now } }
                     }));
                 }
             } else {
                 const fullPath = [...gameState.currentPath, ...target.path];
                 const fileParent = fullPath.slice(0, -1);
                 setGameState(prev => ({ 
                     ...prev, 
                     mode: 'normal', 
                     currentPath: fileParent,
                 }));
             }
         } else {
             setGameState(prev => ({ ...prev, mode: 'normal' }));
         }
    } else if (e.key === 'Escape') {
        setGameState(prev => ({ ...prev, mode: 'normal' }));
    } else if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
        setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.min(candidates.length - 1, prev.fuzzySelectedIndex + 1) }));
    } else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
        setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.max(0, prev.fuzzySelectedIndex - 1) }));
    } else if (e.key === 'Backspace') {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1), fuzzySelectedIndex: 0 }));
    } else if (e.key.length === 1) {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key, fuzzySelectedIndex: 0 }));
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.showEpisodeIntro || isLastLevel || gameState.isGameOver) return;

    if (['input-file', 'filter', 'rename'].includes(gameState.mode)) {
        return;
    }

    setGameState(prev => {
        const isCosmetic = ['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm'].includes(e.key);
        const newKeystrokes = isCosmetic ? prev.keystrokes : prev.keystrokes + 1;
        return { ...prev, keystrokes: newKeystrokes };
    });

    const items = getVisibleItems(gameState);
    const parent = getParentNode(gameState.fs, gameState.currentPath);
    const currentItem = items[gameState.cursorIndex] || null;

    if (gameState.showHelp || gameState.showHint || gameState.showInfoPanel) {
        if (e.key === 'Escape' || e.key === 'Tab' || e.key === '?' || (e.key === 'H' && e.shiftKey)) {
             setGameState(prev => ({ ...prev, showHelp: false, showHint: false, showInfoPanel: false }));
        }
        return;
    }
    
    const allTasksComplete = currentLevel.tasks.every(t => t.completed);
    if (allTasksComplete && e.key === 'Enter' && e.shiftKey) {
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

    if (gameState.mode === 'normal') {
        handleNormalModeKeyDown(e, gameState, setGameState, items, parent, currentItem, currentLevel, getVisibleItems, advanceLevel, gPressedRef);
    }
    else if (gameState.mode === 'sort') {
        handleSortModeKeyDown(e, gameState, setGameState);
    }
    else if (gameState.mode === 'confirm-delete') {
        handleConfirmDeleteModeKeyDown(e, gameState, setGameState, visibleItems);
    }
    else if (gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') {
        handleZoxideFzfModeKeyDown(e, gameState, setGameState, currentLevel);
    }
    else if (gameState.mode === 'g-command') {
        if (e.key === 'Escape') {
            setGameState(prev => ({ ...prev, mode: 'normal' }));
        } else if (e.key === 'g') {
            setGameState(prev => ({ ...prev, cursorIndex: 0, mode: 'normal', usedGG: true }));
        } else if (e.key === 'G') {
            const visibleCount = getVisibleItems(gameState).length;
            setGameState(prev => ({ ...prev, cursorIndex: Math.max(0, visibleCount - 1), mode: 'normal', usedG: true }));
        } else if (e.key === 'h') {
            const homePath = ['root', 'home', 'user'];
            setGameState(prev => ({ ...prev, currentPath: homePath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to home' }));
        } else if (e.key === 'D') {
            const dotfilesPath = ['root', 'home', 'user', '.config'];
            const dotfilesNode = getNodeByPath(gameState.fs, dotfilesPath);
            if (dotfilesNode) {
                setGameState(prev => ({ ...prev, currentPath: dotfilesPath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to dotfiles' }));
            } else {
                setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Dotfiles not found' }));
            }
        } else if (e.key === 'c') {
            const workspacePath = ['root', 'home', 'user', 'workspace'];
            const workspaceNode = getNodeByPath(gameState.fs, workspacePath);
            if (workspaceNode) {
                setGameState(prev => ({ ...prev, currentPath: workspacePath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to workspace' }));
            } else {
                setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Workspace not found' }));
            }
        } else if (e.key === 't') {
            const tmpPath = ['root', 'tmp'];
            setGameState(prev => ({ ...prev, currentPath: tmpPath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to tmp' }));
        } else if (e.key === 'd') {
            const downloadsPath = ['root', 'home', 'user', 'downloads'];
            const downloadsNode = getNodeByPath(gameState.fs, downloadsPath);
            if (downloadsNode) {
                setGameState(prev => ({ ...prev, currentPath: downloadsPath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to downloads' }));
            } else {
                const datastorePath = ['root', 'home', 'user', 'datastore'];
                const datastoreNode = getNodeByPath(gameState.fs, datastorePath);
                if (datastoreNode) {
                    setGameState(prev => ({ ...prev, currentPath: datastorePath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to datastore' }));
                } else {
                    setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Directory not found' }));
                }
            }
        } else if (e.key === 'r') {
            const rootPath = ['root'];
            setGameState(prev => ({ ...prev, currentPath: rootPath, cursorIndex: 0, mode: 'normal', notification: 'Jumped to root' }));
        } else {
            setGameState(prev => ({ ...prev, mode: 'normal' }));
        }
    }

  }, [gameState, currentLevel, isLastLevel, getVisibleItems, handleNormalModeKeyDown, handleSortModeKeyDown, handleConfirmDeleteModeKeyDown, handleZoxideFzfModeKeyDown, advanceLevel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLastLevel) {
    return <OutroSequence />;
  }

  // Helper functions for inputs
  const handleInputModeSubmit = () => {
        const { fs: newFs, error, collision, collisionNode } = createPath(gameState.fs, gameState.currentPath, gameState.inputBuffer);
        if (collision && collisionNode) {
            setGameState(prev => ({ ...prev, mode: 'overwrite-confirm', pendingOverwriteNode: collisionNode, notification: 'Collision detected' }));
        } else if (error) {
            setGameState(prev => ({ ...prev, mode: 'normal', notification: error, inputBuffer: '' }));
        } else {
            // Explicitly clear inputBuffer on success
            setGameState(prev => ({ ...prev, fs: newFs, mode: 'normal', inputBuffer: '', notification: 'FILE CREATED' }));
        }
  };

  const handleFilterModeSubmit = () => {
        setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
  };

  const handleRenameSubmit = () => {
        if (currentItem) {
            const newFs = renameNode(gameState.fs, gameState.currentPath, currentItem.id, gameState.inputBuffer);
            setGameState(prev => ({ ...prev, fs: newFs, mode: 'normal', notification: 'Renamed', stats: { ...prev.stats, renames: prev.stats.renames + 1 } }));
        }
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {/* Intro Overlay */}
      {gameState.showEpisodeIntro && (
        <EpisodeIntro 
          episode={EPISODE_LORE.find(e => e.id === currentLevel.episodeId)!} 
          onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))} 
        />
      )}

      {/* Game Over Overlay */}
      {gameState.isGameOver && (
          <GameOverModal 
            reason={gameState.gameOverReason!} 
            onRestart={() => window.location.reload()} 
            efficiencyTip={currentLevel.efficiencyTip}
          />
      )}

      {/* Modals */}
      {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
      {gameState.showHint && <HintModal hint={currentLevel.hint} stage={gameState.hintStage} onClose={() => setGameState(prev => ({ ...prev, showHint: false, hintStage: 0 }))} />}
      {gameState.showInfoPanel && <InfoPanel file={currentItem} onClose={() => setGameState(prev => ({ ...prev, showInfoPanel: false }))} />}
      {gameState.mode === 'confirm-delete' && <ConfirmationModal title="Confirm Delete" detail={`Permanently delete ${gameState.selectedIds.length > 0 ? gameState.selectedIds.length + ' items' : currentItem?.name}?`} />}
      {showSuccessToast && <SuccessToast message={currentLevel.successMessage || "Sector Cleared"} levelTitle={currentLevel.title} onDismiss={advanceLevel} onClose={() => setShowSuccessToast(false)} />}
      {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
          <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}
      
      {/* Main UI */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* Top Bar (Progress) */}
        <LevelProgress 
            levels={LEVELS} 
            currentLevelIndex={gameState.levelIndex} 
            onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
            onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
            onJumpToLevel={(idx) => {
                 const target = LEVELS[idx];
                 let fs = cloneFS(INITIAL_FS);
                 if (target.onEnter) fs = target.onEnter(fs);
                 setGameState(prev => ({ ...prev, levelIndex: idx, fs, currentPath: target.initialPath || ['root', 'home', 'user'], showEpisodeIntro: false }));
            }}
        />

        {/* Directory Path Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5">
          <div className="font-mono text-sm text-zinc-400">
            {(() => {
              const fullPath = resolvePath(gameState.fs, gameState.currentPath);
              return fullPath.replace('/home/guest', '~');
            })()}
            {(() => {
              const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
              const activeFilter = currentDir && gameState.filters[currentDir.id];
              return activeFilter ? (
                <span className="text-cyan-400"> (filter: {activeFilter})</span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Panes Container */}
        <div className="flex flex-1 min-h-0 relative">

            {/* Parent Pane (Visual context) */}
            <FileSystemPane 
                items={getParentNode(gameState.fs, gameState.currentPath)?.children || []} 
                isActive={false} 
                isParent={true}
                selectedIds={[]}
                clipboard={null}
                linemode={gameState.linemode}
                className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
            />

            {/* Active Pane */}
            <div className="flex-1 flex flex-col relative min-w-0">
                
                {/* Mode Indicators / Input Line */}
                {(gameState.mode !== 'normal' && gameState.mode !== 'confirm-delete' && gameState.mode !== 'sort' && gameState.mode !== 'filter' && gameState.mode !== 'g-command' && gameState.mode !== 'overwrite-confirm' && gameState.mode !== 'input-file' && gameState.mode !== 'rename') && (
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
                        {/* Fake cursor */}
                        <div className="w-2 h-4 bg-white animate-pulse -ml-1"></div>
                    </div>
                )}
                 
                 {/* Which-Key HUD (Ephemeral) */}
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

                 {/* G-Command Dialog */}
                 {gameState.mode === 'g-command' && (
                    <GCommandDialog onClose={() => setGameState(prev => ({ ...prev, mode: 'normal' }))} />
                 )}

                 {/* Filter Dialog */}
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
                                        const currentDir = getNodeByPath(prev.fs, prev.currentPath);
                                        const newFilters = { ...prev.filters };
                                        if (currentDir) newFilters[currentDir.id] = val;
                                        return { ...prev, inputBuffer: val, filters: newFilters, cursorIndex: 0 };
                                    });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') {
                                        handleFilterModeSubmit();
                                    }
                                    e.stopPropagation();
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

                 {/* Create Input Dialog */}
                 {gameState.mode === 'input-file' && (
                    <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Create:</span>
                            <input 
                                type="text"
                                value={gameState.inputBuffer}
                                onChange={(e) => setGameState(prev => ({ ...prev, inputBuffer: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleInputModeSubmit();
                                    if (e.key === 'Escape') setGameState(prev => ({ ...prev, mode: 'normal' }));
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

                 {/* Active File List */}
                 <FileSystemPane 
                    items={visibleItems}
                    isActive={true}
                    cursorIndex={gameState.cursorIndex}
                    selectedIds={gameState.selectedIds}
                    clipboard={gameState.clipboard}
                    linemode={gameState.linemode}
                    renameState={{
                        isRenaming: gameState.mode === 'rename',
                        inputBuffer: gameState.inputBuffer
                    }}
                    onRenameChange={(val) => setGameState(prev => ({ ...prev, inputBuffer: val }))}
                    onRenameSubmit={handleRenameSubmit}
                    onRenameCancel={() => setGameState(prev => ({ ...prev, mode: 'normal' }))}
                 />
                 
                 {/* Zoxide / FZF Overlay */}
                 {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
                    <div className="absolute top-0 left-0 right-0 z-10 bg-zinc-900 border-b border-zinc-700 shadow-xl max-h-[50%] flex flex-col">
                        <div className="p-2 border-b border-zinc-700 bg-zinc-800 flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-black bg-purple-500 px-2 rounded">
                                {gameState.mode === 'zoxide-jump' ? 'ZOXIDE' : 'FZF'}
                            </span>
                            <input 
                                type="text" 
                                className="bg-transparent border-none outline-none text-sm font-mono text-white w-full"
                                value={gameState.inputBuffer}
                                placeholder="Type to filter..."
                                autoFocus
                                readOnly
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {(() => {
                                const isZoxide = gameState.mode === 'zoxide-jump';
                                let candidates: any[] = [];
                                if (isZoxide) {
                                    candidates = Object.keys(gameState.zoxideData)
                                        .map(path => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
                                        .sort((a, b) => b.score - a.score)
                                        .filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
                                } else {
                                    candidates = getRecursiveContent(gameState.fs, gameState.currentPath)
                                        .filter(c => c.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()))
                                        .map(c => ({ path: c.display, ...c }));
                                }

                                return candidates.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`px-3 py-1 text-xs font-mono flex justify-between ${idx === gameState.fuzzySelectedIndex ? 'bg-purple-900/50 text-white' : 'text-zinc-400'}`}
                                    >
                                        <span>{item.path}</span>
                                        {isZoxide && <span className="text-zinc-600">{item.score.toFixed(1)}</span>}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                 )}

            </div>

            {/* Preview Pane */}
            <PreviewPane 
                node={visibleItems[gameState.cursorIndex]} 
                level={currentLevel}
            />

        </div>

        {/* Bottom Bar */}
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
