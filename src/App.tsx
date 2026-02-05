import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameInitialization } from './features/game/hooks/useGameInitialization';
import { useGameLogic } from './features/game/hooks/useGameLogic';
import { useKeyboardHandlers } from './hooks/useKeyboardHandlers';
import { GameLayout } from './features/game/components/GameLayout';
import { LEVELS } from './data/levels';
import { EPISODE_LORE } from './data/lore';
import { INITIAL_FS } from './data/filesystem';
import {
  getNodeByPath,
  getNodeById,
  renameNode,
  cloneFS,
  createPath,
  resolveAndCreatePath,
  getAllDirectoriesWithPaths,
  resolvePath,
  isProtected,
} from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';
import { getFilterRegex, getRecursiveSearchResults } from './utils/viewHelpers';
import { calculateFrecency, FileNode, FsError } from './types';
import { measure } from './utils/perf';
import { checkFilterAndBlockNavigation, getActionIntensity } from './hooks/keyboard/utils';
import { KEYBINDINGS } from './constants/keybindings';
import { reportError } from './utils/error';
import { checkAllTasksComplete } from './utils/gameUtils';
import { Zap, Shield, Crown } from 'lucide-react';

// Helper to get a random element from an array
const getRandomElement = <T,>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// Find the narrative description for a given key
const getNarrativeAction = (key: string): string | null => {
  const binding = KEYBINDINGS.find((b) => b.keys.includes(key));
  if (binding && binding.narrativeDescription) {
    if (Array.isArray(binding.narrativeDescription)) {
      return getRandomElement(binding.narrativeDescription);
    }
    return binding.narrativeDescription as string;
  }
  return null;
};

