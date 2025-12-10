import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_FS, LEVELS } from './constants';
import { GameState, Level, FileNode, ClipboardItem } from './types';
import { getNodeByPath, getParentNode, addNode, deleteNode, cloneFS } from './utils/fsHelpers';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { Terminal } from 'lucide-react';

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
  });

  const [levelTasks, setLevelTasks] = useState(LEVELS[0].tasks);
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
  
  // Update Tasks when GameState changes
  useEffect(() => {
    let updated = false;
    const newTasks = levelTasks.map(task => {
      if (!task.completed && task.check(gameState)) {
        updated = true;
        return { ...task, completed: true };
      }
      return task;
    });

    if (updated) {
      setLevelTasks(newTasks);
      setGameState(prev => ({
        ...prev,
        notification: "Task Completed! Great job."
      }));
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

    if (gameState.mode !== 'normal') {
        handleInputMode(e.key);
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
            // Find index of current folder in parent to maintain relative position roughly (simplified: reset to 0)
            setGameState(prev => ({
                ...prev,
                currentPath: prev.currentPath.slice(0, -1),
                cursorIndex: 0 
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
                cursorIndex: 0
            }));
        }
        break;

      // --- File Operations ---
      case 'd': // Delete (Trash)
        if (activeItem) {
            const newFS = deleteNode(gameState.fs, gameState.currentPath, activeItem.id);
            setGameState(prev => ({
                ...prev,
                fs: newFS,
                cursorIndex: Math.min(prev.cursorIndex, Math.max(0, itemCount - 2)),
                notification: `Moved ${activeItem.name} to trash`
            }));
        }
        break;

      case 'y': // Yank (Copy)
        if (activeItem) {
            setGameState(prev => ({
                ...prev,
                clipboard: { node: activeItem, action: 'yank', originalPath: prev.currentPath },
                notification: `Yanked ${activeItem.name}`
            }));
        }
        break;

      case 'x': // Cut
        if (activeItem) {
            setGameState(prev => ({
                ...prev,
                clipboard: { node: activeItem, action: 'cut', originalPath: prev.currentPath },
                notification: `Cut ${activeItem.name}`
            }));
        }
        break;

      case 'p': // Paste
        if (gameState.clipboard) {
            const { node, action, originalPath } = gameState.clipboard;
            
            // Logic for pasting
            let nextFS = gameState.fs;
            
            // If cutting, remove from original location first
            if (action === 'cut') {
                 // Check if we are pasting into the same folder we cut from (no-op or handled by logic)
                 // But wait, removing it changes the tree structure.
                 // We need to remove it from original path.
                 nextFS = deleteNode(nextFS, originalPath, node.id);
            }

            // Add to current location. If ID conflict, simplistic handling (new ID)
            const nodeToPaste = { ...node, id: Math.random().toString(36).substr(2, 9) };
            nextFS = addNode(nextFS, gameState.currentPath, nodeToPaste);

            setGameState(prev => ({
                ...prev,
                fs: nextFS,
                clipboard: action === 'cut' ? null : prev.clipboard, // Clear clipboard if cut
                notification: `Pasted ${node.name}`
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

      case '?': // Help (Next Level for demo purposes)
         setGameState(prev => ({ ...prev, notification: "Keys: j/k/h/l (Nav), d (Del), x (Cut), y (Copy), p (Paste), a (Create)"}));
         break;
    }
  }, [gameState, sortedItems, activeItem, handleInputMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // Level Management
  const allTasksComplete = levelTasks.every(t => t.completed);
  const handleNextLevel = () => {
     if (gameState.levelIndex < LEVELS.length - 1) {
         const nextLevelIdx = gameState.levelIndex + 1;
         setGameState(prev => ({
             ...prev,
             levelIndex: nextLevelIdx,
             currentPath: LEVELS[nextLevelIdx].initialPath,
             cursorIndex: 0,
             clipboard: null,
             fs: cloneFS(INITIAL_FS), // Reset FS for new level or keep? Let's reset for clean slate.
             notification: `Level ${nextLevelIdx + 1} Started!`
         }));
         setLevelTasks(LEVELS[nextLevelIdx].tasks);
     }
  };


  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white font-mono overflow-hidden">
      {/* Header / Top Bar (Optional, for game context) */}
      <div className="h-10 bg-zinc-900 border-b border-zinc-700 flex items-center px-4 justify-between">
         <div className="flex items-center gap-2 font-bold text-orange-500">
            <Terminal size={18} />
            <span>YAZI QUEST</span>
         </div>
         <div className="text-zinc-500 text-sm">
            {allTasksComplete && (
                <button 
                  onClick={handleNextLevel}
                  className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs animate-pulse"
                >
                    {gameState.levelIndex < LEVELS.length - 1 ? "NEXT LEVEL [Enter]" : "QUEST COMPLETE"}
                </button>
            )}
         </div>
      </div>

      {/* Main 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden relative">
         
         {/* Parent Pane (Left) */}
         {parentDir && parentDir.children && (
            <FileSystemPane 
              items={parentDir.children || []} 
              isActive={false} 
              isParent={true}
              title={parentDir.name}
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
         />

         {/* Preview Pane (Right) */}
         <div className="flex-1 border-l border-zinc-700">
           <PreviewPane node={activeItem || null} />
         </div>

         {/* Input Overlay */}
         {gameState.mode !== 'normal' && (
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-600 p-2 shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">Create:</span>
                    <span className="text-white">{gameState.inputBuffer}</span>
                    <span className="w-2 h-4 bg-zinc-400 animate-pulse"></span>
                </div>
            </div>
         )}
      </div>
      
      {/* Tasks Overlay (Floating) */}
      <div className="absolute top-14 right-4 w-64 bg-zinc-900/90 border border-zinc-700 p-4 rounded shadow-xl backdrop-blur-sm">
         <h3 className="text-zinc-400 text-xs uppercase font-bold mb-2 tracking-wider">Objectives</h3>
         <ul className="space-y-2">
            {levelTasks.map(task => (
                <li key={task.id} className={`text-sm flex items-start gap-2 ${task.completed ? 'text-green-500 line-through opacity-50' : 'text-zinc-300'}`}>
                    <span>{task.completed ? '✓' : '○'}</span>
                    <span>{task.description}</span>
                </li>
            ))}
         </ul>
      </div>

      {/* Status Bar */}
      <StatusBar state={gameState} level={currentLevel} allTasksComplete={allTasksComplete} />
    </div>
  );
};

export default App;
