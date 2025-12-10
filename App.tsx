import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_FS, LEVELS, EPISODE_LORE } from './constants';
import { GameState, Level, FileNode, ClipboardItem } from './types';
import { getNodeByPath, getParentNode, addNode, deleteNode, cloneFS } from './utils/fsHelpers';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { Terminal, Lightbulb, HelpCircle, Target, ArrowRight } from 'lucide-react';

// Sound Effect Helper
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const playFailureSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// Main App Component
const App: React.FC = () => {
  // State Initialization
  const [gameState, setGameState] = useState<GameState>({
    currentPath: LEVELS[0].initialPath,
    cursorIndex: 0,
    clipboard: null,
    mode: 'normal',
    inputBuffer: '',
    history: [],
    levelIndex: 0,
    fs: cloneFS(INITIAL_FS),
    levelStartFS: cloneFS(INITIAL_FS), // Initialize snapshot
    notification: 'Welcome to Yazi Quest!',
    selectedIds: [],
    showHelp: false,
    showHint: false,
    showEpisodeIntro: true, // Start with Episode 1 Intro
    timeLeft: null,
    keystrokes: 0,
  });

  const [levelTasks, setLevelTasks] = useState(LEVELS[0].tasks);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);

  const currentLevel = LEVELS[gameState.levelIndex];

  // Derived State Helpers
  const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
  const parentDir = getParentNode(gameState.fs, gameState.currentPath);
  const currentItems = currentDir?.children || [];
  
  // Sort items: folders first, then files
  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  const activeItem = sortedItems[gameState.cursorIndex];
  const allTasksComplete = levelTasks.every(t => t.completed);

  // Determine current Episode Index (0, 1, 2)
  const episodeIndex = Math.min(Math.floor(gameState.levelIndex / 5), 2);
  const activeEpisodeLore = EPISODE_LORE[episodeIndex];

  // Helper to reset level on failure
  const resetLevel = useCallback(() => {
        playFailureSound();
        setGameState(prev => ({
            ...prev,
            timeLeft: null, 
            notification: "SYSTEM FAILURE! RESETTING LEVEL...",
            mode: 'normal',
            selectedIds: [],
            clipboard: null
        }));

        setTimeout(() => {
            const levelConfig = LEVELS[gameState.levelIndex];
            setGameState(prev => ({
                ...prev,
                fs: cloneFS(prev.levelStartFS), 
                currentPath: levelConfig.initialPath,
                cursorIndex: 0,
                notification: "Level Reset. Try Again.",
                timeLeft: levelConfig.timeLimit || null,
                keystrokes: 0
            }));
            
            setLevelTasks(levelConfig.tasks.map(t => ({...t, completed: false})));
        }, 2000);
  }, [gameState.levelIndex]);

  // Timer Logic
  useEffect(() => {
    if (gameState.showEpisodeIntro || gameState.showHelp || gameState.timeLeft === null || allTasksComplete) {
      return;
    }

    if (gameState.timeLeft <= 0) {
        resetLevel();
        return;
    }

    const timer = setInterval(() => {
        setGameState(prev => ({
            ...prev,
            timeLeft: prev.timeLeft !== null ? prev.timeLeft - 1 : null
        }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.timeLeft, gameState.showEpisodeIntro, gameState.showHelp, allTasksComplete, resetLevel]);

  // Keystroke Limit Logic
  useEffect(() => {
    if (currentLevel.maxKeystrokes && gameState.keystrokes > currentLevel.maxKeystrokes && !allTasksComplete && !gameState.showEpisodeIntro) {
        resetLevel();
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, allTasksComplete, gameState.showEpisodeIntro, resetLevel]);


  // Level Management
  const handleNextLevel = useCallback(() => {
     if (gameState.levelIndex < LEVELS.length - 1) {
         const nextLevelIdx = gameState.levelIndex + 1;
         const nextLevel = LEVELS[nextLevelIdx];
         
         const isEpisodeStart = nextLevelIdx === 5 || nextLevelIdx === 10;

         let nextFS = gameState.fs;
         if (nextLevel.onEnter) {
            nextFS = nextLevel.onEnter(nextFS);
         }

         setGameState(prev => ({
             ...prev,
             levelIndex: nextLevelIdx,
             currentPath: nextLevel.initialPath,
             cursorIndex: 0,
             clipboard: null,
             selectedIds: [],
             fs: nextFS,
             levelStartFS: cloneFS(nextFS),
             notification: `Level ${nextLevelIdx + 1} Started!`,
             showEpisodeIntro: isEpisodeStart,
             timeLeft: nextLevel.timeLimit || null,
             keystrokes: 0
         }));
         setLevelTasks(nextLevel.tasks);
     }
  }, [gameState.levelIndex, gameState.fs]);
  
  const handleStartEpisode = () => {
    setGameState(prev => ({ ...prev, showEpisodeIntro: false }));
  };

  // Update Tasks when GameState changes
  useEffect(() => {
    let updated = false;
    let completedTaskId: string | null = null;

    const newTasks = levelTasks.map(task => {
      if (!task.completed && task.check(gameState)) {
        updated = true;
        completedTaskId = task.id;
        return { ...task, completed: true };
      }
      return task;
    });

    if (updated) {
      setLevelTasks(newTasks);
      setGameState(prev => ({
        ...prev,
        notification: "Objective Complete."
      }));
      
      if (completedTaskId) {
        playSuccessSound();
        setRecentlyCompletedId(completedTaskId);
        setTimeout(() => setRecentlyCompletedId(null), 2500); 
      }
    }
  }, [gameState, levelTasks]);

  // Handle Input Mode 
  const handleInputMode = useCallback((key: string) => {
    // Only count 'Enter' as a meaningful keystroke in input mode for mastery tracking,
    // plus the individual typing.
    // However, to keep it simple and fair for Mastery, we count every keypress.
    // We handle the increment in the main listener.

    if (key === 'Enter') {
        if (!gameState.inputBuffer.trim()) {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
            return;
        }

        const isDir = gameState.inputBuffer.endsWith('/');
        const name = isDir ? gameState.inputBuffer.slice(0, -1) : gameState.inputBuffer;
        
        if (!name) {
             setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
             return;
        }

        const newNode: FileNode = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            type: isDir ? 'dir' : 'file',
            content: isDir ? undefined : '',
            children: isDir ? [] : undefined
        };

        const newFS = addNode(gameState.fs, gameState.currentPath, newNode);

        setGameState(prev => ({
            ...prev,
            fs: newFS,
            mode: 'normal',
            inputBuffer: '',
            notification: `Created ${isDir ? 'directory' : 'file'}: ${name}`
        }));

    } else if (key === 'Escape') {
        setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
    } else if (key === 'Backspace') {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
    } else if (key.length === 1) {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
    }
  }, [gameState]);

  // Main Key Handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; 
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
       e.preventDefault();
    }
    
    if (gameState.showEpisodeIntro) return;

    if (gameState.showHelp) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         setGameState(prev => ({ ...prev, showHelp: false }));
         return;
      }
      return; 
    }

    // Increment keystrokes for any valid action
    // Ignoring modifiers (which we returned early for above, but Shift might exist)
    // We ignore Shift/Tab/Caps if they slip through, but generally sticking to chars.
    if (e.key.length === 1 || ['Enter', 'Backspace', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         setGameState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
    }

    if (gameState.mode !== 'normal') {
        handleInputMode(e.key);
        return;
    }

    if (e.key === 'Enter' && allTasksComplete) {
        handleNextLevel();
        return;
    }

    const itemCount = sortedItems.length;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        setGameState(prev => ({
          ...prev,
          cursorIndex: Math.min(prev.cursorIndex + 1, itemCount - 1)
        }));
        break;
      case 'k':
      case 'ArrowUp':
        setGameState(prev => ({
          ...prev,
          cursorIndex: Math.max(prev.cursorIndex - 1, 0)
        }));
        break;
      case 'h':
      case 'ArrowLeft':
        if (gameState.currentPath.length > 1) {
            setGameState(prev => ({
                ...prev,
                currentPath: prev.currentPath.slice(0, -1),
                cursorIndex: 0,
                selectedIds: [] 
            }));
        }
        break;
      case 'l':
      case 'ArrowRight':
      case 'Enter':
        if (activeItem && activeItem.type === 'dir') {
            setGameState(prev => ({
                ...prev,
                currentPath: [...prev.currentPath, activeItem.id],
                cursorIndex: 0,
                selectedIds: [] 
            }));
        }
        break;

      case ' ': 
        if (activeItem) {
          setGameState(prev => {
            const isSelected = prev.selectedIds.includes(activeItem.id);
            const newSelection = isSelected 
              ? prev.selectedIds.filter(id => id !== activeItem.id)
              : [...prev.selectedIds, activeItem.id];
            
            return {
              ...prev,
              selectedIds: newSelection,
              cursorIndex: Math.min(prev.cursorIndex + 1, itemCount - 1) 
            };
          });
        }
        break;
      
      case 'Escape':
        setGameState(prev => ({ ...prev, selectedIds: [], notification: 'Selection Cleared' }));
        break;

      case 'd': 
        {
          const targets = gameState.selectedIds.length > 0 
            ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
            : activeItem ? [activeItem] : [];

          if (targets.length > 0) {
              let newFS = gameState.fs;
              targets.forEach(t => {
                 newFS = deleteNode(newFS, gameState.currentPath, t.id);
              });

              setGameState(prev => ({
                  ...prev,
                  fs: newFS,
                  cursorIndex: Math.min(prev.cursorIndex, Math.max(0, itemCount - targets.length - 1)),
                  selectedIds: [],
                  notification: `Deleted ${targets.length} item(s)`
              }));
          }
        }
        break;

      case 'y': 
        {
          const targets = gameState.selectedIds.length > 0 
            ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
            : activeItem ? [activeItem] : [];

          if (targets.length > 0) {
              setGameState(prev => ({
                  ...prev,
                  clipboard: { nodes: targets, action: 'yank', originalPath: prev.currentPath },
                  selectedIds: [],
                  notification: `Yanked ${targets.length} item(s)`
              }));
          }
        }
        break;

      case 'x': 
        {
           const targets = gameState.selectedIds.length > 0 
            ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
            : activeItem ? [activeItem] : [];

           if (targets.length > 0) {
              setGameState(prev => ({
                  ...prev,
                  clipboard: { nodes: targets, action: 'cut', originalPath: prev.currentPath },
                  selectedIds: [],
                  notification: `Cut ${targets.length} item(s)`
              }));
           }
        }
        break;

      case 'p': 
        if (gameState.clipboard) {
            const { nodes, action, originalPath } = gameState.clipboard;
            let nextFS = gameState.fs;
            nodes.forEach(node => {
                if (action === 'cut') {
                    nextFS = deleteNode(nextFS, originalPath, node.id);
                }
                const nodeToPaste = { ...node, id: Math.random().toString(36).substr(2, 9) };
                nextFS = addNode(nextFS, gameState.currentPath, nodeToPaste);
            });

            setGameState(prev => ({
                ...prev,
                fs: nextFS,
                clipboard: action === 'cut' ? null : prev.clipboard, 
                notification: `Pasted ${nodes.length} item(s)`
            }));
        } else {
             setGameState(prev => ({ ...prev, notification: 'Clipboard empty' }));
        }
        break;
      
      case 'a': 
        setGameState(prev => ({
            ...prev,
            mode: 'input-file',
            inputBuffer: '',
            notification: 'Enter filename (end with / for dir):'
        }));
        break;

      case '?': 
         setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
         break;

      case 'H':
         setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
         break;
    }
  }, [gameState, sortedItems, activeItem, handleInputMode, allTasksComplete, handleNextLevel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  const toggleHint = () => {
      setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
  };

  const toggleHelp = () => {
      setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
  }

  const activeTaskIndex = levelTasks.findIndex(t => !t.completed);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white font-mono overflow-hidden relative selection:bg-orange-500/30">
      
      {/* Background Ambience - Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black pointer-events-none z-0"></div>

      {/* Episode Intro Overlay */}
      {gameState.showEpisodeIntro && (
        <EpisodeIntro episode={activeEpisodeLore} onComplete={handleStartEpisode} />
      )}

      {/* Modals */}
      {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
      {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}

      {/* Header */}
      <div className="h-10 bg-zinc-950/80 border-b border-zinc-800 flex items-center px-4 justify-between z-20 relative backdrop-blur-md">
         <div className="flex items-center gap-2 font-bold text-orange-500 tracking-wider">
            <Terminal size={18} />
            <span>YAZI QUEST</span>
         </div>
         <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold">
             <button
               onClick={toggleHint}
               className={`flex items-center gap-1 hover:text-yellow-400 transition-colors ${gameState.showHint ? 'text-yellow-400' : ''}`}
               title="Toggle Hint (Shift+H)"
             >
                <Lightbulb size={14} />
                <span>HINT [H]</span>
             </button>

             <button
               onClick={toggleHelp}
               className="flex items-center gap-1 hover:text-blue-400 transition-colors"
               title="Show Help (?)"
             >
                <HelpCircle size={14} />
                <span>HELP [?]</span>
             </button>
         </div>
      </div>

      {/* Quest Progress Map */}
      <LevelProgress levels={LEVELS} currentLevelIndex={gameState.levelIndex} />

      {/* Main 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
         
         {/* Parent Pane (Left) */}
         {parentDir && parentDir.children && (
            <FileSystemPane 
              items={parentDir.children || []} 
              isActive={false} 
              isParent={true}
              title={parentDir.name}
              selectedIds={[]}
            />
         )}
         {/* Root placeholder */}
         {!parentDir && <div className="w-1/4 bg-zinc-950/50 border-r border-zinc-800 backdrop-blur-sm"></div>}

         {/* Current Pane (Middle) */}
         <FileSystemPane 
           items={sortedItems} 
           isActive={true} 
           cursorIndex={gameState.cursorIndex} 
           title={currentDir?.name}
           selectedIds={gameState.selectedIds}
         />

         {/* Preview Pane (Right) */}
         <div className="flex-1 border-l border-zinc-800 flex flex-col h-full bg-zinc-950/90 backdrop-blur-md">
           <div className="flex-1 overflow-hidden relative">
             <PreviewPane node={activeItem || null} />
           </div>

           {/* Current Quest Section */}
           <div className="border-t border-zinc-800 bg-zinc-900/50 flex flex-col h-1/3 min-h-[180px]">
             <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                <h3 className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-2">
                    <Target size={12} className="text-orange-500" />
                    Current Objectives
                </h3>
                <span className="text-[10px] text-zinc-600 font-mono">
                    {levelTasks.filter(t => t.completed).length}/{levelTasks.length}
                </span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                <ul className="space-y-2">
                    {levelTasks.map((task, idx) => {
                        const isCurrent = idx === activeTaskIndex;
                        const isCompleted = task.completed;
                        const isPending = !isCompleted && !isCurrent;
                        const isRecentlyCompleted = task.id === recentlyCompletedId;
                        
                        return (
                            <li 
                              key={task.id} 
                              className={`
                                text-sm flex items-start gap-3 transition-all duration-300 p-1 rounded
                                ${isCurrent ? 'translate-x-1' : ''}
                                ${isRecentlyCompleted ? 'bg-green-900/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : ''}
                              `}
                            >
                                <div className={`mt-0.5 min-w-[16px] flex justify-center`}>
                                    {isCompleted && <span className={`font-bold ${isRecentlyCompleted ? 'text-green-300 scale-125' : 'text-green-600'}`}>✓</span>}
                                    {isCurrent && <span className="text-orange-500 animate-pulse text-[10px]">▶</span>}
                                    {isPending && <span className="text-zinc-700 text-[10px]">○</span>}
                                </div>
                                <div className={`flex flex-col ${isCompleted ? 'text-zinc-600' : isCurrent ? 'text-zinc-200 font-medium' : 'text-zinc-600'}`}>
                                    <span className={`${isCompleted ? 'line-through decoration-zinc-800' : ''} ${isRecentlyCompleted ? 'text-green-200' : ''}`}>
                                        {task.description}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
             </div>

             {/* Footer with Next Level Button */}
             {allTasksComplete && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                    <button
                        onClick={handleNextLevel}
                        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white py-1.5 px-4 rounded shadow-lg shadow-green-900/20 text-[10px] font-bold uppercase tracking-widest animate-pulse transition-all transform hover:scale-[1.01]"
                    >
                        <span>Initialize Next Level</span>
                        <ArrowRight size={10} />
                    </button>
                </div>
             )}
           </div>
         </div>

         {/* Input Overlay */}
         {gameState.mode !== 'normal' && (
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-600 p-2 shadow-lg z-30 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-orange-500 font-bold">Create:</span>
                    <span className="text-white">{gameState.inputBuffer}</span>
                    <span className="w-2 h-4 bg-zinc-400 animate-pulse"></span>
                </div>
            </div>
         )}
      </div>
      
      {/* Status Bar */}
      <StatusBar state={gameState} level={currentLevel} allTasksComplete={allTasksComplete} />
    </div>
  );
};

export default App;