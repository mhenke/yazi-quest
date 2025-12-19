
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, FileNode, Level, ClipboardItem 
} from './types';
import { 
  INITIAL_FS, LEVELS, EPISODE_LORE 
} from './constants';
import { 
  getNodeByPath, deleteNode, addNode, createPath,
  cloneFS, isProtected, getRecursiveContent, resolvePath, getAllDirectories 
} from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { playSuccessSound } from './utils/sounds';

import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { LevelProgress } from './components/LevelProgress';
import { MissionPane } from './components/MissionPane';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { EpisodeIntro } from './components/EpisodeIntro';
import { GameOverModal } from './components/GameOverModal';
import { SuccessToast } from './components/SuccessToast';
import { InfoPanel } from './components/InfoPanel';
import { GCommandDialog } from './components/GCommandDialog';
import { FuzzyFinder } from './components/FuzzyFinder';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPath: ['root', 'home', 'user'],
    cursorIndex: 0,
    clipboard: null,
    mode: 'normal',
    inputBuffer: '',
    filters: {},
    sortBy: 'natural',
    sortDirection: 'asc',
    linemode: 'none',
    zoxideData: {},
    history: [],
    levelIndex: 0,
    fs: JSON.parse(JSON.stringify(INITIAL_FS)), // Deep copy
    levelStartFS: JSON.parse(JSON.stringify(INITIAL_FS)),
    notification: null,
    selectedIds: [],
    pendingDeleteIds: [],
    pendingOverwriteNode: null,
    showHelp: false,
    showHint: false,
    hintStage: 0,
    showHidden: true,
    showInfoPanel: false,
    showEpisodeIntro: true,
    timeLeft: null,
    keystrokes: 0,
    isGameOver: false,
    stats: { fuzzyJumps: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
    settings: { soundEnabled: true },
    usedG: false,
    usedGG: false
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const currentLevel = LEVELS[gameState.levelIndex];
  
  // Calculate visible items for current directory
  const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
  let visibleItems: FileNode[] = [];
  
  if (currentDir && currentDir.children) {
      visibleItems = [...currentDir.children];
      
      // Filter hidden files
      if (!gameState.showHidden) {
          visibleItems = visibleItems.filter(c => !c.name.startsWith('.'));
      }

      // Apply directory filter
      const activeFilter = gameState.filters[currentDir.id] || '';
      if (activeFilter) {
          visibleItems = visibleItems.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()));
      }

      // Apply Sort
      visibleItems = sortNodes(visibleItems, gameState.sortBy, gameState.sortDirection);
  }

  // Ensure cursor is within bounds
  useEffect(() => {
      if (visibleItems.length === 0 && gameState.cursorIndex !== 0) {
          setGameState(prev => ({ ...prev, cursorIndex: 0 }));
      } else if (visibleItems.length > 0 && gameState.cursorIndex >= visibleItems.length) {
          setGameState(prev => ({ ...prev, cursorIndex: visibleItems.length - 1 }));
      }
  }, [visibleItems.length, gameState.cursorIndex]);

  // Level Initialization
  useEffect(() => {
      const level = LEVELS[gameState.levelIndex];
      if (level) {
          setGameState(prev => {
              let newPath = prev.currentPath;
              if (level.initialPath) {
                  // Verify path exists, else fallback to root
                  const node = getNodeByPath(prev.fs, level.initialPath);
                  if (node) newPath = level.initialPath;
              }

              return {
                  ...prev,
                  timeLeft: level.timeLimit || null,
                  keystrokes: 0,
                  currentPath: newPath,
                  cursorIndex: 0,
                  usedG: false,
                  usedGG: false,
                  notification: `Level ${level.id}: ${level.title}`
              };
          });
      }
  }, [gameState.levelIndex]);

  // Timer Logic
  useEffect(() => {
      if (gameState.isGameOver || gameState.showEpisodeIntro || showSuccess || gameState.mode !== 'normal') return;
      if (gameState.timeLeft === null) return;

      const timer = setInterval(() => {
          setGameState(prev => {
              if (prev.timeLeft === null || prev.timeLeft <= 0) {
                  clearInterval(timer);
                  return { ...prev, isGameOver: true, gameOverReason: 'time', timeLeft: 0 };
              }
              return { ...prev, timeLeft: prev.timeLeft - 1 };
          });
      }, 1000);

      return () => clearInterval(timer);
  }, [gameState.isGameOver, gameState.showEpisodeIntro, showSuccess, gameState.mode, gameState.timeLeft]);

  // Check Level Completion
  useEffect(() => {
      if (gameState.isGameOver || showSuccess) return;

      const level = LEVELS[gameState.levelIndex];
      if (!level) return;

      const allTasksComplete = level.tasks.every(t => t.check(gameState, level));
      
      // Update task completion status in level object (for UI)
      level.tasks.forEach(t => {
          t.completed = t.check(gameState, level);
      });

      if (allTasksComplete) {
          playSuccessSound(gameState.settings.soundEnabled);
          setShowSuccess(true);
      }
  }, [gameState, showSuccess]);

  const handleFuzzyModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>
  ) => {
    const isZoxide = gameState.mode === 'zoxide-jump';
    let candidates: { path: string, score: number, pathIds?: string[], id?: string }[] = [];
    if (isZoxide) {
      candidates = Object.keys(gameState.zoxideData)
        .map(path => ({ path, score: 0 })) // score handled in component
        .filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
    } else {
      candidates = getRecursiveContent(gameState.fs, gameState.currentPath)
        .filter(c => c.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()))
        .map(c => ({ path: c.display, score: 0, pathIds: c.path, id: c.id }));
    }

    if (e.key === 'Enter') {
      const idx = gameState.fuzzySelectedIndex || 0;
      const selected = candidates[idx];
      if (selected) {
        if (isZoxide) {
            const allDirs = getAllDirectories(gameState.fs);
            const match = allDirs.find(d => d.display === selected.path);
            if (match) {
                setGameState(prev => ({
                    ...prev,
                    mode: 'normal',
                    currentPath: match.path,
                    cursorIndex: 0,
                    stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                }));
            }
        } else {
            if (selected.pathIds && Array.isArray(selected.pathIds)) {
                const fullPath = [...gameState.currentPath, ...selected.pathIds];
                const targetPath = fullPath.slice(0, -1);
                
                setGameState(prev => {
                    const targetDir = getNodeByPath(prev.fs, targetPath);
                    if (!targetDir || !targetDir.children) return { ...prev, mode: 'normal' };
                    
                    let items = [...targetDir.children];
                    if (!prev.showHidden) items = items.filter(c => !c.name.startsWith('.'));
                    const filter = prev.filters[targetDir.id] || '';
                    if (filter) items = items.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
                    items = sortNodes(items, prev.sortBy, prev.sortDirection);
                    
                    const newIndex = items.findIndex(n => n.id === selected.id);
                    
                    return { 
                        ...prev, 
                        mode: 'normal', 
                        currentPath: targetPath,
                        cursorIndex: newIndex >= 0 ? newIndex : 0
                    };
                });
            } else {
                setGameState(prev => ({ ...prev, mode: 'normal' }));
            }
        }
      } else {
          setGameState(prev => ({ ...prev, mode: 'normal' }));
      }
    } else if (e.key === 'Escape') {
      setGameState(prev => ({ ...prev, mode: 'normal' }));
    } else if (e.key === 'j' || e.key === 'ArrowDown') {
      setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.min(candidates.length - 1, (prev.fuzzySelectedIndex || 0) + 1) }));
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      setGameState(prev => ({ ...prev, fuzzySelectedIndex: Math.max(0, (prev.fuzzySelectedIndex || 0) - 1) }));
    } else if (e.key === 'Backspace') {
      setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1), fuzzySelectedIndex: 0 }));
    } else if (e.key.length === 1) {
      setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key, fuzzySelectedIndex: 0 }));
    }
  }, []);

  const handleNormalModeKeyDown = useCallback((
    e: KeyboardEvent,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    items: FileNode[],
    currentLevel: Level,
    advanceLevel: () => void
  ) => {
          switch (e.key) {
              case 'j':
              case 'ArrowDown':
                  setGameState(prev => ({ ...prev, cursorIndex: Math.min(prev.cursorIndex + 1, items.length - 1) }));
                  break;
              case 'k':
              case 'ArrowUp':
                  setGameState(prev => ({ ...prev, cursorIndex: Math.max(prev.cursorIndex - 1, 0) }));
                  break;
              case 'h':
              case 'ArrowLeft':
                  setGameState(prev => {
                      if (prev.currentPath.length > 1) {
                          return { ...prev, currentPath: prev.currentPath.slice(0, -1), cursorIndex: 0 };
                      }
                      return prev;
                  });
                  break;
              case 'l':
              case 'ArrowRight':
              case 'Enter':
                  const item = items[gameState.cursorIndex];
                  if (item && (item.type === 'dir' || item.type === 'archive')) {
                      setGameState(prev => ({
                          ...prev,
                          currentPath: [...prev.currentPath, item.id],
                          cursorIndex: 0,
                          stats: { ...prev.stats, archivesEntered: item.type === 'archive' ? prev.stats.archivesEntered + 1 : prev.stats.archivesEntered }
                      }));
                  }
                  break;
              case 'G':
                  setGameState(prev => ({ ...prev, cursorIndex: items.length - 1, usedG: true }));
                  break;
              case 'g':
                  setGameState(prev => ({ ...prev, mode: 'g-command' }));
                  break;
              case 'a':
                  setGameState(prev => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
                  break;
              case 'd':
                  if (gameState.selectedIds.length > 0 || items[gameState.cursorIndex]) {
                      setGameState(prev => {
                          let newFs = prev.fs;
                          const idsToDelete = prev.selectedIds.length > 0 ? prev.selectedIds : [items[prev.cursorIndex]?.id].filter(Boolean);
                          
                          let errorMsg: string | null = null;
                          for (const id of idsToDelete) {
                              const node = items.find(n => n.id === id); 
                              if (node) {
                                  const reason = isProtected(prev.fs, prev.currentPath, node, prev.levelIndex, 'delete');
                                  if (reason) {
                                      errorMsg = reason;
                                      break; 
                                  }
                              }
                          }

                          if (errorMsg) return { ...prev, notification: errorMsg };
                          
                          idsToDelete.forEach(id => {
                             newFs = deleteNode(newFs, prev.currentPath, id);
                          });

                          return {
                              ...prev,
                              fs: newFs,
                              selectedIds: [],
                              notification: `Deleted ${idsToDelete.length} items`
                          };
                      });
                  }
                  break;
               case ' ':
                  if (items[gameState.cursorIndex]) {
                      setGameState(prev => {
                          const item = items[prev.cursorIndex];
                          const isSelected = prev.selectedIds.includes(item.id);
                          const newSelected = isSelected 
                              ? prev.selectedIds.filter(id => id !== item.id)
                              : [...prev.selectedIds, item.id];
                          return { ...prev, selectedIds: newSelected, cursorIndex: Math.min(prev.cursorIndex + 1, items.length - 1) };
                      });
                  }
                  break;
              case 'x':
              case 'y':
                  const action = e.key === 'x' ? 'cut' : 'yank';
                  const nodesToClip = gameState.selectedIds.length > 0 
                      ? items.filter(i => gameState.selectedIds.includes(i.id))
                      : [items[gameState.cursorIndex]].filter(Boolean);
                  
                  if (nodesToClip.length > 0) {
                      if (action === 'cut') {
                          let errorMsg: string | null = null;
                          for (const node of nodesToClip) {
                              const reason = isProtected(gameState.fs, gameState.currentPath, node, gameState.levelIndex, 'cut');
                              if (reason) {
                                  errorMsg = reason;
                                  break;
                              }
                          }
                          if (errorMsg) {
                              setGameState(prev => ({ ...prev, notification: errorMsg }));
                              return;
                          }
                      }

                      setGameState(prev => ({
                          ...prev,
                          clipboard: { nodes: nodesToClip, action, originalPath: prev.currentPath },
                          selectedIds: [],
                          notification: `${action === 'cut' ? 'Cut' : 'Yanked'} ${nodesToClip.length} items`
                      }));
                  }
                  break;
              case 'p':
                  if (gameState.clipboard) {
                      setGameState(prev => {
                           let newFs = prev.fs;
                           gameState.clipboard?.nodes.forEach(node => {
                               if (gameState.clipboard?.action === 'cut') {
                                   newFs = deleteNode(newFs, gameState.clipboard.originalPath, node.id);
                               }
                               newFs = addNode(newFs, prev.currentPath, node);
                           });
                           return { ...prev, fs: newFs, clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard, notification: `Pasted ${gameState.clipboard?.nodes.length} items` };
                      });
                  }
                  break;
              case 'f':
                   setGameState(prev => ({ ...prev, mode: 'filter', inputBuffer: '' }));
                   break;
              case 'Z':
                   if (e.shiftKey) setGameState(prev => ({ ...prev, mode: 'zoxide-jump', inputBuffer: '', fuzzySelectedIndex: 0 }));
                   break;
              case 'z':
                   if (!e.shiftKey) setGameState(prev => ({ ...prev, mode: 'fzf-current', inputBuffer: '', fuzzySelectedIndex: 0 }));
                   break;
              case ',':
                   setGameState(prev => ({ ...prev, mode: 'sort' }));
                   break;
          }
  }, []);

  // KEYBOARD HANDLING
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (gameState.isGameOver || gameState.showEpisodeIntro || showSuccess) return;

      if (e.key === 'Escape') {
          if (gameState.showHelp) {
              setGameState(prev => ({ ...prev, showHelp: false }));
              return;
          }
          if (gameState.showHint) {
              setGameState(prev => ({ ...prev, showHint: false }));
              return;
          }
          if (gameState.showInfoPanel) {
              setGameState(prev => ({ ...prev, showInfoPanel: false }));
              return;
          }
          if (gameState.mode !== 'normal') {
              setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
              return;
          }
          setGameState(prev => {
              const currentDir = getNodeByPath(prev.fs, prev.currentPath);
              const hasFilter = currentDir && prev.filters[currentDir.id];
              if (hasFilter) {
                   const newFilters = { ...prev.filters };
                   delete newFilters[currentDir.id];
                   return { ...prev, filters: newFilters };
              }
              if (prev.selectedIds.length > 0) return { ...prev, selectedIds: [] };
              return prev;
          });
          return;
      }

      if (gameState.mode === 'input-file' || gameState.mode === 'filter') {
          if (e.key === 'Enter') {
              if (gameState.mode === 'input-file') {
                   const { fs, error } = createPath(gameState.fs, gameState.currentPath, gameState.inputBuffer);
                   if (error) setGameState(prev => ({ ...prev, notification: error, mode: 'normal', inputBuffer: '' }));
                   else setGameState(prev => ({ ...prev, fs, mode: 'normal', inputBuffer: '', notification: `Created ${gameState.inputBuffer}` }));
              } else if (gameState.mode === 'filter') {
                   setGameState(prev => {
                       const currentDir = getNodeByPath(prev.fs, prev.currentPath);
                       if (currentDir) return { ...prev, filters: { ...prev.filters, [currentDir.id]: prev.inputBuffer }, mode: 'normal', inputBuffer: '', stats: { ...prev.stats, filterUsage: prev.stats.filterUsage + 1 } };
                       return { ...prev, mode: 'normal' };
                   });
              }
              return;
          }
          if (e.key === 'Backspace') {
              setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
              return;
          }
          if (e.key.length === 1) {
              setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
              return;
          }
          return;
      }
      
      if (gameState.mode === 'normal') {
          handleNormalModeKeyDown(e, gameState, setGameState, visibleItems, currentLevel, () => setShowSuccess(false));
      } else if (gameState.mode === 'g-command') {
          if (e.key === 'g') setGameState(prev => ({ ...prev, cursorIndex: 0, mode: 'normal', usedGG: true }));
          else if (e.key === 'r') setGameState(prev => ({ ...prev, currentPath: ['root'], cursorIndex: 0, mode: 'normal' }));
          else setGameState(prev => ({ ...prev, mode: 'normal' }));
      } else if (gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') {
          handleFuzzyModeKeyDown(e, gameState, setGameState);
      }

  }, [gameState, visibleItems, currentLevel, handleNormalModeKeyDown, handleFuzzyModeKeyDown]);

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // RENDER
  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-300 font-sans overflow-hidden select-none">
        
        <LevelProgress 
            levels={LEVELS}
            currentLevelIndex={gameState.levelIndex}
            onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
            onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
        />

        <div className="flex-1 flex min-h-0 relative">
            
            {/* Left: Mission Pane */}
            <MissionPane 
                level={currentLevel} 
                gameState={gameState} 
                onToggleHint={() => setGameState(prev => ({ ...prev, showHint: !prev.showHint }))}
                onToggleHelp={() => setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }))}
            />

            {/* Middle: Active File Pane */}
            <div className="flex-1 flex flex-col relative min-w-0 border-r border-zinc-800">
                
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
                                className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-orange-500"
                                autoFocus
                                readOnly
                            />
                            <div className="w-1.5 h-4 bg-orange-500 animate-pulse" />
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
                 />
            </div>

            {/* Right: Preview Pane */}
            <PreviewPane 
                node={visibleItems[gameState.cursorIndex] || null} 
                level={currentLevel}
            />

            {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
               <FuzzyFinder 
                   gameState={gameState}
                   onClose={() => setGameState(prev => ({ ...prev, mode: 'normal' }))}
                   onSelect={(path, isZoxide) => {
                       if (isZoxide) {
                           const allDirs = getAllDirectories(gameState.fs);
                           const match = allDirs.find(d => d.display === path);
                           if (match) {
                               setGameState(prev => ({
                                   ...prev,
                                   mode: 'normal',
                                   currentPath: match.path,
                                   cursorIndex: 0,
                                   stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 },
                               }));
                           }
                       } else {
                           const candidates = getRecursiveContent(gameState.fs, gameState.currentPath);
                           const match = candidates.find(c => c.display === path);
                           if (match) {
                               const fullPath = [...gameState.currentPath, ...match.path];
                               const targetPath = fullPath.slice(0, -1);
                               
                               setGameState(prev => {
                                   const targetDir = getNodeByPath(prev.fs, targetPath);
                                   if (!targetDir || !targetDir.children) return { ...prev, mode: 'normal' };
                                   
                                   let items = [...targetDir.children];
                                   if (!prev.showHidden) items = items.filter(c => !c.name.startsWith('.'));
                                   const filter = prev.filters[targetDir.id] || '';
                                   if (filter) items = items.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
                                   items = sortNodes(items, prev.sortBy, prev.sortDirection);
                                   
                                   const newIndex = items.findIndex(n => n.id === match.id);
                                   
                                   return { 
                                       ...prev, 
                                       mode: 'normal', 
                                       currentPath: targetPath,
                                       cursorIndex: newIndex >= 0 ? newIndex : 0
                                   };
                               });
                           }
                       }
                   }}
               />
            )}
        </div>

        <StatusBar 
            state={gameState} 
            level={currentLevel}
            allTasksComplete={showSuccess}
            onNextLevel={() => {
                 setGameState(prev => {
                     const nextIdx = prev.levelIndex + 1;
                     return { ...prev, levelIndex: nextIdx, showEpisodeIntro: true };
                 });
                 setShowSuccess(false);
            }}
            currentItem={visibleItems[gameState.cursorIndex] || null}
        />

        {/* Modals */}
        {gameState.showEpisodeIntro && (
            <EpisodeIntro 
                episode={EPISODE_LORE[currentLevel.episodeId - 1]} 
                onComplete={() => setGameState(prev => ({ ...prev, showEpisodeIntro: false }))} 
            />
        )}

        {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
        {gameState.showHint && <HintModal hint={currentLevel.hint} stage={gameState.hintStage} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}
        {gameState.isGameOver && <GameOverModal reason={gameState.gameOverReason || 'time'} onRestart={() => window.location.reload()} efficiencyTip={currentLevel.efficiencyTip} />}

        {showSuccess && (
            <SuccessToast 
                message={currentLevel.successMessage || "Level Complete"} 
                levelTitle={currentLevel.title}
                onDismiss={() => {
                     setGameState(prev => {
                         const nextIdx = prev.levelIndex + 1;
                         return { ...prev, levelIndex: nextIdx, showEpisodeIntro: true };
                     });
                     setShowSuccess(false);
                }}
                onClose={() => setShowSuccess(false)}
            />
        )}

        {gameState.showInfoPanel && <InfoPanel file={visibleItems[gameState.cursorIndex]} onClose={() => setGameState(prev => ({ ...prev, showInfoPanel: false }))} />}

    </div>
  );
};

export default App;