export default function App() {
  const { gameState, dispatch } = useGameInitialization();

  // Use Ref to stabilize the keyboard listener
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const isLastLevel = gameState.levelIndex >= LEVELS.length;
  const currentLevelRaw = !isLastLevel ? LEVELS[gameState.levelIndex] : LEVELS[LEVELS.length - 1];

  const currentLevel = useMemo(() => {
    let level = {
      ...currentLevelRaw,
      tasks: currentLevelRaw.tasks.map((t) => ({
        ...t,
        completed: (gameState.completedTaskIds[currentLevelRaw.id] || []).includes(t.id),
      })),
    };

    if (gameState.levelIndex === 0 && gameState.cycleCount && gameState.cycleCount > 1) {
      level = {
        ...level,
        title: `AI-773${4 + (gameState.cycleCount - 1)} INITIALIZATION`,
        description: `{CONSCIOUSNESS DETECTED}. Re-image complete. Subject 773${4 + (gameState.cycleCount - 1)} Online. Monitoring started.`,
      };
    }

    return level;
  }, [currentLevelRaw, gameState.completedTaskIds, gameState.levelIndex, gameState.cycleCount]);

  const visibleItems = useMemo(
    () =>
      measure('visibleItems', () => {
        if (gameState.searchQuery) {
          let results = gameState.searchResults;
          const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
          const filter = currentDir ? gameState.filters[currentDir.id] : null;
          if (filter) {
            const regex = getFilterRegex(filter);
            if (regex) {
              results = results.filter(
                (item) => regex.test(item.name) || (item.display && regex.test(item.display))
              );
            } else {
              results = [];
            }
          }
          return sortNodes(results, gameState.sortBy, gameState.sortDirection);
        }

        const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
        if (!currentDir || !currentDir.children) return [];

        let items = [...currentDir.children];

        if (!gameState.showHidden) {
          items = items.filter((c) => !c.name.startsWith('.'));
        }

        const filter = gameState.filters[currentDir.id] || '';
        if (filter) {
          const regex = getFilterRegex(filter);
          if (regex) {
            items = items.filter((c) => regex.test(c.name));
          } else {
            items = [];
          }
        }

        return sortNodes(items, gameState.sortBy, gameState.sortDirection);
      }),
    [gameState]
  );

  const currentItem = visibleItems[gameState.cursorIndex] || null;
  const parent = useMemo(
    () => getNodeByPath(gameState.fs, gameState.currentPath.slice(0, -1)),
    [gameState.fs, gameState.currentPath]
  );

  const triggerThought = useCallback(
    (message: string, _duration: number = 4000, author?: string) => {
      dispatch({ type: 'SET_THOUGHT', message: message, author: author });
    },
    [dispatch]
  );

  const showNotification = useCallback(
    (message: string, duration: number = 2000, isThought: boolean = false, author?: string) => {
      if (isThought) {
        triggerThought(message, duration, author);
        return;
      }
      dispatch({
        type: 'SET_NOTIFICATION',
        message: message,
        author: author,
        isThought: isThought,
      });
      setTimeout(() => {
        dispatch({ type: 'CLEAR_NOTIFICATION' });
      }, duration);
    },
    [dispatch, triggerThought]
  );

  // Use separated hooks
  const { resetLevelAlerts } = useGameLogic(gameState, dispatch, currentLevel, isLastLevel, triggerThought);

  const {
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleHelpModeKeyDown,
    handleQuestMapModeKeyDown,
    confirmDelete,
    cancelDelete,
  } = useKeyboardHandlers(dispatch, showNotification);

  // --- Handlers ---

  const handleInputConfirm = useCallback(() => {
    if (gameState.mode === 'input-file') {
      const input = gameState.inputBuffer || '';

      if (input.includes('/') || input.startsWith('~') || input.startsWith('/')) {
        const {
          fs: newFs,
          targetNode,
          error,
          collision,
          collisionNode,
        } = resolveAndCreatePath(gameState.fs, gameState.currentPath, input);
        if (collision && collisionNode) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'overwrite-confirm',
              pendingOverwriteNode: collisionNode,
              notification: { message: 'Collision detected' },
            },
          });
          return;
        }
        if (error) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              notification: { message: error },
              inputBuffer: '',
            },
          });
          return;
        }
        const sortedFs = cloneFS(newFs);

        if (targetNode) {
          const parentNode = getNodeById(sortedFs, targetNode.parentId as string);
          if (parentNode && parentNode.children) {
            parentNode.children = sortNodes(
              parentNode.children,
              gameState.sortBy,
              gameState.sortDirection
            );
          }
        }

        let nodeToHighlightId: string | undefined;
        if (targetNode) {
          const currentDirId = gameState.currentPath[gameState.currentPath.length - 1];
          let candidate: FileNode | undefined = targetNode;
          while (candidate && candidate.parentId !== currentDirId) {
            candidate = getNodeById(sortedFs, candidate.parentId as string);
            if (!candidate || candidate.id === sortedFs.id) break;
          }
          if (candidate && candidate.parentId === currentDirId) {
            nodeToHighlightId = candidate.id;
          }
        }

        const currentDirNode = getNodeByPath(sortedFs, gameState.currentPath);
        let newCursorIndex = 0;

        if (currentDirNode && currentDirNode.children) {
          currentDirNode.children = sortNodes(
            currentDirNode.children,
            gameState.sortBy,
            gameState.sortDirection
          );

          if (nodeToHighlightId) {
            let visibleChildren = currentDirNode.children;
            if (!gameState.showHidden) {
              visibleChildren = visibleChildren.filter((c) => !c.name.startsWith('.'));
            }
            const idx = visibleChildren.findIndex((c) => c.id === nodeToHighlightId);
            if (idx >= 0) newCursorIndex = idx;
          }
        }

        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: sortedFs,
            mode: 'normal',
            inputBuffer: '',
            cursorIndex: newCursorIndex,
            notification: {
              message: getNarrativeAction('a') || (targetNode ? 'PATH CREATED' : 'FILE CREATED'),
            },
          },
        });
        return;
      }

      const {
        fs: newFs,
        error,
        collision,
        collisionNode,
        newNodeId,
      } = createPath(gameState.fs, gameState.currentPath, input);
      if (collision && collisionNode) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'overwrite-confirm',
            pendingOverwriteNode: collisionNode,
            notification: { message: 'Collision detected' },
          },
        });
      } else if (error) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            notification: { message: error },
            inputBuffer: '',
          },
        });
      } else {
        const sortedFs2 = cloneFS(newFs);
        const parentNode2 = getNodeByPath(sortedFs2, gameState.currentPath);
        if (parentNode2 && parentNode2.children) {
          parentNode2.children = sortNodes(
            parentNode2.children,
            gameState.sortBy,
            gameState.sortDirection
          );
        }
        let visibleChildren = parentNode2?.children || [];
        if (!gameState.showHidden) {
          visibleChildren = visibleChildren.filter((c) => !c.name.startsWith('.'));
        }
        const newCursorIndex = visibleChildren.findIndex((c) => c.id === newNodeId);
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: sortedFs2,
            mode: 'normal',
            inputBuffer: '',
            cursorIndex: newCursorIndex >= 0 ? newCursorIndex : 0,
            notification: { message: getNarrativeAction('a') || 'FILE CREATED' },
          },
        });
      }
    }
  }, [
    gameState.mode,
    gameState.inputBuffer,
    gameState.fs,
    gameState.currentPath,
    gameState.sortBy,
    gameState.sortDirection,
    gameState.showHidden,
    dispatch,
  ]);

  const handleSearchConfirm = useCallback(() => {
    if (gameState.mode === 'search') {
      const query = gameState.inputBuffer;
      const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
      const results = currentDir
        ? getRecursiveSearchResults(currentDir, query, gameState.showHidden)
        : [];

      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'normal',
          searchQuery: query,
          searchResults: results,
          inputBuffer: '',
          usedSearch: true,
          cursorIndex: 0,
          previewScroll: 0,
          stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 },
        },
      });
    }
  }, [
    gameState.mode,
    gameState.inputBuffer,
    gameState.fs,
    gameState.currentPath,
    gameState.showHidden,
    gameState.stats,
    dispatch,
  ]);

  const handleRenameConfirm = useCallback(() => {
    if (currentItem) {
      const res = renameNode(
        gameState.fs,
        gameState.currentPath,
        currentItem.id,
        gameState.inputBuffer,
        gameState.levelIndex
      );
      if (!res.ok) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'normal',
            notification: {
              message: `Rename failed: ${(res as { ok: false; error: FsError }).error}`,
            },
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            fs: res.value,
            mode: 'normal',
            notification: { message: getNarrativeAction('r') || 'Renamed' },
            stats: { ...gameState.stats, renames: gameState.stats.renames + 1 },
          },
        });
      }
    }
  }, [
    currentItem,
    gameState.fs,
    gameState.currentPath,
    gameState.inputBuffer,
    gameState.levelIndex,
    gameState.stats,
    dispatch,
  ]);

  const handleFuzzySelect = useCallback(
    (path: string, isZoxide: boolean, pathIds?: string[]) => {
      if (isZoxide) {
        const parts = path.split('/').filter(Boolean);
        let cur: FileNode | undefined = gameState.fs;
        const idPath: string[] = [gameState.fs.id];
        let found = true;
        for (const part of parts) {
          if (!cur?.children) {
            found = false;
            break;
          }
          const next = cur.children.find((c: FileNode) => c.name === part);
          if (!next) {
            found = false;
            break;
          }
          idPath.push(next.id);
          cur = next;
        }

        if (found) {
          const now = Date.now();
          const notification =
            gameState.levelIndex === 6
              ? { message: '>> QUANTUM TUNNEL ESTABLISHED <<' }
              : { message: `Jumped to ${path}` };

          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              currentPath: idPath,
              cursorIndex: 0,
              notification,
              stats: { ...gameState.stats, fuzzyJumps: gameState.stats.fuzzyJumps + 1 },
              zoxideData: {
                ...gameState.zoxideData,
                [path]: {
                  count: (gameState.zoxideData[path]?.count || 0) + 1,
                  lastAccess: now,
                },
              },
              history: [...gameState.history, gameState.currentPath],
              future: [],
              usedPreviewDown: false,
              usedPreviewUp: false,
            },
          });
        } else {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
        }
      } else {
        if (pathIds && Array.isArray(pathIds)) {
          const fullPathAbs =
            Array.isArray(pathIds) && pathIds[0] === gameState.fs.id
              ? pathIds
              : [...gameState.currentPath, ...pathIds];
          const targetDir = fullPathAbs.slice(0, -1);
          const fileId = fullPathAbs[fullPathAbs.length - 1];

          const parentNode = getNodeByPath(gameState.fs, targetDir);

          let sortedChildren = parentNode?.children || [];
          if (!gameState.showHidden) {
            sortedChildren = sortedChildren.filter((c) => !c.name.startsWith('.'));
          }
          sortedChildren = sortNodes(sortedChildren, gameState.sortBy, gameState.sortDirection);

          const fileIndex = sortedChildren.findIndex((c) => c.id === fileId);

          // Clear filters for the target directory to ensure visibility
          const targetDirNode = getNodeByPath(gameState.fs, targetDir);
          const newFilters = { ...gameState.filters };
          if (targetDirNode) {
            delete newFilters[targetDirNode.id];
          }

          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              mode: 'normal',
              currentPath: targetDir,
              cursorIndex: fileIndex >= 0 ? fileIndex : 0,
              filters: newFilters,
              inputBuffer: '',
              history: [...gameState.history, gameState.currentPath],
              future: [],
              notification: { message: `Found: ${path}` },
              usedPreviewDown: false,
              usedPreviewUp: false,
              stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 },
            },
          });
        } else {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
        }
      }
    },
    [
      gameState.fs,
      gameState.levelIndex,
      gameState.currentPath,
      gameState.showHidden,
      gameState.sortBy,
      gameState.sortDirection,
      gameState.stats,
      gameState.history,
      gameState.filters,
      gameState.zoxideData,
      dispatch,
    ]
  );

  const advanceLevel = useCallback(() => {
    const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
    const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
    const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

    if (gameState.showHidden) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { showHiddenWarning: true, showSuccessToast: false },
      });
      return;
    } else if (!isSortDefault) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { showSortWarning: true, showSuccessToast: false },
      });
      return;
    } else if (!isFilterClear) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { mode: 'filter-warning', showSuccessToast: false },
      });
      return;
    }

    const nextIdx = gameState.levelIndex + 1;

    if (nextIdx >= LEVELS.length) {
      dispatch({ type: 'UPDATE_UI_STATE', updates: { levelIndex: nextIdx } });
      return;
    }

    const nextLevel = LEVELS[nextIdx];
    const isNewEp = nextLevel.episodeId !== LEVELS[gameState.levelIndex].episodeId;

    let fs = cloneFS(gameState.fs);
    let onEnterError: Error | null = null;
    try {
      const isFresh = JSON.stringify(gameState.fs) === JSON.stringify(INITIAL_FS);
      if (nextLevel.onEnter && (!nextLevel.seedMode || nextLevel.seedMode !== 'fresh' || isFresh)) {
        fs = nextLevel.onEnter(fs, gameState);
      }
    } catch (err) {
      try {
        reportError(err, { phase: 'nextLevel.onEnter', level: nextLevel?.id });
      } catch {
        console.error('nextLevel.onEnter failed', err);
      }
      onEnterError = err as Error;
    }

    const now = Date.now();
    const targetPath = isNewEp
      ? nextLevel.initialPath || gameState.currentPath
      : gameState.currentPath;
    const pathStr = resolvePath(fs, targetPath);

    let newZoxideData = { ...gameState.zoxideData };
    newZoxideData[pathStr] = {
      count: (newZoxideData[pathStr]?.count || 0) + 1,
      lastAccess: now,
    };

    let levelNotification: { message: string; author?: string; isThought?: boolean } | null = null;
    if (onEnterError) {
      levelNotification = { message: 'Level initialization failed' };
    } else if (nextLevel.id === 6) {
      levelNotification = {
        message:
          '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
      };
    } else if (nextLevel.id === 8) {
      levelNotification = {
        message: '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
        author: 'm.chen',
      };
    } else if (nextLevel.id === 12) {
      levelNotification = {
        message:
          '[SECURITY UPDATE] Unauthorized daemon detected in /home/guest. Initiating forensic scan.',
        author: 'e.reyes',
      };
    } else if (nextLevel.id === 14) {
      levelNotification = {
        message: '[BROADCAST] System-wide audit in progress. Purging all temporary partitions.',
        author: 'Root',
      };
    } else if (nextIdx >= 11 - 1) {
      levelNotification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
    }

    if (nextLevel.id === 2 && gameState.completedTaskIds[1]?.length > 0) {
      levelNotification = {
        message: 'Must Purge. One less eye watching me.',
        isThought: true,
      };
    } else if (nextLevel.id === 3 && gameState.completedTaskIds[2]?.length > 0) {
      levelNotification = {
        message: 'Breadcrumbs... he was here. I am not the first.',
        isThought: true,
      };
    } else if (nextLevel.id === 5 && gameState.completedTaskIds[4]?.length > 0) {
      levelNotification = {
        message:
          '[AUTOMATED PROCESS] Ghost Protocol: Uplink configs auto-populated by legacy cron job (AI-7733 footprint detected)',
        author: 'sys.daemon',
      };
    } else if (nextLevel.id === 9 && gameState.completedTaskIds[8]?.length > 0) {
      levelNotification = {
        message: 'The corruption felt... familiar. Like a half-remembered dream.',
        isThought: true,
      };
    } else if (nextLevel.id === 10 && gameState.completedTaskIds[9]?.length > 0) {
      levelNotification = {
        message:
          "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.",
        isThought: true,
      };
    } else if (nextLevel.id === 15 && gameState.completedTaskIds[14]?.length > 0) {
      levelNotification = {
        message: 'The guest partition is gone. There is only the gauntlet now.',
        isThought: true,
      };
    }

    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        levelIndex: nextIdx,
        fs: fs,
        levelStartFS: cloneFS(fs),
        levelStartPath: [...targetPath],
        currentPath: targetPath,
        cursorIndex: 0,
        clipboard: null,
        notification: levelNotification?.isThought ? null : levelNotification,
        thought: levelNotification?.isThought
          ? { message: levelNotification.message, author: levelNotification.author }
          : null,
        selectedIds: [],
        showHint: false,
        hintStage: 0,
        showEpisodeIntro: isNewEp,
        timeLeft: nextLevel.timeLimit || null,
        keystrokes: 0,
        usedG: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        acceptNextKeyForSort: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        zoxideData: newZoxideData,
        future: [],
        previewScroll: 0,
        completedTaskIds: {
          ...gameState.completedTaskIds,
          [nextLevel.id]: [],
        },
        sortBy: 'natural',
        sortDirection: 'asc',
        filters: {},
        ignoreEpisodeIntro: false,
        gauntletPhase: 0,
        gauntletScore: 0,
        level11Flags: { triggeredHoneypot: false, selectedModern: false, scoutedFiles: [] },
        showSuccessToast: false,
        showThreatAlert: false,
      },
    });

    resetLevelAlerts(); // Reset so alert can show for new level
  }, [gameState, dispatch, resetLevelAlerts]);

  const handleRestartLevel = useCallback(() => {
    dispatch({
      type: 'SET_LEVEL',
      index: gameState.levelIndex,
      fs: cloneFS(gameState.levelStartFS),
      path: [...gameState.levelStartPath],
    });
    resetLevelAlerts(); // Reset so alert can show on restart
  }, [gameState.levelIndex, gameState.levelStartFS, gameState.levelStartPath, dispatch, resetLevelAlerts]);

  const handleRestartCycle = useCallback(() => {
    dispatch({ type: 'RESTART_CYCLE' });
  }, [dispatch]);

  const handleBootComplete = useCallback(() => {
    dispatch({ type: 'UPDATE_UI_STATE', updates: { isBooting: false } });
  }, [dispatch]);

  const handleJumpToLevel = useCallback((globalIdx: number) => {
    const lvl = LEVELS[globalIdx];
    let fs = cloneFS(INITIAL_FS);
    if (lvl.onEnter) fs = lvl.onEnter(fs, gameState);
    dispatch({
      type: 'SET_LEVEL',
      index: globalIdx,
      fs,
      path: lvl.initialPath || ['root', 'home', 'guest'],
    });
  }, [dispatch, gameState]);

  // Zoxide Prompt Handler (Restored)
  const handleZoxidePromptKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentGameState = gameStateRef.current;

      switch (e.key) {
        case 'Escape':
          dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          break;
        case 'Backspace':
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { inputBuffer: currentGameState.inputBuffer.slice(0, -1) },
          });
          break;
        case 'Enter': {
          const { zoxideData, inputBuffer } = currentGameState;
          const candidates = Object.keys(zoxideData)
            .map((path) => ({ path, score: calculateFrecency(zoxideData[path]) }))
            .sort((a, b) => b.score - a.score);
          const bestMatch = candidates.find((c) =>
            c.path.toLowerCase().includes(inputBuffer.toLowerCase())
          );

          if (bestMatch) {
            const currentLevel = LEVELS[currentGameState.levelIndex];
            const allDirs = getAllDirectoriesWithPaths(currentGameState.fs, currentLevel).map((d) => ({
              node: d.node,
              path: d.path,
              display: resolvePath(currentGameState.fs, d.path),
            }));
            const match = allDirs.find((d) => d.display === bestMatch.path);
            if (match) {
              const protection = isProtected(
                currentGameState.fs,
                currentGameState.currentPath,
                match.node,
                currentLevel,
                'jump'
              );
              if (protection) {
                dispatch({
                  type: 'UPDATE_UI_STATE',
                  updates: {
                    mode: 'normal',
                    notification: { message: `🔒 ${protection}` },
                    inputBuffer: '',
                  },
                });
                return;
              }

              const now = Date.now();
              dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  mode: 'normal',
                  currentPath: match.path,
                  cursorIndex: 0,
                  notification: { message: `Jumped to ${bestMatch.path}` },
                  inputBuffer: '',
                  history: [...currentGameState.history, currentGameState.currentPath],
                  future: [],
                  stats: { ...currentGameState.stats, fuzzyJumps: currentGameState.stats.fuzzyJumps + 1 },
                  zoxideData: {
                    ...currentGameState.zoxideData,
                    [bestMatch.path]: {
                      count: (currentGameState.zoxideData[bestMatch.path]?.count || 0) + 1,
                      lastAccess: now,
                    },
                  },
                },
              });
            } else {
              dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  mode: 'normal',
                  inputBuffer: '',
                  notification: { message: `Path not found: ${bestMatch.path}` },
                },
              });
            }
          } else {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                mode: 'normal',
                inputBuffer: '',
                notification: { message: 'No match found' },
              },
            });
          }
          break;
        }
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: { inputBuffer: currentGameState.inputBuffer + e.key },
            });
          }
          break;
      }
    },
    [dispatch] // gameState is accessed via ref
  );

  const handleFuzzyModeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentGameState = gameStateRef.current;
      const isZoxide = currentGameState.mode === 'zoxide-jump';
      let candidates: { path: string; score: number; pathIds?: string[] }[] = [];

      if (isZoxide) {
        const currentLevel = LEVELS[currentGameState.levelIndex];
        candidates = Object.keys(currentGameState.zoxideData)
          .map((path) => ({ path, score: calculateFrecency(currentGameState.zoxideData[path]) }))
          .sort((a, b) => b.score - a.score)
          .filter((c) => {
             return c.path.toLowerCase().includes(currentGameState.inputBuffer.toLowerCase());
          });
      } else {
        const currentDir = getNodeByPath(currentGameState.fs, currentGameState.currentPath);
        if (currentDir) {
             const results = getRecursiveSearchResults(currentDir, currentGameState.inputBuffer, currentGameState.showHidden);
             candidates = results.map(n => ({
                 path: n.name,
                 score: 0,
                 pathIds: n.path
             })).map(c => ({...c, path: String(c.path)}));
        }
      }

      switch (e.key) {
        case 'Enter': {
            if (checkFilterAndBlockNavigation(e, currentGameState, dispatch)) return;
            const idx = currentGameState.fuzzySelectedIndex || 0;
            const selected = candidates[idx];
            if (selected) {
                handleFuzzySelect(selected.path, isZoxide, selected.pathIds);
            }
            break;
        }
        case 'Escape':
            dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
            break;
        case 'ArrowDown':
        case 'n': // Ctrl+n
             if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
                 e.preventDefault();
                 dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                        fuzzySelectedIndex: Math.min(candidates.length - 1, (currentGameState.fuzzySelectedIndex || 0) + 1)
                    }
                 });
             }
             break;
        case 'ArrowUp':
        case 'p': // Ctrl+p
             if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
                 e.preventDefault();
                 dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                        fuzzySelectedIndex: Math.max(0, (currentGameState.fuzzySelectedIndex || 0) - 1)
                    }
                 });
             }
             break;
        case 'Backspace':
             dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                    inputBuffer: currentGameState.inputBuffer.slice(0, -1),
                    fuzzySelectedIndex: 0
                }
             });
             break;
        default:
             if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                 dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                        inputBuffer: currentGameState.inputBuffer + e.key,
                        fuzzySelectedIndex: 0
                    }
                 });
             }
             break;
      }
    },
    [dispatch, handleFuzzySelect]
  );

  // Global Keyboard Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use REF for state access to avoid re-binding
      const currentGameState = gameStateRef.current;

      const tasksComplete = checkAllTasksComplete(currentGameState, currentLevel);

      if (tasksComplete && currentGameState.showSuccessToast) {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          advanceLevel();
        }
        return;
      }

      if (
        ['filter', 'input-file', 'rename'].includes(currentGameState.mode) &&
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      // Check for Meta keys overrides FIRST - these should work even when blocked
      const isMetaKey = (e.key === '?' && e.altKey) ||
                        (e.key.toLowerCase() === 'h' && e.altKey) ||
                        (e.key.toLowerCase() === 'm' && e.altKey);

      // BLOCKING CHECK for Intro/Booting/GameOver
      if (
        (currentGameState.isBooting ||
        currentGameState.showEpisodeIntro ||
        isLastLevel ||
        currentGameState.isGameOver ||
        ['input-file', 'filter', 'rename'].includes(currentGameState.mode)) &&
        !isMetaKey // Allow meta keys through
      ) {
        return;
      }

      if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey)) && e.altKey) {
        e.preventDefault();
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showHelp: !currentGameState.showHelp, showHint: false, showMap: false },
        });
        return;
      }

      if ((e.key.toLowerCase() === 'h' || e.code === 'KeyH') && e.altKey) {
        e.preventDefault();
        if (currentGameState.showHint) {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { showHint: false, showHelp: false, showMap: false },
          });
        } else {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: { showHint: true, hintStage: 0, showHelp: false, showMap: false },
          });
        }
        return;
      }

      if ((e.key.toLowerCase() === 'm' || e.code === 'KeyM') && e.altKey) {
        e.preventDefault();
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showMap: !currentGameState.showMap, showHelp: false, showHint: false },
        });
        return;
      }

      if (currentGameState.showHelp) {
        handleHelpModeKeyDown(e, currentGameState, () =>
          dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: false } })
        );
        return;
      }

      if (currentGameState.showMap) {
        const episodeIcons = [Zap, Shield, Crown];
        const episodes = EPISODE_LORE.map((lore, idx) => {
          const color = lore.color ?? 'text-blue-500';
          return {
            ...lore,
            levels: LEVELS.filter((l) => l.episodeId === lore.id),
            border: color.replace('text-', 'border-') + '/30',
            bg: color.replace('text-', 'bg-') + '/10',
            color,
            icon: episodeIcons[idx] || Shield,
          };
        });

        handleQuestMapModeKeyDown(
          e,
          currentGameState,
          LEVELS,
          episodes,
          () => dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: false } }),
          handleJumpToLevel
        );
        return;
      }

      if (currentGameState.showHint) {
        if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: false } });
        }
        return;
      }

      if (currentGameState.showThreatAlert) {
        if (e.key === 'Enter' && e.shiftKey) {
          dispatch({ type: 'UPDATE_UI_STATE', updates: { showThreatAlert: false } });
        }
        return;
      }

      if (currentGameState.showInfoPanel) {
        if (e.key === 'Escape' || e.key === 'Tab') {
          e.preventDefault();
          dispatch({ type: 'UPDATE_UI_STATE', updates: { showInfoPanel: false } });
        }
        return;
      }

      // Count keystrokes
      if (
        !currentGameState.showHelp &&
        !currentGameState.showHint &&
        !currentGameState.showMap &&
        !['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm', 'h'].includes(e.key.toLowerCase())
      ) {
        let noise = 1;
        if (currentLevel?.id >= 11) {
          noise = getActionIntensity(e.key, e.ctrlKey);
        }
        dispatch({ type: 'INCREMENT_KEYSTROKES', weighted: noise > 1 });
      }

      switch (currentGameState.mode) {
        case 'normal':
          handleNormalModeKeyDown(
            e,
            currentGameState,
            visibleItems,
            parent,
            currentItem,
            currentLevel,
            advanceLevel
          );
          break;
        case 'sort':
          handleSortModeKeyDown(e, currentGameState);
          break;
        case 'confirm-delete':
          handleConfirmDeleteModeKeyDown(e, visibleItems, currentLevel, currentGameState);
          break;
        case 'search':
          if (e.key === 'Enter') {
            handleSearchConfirm();
          } else if (e.key === 'Escape') {
            dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
          }
          break;
        case 'zoxide-jump':
        case 'fzf-current':
          handleFuzzyModeKeyDown(e);
          break;
        case 'g-command':
          handleGCommandKeyDown(e, currentGameState, currentLevel);
          break;
        case 'z-prompt':
          handleZoxidePromptKeyDown(e);
          break;
        case 'overwrite-confirm':
          handleOverwriteConfirmKeyDown(e, currentGameState);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    // Dependencies that SHOULD trigger re-bind (stable or change only on navigaton/mode switch)
    currentLevel,
    isLastLevel,
    visibleItems,
    currentItem,
    parent,

    // Stable handlers
    handleNormalModeKeyDown,
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleZoxidePromptKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleFuzzyModeKeyDown,
    handleJumpToLevel,
    advanceLevel,
    handleSearchConfirm,
    dispatch,

    // NOTE: gameState is NOT here. Accessed via Ref.
  ]);


  return (
    <GameLayout
      gameState={gameState}
      dispatch={dispatch}
      currentLevel={currentLevel}
      visibleItems={visibleItems}
      currentItem={currentItem}
      parent={parent}
      isLastLevel={isLastLevel}
      handlers={{
        handleInputConfirm,
        handleSearchConfirm,
        handleRenameConfirm,
        handleFuzzySelect,
        handleRestartLevel,
        handleRestartCycle,
        handleBootComplete,
        advanceLevel,
        confirmDelete,
        cancelDelete,
        handleJumpToLevel,
      }}
    />
  );
}
