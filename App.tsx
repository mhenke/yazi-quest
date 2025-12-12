import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FileNode, Level, ClipboardItem } from './types';
import { LEVELS, INITIAL_FS, EPISODE_LORE, KEYBINDINGS } from './constants';
import { getNodeByPath, getParentNode, deleteNode, addNode, renameNode, cloneFS, createPath, findNodeByName, isProtected, getAllDirectories, resolvePath, regenerateIds, getRecursiveContent } from './utils/fsHelpers';
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
import { Search, Folder, FileText, ChevronRight } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 1. Clean Slate for Tasks (Important for hot-reload or URL jumps)
    LEVELS.forEach(l => l.tasks.forEach(t => t.completed = false));

    // 2. Parse URL Parameters
    const params = new URLSearchParams(window.location.search);
    const epParam = params.get('ep') || params.get('episode');
    const lvlParam = params.get('lvl') || params.get('level') || params.get('mission');
    const tasksParam = params.get('tasks') || params.get('task') || params.get('complete');
    const skipIntro = params.get('intro') === 'false';
    
    // 3. Determine Target Level
    let targetIndex = 0;
    if (lvlParam) {
        const id = parseInt(lvlParam, 10);
        const idx = LEVELS.findIndex(l => l.id === id);
        if (idx !== -1) targetIndex = idx;
    } else if (epParam) {
        const id = parseInt(epParam, 10);
        const idx = LEVELS.findIndex(l => l.episodeId === id);
        if (idx !== -1) targetIndex = idx;
    }

    // 4. Handle Task Completion (Bypass)
    if (tasksParam) {
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
    const initialLevel = LEVELS[targetIndex];
    const isDevOverride = !!(epParam || lvlParam || tasksParam);
    
    const isEpisodeStart = targetIndex === 0 || 
                           (targetIndex > 0 && LEVELS[targetIndex].episodeId !== LEVELS[targetIndex - 1].episodeId);
    
    const showIntro = !skipIntro && isEpisodeStart; 

    return {
      currentPath: initialLevel.initialPath,
      cursorIndex: 0,
      clipboard: null,
      mode: 'normal',
      inputBuffer: '',
      filters: {}, // Directory-based filters
      history: [],
      zoxideData: { [resolvePath(INITIAL_FS, initialLevel.initialPath)]: 1 }, // Initialize with current path
      levelIndex: targetIndex,
      fs: INITIAL_FS,
      levelStartFS: cloneFS(INITIAL_FS),
      notification: isDevOverride ? `DEV BYPASS: LEVEL ${initialLevel.id}` : null,
      selectedIds: [],
      pendingDeleteIds: [],
      showHelp: false,
      showHint: false,
      showEpisodeIntro: showIntro,
      timeLeft: initialLevel.timeLimit || null,
      keystrokes: 0,
      isGameOver: false,
      gameOverReason: undefined,
      stats: { fuzzyJumps: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
      settings: { soundEnabled: true },
      fuzzySelectedIndex: 0
    };
  });

  const [bulkRenameContent, setBulkRenameContent] = useState("");
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const currentLevel = LEVELS[gameState.levelIndex];
  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const allTasksComplete = currentLevel.tasks.every(t => t.completed);

  // --- Derived State Helpers ---
  const getCurrentDir = useCallback(() => getNodeByPath(stateRef.current.fs, stateRef.current.currentPath), []);
  const getParentDir = useCallback(() => getParentNode(stateRef.current.fs, stateRef.current.currentPath), []);
  
  const getActiveFilter = useCallback(() => {
    const state = stateRef.current;
    const dir = getNodeByPath(state.fs, state.currentPath);
    return dir ? (state.filters[dir.id] || '') : '';
  }, []);

  const getVisibleItems = useCallback(() => {
    const state = stateRef.current;
    const dir = getNodeByPath(state.fs, state.currentPath);
    if (!dir || !dir.children) return [];
    
    const activeFilter = state.filters[dir.id];
    if (!activeFilter) return dir.children;
    
    return dir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()));
  }, []); // Empty dep, depends on ref

  // We need a render-phase version for the UI
  const visibleItemsUI = (() => {
    const dir = getNodeByPath(gameState.fs, gameState.currentPath);
    if (!dir || !dir.children) return [];
    
    const activeFilter = gameState.filters[dir.id];
    if (!activeFilter) return dir.children;
    
    return dir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()));
  })();
  
  const currentItemUI = visibleItemsUI[gameState.cursorIndex];
  const activeFilter = gameState.filters[getCurrentDir()?.id || ''] || '';

  // --- Fuzzy Find Matches (Z - Zoxide / Visited) ---
  const zoxideMatchesUI = gameState.mode === 'fuzzy-find' 
    ? getAllDirectories(gameState.fs)
        .map(d => ({ ...d, score: gameState.zoxideData[d.display] || 0 })) // Attach scores
        .filter(d => d.score > 0) // Only visited
        .filter(d => d.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase())) // Fuzzy filter
        .sort((a, b) => b.score - a.score) // Sort by frequency
    : [];

  // Prepare Zoxide preview node
  const selectedZoxideMatch = gameState.mode === 'fuzzy-find' ? zoxideMatchesUI[gameState.fuzzySelectedIndex || 0] : null;
  const zoxidePreviewNode = selectedZoxideMatch ? getNodeByPath(gameState.fs, selectedZoxideMatch.path) : null;

  // --- Fuzzy Find Matches (z - Recursive Current) ---
  const fzfCurrentMatches = gameState.mode === 'fzf-current' 
    ? getRecursiveContent(gameState.fs, gameState.currentPath)
        .filter(i => i.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()))
    : [];

  // --- Auto-Clamp Cursor Effect ---
  useEffect(() => {
     if (visibleItemsUI.length === 0 && gameState.cursorIndex !== 0) {
         setGameState(prev => ({ ...prev, cursorIndex: 0 }));
     } else if (visibleItemsUI.length > 0 && gameState.cursorIndex >= visibleItemsUI.length) {
         setGameState(prev => ({ ...prev, cursorIndex: visibleItemsUI.length - 1 }));
     }
  }, [visibleItemsUI.length, gameState.cursorIndex]);

  // --- INSTANT TASK CHECKER ---
  // Runs on every relevant state change to provide immediate feedback
  useEffect(() => {
    if (gameState.showEpisodeIntro || gameState.isGameOver) return;
    
    const level = LEVELS[gameState.levelIndex];
    let changed = false;
    let gameOver = false;
    let gameOverReason: 'keystrokes' | undefined = undefined;

    // 1. Check Tasks
    level.tasks.forEach(task => {
        if (!task.completed && task.check(gameState)) {
            task.completed = true;
            changed = true;
        }
    });

    // 2. Check Keystrokes (Mastery) - Instant Fail
    const allDone = level.tasks.every(t => t.completed);
    if (level.maxKeystrokes && gameState.keystrokes > level.maxKeystrokes && !allDone) {
        gameOver = true;
        gameOverReason = 'keystrokes';
    }

    if (changed || gameOver) {
        setGameState(prev => ({
            ...prev,
            isGameOver: prev.isGameOver || gameOver,
            gameOverReason: prev.gameOverReason || gameOverReason,
            notification: changed ? "Objective Complete" : prev.notification
        }));
    }
  }, [gameState.levelIndex, gameState.fs, gameState.currentPath, gameState.cursorIndex, gameState.selectedIds, gameState.filters, gameState.keystrokes, gameState.mode, gameState.stats]);


  // --- TIMER LOOP ---
  // Runs every second, independent of user input
  useEffect(() => {
    const interval = setInterval(() => {
        const state = stateRef.current; // Use Ref to access latest state without re-binding interval
        
        if (state.showEpisodeIntro || state.isGameOver || state.timeLeft === null || state.mode === 'confirm-delete') return;

        const level = LEVELS[state.levelIndex];
        const allDone = level.tasks.every(t => t.completed);

        if (!allDone) {
             setGameState(prev => {
                 const newTime = (prev.timeLeft || 0) - 1;
                 if (newTime <= 0) {
                     return { ...prev, timeLeft: 0, isGameOver: true, gameOverReason: 'time' };
                 }
                 return { ...prev, timeLeft: newTime };
             });
        }
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Run once on mount

  // --- Actions ---

  const advanceLevel = useCallback(() => {
    // Read from Ref to ensure we have latest levelIndex
    const currentIdx = stateRef.current.levelIndex;
    const nextIdx = currentIdx + 1;
    
    if (nextIdx < LEVELS.length) {
        const nextLevel = LEVELS[nextIdx];
        const currentLvl = LEVELS[currentIdx];
        const isNewEpisode = nextLevel.episodeId !== currentLvl.episodeId;
        
        // Reset tasks for next level
        nextLevel.tasks.forEach(t => t.completed = false);

        setGameState(prev => ({
            ...prev,
            levelIndex: nextIdx,
            currentPath: prev.currentPath, // Continuum logic
            cursorIndex: 0,
            filters: {}, // Reset filters on level change
            selectedIds: [],
            timeLeft: nextLevel.timeLimit || null,
            keystrokes: 0,
            levelStartFS: cloneFS(prev.fs), // Snapshot for restart
            showEpisodeIntro: isNewEpisode,
            notification: `LEVEL ${nextLevel.id} INITIATED`
        }));
    } else {
        // Game Complete
        setGameState(prev => ({ ...prev, levelIndex: nextIdx }));
    }
  }, []);

  const jumpToLevel = useCallback((targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= LEVELS.length) return;
    
    const targetLevel = LEVELS[targetIdx];
    // Reset tasks so they can be replayed/viewed
    targetLevel.tasks.forEach(t => t.completed = false);

    setGameState(prev => ({
        ...prev,
        levelIndex: targetIdx,
        currentPath: targetLevel.initialPath,
        cursorIndex: 0,
        mode: 'normal',
        filters: {},
        timeLeft: targetLevel.timeLimit || null,
        keystrokes: 0,
        isGameOver: false,
        notification: `JUMPED TO LEVEL ${targetLevel.id}`,
        zoxideData: { [resolvePath(INITIAL_FS, targetLevel.initialPath)]: 1 }
    }));
  }, []);

  const handleRestartLevel = useCallback(() => {
      const idx = stateRef.current.levelIndex;
      const level = LEVELS[idx];
      level.tasks.forEach(t => t.completed = false);
      
      setGameState(prev => ({
          ...prev,
          fs: cloneFS(prev.levelStartFS), // Restore snapshot
          currentPath: level.initialPath,
          cursorIndex: 0,
          mode: 'normal',
          timeLeft: level.timeLimit || null,
          keystrokes: 0,
          isGameOver: false,
          gameOverReason: undefined,
          notification: "SYSTEM REBOOTED. LEVEL RESTARTED."
      }));
  }, []);
  
  const handleBulkRenameSubmit = (content: string) => {
    const newNames = content.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const visible = getVisibleItems(); // uses Ref state
    const selectedNodes = visible.filter(n => stateRef.current.selectedIds.includes(n.id));
    
    if (newNames.length !== selectedNodes.length) {
        setGameState(prev => ({...prev, notification: `Error: Expected ${selectedNodes.length} names, got ${newNames.length}`}));
        return;
    }
    
    let newRoot = stateRef.current.fs;
    let renameCount = 0;
    
    // Create map of ID to new name
    const idToName: Record<string, string> = {};
    selectedNodes.forEach((node, idx) => {
        idToName[node.id] = newNames[idx];
    });

    const parentPath = stateRef.current.currentPath;
    
    // Perform renames
    selectedNodes.forEach(node => {
        const newName = idToName[node.id];
        if (newName && newName !== node.name) {
            // check protection
            const protection = isProtected(node, stateRef.current.levelIndex, 'rename');
            if (!protection) {
                newRoot = renameNode(newRoot, parentPath, node.id, newName);
                renameCount++;
            }
        }
    });

    setGameState(prev => ({
        ...prev,
        fs: newRoot,
        mode: 'normal',
        selectedIds: [],
        notification: `Batch renamed ${renameCount} files`,
        stats: { ...prev.stats, renames: prev.stats.renames + renameCount }
    }));
  };

  const navigate = (dir: number) => {
      setGameState(prev => {
         const currentDir = getNodeByPath(prev.fs, prev.currentPath);
         const filter = currentDir ? (prev.filters[currentDir.id] || '') : '';
         
         const items = filter 
           ? currentDir?.children?.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())) || []
           : currentDir?.children || [];
           
         let newIndex = prev.cursorIndex + dir;
         if (newIndex < 0) newIndex = 0;
         if (newIndex >= items.length) newIndex = Math.max(0, items.length - 1);
         
         return { ...prev, cursorIndex: newIndex };
      });
  };

  const enterDirectory = () => {
    const visible = getVisibleItems();
    const item = visible[stateRef.current.cursorIndex];
    
    if (item && (item.type === 'dir' || item.type === 'archive')) {
         setGameState(prev => {
             const newPath = [...prev.currentPath, item.id];
             
             // Update Zoxide Score
             const pathStr = resolvePath(prev.fs, newPath);
             const newZoxideData = { ...prev.zoxideData };
             if (item.type === 'dir') {
                 newZoxideData[pathStr] = (newZoxideData[pathStr] || 0) + 1;
             }

             return {
                 ...prev,
                 currentPath: newPath,
                 cursorIndex: 0,
                 zoxideData: newZoxideData,
                 stats: { 
                    ...prev.stats, 
                    archivesEntered: item.type === 'archive' ? prev.stats.archivesEntered + 1 : prev.stats.archivesEntered 
                 }
             };
         });
    }
  };

  // --- Keyboard Handler ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const state = stateRef.current;
        
        // Block input if modals are open (except for specific keys handled inside components or global toggles)
        if (state.showEpisodeIntro || state.isGameOver) {
            return;
        }

        // Global: Shift+Enter to Advance Level
        if (e.key === 'Enter' && e.shiftKey) {
            const currentLvl = LEVELS[state.levelIndex];
            const allDone = currentLvl.tasks.every(t => t.completed);
            if (allDone) {
                e.preventDefault();
                advanceLevel();
                return;
            }
        }

        // Global Toggles
        if (e.key === '?' && state.mode === 'normal') {
            setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
            return;
        }
        if (e.key === 'H' && e.shiftKey && state.mode === 'normal') {
            setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
            return;
        }
        if (e.key === 'm' && !e.ctrlKey && !e.metaKey && state.mode === 'normal') {
             // Toggle mute (dummy for now as we don't have audio engine fully hooked up in this snippet)
             setGameState(prev => ({ ...prev, settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled }, notification: `Sound: ${!prev.settings.soundEnabled ? 'ON' : 'OFF'}` }));
             return;
        }

        // Mode: NORMAL
        if (state.mode === 'normal') {
            // Check for Escape to clear filter
            if (e.key === 'Escape') {
                const dir = getCurrentDir();
                if (dir && state.filters[dir.id]) {
                    setGameState(prev => {
                        const newFilters = { ...prev.filters };
                        delete newFilters[dir.id];
                        return { ...prev, filters: newFilters, cursorIndex: 0 };
                    });
                } else if (state.selectedIds.length > 0) {
                     setGameState(prev => ({ ...prev, selectedIds: [], notification: 'Selection Cleared' }));
                }
                return;
            }

            // Navigation
            if (['j', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                navigate(1);
            } else if (['k', 'ArrowUp'].includes(e.key)) {
                 e.preventDefault();
                 navigate(-1);
            } else if (['h', 'ArrowLeft'].includes(e.key)) {
                 e.preventDefault();
                 const parent = getParentDir();
                 if (parent) {
                      setGameState(prev => ({ 
                          ...prev, 
                          currentPath: prev.currentPath.slice(0, -1),
                          cursorIndex: 0 // Simplification: Reset cursor when going up
                      }));
                 }
            } else if (['l', 'ArrowRight', 'Enter'].includes(e.key)) {
                 e.preventDefault();
                 enterDirectory();
            }
            
            // Actions
            else if (e.key === ' ') {
                 e.preventDefault();
                 const visible = getVisibleItems();
                 const item = visible[state.cursorIndex];
                 if (item) {
                     setGameState(prev => {
                         const isSelected = prev.selectedIds.includes(item.id);
                         const newSelected = isSelected 
                            ? prev.selectedIds.filter(id => id !== item.id)
                            : [...prev.selectedIds, item.id];
                         return { ...prev, selectedIds: newSelected, cursorIndex: Math.min(prev.cursorIndex + 1, visible.length - 1) };
                     });
                 }
            }
            else if (e.key === 'f') {
                e.preventDefault();
                const dir = getCurrentDir();
                if (dir) {
                    const currentFilter = state.filters[dir.id] || '';
                    setGameState(prev => ({ ...prev, mode: 'filter', inputBuffer: currentFilter }));
                }
            }
            else if (e.key === 'G') {
                 setGameState(prev => {
                     const count = getVisibleItems().length;
                     return { ...prev, cursorIndex: count - 1 };
                });
            }
            else if (e.key === 'Z' && e.shiftKey) { // Z - Zoxide Jump (History)
                 e.preventDefault();
                 setGameState(prev => ({ ...prev, mode: 'fuzzy-find', inputBuffer: '', fuzzySelectedIndex: 0 }));
            }
            else if (e.key === 'z' && !e.shiftKey) { // z - Recursive Find (Current Tree)
                e.preventDefault();
                setGameState(prev => ({ ...prev, mode: 'fzf-current', inputBuffer: '', fuzzySelectedIndex: 0 }));
           }
            else if (e.key === 'd') {
                const visible = getVisibleItems();
                const item = visible[state.cursorIndex];
                const idsToDelete = state.selectedIds.length > 0 ? state.selectedIds : (item ? [item.id] : []);
                
                if (idsToDelete.length > 0) {
                     setGameState(prev => ({ ...prev, mode: 'confirm-delete', pendingDeleteIds: idsToDelete }));
                }
            }
            else if (e.key === 'x' || e.key === 'y') {
                const action = e.key === 'x' ? 'cut' : 'yank';
                const visible = getVisibleItems();
                const item = visible[state.cursorIndex];
                const nodesToClip = state.selectedIds.length > 0 
                    ? visible.filter(n => state.selectedIds.includes(n.id))
                    : (item ? [item] : []);

                if (nodesToClip.length > 0) {
                    // Check protection for cut
                    if (action === 'cut') {
                        const blocked = nodesToClip.find(n => isProtected(n, state.levelIndex, 'cut'));
                        if (blocked) {
                            setGameState(prev => ({ ...prev, notification: isProtected(blocked, state.levelIndex, 'cut') }));
                            return;
                        }
                    }

                    const clipboard: ClipboardItem = {
                        nodes: nodesToClip,
                        action: action,
                        originalPath: state.currentPath
                    };
                    
                    setGameState(prev => ({ 
                        ...prev, 
                        clipboard, 
                        selectedIds: [],
                        notification: `${action === 'cut' ? 'Cut' : 'Yanked'} ${nodesToClip.length} items` 
                    }));
                }
            }
            else if (e.key === 'p') {
                if (state.clipboard) {
                    let newRoot = state.fs;
                    let count = 0;
                    
                    state.clipboard.nodes.forEach(node => {
                        let nodeToAdd = node;
                        // If move, delete original first
                        if (state.clipboard!.action === 'cut') {
                            newRoot = deleteNode(newRoot, state.clipboard!.originalPath, node.id);
                        } else {
                            // Copy - regenerate IDs
                            nodeToAdd = regenerateIds(node);
                        }
                        // Add to current
                        newRoot = addNode(newRoot, state.currentPath, nodeToAdd);
                        count++;
                    });
                    
                    setGameState(prev => ({
                        ...prev,
                        fs: newRoot,
                        clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard, // clear if move
                        notification: `Pasted ${count} items`
                    }));
                }
            }
            else if (e.key === 'a') {
                setGameState(prev => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
            }
            else if (e.key === 'r') {
                 if (state.selectedIds.length > 1) {
                     // Bulk Rename
                     // Pre-fill buffer with names
                     const visible = getVisibleItems();
                     const names = visible.filter(n => state.selectedIds.includes(n.id)).map(n => n.name).join('\n');
                     setBulkRenameContent(names);
                     setGameState(prev => ({ ...prev, mode: 'bulk-rename' }));
                 } else {
                     // Single Rename
                     const visible = getVisibleItems();
                     const item = visible[state.cursorIndex];
                     if (item) {
                         setGameState(prev => ({ ...prev, mode: 'rename', inputBuffer: item.name }));
                     }
                 }
            }
        }
        
        // Mode: FILTER
        else if (state.mode === 'filter') {
            const dir = getCurrentDir();
            if (!dir) return;

            if (e.key === 'Escape' || e.key === 'Enter') {
                // Confirm filter and exit
                setGameState(prev => ({ ...prev, mode: 'normal', cursorIndex: 0 }));
            } else if (e.key === 'Backspace') {
                setGameState(prev => {
                    const newVal = prev.inputBuffer.slice(0, -1);
                    return { 
                        ...prev, 
                        inputBuffer: newVal,
                        filters: { ...prev.filters, [dir.id]: newVal },
                        cursorIndex: 0
                    };
                });
            } else if (e.key.length === 1) {
                 setGameState(prev => {
                    const newVal = prev.inputBuffer + e.key;
                    return { 
                        ...prev, 
                        inputBuffer: newVal,
                        filters: { ...prev.filters, [dir.id]: newVal },
                        cursorIndex: 0
                    };
                });
            }
        }

        // Mode: FUZZY FIND (Z - Zoxide)
        else if (state.mode === 'fuzzy-find') {
            if (e.key === 'Escape') {
                setGameState(prev => ({ ...prev, mode: 'normal' }));
            }
        }

        // Mode: FZF CURRENT (z - Recursive)
        else if (state.mode === 'fzf-current') {
            if (e.key === 'Escape') {
                setGameState(prev => ({ ...prev, mode: 'normal' }));
            }
        }

        // Mode: CONFIRM DELETE
        else if (state.mode === 'confirm-delete') {
             if (e.key.toLowerCase() === 'y') {
                 let newRoot = state.fs;
                 let deletedCount = 0;
                 state.pendingDeleteIds.forEach(id => {
                     // Get node name for protection check
                     const parent = getNodeByPath(newRoot, state.currentPath);
                     const node = parent?.children?.find(c => c.id === id);
                     if (node) {
                         const msg = isProtected(node, state.levelIndex, 'delete');
                         if (!msg) {
                             newRoot = deleteNode(newRoot, state.currentPath, id);
                             deletedCount++;
                         }
                     }
                 });
                 
                 setGameState(prev => ({
                     ...prev,
                     fs: newRoot,
                     mode: 'normal',
                     selectedIds: [],
                     pendingDeleteIds: [],
                     notification: `Deleted ${deletedCount} items`
                 }));
             } else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') {
                 setGameState(prev => ({ ...prev, mode: 'normal', pendingDeleteIds: [] }));
             }
        }

        // Mode: INPUT (File/Dir Creation)
        else if (state.mode === 'input-file') {
             if (e.key === 'Escape') {
                 setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
             } else if (e.key === 'Enter') {
                 const name = state.inputBuffer.trim();
                 if (name) {
                     const { fs: newFS, error } = createPath(state.fs, state.currentPath, name);
                     setGameState(prev => ({
                         ...prev,
                         fs: newFS,
                         mode: 'normal',
                         inputBuffer: '',
                         notification: error || `Created ${name}`
                     }));
                 }
             } else if (e.key === 'Backspace') {
                 setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
             } else if (e.key.length === 1) {
                 setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
             }
        }

        // Mode: RENAME
        else if (state.mode === 'rename') {
             if (e.key === 'Escape') {
                 setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
             } else if (e.key === 'Enter') {
                 const newName = state.inputBuffer.trim();
                 const visible = getVisibleItems();
                 const item = visible[state.cursorIndex];
                 if (newName && item) {
                     // Protection check handled in logic or should be?
                     const msg = isProtected(item, state.levelIndex, 'rename');
                     if (msg) {
                         setGameState(prev => ({ ...prev, mode: 'normal', notification: msg }));
                     } else {
                         const newFS = renameNode(state.fs, state.currentPath, item.id, newName);
                         setGameState(prev => ({ ...prev, fs: newFS, mode: 'normal', notification: `Renamed to ${newName}` }));
                     }
                 }
             } else if (e.key === 'Backspace') {
                 setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
             } else if (e.key.length === 1) {
                 setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
             }
        }

        // Keystroke Counting
        if (state.mode !== 'normal' || !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
             setGameState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
        }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getVisibleItems, getParentDir, advanceLevel, getCurrentDir, navigate, enterDirectory]);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-zinc-300 font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* 1. Header: Progress & Breadcrumbs */}
      <LevelProgress 
         levels={LEVELS} 
         currentLevelIndex={gameState.levelIndex} 
         onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
         onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Parent Directory Pane (Context) */}
        {gameState.currentPath.length > 1 && (
           <FileSystemPane 
             items={getParentDir()?.children || []}
             isActive={false}
             title={resolvePath(gameState.fs, gameState.currentPath.slice(0, -1))}
             isParent={true}
             selectedIds={[]}
             clipboard={gameState.clipboard}
           />
        )}

        {/* Current Directory Pane (Active) */}
        <FileSystemPane 
             items={visibleItemsUI}
             isActive={gameState.mode === 'normal' || gameState.mode === 'filter' || gameState.mode.includes('select')}
             cursorIndex={gameState.cursorIndex}
             title={resolvePath(gameState.fs, gameState.currentPath) + (activeFilter ? ` (filter: ${activeFilter})` : '')}
             isParent={false}
             selectedIds={gameState.selectedIds}
             clipboard={gameState.clipboard}
             className="flex-1 border-r border-zinc-800"
        />

        {/* Right Side: Preview & Info */}
        <PreviewPane node={currentItemUI} level={currentLevel} />
        
        {/* Modals & Overlays */}
        {gameState.showEpisodeIntro && (
            <EpisodeIntro 
                episode={EPISODE_LORE[currentLevel.episodeId - 1]} 
                onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))} 
            />
        )}

        {gameState.isGameOver && (
            <GameOverModal 
                reason={gameState.gameOverReason || 'time'} 
                onRestart={handleRestartLevel}
            />
        )}

        {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
        {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}
        
        {gameState.mode === 'confirm-delete' && (
            <ConfirmationModal 
                title="CONFIRM DELETION" 
                detail={`Are you sure you want to delete ${gameState.pendingDeleteIds.length} items? This cannot be undone.`} 
            />
        )}
        
        {/* Input Overlays */}
        {(gameState.mode === 'input-file' || gameState.mode === 'rename') && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-green-500 shadow-lg p-2 min-w-[300px] flex items-center gap-2 z-50">
                 <span className="text-green-500 font-bold px-2">{gameState.mode === 'rename' ? 'RENAME:' : 'NEW:'}</span>
                 <input
                     autoFocus
                     className="bg-transparent font-mono text-white flex-1 outline-none min-w-0"
                     value={gameState.inputBuffer}
                     onChange={(e) => setGameState(prev => ({ ...prev, inputBuffer: e.target.value }))}
                     onKeyDown={(e) => {
                         e.stopPropagation();
                         if (e.key === 'Enter') {
                             if (gameState.mode === 'rename') {
                                 // Handle Rename Submit Logic locally or dispatch
                                 const newName = gameState.inputBuffer.trim();
                                 const item = visibleItemsUI[gameState.cursorIndex];
                                 if (newName && item) {
                                     const msg = isProtected(item, gameState.levelIndex, 'rename');
                                     if (msg) {
                                         setGameState(prev => ({ ...prev, mode: 'normal', notification: msg }));
                                     } else {
                                         const newFS = renameNode(gameState.fs, gameState.currentPath, item.id, newName);
                                         setGameState(prev => ({ ...prev, fs: newFS, mode: 'normal', notification: `Renamed to ${newName}`, stats: { ...prev.stats, renames: prev.stats.renames + 1 } }));
                                     }
                                 }
                             } else {
                                 // Handle New File Logic
                                 const name = gameState.inputBuffer.trim();
                                 if (name) {
                                     const { fs: newFS, error } = createPath(gameState.fs, gameState.currentPath, name);
                                     setGameState(prev => ({ ...prev, fs: newFS, mode: 'normal', notification: error || `Created ${name}` }));
                                 }
                             }
                         } else if (e.key === 'Escape') {
                             setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
                         }
                     }}
                 />
            </div>
        )}

        {gameState.mode === 'filter' && (
            <div className="absolute bottom-6 right-6 bg-purple-900/90 border border-purple-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
                 <Search size={14} />
                 <span className="font-bold">FILTER:</span>
                 <input 
                     autoFocus
                     className="bg-transparent border-none outline-none text-white font-mono w-32"
                     value={gameState.inputBuffer}
                     onChange={(e) => {
                         const val = e.target.value;
                         const dir = getCurrentDir();
                         if (dir) {
                            setGameState(prev => ({
                                ...prev,
                                inputBuffer: val,
                                filters: { ...prev.filters, [dir.id]: val },
                                cursorIndex: 0
                            }));
                         }
                     }}
                     onKeyDown={(e) => {
                         e.stopPropagation();
                         if (e.key === 'Enter' || e.key === 'Escape') {
                             setGameState(prev => ({ ...prev, mode: 'normal', cursorIndex: 0 }));
                         }
                     }}
                 />
            </div>
        )}

        {/* Global Fuzzy Find (Z - Zoxide / Visited) */}
        {gameState.mode === 'fuzzy-find' && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-zinc-900 border border-zinc-700 shadow-2xl z-50 flex flex-col rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
                       <span className="text-zinc-500 font-bold uppercase text-xs">Zoxide</span>
                       <input 
                          type="text" 
                          autoFocus
                          className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                          value={gameState.inputBuffer} 
                          onChange={(e) => setGameState(prev => ({ ...prev, inputBuffer: e.target.value, fuzzySelectedIndex: 0 }))}
                          onKeyDown={(e) => {
                               e.stopPropagation();
                               if (e.key === 'ArrowDown') {
                                   e.preventDefault();
                                   setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.min((prev.fuzzySelectedIndex || 0) + 1, zoxideMatchesUI.length - 1) }));
                               } else if (e.key === 'ArrowUp') {
                                   e.preventDefault();
                                   setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.max((prev.fuzzySelectedIndex || 0) - 1, 0) }));
                               } else if (e.key === 'Enter') {
                                   e.preventDefault();
                                   const match = zoxideMatchesUI[gameState.fuzzySelectedIndex || 0];
                                   if (match) {
                                        setGameState(prev => ({
                                            ...prev,
                                            currentPath: match.path,
                                            cursorIndex: 0,
                                            mode: 'normal',
                                            inputBuffer: '',
                                            stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                                            notification: `Jumped to ${match.display}`
                                        }));
                                   }
                               } else if (e.key === 'Escape') {
                                    setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
                               }
                          }}
                          placeholder="Search visited directories..." 
                       />
                  </div>
                  
                  {/* Matches List */}
                  <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-900/50">
                       {zoxideMatchesUI.map((match, idx) => (
                           <div 
                              key={match.path.join('/')} 
                              className={`px-4 py-2 text-sm font-mono cursor-pointer flex items-center justify-between ${idx === (gameState.fuzzySelectedIndex || 0) ? 'bg-blue-900 text-white' : 'text-zinc-400'}`}
                              onMouseEnter={() => setGameState(prev => ({ ...prev, fuzzySelectedIndex: idx }))}
                              onClick={() => {
                                    setGameState(prev => ({
                                        ...prev,
                                        currentPath: match.path,
                                        cursorIndex: 0,
                                        mode: 'normal',
                                        inputBuffer: '',
                                        stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                                        notification: `Jumped to ${match.display}`
                                    }));
                              }}
                           >
                               <div className="flex items-center gap-2">
                                   <Folder size={14} className={idx === (gameState.fuzzySelectedIndex || 0) ? "text-blue-300" : "text-zinc-600"} />
                                   {match.display}
                               </div>
                               <span className="text-xs opacity-50">{match.score.toFixed(1)}</span>
                           </div>
                       ))}
                       {zoxideMatchesUI.length === 0 && (
                           <div className="p-8 text-zinc-500 italic text-center flex flex-col items-center gap-2">
                               <Folder size={32} className="opacity-20" />
                               <p>No history found.</p>
                               <p className="text-xs">Navigate to directories to build your zoxide database.</p>
                           </div>
                       )}
                  </div>

                  {/* Preview Pane */}
                  <div className="h-[200px] border-t border-zinc-700 bg-zinc-950 p-0 flex flex-col shrink-0">
                      <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 border-b border-zinc-800 uppercase tracking-wider bg-zinc-900 flex items-center gap-2">
                          <Folder size={12} />
                          <span className="truncate">Preview: {selectedZoxideMatch?.display || '/'}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                         {zoxidePreviewNode && zoxidePreviewNode.children && zoxidePreviewNode.children.length > 0 ? (
                             zoxidePreviewNode.children.map(child => (
                                 <div key={child.id} className="flex items-center gap-2 px-2 py-0.5 text-xs font-mono text-zinc-400">
                                     {child.type === 'dir' ? <Folder size={12} className="text-blue-500" /> : <FileText size={12} className="text-zinc-600" />}
                                     <span className={child.type === 'dir' ? 'text-blue-400' : ''}>{child.name}</span>
                                 </div>
                             ))
                         ) : (
                             <div className="text-zinc-700 italic text-xs p-2">~ empty ~</div>
                         )}
                      </div>
                  </div>
             </div>
        )}

        {/* Local Fuzzy Find (z - Recursive) */}
        {gameState.mode === 'fzf-current' && (
             <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] max-h-[600px] bg-zinc-900 border border-green-700 shadow-2xl z-50 flex flex-col">
                  <div className="p-3 border-b border-green-700 flex items-center gap-2">
                       <Search size={16} className="text-green-500" />
                       <input 
                          type="text" 
                          autoFocus
                          className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                          value={gameState.inputBuffer} 
                          onChange={(e) => setGameState(prev => ({ ...prev, inputBuffer: e.target.value, fuzzySelectedIndex: 0 }))}
                          onKeyDown={(e) => {
                               e.stopPropagation();
                               if (e.key === 'ArrowDown') {
                                   e.preventDefault();
                                   setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.min((prev.fuzzySelectedIndex || 0) + 1, fzfCurrentMatches.length - 1) }));
                               } else if (e.key === 'ArrowUp') {
                                   e.preventDefault();
                                   setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.max((prev.fuzzySelectedIndex || 0) - 1, 0) }));
                               } else if (e.key === 'Enter') {
                                   e.preventDefault();
                                   const match = fzfCurrentMatches[gameState.fuzzySelectedIndex || 0];
                                   if (match) {
                                        // On select, navigate to the parent folder of the matched item, and highlight it
                                        const parentPath = match.path.slice(0, -1);
                                        const parentNode = getNodeByPath(gameState.fs, parentPath);
                                        const newIndex = parentNode?.children?.findIndex(c => c.id === match.node.id) ?? 0;
                                        
                                        setGameState(prev => ({
                                            ...prev,
                                            currentPath: parentPath,
                                            cursorIndex: Math.max(0, newIndex),
                                            mode: 'normal',
                                            inputBuffer: '',
                                            stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                                            notification: `Navigated to ${match.display}`
                                        }));
                                   }
                               } else if (e.key === 'Escape') {
                                    setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
                               }
                          }}
                          placeholder={gameState.selectedIds.length > 0 ? `Searching in ${gameState.selectedIds.length} items...` : "Search files in tree..."}
                       />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-hide">
                       {fzfCurrentMatches.map((match, idx) => (
                           <div 
                              key={match.path.join('/')} 
                              className={`px-4 py-2 text-sm font-mono cursor-pointer flex items-center gap-2 ${idx === (gameState.fuzzySelectedIndex || 0) ? 'bg-green-900 text-white' : 'text-zinc-400'}`}
                              onMouseEnter={() => setGameState(prev => ({ ...prev, fuzzySelectedIndex: idx }))}
                              onClick={() => {
                                    const parentPath = match.path.slice(0, -1);
                                    const parentNode = getNodeByPath(gameState.fs, parentPath);
                                    const newIndex = parentNode?.children?.findIndex(c => c.id === match.node.id) ?? 0;
                                    
                                    setGameState(prev => ({
                                        ...prev,
                                        currentPath: parentPath,
                                        cursorIndex: Math.max(0, newIndex),
                                        mode: 'normal',
                                        inputBuffer: '',
                                        stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                                        notification: `Navigated to ${match.display}`
                                    }));
                              }}
                           >
                               {match.node.type === 'dir' ? <Folder size={14} className="text-blue-500" /> : <FileText size={14} className="text-zinc-600" />}
                               {match.display}
                           </div>
                       ))}
                       {fzfCurrentMatches.length === 0 && (
                           <div className="p-4 text-zinc-500 italic text-center">No matches found</div>
                       )}
                  </div>
             </div>
        )}

        {gameState.mode === 'bulk-rename' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="w-[600px] bg-zinc-900 border border-zinc-700 p-6 shadow-2xl flex flex-col gap-4">
                     <h3 className="text-lg font-bold text-white">Bulk Rename</h3>
                     <p className="text-xs text-zinc-500">Edit names below (one per line). Order must match selection.</p>
                     <textarea 
                        className="w-full h-64 bg-black border border-zinc-800 p-4 font-mono text-sm text-zinc-300 outline-none focus:border-blue-500"
                        value={bulkRenameContent}
                        onChange={(e) => setBulkRenameContent(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                             if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                 handleBulkRenameSubmit(bulkRenameContent);
                             }
                             if (e.key === 'Escape') {
                                 setGameState(prev => ({ ...prev, mode: 'normal' }));
                             }
                        }}
                     />
                     <div className="flex justify-between items-center text-xs">
                         <span className="text-zinc-500">Ctrl+Enter to Confirm • Esc to Cancel</span>
                         <button 
                             className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors"
                             onClick={() => handleBulkRenameSubmit(bulkRenameContent)}
                         >
                             Confirm
                         </button>
                     </div>
                </div>
            </div>
        )}

        {/* Conclusion / Outro */}
        {isLastLevel && allTasksComplete && <OutroSequence />}

      </div>

      {/* 3. Status Bar */}
      <StatusBar 
        state={gameState} 
        level={currentLevel} 
        allTasksComplete={allTasksComplete}
        onNextLevel={advanceLevel}
      />
    </div>
  );
}