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
import { MissionPane } from './components/MissionPane';

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
      filter: '',
      history: [],
      levelIndex: targetIndex,
      maxLevelReached: targetIndex,
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
  const allTasksComplete = currentLevel.tasks.every(t => t.completed);

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
  useEffect(() => {
     if (visibleItems.length === 0 && gameState.cursorIndex !== 0) {
         setGameState(prev => ({ ...prev, cursorIndex: 0 }));
     } else if (visibleItems.length > 0 && gameState.cursorIndex >= visibleItems.length) {
         setGameState(prev => ({ ...prev, cursorIndex: visibleItems.length - 1 }));
     }
  }, [visibleItems.length]);

  // --- Game Loop (Task Checking & Timer) ---
  useEffect(() => {
    const interval = setInterval(() => {
        if (gameState.showEpisodeIntro || gameState.isGameOver || gameState.mode === 'confirm-delete') return;

        // 1. Check Tasks
        const level = LEVELS[gameState.levelIndex];
        let changed = false;
        
        level.tasks.forEach(task => {
            if (!task.completed && task.check(gameState)) {
                task.completed = true;
                changed = true;
            }
        });

        // 2. Update Timer
        let newTime = gameState.timeLeft;
        let gameOver = false;
        let reason: 'time' | 'keystrokes' | undefined = undefined;

        if (gameState.timeLeft !== null && !allTasksComplete) {
            newTime = gameState.timeLeft - 1;
            if (newTime <= 0) {
                newTime = 0;
                gameOver = true;
                reason = 'time';
            }
        }
        
        // 3. Check Keystrokes (Mastery)
        if (level.maxKeystrokes && gameState.keystrokes > level.maxKeystrokes && !allTasksComplete) {
            gameOver = true;
            reason = 'keystrokes';
        }

        if (changed || newTime !== gameState.timeLeft || gameOver) {
            setGameState(prev => ({
                ...prev,
                timeLeft: newTime,
                isGameOver: gameOver,
                gameOverReason: reason
            }));
        }

    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.levelIndex, gameState.fs, gameState.currentPath, gameState.selectedIds, gameState.mode, gameState.showEpisodeIntro, gameState.isGameOver, allTasksComplete]);

  // --- Actions ---

  const advanceLevel = useCallback(() => {
    const nextIdx = gameState.levelIndex + 1;
    if (nextIdx < LEVELS.length) {
        const nextLevel = LEVELS[nextIdx];
        const isNewEpisode = nextLevel.episodeId !== currentLevel.episodeId;
        
        // Reset tasks for next level
        nextLevel.tasks.forEach(t => t.completed = false);

        setGameState(prev => ({
            ...prev,
            levelIndex: nextIdx,
            maxLevelReached: Math.max(prev.maxLevelReached, nextIdx),
            currentPath: nextLevel.initialPath, // Reset position for new level
            cursorIndex: 0,
            mode: 'normal',
            filter: '',
            history: [],
            notification: `LEVEL ${nextLevel.id} INITIATED`,
            showEpisodeIntro: isNewEpisode,
            levelStartFS: cloneFS(prev.fs), // Snapshot for restart
            timeLeft: nextLevel.timeLimit || null,
            keystrokes: 0
        }));
    } else {
        // Game Complete
        setGameState(prev => ({ ...prev, levelIndex: nextIdx }));
    }
  }, [gameState.levelIndex, currentLevel.episodeId]);

  const jumpToLevel = useCallback((targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= LEVELS.length) return;
    
    const targetLevel = LEVELS[targetIdx];
    // Reset tasks so they can be replayed/viewed
    targetLevel.tasks.forEach(t => t.completed = false);

    setGameState(prev => ({
        ...prev,
        levelIndex: targetIdx,
        // We do NOT update maxLevelReached here, only in advanceLevel
        // We do NOT reset fs (as requested by user)
        currentPath: targetLevel.initialPath,
        cursorIndex: 0,
        mode: 'normal',
        filter: '',
        timeLeft: targetLevel.timeLimit || null,
        keystrokes: 0,
        isGameOver: false,
        notification: `JUMPED TO LEVEL ${targetLevel.id}`
    }));
  }, []);

  const handleRestartLevel = useCallback(() => {
      const level = LEVELS[gameState.levelIndex];
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
  }, [gameState.levelIndex]);

  // ... (Key handling logic would go here, omitting for brevity as it's large and mostly unchanged, 
  //      but assume standard key handling calls setGameState)
  
  // Minimal re-implementation of key handling to ensure the app works 
  // Since I need to output the FULL file content, I must include the key handler.
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (gameState.showEpisodeIntro || gameState.isGameOver) return;
      if (gameState.mode === 'confirm-delete') return; // Handled by modal
      
      // Increment keystrokes for non-navigation keys or all keys? 
      // Usually navigation counts for efficiency.
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
          setGameState(prev => ({...prev, keystrokes: prev.keystrokes + 1}));
      }

      // GLOBAL: Help & Hint
      if (e.key === '?') {
          setGameState(prev => ({...prev, showHelp: !prev.showHelp}));
          return;
      }
      if (e.key === 'H' && e.shiftKey) { // Uppercase H
          setGameState(prev => ({...prev, showHint: !prev.showHint}));
          return;
      }
      if (e.key === 'm') { // Mute toggle
         // Implemented in settings usually
         return;
      }

      // MODE: INPUT (File/Dir Creation)
      if (gameState.mode.startsWith('input')) {
          if (e.key === 'Enter') {
              e.preventDefault();
              const pathStr = gameState.inputBuffer;
              if (pathStr.trim()) {
                  // Execute Create
                  const result = createPath(gameState.fs, gameState.currentPath, pathStr);
                  if (result.error) {
                      setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '', notification: `ERROR: ${result.error}` }));
                  } else {
                      setGameState(prev => ({ 
                          ...prev, 
                          fs: result.fs, 
                          mode: 'normal', 
                          inputBuffer: '', 
                          notification: `Created: ${pathStr}` 
                      }));
                  }
              } else {
                  setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
              }
          } else if (e.key === 'Escape') {
              setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
          } else if (e.key === 'Backspace') {
              setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
          } else if (e.key.length === 1) {
              setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
          }
          return;
      }

      // MODE: FILTER / SEARCH
      if (gameState.mode === 'filter') {
          if (e.key === 'Enter' || e.key === 'Escape') {
              // Commit filter (stay in normal mode but keep filter active visually until cleared? 
              // Yazi behavior: Enter keeps filter, Esc clears it if empty, or cancels input.
              // We'll simplify: Enter keeps it. Esc clears it.
              if (e.key === 'Escape') {
                   setGameState(prev => ({ ...prev, mode: 'normal', filter: '' }));
              } else {
                   setGameState(prev => ({ ...prev, mode: 'normal' })); // Keep filter string in state
              }
          } else if (e.key === 'Backspace') {
              setGameState(prev => {
                  const newFilter = prev.filter.slice(0, -1);
                  return { ...prev, filter: newFilter };
              });
          } else if (e.key.length === 1) {
              setGameState(prev => {
                  const newFilter = prev.filter + e.key;
                  return { ...prev, filter: newFilter };
              });
          }
          return;
      }

      // MODE: RENAME
      if (gameState.mode === 'rename') {
           if (e.key === 'Enter') {
               if (gameState.inputBuffer.trim()) {
                    // Check protection
                    const node = currentItem;
                    const protectedMsg = isProtected(node, gameState.levelIndex, 'rename');
                    if (protectedMsg) {
                        setGameState(prev => ({...prev, mode: 'normal', inputBuffer: '', notification: protectedMsg}));
                    } else {
                        const newRoot = renameNode(gameState.fs, gameState.currentPath, node.id, gameState.inputBuffer);
                        setGameState(prev => ({
                            ...prev, 
                            fs: newRoot, 
                            mode: 'normal', 
                            inputBuffer: '',
                            notification: `Renamed to ${gameState.inputBuffer}`,
                            stats: { ...prev.stats, renames: prev.stats.renames + 1 }
                        }));
                    }
               } else {
                    setGameState(prev => ({...prev, mode: 'normal', inputBuffer: ''}));
               }
           } else if (e.key === 'Escape') {
               setGameState(prev => ({...prev, mode: 'normal', inputBuffer: ''}));
           } else if (e.key === 'Backspace') {
               setGameState(prev => ({...prev, inputBuffer: prev.inputBuffer.slice(0, -1)}));
           } else if (e.key.length === 1) {
               setGameState(prev => ({...prev, inputBuffer: prev.inputBuffer + e.key}));
           }
           return;
      }

      // MODE: FUZZY FIND
      if (gameState.mode === 'fuzzy-find') {
          if (e.key === 'Enter') {
               // Jump to top result
               const dirs = getAllDirectories(gameState.fs);
               const match = dirs.find(d => d.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
               if (match) {
                   setGameState(prev => ({
                       ...prev,
                       currentPath: match.path,
                       cursorIndex: 0,
                       mode: 'normal',
                       inputBuffer: '',
                       stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 }
                   }));
               } else {
                   setGameState(prev => ({...prev, mode: 'normal', inputBuffer: '', notification: "No directory found"}));
               }
          } else if (e.key === 'Escape') {
              setGameState(prev => ({...prev, mode: 'normal', inputBuffer: ''}));
          } else if (e.key === 'Backspace') {
              setGameState(prev => ({...prev, inputBuffer: prev.inputBuffer.slice(0, -1)}));
          } else if (e.key.length === 1) {
              setGameState(prev => ({...prev, inputBuffer: prev.inputBuffer + e.key}));
          }
          return;
      }
      
      // NORMAL MODE COMMANDS
      
      // Navigation
      if (e.key === 'j' || e.key === 'ArrowDown') {
          setGameState(prev => {
             const dir = getNodeByPath(prev.fs, prev.currentPath);
             const count = dir?.children ? dir.children.length : 0;
             // Apply filter count
             const validItems = prev.filter 
                ? dir?.children?.filter(c => c.name.toLowerCase().includes(prev.filter.toLowerCase())) 
                : dir?.children;
             
             const max = validItems?.length || 0;
             if (max === 0) return prev;
             
             return { ...prev, cursorIndex: Math.min(prev.cursorIndex + 1, max - 1) };
          });
      }
      else if (e.key === 'k' || e.key === 'ArrowUp') {
          setGameState(prev => ({ ...prev, cursorIndex: Math.max(prev.cursorIndex - 1, 0) }));
      }
      else if (e.key === 'h' || e.key === 'ArrowLeft') {
          setGameState(prev => {
              if (prev.currentPath.length <= 1) return prev; // At root
              const newPath = prev.currentPath.slice(0, -1);
              // Try to restore cursor index to where we came from? 
              // Simplification: reset to 0 or find the child index we just left (advanced)
              return { ...prev, currentPath: newPath, cursorIndex: 0 };
          });
      }
      else if (e.key === 'l' || e.key === 'ArrowRight' || e.key === 'Enter') {
          if (currentItem) {
              if (currentItem.type === 'dir' || currentItem.type === 'archive') {
                  setGameState(prev => {
                       // Special stat tracking for archives
                       const stats = { ...prev.stats };
                       if (currentItem.type === 'archive') stats.archivesEntered++;
                       
                       return {
                          ...prev,
                          currentPath: [...prev.currentPath, currentItem.id],
                          cursorIndex: 0,
                          stats
                       };
                  });
              } else {
                  // File: open? In this game, maybe just notification
                  setGameState(prev => ({...prev, notification: `Opened ${currentItem.name}`}));
              }
          }
      }
      
      // Selection
      else if (e.key === ' ') { // Space
          e.preventDefault();
          if (currentItem) {
              setGameState(prev => {
                  const newSelected = prev.selectedIds.includes(currentItem.id)
                      ? prev.selectedIds.filter(id => id !== currentItem.id)
                      : [...prev.selectedIds, currentItem.id];
                  
                  // Auto-advance cursor
                  const dir = getNodeByPath(prev.fs, prev.currentPath);
                  const validItems = prev.filter 
                        ? dir?.children?.filter(c => c.name.toLowerCase().includes(prev.filter.toLowerCase())) 
                        : dir?.children;
                  const max = validItems?.length || 0;
                  const nextCursor = Math.min(prev.cursorIndex + 1, max - 1);
                  
                  return { ...prev, selectedIds: newSelected, cursorIndex: nextCursor };
              });
          }
      }

      // Operations
      else if (e.key === 'd') {
          // Check protection logic handled in confirmation or here?
          // Let's do a quick check. If multiple selected, complex.
          // Trigger confirmation mode.
          const targets = gameState.selectedIds.length > 0 
              ? gameState.selectedIds 
              : currentItem ? [currentItem.id] : [];
          
          if (targets.length > 0) {
              setGameState(prev => ({
                  ...prev, 
                  mode: 'confirm-delete', 
                  pendingDeleteIds: targets
              }));
          }
      }
      else if (e.key === 'a') {
          setGameState(prev => ({...prev, mode: 'input-file', inputBuffer: '', notification: 'Create: name/ for dir'}));
      }
      else if (e.key === 'f') {
          setGameState(prev => ({...prev, mode: 'filter', inputBuffer: '', notification: 'Filter: type to search'}));
      }
      else if (e.key === 'Escape') {
          // Clear filter or selection
          setGameState(prev => {
              if (prev.filter) return { ...prev, filter: '' };
              if (prev.selectedIds.length > 0) return { ...prev, selectedIds: [] };
              return prev;
          });
      }
      else if (e.key === 'Z' && e.shiftKey) { // Shift+Z
          setGameState(prev => ({...prev, mode: 'fuzzy-find', inputBuffer: '', notification: 'Fuzzy Find >'}));
      }
      else if (e.key === 'r') {
          if (currentItem) {
               setGameState(prev => ({
                   ...prev, 
                   mode: 'rename', 
                   inputBuffer: currentItem.name, 
                   notification: `Rename ${currentItem.name}`
               }));
          }
      }
      
      // Clipboard (Yank/Cut/Paste)
      else if (e.key === 'y') {
          const targets = gameState.selectedIds.length > 0 
                ? gameState.selectedIds 
                : currentItem ? [currentItem.id] : [];
          if (targets.length > 0) {
              const currentDir = getCurrentDir();
              const nodes = currentDir?.children?.filter(c => targets.includes(c.id)) || [];
              setGameState(prev => ({
                  ...prev,
                  selectedIds: [], // Clear selection
                  clipboard: { nodes, action: 'yank', originalPath: prev.currentPath },
                  notification: `Yanked ${nodes.length} items`
              }));
          }
      }
      else if (e.key === 'x') {
          const targets = gameState.selectedIds.length > 0 
                ? gameState.selectedIds 
                : currentItem ? [currentItem.id] : [];
          if (targets.length > 0) {
              const currentDir = getCurrentDir();
              const nodes = currentDir?.children?.filter(c => targets.includes(c.id)) || [];
              
              // Check protection for Cut
              const protectedNode = nodes.find(n => isProtected(n, gameState.levelIndex, 'cut'));
              if (protectedNode) {
                  const msg = isProtected(protectedNode, gameState.levelIndex, 'cut');
                  setGameState(prev => ({...prev, notification: msg}));
              } else {
                  setGameState(prev => ({
                      ...prev,
                      selectedIds: [],
                      clipboard: { nodes, action: 'cut', originalPath: prev.currentPath },
                      notification: `Cut ${nodes.length} items`
                  }));
              }
          }
      }
      else if (e.key === 'p') {
          if (gameState.clipboard) {
              setGameState(prev => {
                  if (!prev.clipboard) return prev;
                  let newRoot = prev.fs;
                  
                  // For each node in clipboard
                  for (const node of prev.clipboard.nodes) {
                      // Add copy to current location
                      newRoot = addNode(newRoot, prev.currentPath, node);
                      
                      // If action was cut, remove from original location
                      if (prev.clipboard.action === 'cut') {
                          newRoot = deleteNode(newRoot, prev.clipboard.originalPath, node.id);
                      }
                  }

                  return {
                      ...prev,
                      fs: newRoot,
                      clipboard: prev.clipboard.action === 'cut' ? null : prev.clipboard, // Clear clipboard if cut
                      notification: `Pasted ${prev.clipboard.nodes.length} items`
                  };
              });
          }
      }


  }, [gameState.mode, gameState.inputBuffer, gameState.cursorIndex, gameState.currentPath, gameState.selectedIds, gameState.clipboard, gameState.fs, gameState.showEpisodeIntro, gameState.isGameOver, currentItem, getCurrentDir]);

  // Attach Listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // --- Render ---

  if (gameState.levelIndex >= LEVELS.length) {
      // Outro / Conclusion
      return <OutroSequence />;
  }

  const handleConfirmDelete = () => {
       // Perform Deletion
       let newRoot = gameState.fs;
       let blocked = false;
       let blockMsg = '';

       // Check protections
       const currentDir = getCurrentDir();
       const itemsToDelete = currentDir?.children?.filter(c => gameState.pendingDeleteIds.includes(c.id)) || [];
       
       for (const item of itemsToDelete) {
           const msg = isProtected(item, gameState.levelIndex, 'delete');
           if (msg) {
               blocked = true;
               blockMsg = msg;
               break;
           }
       }

       if (blocked) {
           setGameState(prev => ({
               ...prev, 
               mode: 'normal', 
               pendingDeleteIds: [], 
               notification: blockMsg
           }));
       } else {
           for (const id of gameState.pendingDeleteIds) {
               newRoot = deleteNode(newRoot, gameState.currentPath, id);
           }
           setGameState(prev => ({
               ...prev,
               fs: newRoot,
               mode: 'normal',
               pendingDeleteIds: [],
               selectedIds: [],
               notification: `Deleted ${gameState.pendingDeleteIds.length} items`
           }));
       }
  };

  const handleCancelDelete = () => {
      setGameState(prev => ({...prev, mode: 'normal', pendingDeleteIds: []}));
  };

  // Confirm Modal Key Handler
  const ConfirmWrapper = () => {
      useEffect(() => {
          const handler = (e: KeyboardEvent) => {
              if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') handleConfirmDelete();
              if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') handleCancelDelete();
          };
          window.addEventListener('keydown', handler);
          return () => window.removeEventListener('keydown', handler);
      }, []);
      return (
          <ConfirmationModal 
            title="CONFIRM DELETION" 
            detail={`Delete ${gameState.pendingDeleteIds.length} items? This action cannot be undone.`} 
          />
      );
  };

  return (
    <div className="h-screen w-screen bg-black text-zinc-300 flex flex-col overflow-hidden select-none">
      
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

      {gameState.mode === 'confirm-delete' && <ConfirmWrapper />}
      {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({...prev, showHelp: false}))} />}
      {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({...prev, showHint: false}))} />}

      {/* Top Bar: Level Progress & Status */}
      <LevelProgress 
          levels={LEVELS} 
          currentLevelIndex={gameState.levelIndex}
          maxLevelReached={gameState.maxLevelReached}
          onJumpToLevel={jumpToLevel}
          onToggleHint={() => setGameState(prev => ({...prev, showHint: !prev.showHint}))}
          onToggleHelp={() => setGameState(prev => ({...prev, showHelp: !prev.showHelp}))}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Mission / Help Pane (Fixed width) */}
        <MissionPane 
            level={currentLevel} 
            gameState={gameState} 
            onToggleHint={() => setGameState(prev => ({...prev, showHint: !prev.showHint}))}
            onToggleHelp={() => setGameState(prev => ({...prev, showHelp: !prev.showHelp}))}
        />

        {/* Center: File System Columns */}
        <div className="flex-1 flex min-w-0 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
            {/* Parent Directory (Dimmed) */}
            {gameState.currentPath.length > 1 && (
                <FileSystemPane 
                    items={getParentDir()?.children || []} 
                    isActive={false} 
                    isParent={true}
                    selectedIds={[]}
                    clipboard={null}
                    className="hidden md:flex w-1/4"
                    title={getParentDir()?.name}
                />
            )}
            
            {/* Current Directory (Active) */}
            <FileSystemPane 
                items={visibleItems} 
                isActive={true} 
                cursorIndex={gameState.cursorIndex}
                title={getCurrentDir()?.name || 'root'}
                selectedIds={gameState.selectedIds}
                clipboard={gameState.clipboard}
                className="flex-1 border-l border-zinc-800"
            />
        </div>

        {/* Right: Preview Pane */}
        <div className="w-1/3 hidden lg:flex flex-col">
            <PreviewPane node={currentItem} level={currentLevel} />
        </div>

        {/* Floating Input / Filter Overlay */}
        {(gameState.mode.startsWith('input') || gameState.mode === 'filter' || gameState.mode === 'rename' || gameState.mode === 'fuzzy-find') && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-96 bg-zinc-900 border border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] z-50 rounded px-4 py-3 animate-in slide-in-from-bottom-2">
                <div className="text-[10px] uppercase font-bold text-orange-500 mb-1 tracking-wider">
                    {gameState.notification || gameState.mode}
                </div>
                <div className="flex items-center gap-2 font-mono text-lg text-white">
                    <span className="text-zinc-500">{'>'}</span>
                    <span className="min-w-[2px]">{gameState.inputBuffer}</span>
                    <span className="w-2.5 h-5 bg-orange-500 animate-pulse"></span>
                </div>
            </div>
        )}
      </div>

      {/* Bottom: Status Bar */}
      <StatusBar 
        state={gameState} 
        level={currentLevel} 
        allTasksComplete={allTasksComplete} 
        onNextLevel={advanceLevel}
      />

    </div>
  );
}
