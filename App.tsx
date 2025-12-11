
import React, { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react';
import { INITIAL_FS, LEVELS, EPISODE_LORE, CONCLUSION_DATA } from './constants';
import { GameState, Level, FileNode, ClipboardItem } from './types';
import { getNodeByPath, getParentNode, addNode, deleteNode, cloneFS, isProtected, createPath, getAllDirectories, renameNode } from './utils/fsHelpers';
import { FileSystemPane } from './components/FileSystemPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { GameOverModal } from './components/GameOverModal';
import { Terminal, Lightbulb, HelpCircle, Target, ArrowRight, ArrowDown } from 'lucide-react';

// Sound Effect Helper
const playSuccessSound = (enabled: boolean) => {
  if (!enabled) return;
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

const playFailureSound = (enabled: boolean) => {
  if (!enabled) return;
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
  // Check for debug flag
  const searchParams = new URLSearchParams(window.location.search);
  const isDebugOutro = searchParams.get('debug') === 'outro';

  // State Initialization
  const [gameState, setGameState] = useState<GameState>(() => {
    let fs = cloneFS(INITIAL_FS);
    let levelIndex = 0;
    
    // Attempt to load level from localStorage (persistence)
    const savedLevel = localStorage.getItem('yazi_quest_level');
    if (savedLevel && !isDebugOutro) {
        const parsed = parseInt(savedLevel, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < LEVELS.length) {
            levelIndex = parsed;
        }
    }

    let currentPath = LEVELS[levelIndex].initialPath;
    let showEpisodeIntro = true;
    let notification = 'Welcome to Yazi Quest!';

    if (isDebugOutro) {
        levelIndex = 16; // Final Level (Index 16 = Level 17)
        currentPath = LEVELS[16].initialPath;
        showEpisodeIntro = false;
        notification = 'DEBUG: OUTRO READY';

        // Modify FS to satisfy Level 17 conditions (Only workspace remains in guest)
        const guestNode = getNodeByPath(fs, ['root', 'home', 'user']);
        if (guestNode && guestNode.children) {
             guestNode.children = guestNode.children.filter(c => c.name === 'workspace');
        }
    }

    // Default settings
    const initialSettings = {
        soundEnabled: true
    };

    return {
        currentPath,
        cursorIndex: 0,
        clipboard: null,
        mode: 'normal',
        inputBuffer: '',
        filter: '',
        history: [],
        levelIndex,
        fs,
        levelStartFS: cloneFS(fs), // Initialize snapshot
        notification,
        selectedIds: [],
        pendingDeleteIds: [],
        showHelp: false,
        showHint: false,
        showEpisodeIntro, 
        timeLeft: LEVELS[levelIndex].timeLimit || null,
        keystrokes: 0,
        isGameOver: false,
        gameOverReason: undefined,
        stats: {
           fuzzyJumps: 0,
           filterUsage: 0,
           renames: 0,
           archivesEntered: 0
        },
        settings: initialSettings
    };
  });

  const [levelTasks, setLevelTasks] = useState(LEVELS[gameState.levelIndex].tasks);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bulkRenameText, setBulkRenameText] = useState("");

  // Persist Level Progress
  useEffect(() => {
    localStorage.setItem('yazi_quest_level', gameState.levelIndex.toString());
  }, [gameState.levelIndex]);

  const currentLevel = LEVELS[gameState.levelIndex];

  // Derived State Helpers (Memoized)
  const currentDir = useMemo(() => getNodeByPath(gameState.fs, gameState.currentPath), [gameState.fs, gameState.currentPath]);
  const parentDir = useMemo(() => getParentNode(gameState.fs, gameState.currentPath), [gameState.fs, gameState.currentPath]);
  const currentItems = useMemo(() => currentDir?.children || [], [currentDir]);
  
  // Use Deferred Value for filter to prevent input lag on large lists (Performance)
  const deferredFilter = useDeferredValue(gameState.filter);

  // Sort and Filter items
  const sortedItems = useMemo(() => {
    return [...currentItems].sort((a, b) => {
        // Sort logic: Dir > Archive > File
        const typeScore = (t: string) => {
            if (t === 'dir') return 0;
            if (t === 'archive') return 1;
            return 2;
        };
        const scoreA = typeScore(a.type);
        const scoreB = typeScore(b.type);
        
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name);
    }).filter(item => {
        if (!deferredFilter) return true;
        return item.name.toLowerCase().includes(deferredFilter.toLowerCase());
    });
  }, [currentItems, deferredFilter]);

  // Calculate fuzzy jump targets (Memoized)
  const allDirectories = useMemo(() => {
      if (gameState.mode !== 'fuzzy-find') return [];
      return getAllDirectories(gameState.fs);
  }, [gameState.fs, gameState.mode]);

  const fuzzyResults = useMemo(() => {
      if (!gameState.inputBuffer) return allDirectories;
      return allDirectories.filter(d => d.display.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
  }, [allDirectories, gameState.inputBuffer]);

  const activeItem = sortedItems[gameState.cursorIndex];
  const allTasksComplete = levelTasks.every(t => t.completed);

  // Determine current Episode Index (0, 1, 2) based on episodeId in level config
  // episodeId is 1-based, array is 0-based
  const episodeIndex = currentLevel ? (currentLevel.episodeId - 1) : 0;
  const activeEpisodeLore = EPISODE_LORE[episodeIndex] || EPISODE_LORE[0];

  // Pre-load video via browser cache (avoids CORS fetch issues)
  useEffect(() => {
    const video = document.createElement('video');
    video.src = CONCLUSION_DATA.videoUrl;
    video.preload = 'auto';
    video.muted = true; // Required for some browsers to buffer without interaction
    video.load(); 
    
    return () => {
        video.src = "";
        video.load();
    };
  }, []);

  // Reset Level Function (Immediate)
  const handleRestartLevel = useCallback(() => {
      const levelConfig = LEVELS[gameState.levelIndex];
      setGameState(prev => ({
          ...prev,
          fs: cloneFS(prev.levelStartFS), 
          currentPath: levelConfig.initialPath,
          cursorIndex: 0,
          notification: "Level Restarted.",
          timeLeft: levelConfig.timeLimit || null,
          keystrokes: 0,
          isGameOver: false,
          gameOverReason: undefined,
          mode: 'normal',
          selectedIds: [],
          pendingDeleteIds: [],
          clipboard: null,
          filter: '',
      }));
      
      setLevelTasks(levelConfig.tasks.map(t => ({...t, completed: false})));
  }, [gameState.levelIndex]); 

  // Timer Logic
  useEffect(() => {
    if (gameState.showEpisodeIntro || gameState.showHelp || gameState.timeLeft === null || allTasksComplete || gameCompleted || gameState.isGameOver) {
      return;
    }

    if (gameState.timeLeft <= 0) {
        setGameState(prev => ({ ...prev, isGameOver: true, gameOverReason: 'time' }));
        playFailureSound(gameState.settings.soundEnabled);
        return;
    }

    const timer = setInterval(() => {
        setGameState(prev => ({
            ...prev,
            timeLeft: prev.timeLeft !== null ? prev.timeLeft - 1 : null
        }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.timeLeft, gameState.showEpisodeIntro, gameState.showHelp, gameState.isGameOver, allTasksComplete, gameCompleted, gameState.settings.soundEnabled]);

  // Keystroke Limit Logic
  useEffect(() => {
    if (currentLevel.maxKeystrokes && gameState.keystrokes > currentLevel.maxKeystrokes && !allTasksComplete && !gameState.showEpisodeIntro && !gameCompleted && !gameState.isGameOver) {
        setGameState(prev => ({ ...prev, isGameOver: true, gameOverReason: 'keystrokes' }));
        playFailureSound(gameState.settings.soundEnabled);
    }
  }, [gameState.keystrokes, currentLevel.maxKeystrokes, allTasksComplete, gameState.showEpisodeIntro, gameCompleted, gameState.isGameOver, gameState.settings.soundEnabled]);


  // Level Management
  const handleNextLevel = useCallback(() => {
     if (gameState.levelIndex < LEVELS.length - 1) {
         const nextLevelIdx = gameState.levelIndex + 1;
         const nextLevel = LEVELS[nextLevelIdx];
         const currentLevel = LEVELS[gameState.levelIndex];
         
         // Episode starts if episodeId changes
         const isEpisodeStart = nextLevel.episodeId !== currentLevel.episodeId;

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
             pendingDeleteIds: [],
             filter: '',
             fs: nextFS,
             levelStartFS: cloneFS(nextFS),
             notification: `Level ${nextLevelIdx + 1} Started!`,
             showEpisodeIntro: isEpisodeStart,
             timeLeft: nextLevel.timeLimit || null,
             keystrokes: 0,
             isGameOver: false,
         }));
         setLevelTasks(nextLevel.tasks);
     } else {
         // Game Completed
         setGameCompleted(true);
     }
  }, [gameState.levelIndex, gameState.fs]);
  
  const handleStartEpisode = () => {
    setGameState(prev => ({ ...prev, showEpisodeIntro: false }));
  };

  // Update Tasks when GameState changes
  useEffect(() => {
    let updated = false;
    let completedTaskId: string | null = null;

    if (gameState.isGameOver) return; // Don't check tasks if failed

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
        playSuccessSound(gameState.settings.soundEnabled);
        setRecentlyCompletedId(completedTaskId);
        setTimeout(() => setRecentlyCompletedId(null), 2500); 
      }
    }
  }, [gameState, levelTasks, gameState.settings.soundEnabled]);

  // Perform Batch Rename
  const executeBatchRename = () => {
      const newNames = bulkRenameText.split('\n');
      const targets = gameState.selectedIds.length > 0 
          ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
          : activeItem ? [activeItem] : [];

      if (newNames.length !== targets.length) {
          setGameState(prev => ({ ...prev, notification: `Error: Line count mismatch (${newNames.length} vs ${targets.length})` }));
          playFailureSound(gameState.settings.soundEnabled);
          return;
      }

      let nextFS = gameState.fs;
      targets.forEach((node, idx) => {
         const newName = newNames[idx].trim();
         if (newName && newName !== node.name) {
             nextFS = renameNode(nextFS, gameState.currentPath, node.id, newName);
         }
      });

      setGameState(prev => ({
          ...prev,
          fs: nextFS,
          mode: 'normal',
          selectedIds: [],
          notification: `Renamed ${targets.length} item(s)`,
          stats: { ...prev.stats, renames: prev.stats.renames + targets.length }
      }));
  };

  // Handle Input Mode 
  const handleInputMode = useCallback((key: string) => {
    if (gameState.mode === 'filter') {
        if (key === 'Escape' || key === 'Enter') {
             setGameState(prev => ({ ...prev, mode: 'normal' }));
        } else if (key === 'Backspace') {
             setGameState(prev => ({ ...prev, filter: prev.filter.slice(0, -1), cursorIndex: 0 }));
        } else if (key.length === 1) {
             setGameState(prev => ({ ...prev, filter: prev.filter + key, cursorIndex: 0 }));
        }
        return;
    }

    if (gameState.mode === 'fuzzy-find') {
        if (key === 'Escape') {
             setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
        } else if (key === 'Enter') {
             // Jump to first result
             if (fuzzyResults.length > 0) {
                 setGameState(prev => ({ 
                     ...prev, 
                     mode: 'normal', 
                     currentPath: fuzzyResults[0].path,
                     inputBuffer: '',
                     notification: `Jumped to ${fuzzyResults[0].display}`,
                     stats: { ...prev.stats, fuzzyJumps: prev.stats.fuzzyJumps + 1 }
                 }));
             }
        } else if (key === 'Backspace') {
             setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
        } else if (key.length === 1) {
             setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
        }
        return;
    }

    if (gameState.mode === 'rename') {
        if (key === 'Enter') {
            const target = activeItem;
            if (target && gameState.inputBuffer.trim()) {
                const newFS = renameNode(gameState.fs, gameState.currentPath, target.id, gameState.inputBuffer.trim());
                setGameState(prev => ({
                    ...prev,
                    fs: newFS,
                    mode: 'normal',
                    inputBuffer: '',
                    notification: `Renamed to ${prev.inputBuffer}`,
                    stats: { ...prev.stats, renames: prev.stats.renames + 1 }
                }));
            } else {
                setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
            }
        } else if (key === 'Escape') {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
        } else if (key === 'Backspace') {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
        } else if (key.length === 1) {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
        }
        return;
    }

    if (gameState.mode === 'go') {
        if (key === 'Escape') {
            setGameState(prev => ({ ...prev, mode: 'normal' }));
            return;
        }

        switch(key) {
            case 'h': // Home
                setGameState(prev => ({
                    ...prev,
                    currentPath: ['root', 'home', 'user'],
                    cursorIndex: 0,
                    mode: 'normal',
                    notification: 'Navigated to Home'
                }));
                break;
            case 'd': // Downloads / Incoming
                setGameState(prev => ({
                    ...prev,
                    currentPath: ['root', 'home', 'user', 'downloads'],
                    cursorIndex: 0,
                    mode: 'normal',
                    notification: 'Navigated to Downloads'
                }));
                break;
            case 'c': // Config
                setGameState(prev => ({
                    ...prev,
                    currentPath: ['root', 'home', 'user', 'config'],
                    cursorIndex: 0,
                    mode: 'normal',
                    notification: 'Navigated to Config'
                }));
                break;
             case '/': // Root
                setGameState(prev => ({
                    ...prev,
                    currentPath: ['root'],
                    cursorIndex: 0,
                    mode: 'normal',
                    notification: 'Navigated to Root'
                }));
                break;
            case ' ': // Interactive
                 setGameState(prev => ({
                    ...prev,
                    mode: 'cd-interactive',
                    inputBuffer: '',
                    notification: 'Jump Interactively'
                }));
                break;
            default:
                // Unknown key in go mode resets
                setGameState(prev => ({ ...prev, mode: 'normal' }));
        }
        return;
    }

     if (gameState.mode === 'cd-interactive') {
        if (key === 'Enter') {
            if (!gameState.inputBuffer.trim()) {
                setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
                return;
            }
            
            // Try to change directory (simple path jump, supports jumping to immediate children or root absolute)
            const pathStr = gameState.inputBuffer.trim();
            if (pathStr === '~') {
                 setGameState(prev => ({
                    ...prev,
                    currentPath: ['root', 'home', 'user'],
                    cursorIndex: 0,
                    mode: 'normal',
                    inputBuffer: '',
                    notification: 'Jumped to Home'
                }));
                return;
            }
            
            // Check current children for match
            const target = sortedItems.find(i => i.name === pathStr && i.type === 'dir');
            if (target) {
                 setGameState(prev => ({
                    ...prev,
                    currentPath: [...prev.currentPath, target.id],
                    cursorIndex: 0,
                    mode: 'normal',
                    inputBuffer: '',
                    notification: `Jumped to ${pathStr}`
                }));
            } else {
                 setGameState(prev => ({
                    ...prev,
                    mode: 'normal',
                    inputBuffer: '',
                    notification: 'Directory not found'
                }));
                playFailureSound(gameState.settings.soundEnabled);
            }

        } else if (key === 'Escape') {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
        } else if (key === 'Backspace') {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
        } else if (key.length === 1) {
            setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
        }
        return;
    }

    if (key === 'Enter') {
        if (!gameState.inputBuffer.trim()) {
            setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
            return;
        }

        // Use new createPath for recursive creation support
        const { fs: newFS, error } = createPath(gameState.fs, gameState.currentPath, gameState.inputBuffer);

        if (error) {
           setGameState(prev => ({
                ...prev,
                mode: 'normal',
                inputBuffer: '',
                notification: error
            }));
            playFailureSound(gameState.settings.soundEnabled);
        } else {
            setGameState(prev => ({
                ...prev,
                fs: newFS,
                mode: 'normal',
                inputBuffer: '',
                notification: `Created: ${gameState.inputBuffer}`
            }));
        }

    } else if (key === 'Escape') {
        setGameState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
    } else if (key === 'Backspace') {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
    } else if (key.length === 1) {
        setGameState(prev => ({ ...prev, inputBuffer: prev.inputBuffer + key }));
    }
  }, [gameState, fuzzyResults, activeItem, sortedItems, gameState.settings.soundEnabled]);

  // Main Key Handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Stop propagation if we are in bulk rename mode using the textarea
    if (gameState.mode === 'bulk-rename') return;

    // Shift+Z handling
    if (e.key === 'Z' && e.shiftKey) {
        e.preventDefault();
        setGameState(prev => ({
            ...prev,
            mode: 'fuzzy-find',
            inputBuffer: '',
            notification: 'Fuzzy Find Directory'
        }));
        return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return; 
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
       e.preventDefault();
    }
    
    if (gameState.showEpisodeIntro || gameCompleted || gameState.isGameOver) return;

    if (gameState.showHelp) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         setGameState(prev => ({ ...prev, showHelp: false }));
         return;
      }
      return; 
    }

    if (e.key.length === 1 || ['Enter', 'Backspace', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         setGameState(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
    }

    if (gameState.mode === 'confirm-delete') {
        if (e.key.toLowerCase() === 'y' || e.key === 'Enter') {
            // EXECUTE DELETE
            let newFS = gameState.fs;
            gameState.pendingDeleteIds.forEach(id => {
                newFS = deleteNode(newFS, gameState.currentPath, id);
            });
            const deletedCount = gameState.pendingDeleteIds.length;
            
            // Re-calculate derived items to find new cursor index
            // We need to look at what remains.
            const newDir = getNodeByPath(newFS, gameState.currentPath);
            const newChildren = newDir?.children || [];
            
            // Keep cursor in bounds
            const newIndex = Math.max(0, Math.min(gameState.cursorIndex, newChildren.length - 1));

            setGameState(prev => ({
                ...prev,
                fs: newFS,
                mode: 'normal',
                pendingDeleteIds: [],
                selectedIds: [],
                cursorIndex: newIndex, 
                notification: `Deleted ${deletedCount} item(s)`
            }));
        } else {
             // CANCEL
             setGameState(prev => ({
                ...prev,
                mode: 'normal',
                pendingDeleteIds: [],
                notification: 'Deletion Cancelled'
            }));
        }
        return;
    }

    if (gameState.mode !== 'normal') {
        handleInputMode(e.key);
        return;
    }

    // Only Shift+Enter allows shortcut, otherwise use UI button
    if (e.key === 'Enter' && e.shiftKey && allTasksComplete) {
        handleNextLevel();
        return;
    }

    const itemCount = sortedItems.length;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        setGameState(prev => ({
          ...prev,
          cursorIndex: Math.min(prev.cursorIndex + 1, Math.max(0, itemCount - 1))
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
                selectedIds: [],
                filter: '' // Clear filter on parent nav
            }));
        }
        break;
      case 'l':
      case 'ArrowRight':
      case 'Enter':
        // Modified: Allow entering if type is dir or archive
        if (activeItem && (activeItem.type === 'dir' || activeItem.type === 'archive' || (activeItem.children && activeItem.children.length > 0))) {
            const isArchive = activeItem.type === 'archive';
            setGameState(prev => ({
                ...prev,
                currentPath: [...prev.currentPath, activeItem.id],
                cursorIndex: 0,
                selectedIds: [],
                filter: '', // Clear filter on child nav
                stats: { 
                   ...prev.stats, 
                   archivesEntered: isArchive ? prev.stats.archivesEntered + 1 : prev.stats.archivesEntered 
                }
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
              cursorIndex: Math.min(prev.cursorIndex + 1, Math.max(0, itemCount - 1)) 
            };
          });
        }
        break;
      
      case 'Escape':
        setGameState(prev => ({ ...prev, selectedIds: [], filter: '', notification: 'Selection & Filter Cleared' }));
        break;

      case 'f':
        setGameState(prev => ({
            ...prev,
            mode: 'filter',
            filter: '', // Reset filter when starting new filter mode? Or keep? Yazi resets usually.
            notification: 'Fuzzy Filter Active'
        }));
        break;

      case 'g':
        setGameState(prev => ({
            ...prev,
            mode: 'go',
            notification: 'Go Mode'
        }));
        break;

      case 'r':
        {
           const targets = gameState.selectedIds.length > 0 
              ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
              : activeItem ? [activeItem] : [];
            
           if (targets.length > 0) {
               // PROTECTION CHECK
               for (const t of targets) {
                  const error = isProtected(t, gameState.levelIndex, 'rename');
                  if (error) {
                      setGameState(prev => ({ ...prev, notification: `DENIED: ${error}` }));
                      playFailureSound(gameState.settings.soundEnabled);
                      return;
                  }
               }
               
               if (targets.length === 1) {
                   setGameState(prev => ({
                       ...prev,
                       mode: 'rename',
                       inputBuffer: targets[0].name,
                       notification: 'Rename File'
                   }));
               } else {
                   // Bulk Rename Mode
                   setBulkRenameText(targets.map(t => t.name).join('\n'));
                   setGameState(prev => ({
                       ...prev,
                       mode: 'bulk-rename',
                       notification: 'Bulk Rename (Edit Buffer)'
                   }));
               }
           }
        }
        break;

      case 'd': 
        {
          const targets = gameState.selectedIds.length > 0 
            ? sortedItems.filter(i => gameState.selectedIds.includes(i.id))
            : activeItem ? [activeItem] : [];

          if (targets.length > 0) {
              // PROTECTION CHECK
              for (const t of targets) {
                  const error = isProtected(t, gameState.levelIndex, 'delete');
                  if (error) {
                      setGameState(prev => ({ ...prev, notification: `DENIED: ${error}` }));
                      playFailureSound(gameState.settings.soundEnabled);
                      return;
                  }
              }

              // Trigger Confirmation Mode
              setGameState(prev => ({
                  ...prev,
                  mode: 'confirm-delete',
                  pendingDeleteIds: targets.map(t => t.id),
                  notification: 'Confirm Deletion?'
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
                  notification: `COPIED ${targets.length} item(s). Press 'p' to paste.`
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
              // PROTECTION CHECK
              for (const t of targets) {
                  const error = isProtected(t, gameState.levelIndex, 'cut');
                  if (error) {
                      setGameState(prev => ({ ...prev, notification: `DENIED: ${error}` }));
                      playFailureSound(gameState.settings.soundEnabled);
                      return;
                  }
              }

              setGameState(prev => ({
                  ...prev,
                  clipboard: { nodes: targets, action: 'cut', originalPath: prev.currentPath },
                  selectedIds: [],
                  notification: `CUT ${targets.length} item(s). Press 'p' to move.`
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
                notification: action === 'cut' ? `MOVED ${nodes.length} item(s)` : `PASTED ${nodes.length} item(s)`
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
            notification: 'Enter path (end with / for dir):'
        }));
        break;

      case '?': 
         setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
         break;

      case 'H':
         setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
         break;

      case 'm':
         setGameState(prev => ({ 
             ...prev, 
             settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
             notification: `Sound ${!prev.settings.soundEnabled ? 'Enabled' : 'Disabled'}`
         }));
         break;
    }
  }, [gameState, sortedItems, activeItem, handleInputMode, allTasksComplete, handleNextLevel, gameCompleted]);

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
      {gameState.showEpisodeIntro && !gameCompleted && (
        <EpisodeIntro episode={activeEpisodeLore} onComplete={handleStartEpisode} />
      )}

      {/* Game Completed Outro */}
      {gameCompleted && <OutroSequence />}

      {/* Game Over Modal */}
      {gameState.isGameOver && gameState.gameOverReason && (
        <GameOverModal 
            reason={gameState.gameOverReason} 
            onRestart={handleRestartLevel} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {gameState.mode === 'confirm-delete' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="border border-purple-500 bg-zinc-900 shadow-2xl min-w-[300px] max-w-lg">
                <div className="border-b border-purple-500 text-purple-400 font-bold px-4 py-1 text-center relative">
                    <span className="bg-zinc-900 px-2 relative z-10">
                        Trash {gameState.pendingDeleteIds.length} selected {gameState.pendingDeleteIds.length === 1 ? 'file' : 'files'}?
                    </span>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-purple-500 -z-0"></div>
                </div>
                <div className="p-6">
                    <ul className="text-zinc-300 text-sm space-y-1 overflow-hidden max-h-32">
                        {gameState.pendingDeleteIds.slice(0, 3).map(id => {
                            const item = sortedItems.find(i => i.id === id);
                            return (
                                <li key={id} className="truncate">
                                    {/* Mock full path for aesthetic */}
                                    <span className="opacity-50">.../</span>
                                    {item?.name || 'unknown'}
                                </li>
                            );
                        })}
                        {gameState.pendingDeleteIds.length > 3 && (
                            <li className="text-zinc-500 italic">...and {gameState.pendingDeleteIds.length - 3} more</li>
                        )}
                    </ul>
                </div>
                <div className="border-t border-purple-500 bg-zinc-900 px-4 py-1 flex justify-between text-sm font-bold">
                    <span className="text-white bg-white/10 px-1">[Y]es</span>
                    <span className="text-zinc-500">(N)o</span>
                </div>
            </div>
        </div>
      )}

      {/* Fuzzy Find Overlay (Shift+Z) */}
      {gameState.mode === 'fuzzy-find' && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm">
            <div className="w-[600px] bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col max-h-[70vh]">
                <div className="p-3 border-b border-zinc-700 bg-zinc-800 flex items-center gap-2">
                    <span className="text-red-500 font-bold">Z &gt;</span>
                    <span className="text-white animate-pulse">_</span>
                    <span className="text-zinc-300">{gameState.inputBuffer}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {fuzzyResults.length === 0 ? (
                        <div className="text-zinc-600 italic p-2">No directories found</div>
                    ) : (
                        fuzzyResults.slice(0, 10).map((item, idx) => (
                            <div key={item.path.join('-')} className={`px-2 py-1 font-mono text-sm ${idx === 0 ? 'bg-red-900/30 text-red-200 border-l-2 border-red-500' : 'text-zinc-400'}`}>
                                {item.display}
                            </div>
                        ))
                    )}
                    {fuzzyResults.length > 10 && (
                        <div className="text-zinc-600 text-xs px-2 pt-1">... {fuzzyResults.length - 10} more</div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Vim-Like Bulk Rename Buffer */}
      {gameState.mode === 'bulk-rename' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-4xl h-[600px] bg-[#1e1e1e] border border-zinc-600 shadow-2xl flex flex-col font-mono text-sm relative">
                  {/* Buffer Status Bar (Top) */}
                  <div className="bg-[#2d2d2d] px-4 py-1 flex justify-between items-center text-zinc-400 border-b border-zinc-700 select-none">
                      <span className="flex items-center gap-2">
                          <span className="text-orange-400 font-bold">buffer</span>
                          <span className="text-zinc-500">typecraft_rename_buffer.tmp</span>
                      </span>
                  </div>

                  <div className="flex flex-1 overflow-hidden relative">
                      {/* Line Numbers Gutter */}
                      <div className="w-12 bg-[#1e1e1e] border-r border-zinc-700 text-zinc-500 text-right pr-3 pt-4 select-none leading-[1.5rem] font-mono">
                          {bulkRenameText.split('\n').map((_, i) => (
                              <div key={i}>{i + 1}</div>
                          ))}
                          {/* Add extra tildes for empty space vim feel */}
                          {Array.from({ length: Math.max(0, 20 - bulkRenameText.split('\n').length) }).map((_, i) => (
                              <div key={`empty-${i}`} className="text-blue-900">~</div>
                          ))}
                      </div>

                      {/* Text Editor Area */}
                      <textarea 
                        autoFocus
                        className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] p-0 pl-3 pt-4 outline-none resize-none leading-[1.5rem] font-mono border-none"
                        value={bulkRenameText}
                        spellCheck={false}
                        onChange={(e) => setBulkRenameText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                executeBatchRename();
                            }
                            if (e.key === 'Escape') {
                                setGameState(prev => ({ ...prev, mode: 'normal', notification: 'Rename Cancelled' }));
                            }
                        }}
                      />
                  </div>

                  {/* Vim Status Bar (Bottom) */}
                  <div className="bg-[#007acc] text-white px-2 py-1 flex justify-between items-center text-xs font-bold select-none">
                      <div className="flex gap-4">
                        <span>NORMAL</span>
                        <span>master</span>
                      </div>
                      <div className="flex gap-4">
                          <span>utf-8</span>
                          <span>shell</span>
                          <span>Save: Ctrl+Enter</span>
                          <span>Cancel: Esc</span>
                      </div>
                  </div>
              </div>
          </div>
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
              clipboard={gameState.clipboard}
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
           clipboard={gameState.clipboard}
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
             {allTasksComplete && !gameCompleted && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                    <button
                        onClick={handleNextLevel}
                        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white py-1.5 px-4 rounded shadow-lg shadow-green-900/20 text-[10px] font-bold uppercase tracking-widest animate-pulse transition-all transform hover:scale-[1.01]"
                    >
                        <span>Initialize Next Level [Shift+Enter]</span>
                        <ArrowRight size={10} />
                    </button>
                </div>
             )}
             
             {/* Final Level Footer */}
             {allTasksComplete && gameCompleted && (
                 <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm text-center text-xs text-green-500 font-bold uppercase animate-pulse">
                     Sequence Complete
                 </div>
             )}
           </div>
         </div>

         {/* Input Overlay */}
         {(gameState.mode === 'input-file' || gameState.mode === 'input-dir' || gameState.mode === 'rename' || gameState.mode === 'cd-interactive') && (
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-600 p-2 shadow-lg z-30 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-orange-500 font-bold">
                        {gameState.mode === 'rename' ? 'Rename:' : gameState.mode === 'cd-interactive' ? 'Jump to:' : 'Create:'}
                    </span>
                    <span className="text-white">{gameState.inputBuffer}</span>
                    <span className="w-2 h-4 bg-zinc-400 animate-pulse"></span>
                </div>
            </div>
         )}

         {/* Filter Overlay */}
         {gameState.mode === 'filter' && (
            <div className="absolute bottom-6 left-1/3 w-1/3 bg-zinc-800/90 border border-zinc-600 p-2 shadow-lg z-30 animate-in slide-in-from-bottom-2 duration-200 rounded-lg">
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-yellow-500 font-bold">Filter:</span>
                    <span className="text-white">{gameState.filter}</span>
                    <span className="w-2 h-4 bg-zinc-400 animate-pulse"></span>
                </div>
            </div>
         )}

         {/* Go Mode Overlay */}
         {gameState.mode === 'go' && (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-zinc-900/90 backdrop-blur border-t border-zinc-700 p-2 flex justify-between items-center text-xs font-mono animate-in slide-in-from-bottom-2 duration-150">
               <div className="flex gap-8 px-4 text-zinc-400">
                  <div className="flex flex-col gap-1">
                      <span className="text-white font-bold"><span className="text-orange-500">h</span> &rarr; Go to home</span>
                      <span className="text-white font-bold"><span className="text-orange-500">D</span> &rarr; Go to dotfiles (config)</span>
                      <span className="text-white font-bold"><span className="text-orange-500">/</span> &rarr; Go to root</span>
                  </div>
                  <div className="flex flex-col gap-1">
                      <span className="text-white font-bold"><span className="text-orange-500">c</span> &rarr; Go to config</span>
                      <span className="text-white font-bold"><span className="text-orange-500">d</span> &rarr; Go to downloads</span>
                      <span className="text-white font-bold"><span className="text-orange-500">&lt;Space&gt;</span> &rarr; Jump interactively</span>
                  </div>
               </div>
               <div className="px-4 text-zinc-600 uppercase font-bold tracking-widest">
                   GO MODE
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
