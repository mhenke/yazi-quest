import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FileNode, Level, ClipboardItem } from './types';
import { LEVELS, INITIAL_FS, EPISODE_LORE, KEYBINDINGS } from './constants';
import { getNodeByPath, getParentNode, deleteNode, addNode, renameNode, cloneFS, createPath, findNodeByName, isProtected, getAllDirectories, resolvePath } from './utils/fsHelpers';
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
    
    // Show intro if we are at start of an episode, OR if explicitly jumped to a level (unless skipped via logic, but simpler is better)
    // We'll show it if it's the first level of an episode to set context.
    const isEpisodeStart = targetIndex === 0 || 
                           (targetIndex > 0 && LEVELS[targetIndex].episodeId !== LEVELS[targetIndex - 1].episodeId);
    
    // Logic: Always show intro for Ep 1 start. For others, only if it's the start of the episode.
    const showIntro = !skipIntro && isEpisodeStart; 

    // Note: FS is reset to INITIAL_FS on jump. 
    // Complex levels later might be missing dependencies if jumped to directly without playing previous levels.
    // This is expected behavior for a debug/bypass feature.

    return {
      currentPath: initialLevel.initialPath,
      cursorIndex: 0,
      clipboard: null,
      mode: 'normal',
      inputBuffer: '',
      filter: '',
      history: [],
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
      settings: { soundEnabled: true }
    };
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const currentLevel = LEVELS[gameState.levelIndex];
  const isLastLevel = gameState.levelIndex >= LEVELS.length;

  // --- Derived State Helpers ---
  const getCurrentDir = () => getNodeByPath(gameState.fs, gameState.currentPath);
  const getParentDir = () => getParentNode(gameState.fs, gameState.currentPath);
  
  const getVisibleItems = () => {
    const dir = getCurrentDir();
    if (!dir || !dir.children) return [];
    if (!gameState.filter) return dir.children;
    return dir.children.filter(c => c.name.toLowerCase().includes(gameState.filter.toLowerCase()));
  };

  const visibleItems = getVisibleItems();
  const currentItem = visibleItems[gameState.cursorIndex];

  // --- Auto-Clamp Cursor Effect ---
  // If the number of visible items changes (e.g., deletion), ensure cursor is valid.
  useEffect(() => {
     if (visibleItems.length === 0 && gameState.cursorIndex !== 0) {
         setGameState(prev => ({ ...prev, cursorIndex: 0 }));
     } else if (visibleItems.length > 0 && gameState.cursorIndex >= visibleItems.length) {
         setGameState(prev => ({ ...prev, cursorIndex: visibleItems.length - 1 }));
     }
  }, [visibleItems.length, gameState.cursorIndex]);

  // --- Game Loop / Level Check ---
  useEffect(() => {
    if (gameState.isGameOver || isLastLevel) return;

    // Check tasks
    const tasks = currentLevel.tasks;
    let hasUpdates = false;

    // Check each task. If it completes, mark it done forever in the singleton.
    // This allows transient states (like being in a filter mode) to be captured.
    tasks.forEach(t => {
        if (!t.completed && t.check(gameState)) {
            t.completed = true;
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        // Trigger a re-render so the checkmark appears in UI immediately
        setGameState(prev => ({ 
            ...prev, 
            notification: "Objective Complete" 
        }));
    }

    const allComplete = tasks.every(t => t.completed);
    
    // Advance Level if all complete
    if (allComplete) {
       const timer = setTimeout(() => {
          advanceLevel();
       }, 500); // Small delay for effect
       return () => clearTimeout(timer);
    }
  }, [gameState.fs, gameState.currentPath, gameState.selectedIds, gameState.mode, gameState.levelIndex, gameState.filter, gameState.stats]);

  const advanceLevel = () => {
    setGameState(prev => {
        const nextIndex = prev.levelIndex + 1;
        if (nextIndex >= LEVELS.length) {
            // Game Complete
            return { ...prev, levelIndex: nextIndex };
        }
        
        const nextLevel = LEVELS[nextIndex];
        const prevLevel = LEVELS[prev.levelIndex];

        // Reset tasks for the next level to ensure clean state
        if (nextLevel) {
            nextLevel.tasks.forEach(t => t.completed = false);
        }

        const isNewEpisode = nextLevel.episodeId !== prevLevel.episodeId;
        
        // Continuum Logic: Always preserve path for realism.
        // We do not reset to nextLevel.initialPath unless the user restarts the level manually via Game Over.
        const nextPath = prev.currentPath;
        
        // Take a snapshot for reset
        const currentFSSnapshot = cloneFS(prev.fs);

        return {
            ...prev,
            levelIndex: nextIndex,
            currentPath: nextPath, 
            cursorIndex: 0,
            filter: '',
            selectedIds: [],
            timeLeft: nextLevel.timeLimit || null,
            keystrokes: 0,
            levelStartFS: currentFSSnapshot, 
            showEpisodeIntro: isNewEpisode,
            notification: `LEVEL ${nextLevel.id} INITIATED`
        };
    });
  };

  // --- Timer ---
  useEffect(() => {
    if (!gameState.timeLeft || gameState.isGameOver || gameState.showEpisodeIntro || gameState.showHelp) return;
    
    const interval = setInterval(() => {
        setGameState(prev => {
            if (prev.timeLeft === null || prev.timeLeft <= 0) {
                 return { ...prev, isGameOver: true, gameOverReason: 'time', timeLeft: 0 };
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.timeLeft, gameState.isGameOver, gameState.showEpisodeIntro, gameState.showHelp]);

  // --- Action Handlers ---
  const navigate = (dir: number) => {
    setGameState(prev => {
       // Recalculating inside based on prev is safer
       const currentDir = getNodeByPath(prev.fs, prev.currentPath);
       const items = prev.filter 
         ? currentDir?.children?.filter(c => c.name.toLowerCase().includes(prev.filter.toLowerCase())) || []
         : currentDir?.children || [];
         
       let newIndex = prev.cursorIndex + dir;
       if (newIndex < 0) newIndex = 0;
       if (newIndex >= items.length) newIndex = Math.max(0, items.length - 1);
       
       return { ...prev, cursorIndex: newIndex };
    });
  };

  const enterDirectory = () => {
    if (!currentItem) return;
    if (currentItem.type === 'dir' || currentItem.type === 'archive') {
       if (currentItem.type === 'archive') {
           setGameState(prev => ({ ...prev, stats: { ...prev.stats, archivesEntered: prev.stats.archivesEntered + 1 } }));
       }
       setGameState(prev => ({
           ...prev,
           currentPath: [...prev.currentPath, currentItem.id],
           cursorIndex: 0,
           filter: '' // Reset filter on dir change
       }));
    }
  };

  const goUp = () => {
      if (gameState.currentPath.length > 1) {
          setGameState(prev => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              filter: ''
          }));
      }
  };

  const toggleSelection = () => {
      if (!currentItem) return;
      setGameState(prev => {
          const isSelected = prev.selectedIds.includes(currentItem.id);
          const newIds = isSelected 
             ? prev.selectedIds.filter(id => id !== currentItem.id)
             : [...prev.selectedIds, currentItem.id];
          // Auto advance cursor
          const currentDir = getNodeByPath(prev.fs, prev.currentPath);
          const items = currentDir?.children?.length || 0;
          const nextIndex = Math.min(prev.cursorIndex + 1, items - 1);
          
          return { ...prev, selectedIds: newIds, cursorIndex: nextIndex };
      });
  };

  const initiateDelete = () => {
      // Determine what to delete: selection or current item
      const idsToDelete = gameState.selectedIds.length > 0 ? gameState.selectedIds : (currentItem ? [currentItem.id] : []);
      if (idsToDelete.length === 0) return;

      // Check protections BEFORE showing dialog
      for (const id of idsToDelete) {
          const dir = getCurrentDir();
          const node = dir?.children?.find(c => c.id === id);
          if (node) {
              const reason = isProtected(node, gameState.levelIndex, 'delete');
              if (reason) {
                  setGameState(prev => ({ ...prev, notification: `ERROR: ${reason}` }));
                  return;
              }
          }
      }

      // If valid, switch mode to confirmation
      setGameState(prev => ({
          ...prev,
          mode: 'confirm-delete',
          pendingDeleteIds: idsToDelete
      }));
  };

  const confirmDelete = () => {
      setGameState(prev => {
          let newFS = prev.fs;
          prev.pendingDeleteIds.forEach(id => {
              newFS = deleteNode(newFS, prev.currentPath, id);
          });
          return { 
              ...prev, 
              fs: newFS, 
              mode: 'normal',
              selectedIds: [], 
              pendingDeleteIds: [],
              notification: `Deleted ${prev.pendingDeleteIds.length} items` 
          };
      });
  };

  const cancelDelete = () => {
      setGameState(prev => ({
          ...prev,
          mode: 'normal',
          pendingDeleteIds: []
      }));
  };

  const handleCopy = (isCut: boolean) => {
      const ids = gameState.selectedIds.length > 0 ? gameState.selectedIds : (currentItem ? [currentItem.id] : []);
      if (ids.length === 0) return;

      // Map IDs to actual objects
      const nodes: FileNode[] = [];
      const dir = getCurrentDir();
      if (dir && dir.children) {
          ids.forEach(id => {
              const n = dir.children!.find(c => c.id === id);
              if (n) nodes.push(n);
          });
      }

      if (isCut) {
          // Check protections
          for (const node of nodes) {
              const reason = isProtected(node, gameState.levelIndex, 'cut');
              if (reason) {
                  setGameState(prev => ({ ...prev, notification: reason }));
                  return;
              }
          }
      }

      setGameState(prev => ({
          ...prev,
          clipboard: { nodes: nodes, action: isCut ? 'cut' : 'yank', originalPath: prev.currentPath },
          selectedIds: [], // Clear selection after yank/cut command
          notification: `${isCut ? 'Cut' : 'Yanked'} ${nodes.length} items`
      }));
  };

  const handlePaste = () => {
      if (!gameState.clipboard) return;
      
      setGameState(prev => {
          if (!prev.clipboard) return prev;
          let newFS = prev.fs;
          const { nodes, action, originalPath } = prev.clipboard;
          
          // Execute move or copy
          nodes.forEach(node => {
               if (action === 'cut') {
                   // Remove from original
                   newFS = deleteNode(newFS, originalPath, node.id);
               }
               // Add to current
               newFS = addNode(newFS, prev.currentPath, node);
          });
          
          return {
              ...prev,
              fs: newFS,
              clipboard: action === 'cut' ? null : prev.clipboard, // Clear clipboard if moved
              notification: `Pasted ${nodes.length} items`
          };
      });
  };

  const handleInputSubmit = () => {
      const buffer = gameState.inputBuffer.trim();
      if (!buffer) {
          setGameState(prev => ({ ...prev, mode: 'normal' }));
          return;
      }

      if (gameState.mode === 'input-file' || gameState.mode === 'input-dir') {
           const type = gameState.mode === 'input-dir' ? 'dir' : 'file';
           // Check if complex path or simple name
           if (buffer.includes('/')) {
                // Advanced: create path
                const res = createPath(gameState.fs, gameState.currentPath, buffer + (type === 'dir' && !buffer.endsWith('/') ? '/' : ''));
                if (res.error) {
                    setGameState(prev => ({ ...prev, notification: res.error || 'Error', mode: 'normal', inputBuffer: '' }));
                } else {
                    setGameState(prev => ({ ...prev, fs: res.fs, mode: 'normal', inputBuffer: '', notification: `Created ${buffer}` }));
                }
           } else {
               // Simple create
                const newNode: FileNode = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: buffer,
                    type: type,
                    children: type === 'dir' ? [] : undefined,
                    content: type === 'file' ? '' : undefined
                };
                setGameState(prev => ({ 
                    ...prev, 
                    fs: addNode(prev.fs, prev.currentPath, newNode),
                    mode: 'normal',
                    inputBuffer: '',
                    notification: `Created ${buffer}`
                }));
           }
      } else if (gameState.mode === 'rename') {
          if (currentItem) {
               // Protection check
               const reason = isProtected(currentItem, gameState.levelIndex, 'rename');
               if (reason) {
                   setGameState(prev => ({ ...prev, notification: reason, mode: 'normal', inputBuffer: '' }));
                   return;
               }

               setGameState(prev => ({
                   ...prev,
                   fs: renameNode(prev.fs, prev.currentPath, currentItem.id, buffer),
                   stats: { ...prev.stats, renames: prev.stats.renames + 1 },
                   mode: 'normal',
                   inputBuffer: '',
                   notification: `Renamed to ${buffer}`
               }));
          }
      } else if (gameState.mode === 'fuzzy-find') {
          // Find directory matching buffer best
          const dirs = getAllDirectories(gameState.fs);
          const match = dirs.find(d => d.display.includes(buffer) || d.display.replace(/\//g, '').includes(buffer));
          
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
          } else {
              setGameState(prev => ({ ...prev, notification: 'No matching directory', mode: 'normal', inputBuffer: '' }));
          }
      }
  };

  // --- Keydown Handler ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.showEpisodeIntro || gameState.isGameOver) {
        // Only allow blocking keys or simple interaction
        return;
    }

    const key = e.key;

    // Increment Keystrokes (for Mastery)
    if (currentLevel.maxKeystrokes && gameState.mode === 'normal') {
        setGameState(prev => {
            if (prev.keystrokes >= (currentLevel.maxKeystrokes || 999)) {
                 return { ...prev, isGameOver: true, gameOverReason: 'keystrokes', keystrokes: prev.keystrokes + 1 };
            }
            return { ...prev, keystrokes: prev.keystrokes + 1 };
        });
    }

    // Modal Toggles
    if (key === '?' && gameState.mode === 'normal') {
        setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
        return;
    }
    if (gameState.showHelp) {
        setGameState(prev => ({ ...prev, showHelp: false }));
        return;
    }
    if (key === 'H' && gameState.mode === 'normal') {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
        return;
    }
    if (gameState.showHint) {
        setGameState(prev => ({ ...prev, showHint: false }));
        return;
    }

    // --- Delete Confirmation Mode ---
    if (gameState.mode === 'confirm-delete') {
        if (key === 'y' || key === 'Y' || key === 'Enter') {
            confirmDelete();
        } else if (key === 'n' || key === 'N' || key === 'Escape') {
            cancelDelete();
        }
        return;
    }

    // --- Input Modes ---
    if (['input-file', 'input-dir', 'rename', 'fuzzy-find'].includes(gameState.mode)) {
        if (key === 'Escape') {
            e.preventDefault();
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '', notification: null }));
            return;
        }
        if (key === 'Enter') {
            e.preventDefault();
            handleInputSubmit();
            return;
        }
        if (key === 'Backspace') {
            e.preventDefault();
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
            return;
        }
        if (key.length === 1) {
            e.preventDefault(); // Stop browser shortcuts like Quick Find (/) or Search (')
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
            return;
        }
        return;
    }

    // --- Filter Mode Logic (Snippet Integration) ---
    if (gameState.mode === 'filter') {
        if (key === 'Escape' || key === 'Enter') {
             e.preventDefault();
             setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Filter Active' }));
        } else if (key === 'Backspace') {
             e.preventDefault();
             setGameState(prev => ({ ...prev, filter: prev.filter.slice(0, -1), cursorIndex: 0 }));
        } else if (key.length === 1) {
             e.preventDefault();
             setGameState(prev => ({ ...prev, filter: prev.filter + key, cursorIndex: 0 }));
        }
        return;
    }

    // --- Normal Mode ---
    if (gameState.mode === 'normal') {
        switch (key) {
            case 'j':
            case 'ArrowDown':
                navigate(1);
                break;
            case 'k':
            case 'ArrowUp':
                navigate(-1);
                break;
            case 'l':
            case 'ArrowRight':
            case 'Enter':
                enterDirectory();
                break;
            case 'h':
            case 'ArrowLeft':
                goUp();
                break;
            case 'g':
                setGameState(prev => ({ ...prev, cursorIndex: 0 }));
                break;
            case 'G':
                // Go to bottom (need visible count)
                setGameState(prev => {
                     const count = getVisibleItems().length;
                     return { ...prev, cursorIndex: count - 1 };
                });
                break;
            case ' ':
                toggleSelection();
                break;
            case 'a':
                setGameState(prev => ({ ...prev, mode: 'input-file', notification: 'Create: Type name (end with / for dir)' }));
                break;
            case 'd':
                initiateDelete();
                break;
            case 'r':
                if (currentItem) {
                    setGameState(prev => ({ ...prev, mode: 'rename', inputBuffer: currentItem.name, notification: `Rename ${currentItem.name}` }));
                }
                break;
            case 'x':
                handleCopy(true); // Cut
                break;
            case 'y':
                handleCopy(false); // Copy
                break;
            case 'p':
                handlePaste();
                break;
            case 'f':
                e.preventDefault();
                setGameState(prev => ({ ...prev, mode: 'filter', notification: 'Filter Mode' }));
                break;
            case 'Z':
                setGameState(prev => ({ ...prev, mode: 'fuzzy-find', notification: 'Fuzzy Find Directory' }));
                break;
            case 'Escape':
                if (gameState.filter) {
                    setGameState(prev => ({ ...prev, filter: '', notification: 'Filter Cleared' }));
                } else if (gameState.selectedIds.length > 0) {
                    setGameState(prev => ({ ...prev, selectedIds: [], notification: 'Selection Cleared' }));
                }
                break;
        }
    }

  }, [gameState, currentLevel, handleInputSubmit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // --- Render ---

  if (isLastLevel) {
      return <OutroSequence />;
  }

  // Calculate confirmation details
  let confirmMessage = "";
  let confirmDetail = "";
  if (gameState.mode === 'confirm-delete') {
      const count = gameState.pendingDeleteIds.length;
      confirmMessage = `Trash ${count} selected ${count === 1 ? 'file' : 'files'}?`;
      // Show path of first item for context, similar to Yazi
      const firstId = gameState.pendingDeleteIds[0];
      const dir = getCurrentDir();
      const node = dir?.children?.find(c => c.id === firstId);
      const currentPathStr = resolvePath(gameState.fs, gameState.currentPath);
      // Remove trailing slash if exists for clean join
      const cleanPath = currentPathStr.endsWith('/') && currentPathStr !== '/' ? currentPathStr.slice(0, -1) : currentPathStr;
      
      confirmDetail = node ? `${cleanPath}/${node.name}` : `${count} Items`;
      
      if (count > 1) {
          confirmDetail += ` (+${count - 1} others)`;
      }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-mono select-none">
       {/* Episode Intro Overlay */}
       {gameState.showEpisodeIntro && (
           <EpisodeIntro 
             episode={EPISODE_LORE.find(e => e.id === currentLevel.episodeId) || EPISODE_LORE[0]} 
             onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))} 
           />
       )}

       {/* Delete Confirmation Modal */}
       {gameState.mode === 'confirm-delete' && (
           <ConfirmationModal title={confirmMessage} detail={confirmDetail} />
       )}

       {/* Game Over Modal */}
       {gameState.isGameOver && gameState.gameOverReason && (
           <GameOverModal 
             reason={gameState.gameOverReason} 
             onRestart={() => {
                currentLevel.tasks.forEach(t => t.completed = false);
                setGameState(prev => ({
                    ...prev,
                    fs: prev.levelStartFS,
                    currentPath: currentLevel.initialPath,
                    cursorIndex: 0,
                    filter: '',
                    selectedIds: [],
                    clipboard: null,
                    isGameOver: false,
                    timeLeft: currentLevel.timeLimit || null,
                    keystrokes: 0,
                    stats: { ...prev.stats } 
                }));
             }} 
           />
       )}

       {/* Help Modal */}
       {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
       
       {/* Hint Modal */}
       {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}

       {/* Top Bar: Progress + Controls */}
       <LevelProgress 
         levels={LEVELS} 
         currentLevelIndex={gameState.levelIndex} 
         onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
         onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
       />

       {/* Main Content Area */}
       <div className="flex-1 flex overflow-hidden relative">
           
           {/* Parent Pane */}
           <FileSystemPane 
             items={getParentDir()?.children || []} 
             isActive={false} 
             title="Parent"
             isParent={true}
             selectedIds={[]}
             clipboard={gameState.clipboard}
             className="w-1/4 xl:w-1/5 bg-zinc-950/50 text-zinc-600 border-r border-zinc-800"
           />
           
           {/* Active Pane */}
           <FileSystemPane 
             items={visibleItems} 
             isActive={true} 
             cursorIndex={gameState.cursorIndex} 
             title={resolvePath(gameState.fs, gameState.currentPath)}
             selectedIds={gameState.selectedIds}
             clipboard={gameState.clipboard}
             className="w-1/3 md:w-1/4 bg-zinc-900/80 text-zinc-300 border-r border-zinc-800"
           />
           
           {/* Preview Pane with integrated Mission Log */}
           <PreviewPane 
             node={currentItem || null} 
             level={currentLevel}
           />

           {/* Input Overlay */}
           {['input-file', 'input-dir', 'rename', 'filter', 'fuzzy-find'].includes(gameState.mode) && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black border border-green-500 px-4 py-2 shadow-2xl flex items-center gap-2 z-20 w-1/2">
                <span className="text-green-500 font-bold uppercase text-xs">{gameState.mode}:</span>
                <span className="text-white font-mono flex-1 outline-none relative">
                   {gameState.mode === 'filter' ? gameState.filter : gameState.inputBuffer}
                   <span className="animate-pulse bg-white/50 w-2 h-4 inline-block align-middle ml-1"></span>
                </span>
             </div>
           )}
       </div>

       {/* Status Bar */}
       <StatusBar state={gameState} level={currentLevel} allTasksComplete={false} />
    </div>
  );
}