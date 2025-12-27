import React, { useState, useEffect, useCallback } from 'react';
import { GameState, FileNode, Level, ClipboardItem, FsError } from '../types';
import { INITIAL_FS, LEVELS, EPISODE_LORE } from '../constants';
import {
  getNodeByPath,
  deleteNode,
  addNode,
  createPath,
  cloneFS,
  isProtected,
  renameNode,
} from '../utils/fsHelpers';
import { sortNodes } from '../utils/sortHelpers';
import { playSuccessSound } from '../utils/sounds';

import { FileSystemPane } from '../components/FileSystemPane';
import { PreviewPane } from '../components/PreviewPane';
import { StatusBar } from '../components/StatusBar';
import { LevelProgress } from '../components/LevelProgress';

import { HelpModal } from '../components/HelpModal';
import { HintModal } from '../components/HintModal';
import { EpisodeIntro } from '../components/EpisodeIntro';
import { GameOverModal } from '../components/GameOverModal';
import { SuccessToast } from '../components/SuccessToast';
import { InfoPanel } from '../components/InfoPanel';
import { GCommandDialog } from '../components/GCommandDialog';

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
    lastAction: null,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const currentLevel = LEVELS[gameState.levelIndex];

  // Calculate visible items for current directory (memoized)
  const visibleItems: FileNode[] = React.useMemo(() => {
    const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
    let items: FileNode[] = [];

    if (currentDir && currentDir.children) {
      items = [...currentDir.children];

      // Filter hidden files
      if (!gameState.showHidden) {
        items = items.filter((c) => !c.name.startsWith('.'));
      }

      // Apply directory filter
      const activeFilter = gameState.filters[currentDir.id] || '';
      if (activeFilter) {
        items = items.filter((c) => c.name.toLowerCase().includes(activeFilter.toLowerCase()));
      }

      // Apply Sort
      items = sortNodes(items, gameState.sortBy, gameState.sortDirection);
    }

    return items;
  }, [
    gameState.fs,
    gameState.currentPath,
    gameState.showHidden,
    gameState.filters,
    gameState.sortBy,
    gameState.sortDirection,
  ]);

  // Ensure cursor is within bounds
  useEffect(() => {
    if (visibleItems.length === 0 && gameState.cursorIndex !== 0) {
      setTimeout(() => setGameState((prev) => ({ ...prev, cursorIndex: 0 })), 0);
    } else if (visibleItems.length > 0 && gameState.cursorIndex >= visibleItems.length) {
      setTimeout(
        () => setGameState((prev) => ({ ...prev, cursorIndex: visibleItems.length - 1 })),
        0
      );
    }
  }, [visibleItems.length, gameState.cursorIndex]);

  // Level Initialization
  useEffect(() => {
    const level = LEVELS[gameState.levelIndex];
    if (level) {
      setTimeout(() => {
        setGameState((prev) => {
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
            lastAction: null,
            notification: `Level ${level.id}: ${level.title}`,
          };
        });
      }, 0);
    }
  }, [gameState.levelIndex]);

  // Timer Logic
  useEffect(() => {
    if (
      gameState.isGameOver ||
      gameState.showEpisodeIntro ||
      showSuccess ||
      gameState.mode !== 'normal'
    )
      return;
    if (gameState.timeLeft === null) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft === null || prev.timeLeft <= 0) {
          clearInterval(timer);
          return { ...prev, isGameOver: true, gameOverReason: 'time', timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameState.isGameOver,
    gameState.showEpisodeIntro,
    showSuccess,
    gameState.mode,
    gameState.timeLeft,
  ]);

  // Helper to evaluate a task's check (supports array of alternative checks)
  const evaluateTaskCheck = (
    check:
      | ((gameState: GameState, level: Level) => boolean)
      | Array<(gameState: GameState, level: Level) => boolean>,
    state: GameState,
    level: Level
  ) => {
    if (Array.isArray(check)) {
      return check.some((fn) => {
        try {
          return fn(state, level);
        } catch (_e) {
          return false;
        }
      });
    }
    try {
      return (check as (s: GameState, l: Level) => boolean)(state, level);
    } catch (_e) {
      return false;
    }
  };

  // Check Level Completion
  useEffect(() => {
    if (gameState.isGameOver || showSuccess) return;

    const level = LEVELS[gameState.levelIndex];
    if (!level) return;

    const allTasksComplete = level.tasks.every((t) => evaluateTaskCheck(t.check, gameState, level));

    // Update task completion status in level object (for UI)
    level.tasks.forEach((t) => {
      t.completed = evaluateTaskCheck(t.check, gameState, level);
    });

    if (allTasksComplete) {
      playSuccessSound(gameState.settings.soundEnabled);
      setTimeout(() => setShowSuccess(true), 0);
    }
  }, [gameState, showSuccess]);

  // KEYBOARD HANDLING
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.isGameOver || gameState.showEpisodeIntro || showSuccess) return;

      // Global Toggles
      if (e.key === 'Escape') {
        if (gameState.showHelp) {
          setGameState((prev) => ({ ...prev, showHelp: false }));
          return;
        }
        if (gameState.showHint) {
          setGameState((prev) => ({ ...prev, showHint: false }));
          return;
        }
        if (gameState.showInfoPanel) {
          setGameState((prev) => ({ ...prev, showInfoPanel: false }));
          return;
        }
        if (gameState.mode !== 'normal') {
          // Exit modes
          setGameState((prev) => {
            return { ...prev, mode: 'normal', inputBuffer: '' };
          });
          return;
        }
        // Clear selection or filter in normal mode
        setGameState((prev) => {
          const currentDir = getNodeByPath(prev.fs, prev.currentPath);
          const hasFilter = currentDir && prev.filters[currentDir.id];

          if (hasFilter) {
            const newFilters = { ...prev.filters };
            delete newFilters[currentDir.id];
            return { ...prev, filters: newFilters };
          }
          if (prev.selectedIds.length > 0) {
            return { ...prev, selectedIds: [] };
          }
          return prev;
        });
        return;
      }

      // Input Modes
      if (gameState.mode === 'input-file' || gameState.mode === 'filter') {
        if (e.key === 'Enter') {
          if (gameState.mode === 'input-file') {
            const isDir = gameState.inputBuffer.endsWith('/');
            // Create file/dir logic
            const { fs, error } = createPath(
              gameState.fs,
              gameState.currentPath,
              gameState.inputBuffer
            );
            if (error) {
              setGameState((prev) => ({
                ...prev,
                notification: error,
                mode: 'normal',
                inputBuffer: '',
              }));
            } else {
              setGameState((prev) => ({
                ...prev,
                fs,
                mode: 'normal',
                inputBuffer: '',
                notification: `Created ${gameState.inputBuffer}`,
                lastAction: { type: isDir ? 'CREATE_DIR' : 'CREATE_FILE', timestamp: Date.now() },
              }));
            }
          } else if (gameState.mode === 'filter') {
            // Apply filter
            setGameState((prev) => {
              const currentDir = getNodeByPath(prev.fs, prev.currentPath);
              if (currentDir) {
                return {
                  ...prev,
                  filters: { ...prev.filters, [currentDir.id]: prev.inputBuffer },
                  mode: 'normal',
                  inputBuffer: '',
                  stats: { ...prev.stats, filterUsage: prev.stats.filterUsage + 1 },
                  lastAction: { type: 'FILTER', timestamp: Date.now() },
                };
              }
              return { ...prev, mode: 'normal' };
            });
          }
          return;
        }
        if (e.key === 'Backspace') {
          setGameState((prev) => ({ ...prev, inputBuffer: prev.inputBuffer.slice(0, -1) }));
          return;
        }
        if (e.key.length === 1) {
          setGameState((prev) => ({ ...prev, inputBuffer: prev.inputBuffer + e.key }));
          return;
        }
        return;
      }

      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setGameState((prev) => ({
          ...prev,
          selectedIds: visibleItems.map((item) => item.id),
          lastAction: { type: 'SELECT_ALL', timestamp: Date.now() },
        }));
        return;
      }

      if (e.shiftKey && (e.key === 'J' || e.key === 'K')) {
        setGameState((prev) => ({
          ...prev,
          lastAction: { type: 'PREVIEW_SCROLL', timestamp: Date.now() },
        }));
        // The actual scroll logic is in PreviewPane, this just records the action
      }

      // Normal Mode Navigation
      if (gameState.mode === 'normal') {
        // Increment keystroke counter for mastery levels
        if (currentLevel.maxKeystrokes) {
          setGameState((prev) => {
            const newCount = prev.keystrokes + 1;
            if (newCount > currentLevel.maxKeystrokes!) {
              return { ...prev, isGameOver: true, gameOverReason: 'keystrokes' };
            }
            return { ...prev, keystrokes: newCount };
          });
        }

        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            setGameState((prev) => ({
              ...prev,
              cursorIndex: Math.min(prev.cursorIndex + 1, visibleItems.length - 1),
            }));
            break;
          case 'k':
          case 'ArrowUp':
            setGameState((prev) => ({ ...prev, cursorIndex: Math.max(prev.cursorIndex - 1, 0) }));
            break;
          case 'h':
          case 'ArrowLeft':
            setGameState((prev) => {
              if (prev.currentPath.length > 1) {
                return { ...prev, currentPath: prev.currentPath.slice(0, -1), cursorIndex: 0 };
              }
              return prev;
            });
            break;
          case 'l':
          case 'ArrowRight':
          case 'Enter': {
            const item = visibleItems[gameState.cursorIndex];
            if (item && (item.type === 'dir' || item.type === 'archive')) {
              setGameState((prev) => ({
                ...prev,
                currentPath: [...prev.currentPath, item.id],
                cursorIndex: 0,
                stats: {
                  ...prev.stats,
                  archivesEntered:
                    item.type === 'archive'
                      ? prev.stats.archivesEntered + 1
                      : prev.stats.archivesEntered,
                },
              }));
            }
            break;
          }
          case 'G': // Shift+g
            setGameState((prev) => ({
              ...prev,
              cursorIndex: visibleItems.length - 1,
              lastAction: { type: 'JUMP_BOTTOM', timestamp: Date.now() },
            }));
            break;
          case 'g':
            setGameState((prev) => ({ ...prev, mode: 'g-command' }));
            break;
          case 'a':
            setGameState((prev) => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
            break;
          case 'd':
            if (gameState.selectedIds.length > 0 || visibleItems[gameState.cursorIndex]) {
              setGameState((prev) => {
                const idsToDelete =
                  prev.selectedIds.length > 0
                    ? prev.selectedIds
                    : [visibleItems[prev.cursorIndex]?.id].filter(Boolean);

                let errorMsg: string | null = null;
                let tempFs = prev.fs;

                for (const id of idsToDelete) {
                  const node = visibleItems.find((n) => n.id === id);
                  if (node) {
                    // Correctly call isProtected before attempting deletion
                    const reason = isProtected(node, LEVELS[prev.levelIndex].id, 'delete'); // use level id for protection checks
                    if (reason) {
                      errorMsg = reason;
                      break;
                    }

                    // Attempt deletion
                    const result = deleteNode(
                      tempFs,
                      prev.currentPath,
                      id,
                      'delete',
                      false,
                      LEVELS[prev.levelIndex].id
                    );
                    if (!result.ok) {
                      errorMsg = `Error: ${(result as { ok: false; error: FsError }).error}`;
                      break;
                    }
                    tempFs = result.value;
                  }
                }

                if (errorMsg) {
                  return { ...prev, notification: errorMsg, selectedIds: [] };
                }

                return {
                  ...prev,
                  fs: tempFs,
                  selectedIds: [],
                  notification: `Deleted ${idsToDelete.length} items`,
                  lastAction: { type: 'DELETE', timestamp: Date.now() },
                };
              });
            }
            break;
          case ' ': // Space
            if (visibleItems[gameState.cursorIndex]) {
              setGameState((prev) => {
                const item = visibleItems[prev.cursorIndex];
                const isSelected = prev.selectedIds.includes(item.id);
                const newSelected = isSelected
                  ? prev.selectedIds.filter((id) => id !== item.id)
                  : [...prev.selectedIds, item.id];
                // Auto advance cursor
                return {
                  ...prev,
                  selectedIds: newSelected,
                  cursorIndex: Math.min(prev.cursorIndex + 1, visibleItems.length - 1),
                };
              });
            }
            break;
          case 'x': // Cut
          case 'y': {
            // Copy
            const action = e.key === 'x' ? 'cut' : 'yank';
            const nodesToClip =
              gameState.selectedIds.length > 0
                ? visibleItems.filter((i) => gameState.selectedIds.includes(i.id))
                : [visibleItems[gameState.cursorIndex]].filter(Boolean);

            if (nodesToClip.length > 0) {
              if (action === 'cut') {
                let errorMsg: string | null = null;
                for (const node of nodesToClip) {
                  const reason = isProtected(node, currentLevel.id, 'cut'); // use current level id for protection checks
                  if (reason) {
                    errorMsg = reason;
                    break;
                  }
                }
                if (errorMsg) {
                  setGameState((prev) => ({ ...prev, notification: errorMsg, selectedIds: [] }));
                  break;
                }
              }

              setGameState((prev) => ({
                ...prev,
                clipboard: { nodes: nodesToClip, action, originalPath: prev.currentPath },
                selectedIds: [],
                notification: `${action === 'cut' ? 'Cut' : 'Yanked'} ${nodesToClip.length} items`,
                lastAction: { type: action === 'cut' ? 'CUT' : 'YANK', timestamp: Date.now() },
              }));
            }
            break;
          }
          case 'p': // Paste
            if (gameState.clipboard) {
              setGameState((prev) => {
                let tempFs = prev.fs;
                const targetPath = prev.currentPath;
                let errorMsg: string | null = null;

                // First, check if target directory is protected
                const parentNode = getNodeByPath(tempFs, targetPath);
                if (parentNode?.protected) {
                  return {
                    ...prev,
                    notification: 'Permission Denied: Cannot paste into protected directory.',
                  };
                }

                for (const node of prev.clipboard.nodes) {
                  if (prev.clipboard?.action === 'cut') {
                    const delResult = deleteNode(
                      tempFs,
                      prev.clipboard.originalPath,
                      node.id,
                      'cut',
                      true,
                      LEVELS[prev.levelIndex].id
                    ); // force delete
                    if (delResult.ok) tempFs = delResult.value;
                  }

                  const nodeToAdd = prev.clipboard?.action === 'yank' ? cloneFS(node) : node;
                  const addResult = addNode(tempFs, targetPath, nodeToAdd);

                  if (!addResult.ok) {
                    errorMsg = `Error: ${(addResult as { ok: false; error: FsError }).error}`;
                    if (prev.clipboard?.action === 'cut') {
                      const rollbackResult = addNode(prev.fs, prev.clipboard.originalPath, node);
                      if (rollbackResult.ok) tempFs = rollbackResult.value;
                    }
                    break;
                  }
                  tempFs = addResult.value;
                }

                if (errorMsg) {
                  return { ...prev, fs: tempFs, notification: errorMsg };
                }

                const notif = `Deployed ${prev.clipboard.nodes.length} assets`;
                const newClipboard = prev.clipboard?.action === 'cut' ? null : prev.clipboard;

                return {
                  ...prev,
                  fs: tempFs,
                  clipboard: newClipboard,
                  notification: notif,
                  lastAction: { type: 'PASTE', timestamp: Date.now() },
                };
              });
            }
            break;
          case 'f': // Filter
            setGameState((prev) => ({ ...prev, mode: 'filter', inputBuffer: '' }));
            break;
          case '?':
            setGameState((prev) => ({ ...prev, showHelp: !prev.showHelp }));
            break;
          case 'Tab':
            setGameState((prev) => ({ ...prev, showInfoPanel: !prev.showInfoPanel }));
            break;
        }
      }

      // Handle G-Command Mode
      if (gameState.mode === 'g-command') {
        if (e.key === 'g') {
          // gg - go to top
          setGameState((prev) => ({
            ...prev,
            cursorIndex: 0,
            mode: 'normal',
            lastAction: { type: 'JUMP_TOP', timestamp: Date.now() },
          }));
        } else {
          setGameState((prev) => ({ ...prev, mode: 'normal' }));
        }
      }
    },
    [gameState, visibleItems, currentLevel, showSuccess]
  );

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
        onToggleHint={() => setGameState((prev) => ({ ...prev, showHint: !prev.showHint }))}
        onToggleHelp={() => setGameState((prev) => ({ ...prev, showHelp: !prev.showHelp }))}
      />

      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Mission Pane */}

        {/* Middle: Active File Pane */}
        <div className="flex-1 flex flex-col relative min-w-0 border-r border-zinc-800">
          {/* Mode Indicators / Input Line */}
          {gameState.mode !== 'normal' &&
            gameState.mode !== 'confirm-delete' &&
            gameState.mode !== 'sort' &&
            gameState.mode !== 'filter' &&
            gameState.mode !== 'g-command' &&
            gameState.mode !== 'overwrite-confirm' &&
            gameState.mode !== 'input-file' && (
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
              {/* Sort options UI placeholder */}
              <div className="text-xs text-zinc-500">Sort options active...</div>
            </div>
          )}

          {/* G-Command Dialog */}
          {gameState.mode === 'g-command' && (
            <GCommandDialog onClose={() => setGameState((prev) => ({ ...prev, mode: 'normal' }))} />
          )}

          {/* Filter Dialog */}
          {gameState.mode === 'filter' && (
            <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                  Filter:
                </span>
                <input
                  type="text"
                  value={gameState.inputBuffer}
                  className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-orange-500"
                  autoFocus
                  readOnly
                />
                <div className="w-1.5 h-4 bg-orange-500 animate-pulse" />
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
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                  Create:
                </span>
                <input
                  type="text"
                  value={gameState.inputBuffer}
                  className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-blue-500"
                  autoFocus
                  readOnly
                />
                <div className="w-1.5 h-4 bg-blue-500 animate-pulse" />
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
          />
        </div>

        {/* Right: Preview Pane */}
        <PreviewPane node={visibleItems[gameState.cursorIndex] || null} level={currentLevel} />
      </div>

      <StatusBar
        state={gameState}
        level={currentLevel}
        allTasksComplete={showSuccess}
        onNextLevel={() => {
          setGameState((prev) => {
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
          onComplete={() => setGameState((prev) => ({ ...prev, showEpisodeIntro: false }))}
        />
      )}

      {gameState.showHelp && (
        <HelpModal onClose={() => setGameState((prev) => ({ ...prev, showHelp: false }))} />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() => setGameState((prev) => ({ ...prev, showHint: false }))}
        />
      )}

      {gameState.isGameOver && (
        <GameOverModal
          reason={gameState.gameOverReason || 'time'}
          onRestart={() => {
            setGameState((prev) => ({
              ...prev,
              isGameOver: false,
              fs: JSON.parse(JSON.stringify(prev.levelStartFS)),
              currentPath: LEVELS[prev.levelIndex].initialPath || prev.currentPath,
              cursorIndex: 0,
              timeLeft: LEVELS[prev.levelIndex].timeLimit || null,
            }));
          }}
          efficiencyTip={currentLevel.efficiencyTip}
        />
      )}

      {showSuccess && (
        <SuccessToast
          message={currentLevel.successMessage || 'Level Complete'}
          levelTitle={currentLevel.title}
          onDismiss={() => {
            setGameState((prev) => {
              const nextIdx = prev.levelIndex + 1;
              return { ...prev, levelIndex: nextIdx, showEpisodeIntro: true };
            });
            setShowSuccess(false);
          }}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={visibleItems[gameState.cursorIndex]}
          onClose={() => setGameState((prev) => ({ ...prev, showInfoPanel: false }))}
        />
      )}
    </div>
  );
};

export default App;
