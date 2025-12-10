import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_FS, LEVELS } from './constants';
import { GameState, Level, FileNode, ClipboardItem } from './types';
import { getNodeByPath, getParentNode, addNode, deleteNode, cloneFS } from './utils/fsHelpers';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { Terminal, Lightbulb, HelpCircle, Target, ArrowRight } from 'lucide-react';

// Sound Effect Helper
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Softer than square
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
    
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
    notification: 'Welcome to Yazi Quest!',
    selectedIds: [],
    showHelp: false,
    showHint: false,
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

  // Level Management
  const handleNextLevel = useCallback(() => {
     if (gameState.levelIndex < LEVELS.length - 1) {
         const nextLevelIdx = gameState.levelIndex + 1;
         const nextLevel = LEVELS[nextLevelIdx];
         
         // Persist current FS state instead of resetting
         let nextFS = gameState.fs;
         
         // Run setup logic if level has specific requirements (e.g. restoring files)
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
             notification: `Level ${nextLevelIdx + 1} Started!`
         }));
         setLevelTasks(nextLevel.tasks);
     }
  }, [gameState.levelIndex, gameState.fs]);
  
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
        setTimeout(() => setRecentlyCompletedId(null), 2500); // Highlight duration
      }
    }
  }, [gameState, levelTasks]);

  // Handle Input Mode (Creating files/dirs)
  const handleInputMode = useCallback((key: string) => {
    if (key === 'Enter') {
        if (!gameState.inputBuffer.trim()) {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
            return;
        }

        const isDir = gameState.inputBuffer.endsWith('/');
        const name = isDir ? gameState.inputBuffer.slice(0, -1) : gameState.inputBuffer;
        
        // Basic validation
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
    if (e.metaKey || e.ctrlKey || e.altKey) return; // Ignore browser shortcuts mostly
    
    // Prevent default scrolling for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
       e.preventDefault();
    }

    // Modal Interaction: Help modal blocks interaction
    if (gameState.showHelp) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         setGameState(prev => ({ ...prev, showHelp: false }));
         return;
      }
      return; // Block other interactions while Help modal is open
    }

    if (gameState.mode !== 'normal') {
        handleInputMode(e.key);
        return;
    }

    // Check for Level Completion shortcut
    if (e.key === 'Enter' && allTasksComplete) {
        handleNextLevel();
        return;
    }

    const itemCount = sortedItems.length;

    switch (e.key) {
      // --- Navigation ---
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
                selectedIds: [] // Clear selection on directory change
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
                selectedIds: [] // Clear selection on directory change
            }));
        }
        break;

      // --- Selection ---
      case ' ': // Space
        if (activeItem) {
          setGameState(prev => {
            const isSelected = prev.selectedIds.includes(activeItem.id);
            const newSelection = isSelected 
              ? prev.selectedIds.filter(id => id !== activeItem.id)
              : [...prev.selectedIds, activeItem.id];
            
            return {
              ...prev,
              selectedIds: newSelection,
              cursorIndex: Math.min(prev.cursorIndex + 1, itemCount - 1) // Auto-advance
            };
          });
        }
        break;
      
      case 'Escape':
        setGameState(prev => ({ ...prev, selectedIds: [], notification: 'Selection Cleared' }));
        break;

      // --- File Operations ---
      case 'd': // Delete (Trash)
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

      case 'y': // Yank (Copy)
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

      case 'x': // Cut
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

      case 'p': // Paste
        if (gameState.clipboard) {
            const { nodes, action, originalPath } = gameState.clipboard;
            
            let nextFS = gameState.fs;
            
            // Loop through all clipboard nodes
            nodes.forEach(node => {
                // If cutting, remove from original location first
                if (action === 'cut') {
                    nextFS = deleteNode(nextFS, originalPath, node.id);
                }

                // Add to current location with new ID to prevent conflicts
                const nodeToPaste = { ...node, id: Math.random().toString(36).substr(2, 9) };
                nextFS = addNode(nextFS, gameState.currentPath, nodeToPaste);
            });

            setGameState(prev => ({
                ...prev,
                fs: nextFS,
                // Clear clipboard if cut, otherwise keep for multiple pastes
                clipboard: action === 'cut' ? null : prev.clipboard, 
                notification: `Pasted ${nodes.length} item(s)`
            }));
        } else {
             setGameState(prev => ({ ...prev, notification: 'Clipboard empty' }));
        }
        break;
      
      case 'a': // Create
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
         // Toggles Hint
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

  // Identify active task index (first incomplete)
  const activeTaskIndex = levelTasks.findIndex(t => !t.completed);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white font-mono overflow-hidden relative">
      {/* Modals */}
      {gameState.showHelp && <HelpModal onClose={() => setGameState(prev => ({ ...prev, showHelp: false }))} />}
      {gameState.showHint && <HintModal hint={currentLevel.hint} onClose={() => setGameState(prev => ({ ...prev, showHint: false }))} />}

      {/* Header / Top Bar (Optional, for game context) */}
      <div className="h-10 bg-zinc-900 border-b border-zinc-700 flex items-center px-4 justify-between z-20 relative">
         <div className="flex items-center gap-2 font-bold text-orange-500">
            <Terminal size={18} />
            <span>YAZI QUEST</span>
         </div>
         <div className="flex items-center gap-4 text-zinc-500 text-sm">
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
      <div className="flex-1 flex overflow-hidden relative">
         
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
         {/* If no parent (root), show placeholder or shift layout. To simplify, we keep structure fixed */}
         {!parentDir && <div className="w-1/4 bg-zinc-900 border-r border-zinc-700"></div>}

         {/* Current Pane (Middle) */}
         <FileSystemPane 
           items={sortedItems} 
           isActive={true} 
           cursorIndex={gameState.cursorIndex} 
           title={currentDir?.name}
           selectedIds={gameState.selectedIds}
         />

         {/* Preview Pane (Right) - Contains Preview AND Quest List */}
         <div className="flex-1 border-l border-zinc-700 flex flex-col h-full bg-zinc-950">
           {/* Preview Section */}
           <div className="flex-1 overflow-hidden relative">
             <PreviewPane node={activeItem || null} />
           </div>

           {/* Current Quest Section */}
           <div className="border-t border-zinc-800 bg-zinc-900/50 flex flex-col h-1/3 min-h-[180px]">
             <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                <h3 className="text-zinc-300 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                    <Target size={14} className="text-orange-500" />
                    Current Objectives
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                    {levelTasks.filter(t => t.completed).length}/{levelTasks.length}
                </span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-3">
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
                                ${isRecentlyCompleted ? 'bg-green-900/30 shadow-[0_0_15px_rgba(34,197,94,0.2)] scale-[1.02]' : ''}
                              `}
                            >
                                <div className={`mt-0.5 min-w-[16px] flex justify-center`}>
                                    {isCompleted && <span className={`font-bold ${isRecentlyCompleted ? 'text-green-300 scale-125 transition-transform' : 'text-green-500'}`}>✓</span>}
                                    {isCurrent && <span className="text-orange-500 animate-pulse">▶</span>}
                                    {isPending && <span className="text-zinc-700">○</span>}
                                </div>
                                <div className={`flex flex-col ${isCompleted ? 'text-zinc-500' : isCurrent ? 'text-white font-medium' : 'text-zinc-500'}`}>
                                    <span className={`${isCompleted ? 'line-through decoration-zinc-700' : ''} ${isRecentlyCompleted ? 'text-green-200' : ''}`}>
                                        {task.description}
                                    </span>
                                    {isCurrent && <span className="text-[10px] text-orange-400/70 font-mono mt-0.5 animate-pulse uppercase tracking-wide">In Progress...</span>}
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
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded shadow-lg shadow-green-900/20 text-xs font-bold uppercase tracking-widest animate-pulse transition-all transform hover:scale-[1.02]"
                    >
                        <span>{gameState.levelIndex < LEVELS.length - 1 ? "Initialize Next Level" : "Trilogy Complete"}</span>
                        <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                             <span>ENTER</span>
                             <ArrowRight size={10} />
                        </div>
                    </button>
                </div>
             )}
           </div>
         </div>

         {/* Input Overlay */}
         {gameState.mode !== 'normal' && (
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-600 p-2 shadow-lg z-30">
                <div className="flex items-center gap-2">
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