import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FileNode, Level, ClipboardItem } from './types';
import { LEVELS, INITIAL_FS, EPISODE_LORE, KEYBINDINGS } from './constants';
import { getNodeByPath, getParentNode, deleteNode, addNode, renameNode, cloneFS, createPath, findNodeByName, isProtected, getAllDirectories } from './utils/fsHelpers';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialLevel = LEVELS[0];
    return {
      currentPath: initialLevel.initialPath,
      cursorIndex: 0,
      clipboard: null,
      mode: 'normal',
      inputBuffer: '',
      filter: '',
      history: [],
      levelIndex: 0,
      fs: INITIAL_FS,
      levelStartFS: cloneFS(INITIAL_FS),
      notification: null,
      selectedIds: [],
      pendingDeleteIds: [],
      showHelp: false,
      showHint: false,
      showEpisodeIntro: true,
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
        // Reset tasks for the next level to ensure clean state
        if (nextLevel) {
            nextLevel.tasks.forEach(t => t.completed = false);
        }

        const isNewEpisode = nextLevel.episodeId !== currentLevel.episodeId;
        
        // Take a snapshot for reset
        const currentFSSnapshot = cloneFS(prev.fs);

        return {
            ...prev,
            levelIndex: nextIndex,
            currentPath: nextLevel.initialPath, // Teleport to new start
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
       const visible = getVisibleItems(); // Need fresh calc inside setter if using prev? Actually ref is safer or assume consistent
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

  const handleDelete = () => {
      // Determine what to delete: selection or current item
      const idsToDelete = gameState.selectedIds.length > 0 ? gameState.selectedIds : (currentItem ? [currentItem.id] : []);
      if (idsToDelete.length === 0) return;

      // Check protections
      for (const id of idsToDelete) {
          // Find node to check name (expensive but safe)
          // Simplified: we only check current context or selection.
          // Since finding by ID globally is hard without path, we assume items are in current dir
          // But wait, selection persists? No, usually localized. 
          // For simplicity in this version, selection clears on dir change, so items are in current dir.
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

      setGameState(prev => {
          let newFS = prev.fs;
          idsToDelete.forEach(id => {
              newFS = deleteNode(newFS, prev.currentPath, id);
          });
          return { 
              ...prev, 
              fs: newFS, 
              selectedIds: [], 
              notification: `Deleted ${idsToDelete.length} items` 
          };
      });
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
    if (currentLevel.maxKeystrokes) {
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

    // --- Input Modes ---
    if (['input-file', 'input-dir', 'rename', 'fuzzy-find'].includes(gameState.mode)) {
        if (key === 'Escape') {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '', notification: null }));
            return;
        }
        if (key === 'Enter') {
            handleInputSubmit();
            return;
        }
        if (key === 'Backspace') {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
            return;
        }
        if (key.length === 1) {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
            return;
        }
        return;
    }

    // --- Filter Mode Logic (Snippet Integration) ---
    if (gameState.mode === 'filter') {
        if (key === 'Escape' || key === 'Enter') {
             // User request: Escape (and Enter) exits input mode but KEEPS the filter active.
             // This allows interacting with the filtered subset.
             // A subsequent Escape in normal mode will clear the filter.
             setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Filter Active' }));
        } else if (key === 'Backspace') {
             setGameState(prev => ({ ...prev, filter: prev.filter.slice(0, -1), cursorIndex: 0 }));
        } else if (key.length === 1) {
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
                // Cycle between file/dir? Or just default. Let's make 'a' file and 'A' dir?
                // Yazi uses 'a' for create (opens input).
                // Let's prompt input with hint? 
                // Simplified: 'a' for file, shift+A for dir? Or just generic input that detects trailing slash
                setGameState(prev => ({ ...prev, mode: 'input-file', notification: 'Create: Type name (end with / for dir)' }));
                break;
            case 'd':
                handleDelete();
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

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-mono select-none">
       {/* Episode Intro Overlay */}
       {gameState.showEpisodeIntro && (
           <EpisodeIntro 
             episode={EPISODE_LORE.find(e => e.id === currentLevel.episodeId) || EPISODE_LORE[0]} 
             onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))} 
           />
       )}

       {/* Game Over Modal */}
       {gameState.isGameOver && gameState.gameOverReason && (
           <GameOverModal 
             reason={gameState.gameOverReason} 
             onRestart={() => {
                // Reset tasks for the restart
                currentLevel.tasks.forEach(t => t.completed = false);

                // Reset to start of current level
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
                    stats: { ...prev.stats } // keep stats or reset? usually reset for strict runs, but let's keep it fun
                }));
             }} 
           />
       )}

       {/* Help Modal */}
       {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
       
       {/* Hint Modal */}
       {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}

       {/* Top Bar: Progress */}
       <LevelProgress levels={LEVELS} currentLevelIndex={gameState.levelIndex} />

       {/* Main Content Area */}
       <div className="flex-1 flex overflow-hidden relative">
           {/* Parent Pane (Optional view) */}
           <FileSystemPane 
             items={getParentDir()?.children || []} 
             isActive={false} 
             title="Parent"
             isParent={true}
             selectedIds={[]}
             clipboard={gameState.clipboard}
           />
           
           {/* Active Pane */}
           <FileSystemPane 
             items={visibleItems} 
             isActive={true} 
             cursorIndex={gameState.cursorIndex} 
             title={`/${gameState.currentPath.slice(1).join('/')}`}
             selectedIds={gameState.selectedIds}
             clipboard={gameState.clipboard}
           />
           
           {/* Preview Pane */}
           <PreviewPane node={currentItem || null} />

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