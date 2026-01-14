import { useCallback } from 'react';

import { GameState, FileNode, Level, FsError, Result } from '../types';
import {
  getNodeByPath,
  deleteNode,
  addNode,
  addNodeWithConflictResolution,
  isProtected,
  resolvePath,
  resolveAndCreatePath,
  findPathById,
} from '../utils/fsHelpers';
import { getVisibleItems } from '../utils/viewHelpers';
import { reportError } from '../utils/error';
import { KEYBINDINGS } from '../constants/keybindings';

// Helper to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => {
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

// Helper to check for active filter in the current directory and block navigation
export const checkFilterAndBlockNavigation = (
  e: KeyboardEvent,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  direction: 'forward' | 'backward' = 'backward'
): boolean => {
  const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
  if (currentDirNode && gameState.filters[currentDirNode.id]) {
    if (direction === 'forward') {
      // When navigating INTO a subdirectory, clear the filter and allow navigation
      e.preventDefault();
      setGameState((prev) => {
        const newFilters = { ...prev.filters };
        delete newFilters[currentDirNode.id];
        return { ...prev, filters: newFilters };
      });
      return false; // Allow navigation after clearing filter
    }
    // Backward navigation with filter active - show warning
    e.preventDefault();
    setGameState((prev) => ({ ...prev, mode: 'filter-warning' }));
    return true; // Navigation blocked
  }
  return false; // Navigation allowed
};

export const checkSearchAndBlockNavigation = (
  e: KeyboardEvent,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
): boolean => {
  if (gameState.searchQuery && gameState.searchResults.length > 0) {
    e.preventDefault();
    setGameState((prev) => ({ ...prev, mode: 'search-warning' }));
    return true; // Navigation blocked
  }
  return false; // Navigation allowed
};

export const useKeyboardHandlers = (
  showNotification: (message: string, duration?: number) => void
) => {
  const handleSortModeKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      const key = e.key;
      const shift = e.shiftKey;

      if (key === 'Escape') {
        setGameState((prev) => ({ ...prev, mode: 'normal', acceptNextKeyForSort: false }));
        return;
      }

      if (key === 'l') {
        setGameState((prev) => {
          const modes: ('none' | 'size' | 'mtime' | 'permissions')[] = [
            'none',
            'size',
            'mtime',
            'permissions',
          ];
          const nextIndex = (modes.indexOf(prev.linemode) + 1) % modes.length;
          return {
            ...prev,
            mode: 'normal',
            acceptNextKeyForSort: false,
            linemode: modes[nextIndex],
          };
        });
        return;
      }

      if (key === '-') {
        setGameState((prev) => ({
          ...prev,
          mode: 'normal',
          acceptNextKeyForSort: false,
          linemode: 'none',
        }));
        return;
      }

      // Config for standard sort keys
      const SORT_CONFIG: Record<
        string,
        {
          by: GameState['sortBy'];
          defaultDir: GameState['sortDirection'];
          reverseDir: GameState['sortDirection'];
          label: string;
          linemode?: GameState['linemode'];
        }
      > = {
        n: {
          by: 'natural',
          defaultDir: 'asc',
          reverseDir: 'desc',
          label: 'Natural',
        },
        a: {
          by: 'alphabetical',
          defaultDir: 'asc',
          reverseDir: 'desc',
          label: 'A-Z',
        },
        m: {
          by: 'modified',
          defaultDir: 'desc',
          reverseDir: 'asc',
          label: 'Modified',
          linemode: 'mtime',
        },
        s: {
          by: 'size',
          defaultDir: 'desc',
          reverseDir: 'asc',
          label: 'Size',
          linemode: 'size',
        },
        e: {
          by: 'extension',
          defaultDir: 'asc',
          reverseDir: 'desc',
          label: 'Extension',
        },
      };

      const config = SORT_CONFIG[key.toLowerCase()];

      if (config) {
        setGameState((prev) => ({
          ...prev,
          mode: 'normal',
          acceptNextKeyForSort: false,
          sortBy: config.by,
          sortDirection: shift ? config.reverseDir : config.defaultDir,
          linemode: config.linemode || prev.linemode,
          notification: `Sort: ${config.label}${shift ? ' (rev)' : ''}`,
        }));
      }
    },
    []
  );

  const confirmDelete = useCallback(
    (
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      visibleItems: FileNode[],
      currentLevelParam: Level
    ) => {
      setGameState((prev) => {
        let newFs = prev.fs;
        let errorMsg: string | null | undefined = null;

        for (const id of prev.pendingDeleteIds) {
          const node = visibleItems.find((n) => n.id === id);
          if (node) {
            const protection = isProtected(
              prev.fs,
              prev.currentPath,
              node,
              currentLevelParam,
              'delete'
            );
            if (protection) {
              errorMsg = protection;
              break;
            }
            const res = deleteNode(newFs, prev.currentPath, id, prev.levelIndex);
            if (!res.ok) {
              errorMsg = (res as { ok: false; error: FsError }).error;
              break;
            }
            newFs = res.value;
          }
        }

        if (errorMsg) {
          return {
            ...prev,
            mode: 'normal',
            pendingDeleteIds: [],
            notification: `🔒 PROTECTED: ${errorMsg}`,
          };
        }
        return {
          ...prev,
          fs: newFs,
          mode: 'normal',
          pendingDeleteIds: [],
          selectedIds: [],
          notification: getNarrativeAction('d') || 'Items deleted',
        };
      });
    },
    []
  );

  const cancelDelete = useCallback(
    (setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      setGameState((prev) => ({ ...prev, mode: 'normal', pendingDeleteIds: [] }));
    },
    []
  );

  const handleConfirmDeleteModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      visibleItems: FileNode[],
      currentLevelParam: Level
    ) => {
      if (e.key === 'y' || e.key === 'Enter') {
        confirmDelete(setGameState, visibleItems, currentLevelParam);
      } else if (e.key === 'n' || e.key === 'Escape') {
        cancelDelete(setGameState);
      }
    },
    [confirmDelete, cancelDelete]
  );

  const handleOverwriteConfirmKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      if (e.key === 'y' || e.key === 'Enter') {
        setGameState((prev) => {
          if (!prev.pendingOverwriteNode) return { ...prev, mode: 'normal' };

          let newFs = prev.fs;
          const deleteRes = deleteNode(
            newFs,
            prev.currentPath,
            prev.pendingOverwriteNode.id,
            prev.levelIndex
          );
          if (!deleteRes.ok)
            return {
              ...prev,
              mode: 'normal',
              notification: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}`,
            };
          newFs = deleteRes.value;

          const createRes = resolveAndCreatePath(newFs, prev.currentPath, prev.inputBuffer);
          if (createRes.error) {
            return {
              ...prev,
              fs: newFs,
              mode: 'normal',
              inputBuffer: '',
              notification: createRes.error,
              pendingOverwriteNode: null,
            };
          }

          if (createRes.collision && createRes.collisionNode) {
            return {
              ...prev,
              fs: newFs,
              mode: 'overwrite-confirm',
              inputBuffer: prev.inputBuffer,
              pendingOverwriteNode: createRes.collisionNode,
              notification: 'Collision still detected after overwrite attempt.',
            };
          }

          return {
            ...prev,
            fs: createRes.fs,
            mode: 'normal',
            inputBuffer: '',
            pendingOverwriteNode: null,
            notification: 'Overwritten successfully.',
          };
        });
      } else if (e.key === 'n' || e.key === 'Escape') {
        setGameState((prev) => ({ ...prev, mode: 'normal', pendingOverwriteNode: null }));
      }
    },
    []
  );

  const handleGCommandKeyDown = useCallback(
    (
      e: KeyboardEvent,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      gameState: GameState,
      currentLevel: Level
    ) => {
      console.log('handleGCommandKeyDown', e.key, gameState);
      if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
        return;
      }

      // Level 1 Pedagogical Constraint: Block shortcuts (gd, gw, etc.) to force manual navigation
      // Only allow 'g' (for gg) or Escape
      if (currentLevel.id === 1) {
        if (e.key !== 'g' && e.key !== 'Escape') {
          setGameState((prev) => ({
            ...prev,
            mode: 'normal',
            notification: 'Shortcuts disabled in Level 1. Use manual navigation.',
          }));
          return;
        }
      }

      if (e.key === 'Escape') {
        setGameState((prev) => ({ ...prev, mode: 'normal' }));
        return;
      }

      // Handle Shift+G (Jump to bottom) specially
      if (e.key === 'G') {
        e.preventDefault();
        try {
          const items = getVisibleItems(gameState) || [];
          const last = Math.max(0, items.length - 1);
          setGameState((prev) => ({
            ...prev,
            cursorIndex: last,
            mode: 'normal',
            usedG: true,
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
        } catch (err) {
          setGameState((prev) => ({ ...prev, mode: 'normal' }));
        }
        return;
      }

      const JUMP_TARGETS: Record<
        string,
        {
          path: string[];
          label: string;
          flag?:
            | keyof GameState['stats']
            | 'usedG'
            | 'usedGI'
            | 'usedGC'
            | 'usedGG'
            | 'usedGR'
            | 'usedGH';
        }
      > = {
        g: { path: [], label: 'top', flag: 'usedGG' }, // Special handling later, but defined here for completeness
        h: { path: ['root', 'home', 'guest'], label: 'home', flag: 'usedGH' },
        c: { path: ['root', 'home', 'guest', '.config'], label: 'config', flag: 'usedGC' },
        w: { path: ['root', 'home', 'guest', 'workspace'], label: 'workspace' },
        t: { path: ['root', 'tmp'], label: 'tmp' },
        r: { path: ['root'], label: 'root', flag: 'usedGR' },
        i: { path: ['root', 'home', 'guest', 'incoming'], label: 'incoming', flag: 'usedGI' },
        d: { path: ['root', 'home', 'guest', 'datastore'], label: 'datastore' },
      };

      const target = JUMP_TARGETS[e.key];

      if (target) {
        // Special case for 'gg' (top of list) - doesn't change path
        if (e.key === 'g') {
          setGameState((prev) => ({
            ...prev,
            cursorIndex: 0,
            mode: 'normal',
            usedGG: true,
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
        } else {
          // Check for active search - block navigation
          if (checkSearchAndBlockNavigation(e, gameState, setGameState)) {
            return;
          }
          // Check for protection
          const targetNode = getNodeByPath(gameState.fs, target.path);
          if (targetNode) {
            const protection = isProtected(
              gameState.fs,
              gameState.currentPath,
              targetNode,
              currentLevel,
              'jump'
            );
            if (protection) {
              setGameState((prev) => ({
                ...prev,
                mode: 'normal',
                notification: `🔒 ${protection}`,
              }));
              return;
            }
          }

          // Standard Path Jumps
          setGameState((prev) => {
            const extraFlags = target.flag ? { [target.flag]: true } : {};
            return {
              ...prev,
              currentPath: target.path,
              cursorIndex: 0,
              mode: 'normal',
              notification: `Jumped to ${target.label}`,
              history: [...prev.history, prev.currentPath],
              future: [],
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
              ...extraFlags,
            };
          });
        }
      } else {
        // Unknown key, exit mode
        setGameState((prev) => ({ ...prev, mode: 'normal' }));
      }
    },
    []
  );

  const handleNormalModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      items: FileNode[],
      parent: FileNode | null,
      currentItem: FileNode | null,
      currentLevel: Level,
      advanceLevel: () => void
    ) => {
      // Level 13: Async Distributed Node Switching
      if (currentLevel.id === 13) {
        const NODES: Record<string, { path: string[]; label: string }> = {
          '1': { path: ['root', 'nodes', 'tokyo'], label: 'TOKYO' },
          '2': { path: ['root', 'nodes', 'berlin'], label: 'BERLIN' },
          '3': { path: ['root', 'nodes', 'saopaulo'], label: 'SÃO PAULO' },
        };

        if (NODES[e.key]) {
          const target = NODES[e.key];
          setGameState((prev) => ({
            ...prev,
            currentPath: target.path,
            cursorIndex: 0,
            notification: `>>> SYNC: ACTIVE NODE CHANGED TO ${target.label} <<<`,
            history: [...prev.history, prev.currentPath], // Persist jump in history
            future: [], // Clear future
          }));
          return;
        }
      }

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          setGameState((prev) => ({
            ...prev,
            cursorIndex: prev.cursorIndex >= items.length - 1 ? 0 : prev.cursorIndex + 1,
            previewScroll: 0,
            usedDown: true,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        case 'k':
        case 'ArrowUp':
          setGameState((prev) => ({
            ...prev,
            cursorIndex:
              prev.cursorIndex <= 0 ? Math.max(0, items.length - 1) : prev.cursorIndex - 1,
            previewScroll: 0,
            usedUp: true,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        case 'J':
          if (e.shiftKey) {
            setGameState((prev) => ({
              ...prev,
              previewScroll: prev.previewScroll + 5,
              usedPreviewDown: true,
            }));
          }
          break;
        case 'K':
          if (e.shiftKey) {
            setGameState((prev) => ({
              ...prev,
              previewScroll: Math.max(0, prev.previewScroll - 5),
              usedPreviewUp: true,
            }));
          }
          break;
        case 'g':
          e.preventDefault();
          setGameState((prev) => ({ ...prev, mode: 'g-command' }));
          break;
        case 'G': {
          // Direct Shift+G in normal mode: jump to bottom of visible list
          e.preventDefault();
          if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
            return;
          }

          try {
            const items = getVisibleItems(gameState) || [];
            const last = Math.max(0, items.length - 1);
            setGameState((prev) => ({
              ...prev,
              cursorIndex: last,
              previewScroll: 0,
              usedG: true,
              usedPreviewDown: false,
              usedPreviewUp: false,
            }));
          } catch (err) {
            // ignore
          }
          break;
        }
        case 'h':
        case 'ArrowLeft': {
          if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
            return;
          }

          // If search is active, navigate to the parent folder of the selected search result
          if (gameState.searchQuery && currentItem) {
            const itemPath = findPathById(gameState.fs, currentItem.id);
            if (itemPath && itemPath.length > 1) {
              // Get parent path (exclude the item itself)
              const parentPath = itemPath.slice(0, -1);
              setGameState((prev) => ({
                ...prev,
                currentPath: parentPath,
                cursorIndex: 0,
                previewScroll: 0,
                searchQuery: null,
                searchResults: [],
                history: [...prev.history, prev.currentPath],
                future: [],
              }));
              return;
            }
          }

          // Normal h behavior - go to parent
          if (parent) {
            setGameState((prev) => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              previewScroll: 0,
              history: [...prev.history, prev.currentPath],
              future: [],
              usedPreviewDown: false,
              usedPreviewUp: false,
              // Also clear any search when navigating
              searchQuery: null,
              searchResults: [],
            }));
          }
          break;
        }
        case 'o':
        case 'l':
        case 'Enter':
        case 'ArrowRight': {
          if (checkFilterAndBlockNavigation(e, gameState, setGameState, 'forward')) {
            return;
          }
          const allComplete = currentLevel.tasks.every((t) => t.completed);
          if (allComplete && !gameState.showHidden && e.key === 'Enter' && e.shiftKey) {
            advanceLevel();
            return;
          }
          if (currentItem && (currentItem.type === 'dir' || currentItem.type === 'archive')) {
            // Check for protection
            const protection = isProtected(
              gameState.fs,
              gameState.currentPath,
              currentItem,
              currentLevel,
              'enter'
            );
            if (protection) {
              showNotification(`🔒 ${protection}`, 4000);
              return;
            }

            // If in search mode, find the full path to this directory and navigate to it
            if (gameState.searchQuery) {
              const itemPath = findPathById(gameState.fs, currentItem.id);
              if (itemPath) {
                const pathStr = resolvePath(gameState.fs, itemPath);
                const now = Date.now();
                setGameState((prev) => ({
                  ...prev,
                  currentPath: itemPath,
                  cursorIndex: 0,
                  usedG: false,
                  usedGG: false,
                  usedPreviewDown: false,
                  usedPreviewUp: false,
                  history: [...prev.history, prev.currentPath],
                  future: [],
                  previewScroll: 0,
                  searchQuery: null,
                  searchResults: [],
                  zoxideData: {
                    ...prev.zoxideData,
                    [pathStr]: {
                      count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                      lastAccess: now,
                    },
                  },
                }));
                return;
              }
            }

            // Normal navigation - append to current path
            setGameState((prev) => {
              const nextPath = [...prev.currentPath, currentItem.id];
              const pathStr = resolvePath(prev.fs, nextPath);
              const now = Date.now();
              return {
                ...prev,
                currentPath: nextPath,
                cursorIndex: 0,
                usedG: false,
                usedGG: false,
                usedPreviewDown: false,
                usedPreviewUp: false,
                history: [...prev.history, prev.currentPath],
                future: [],
                previewScroll: 0,
                zoxideData: {
                  ...prev.zoxideData,
                  [pathStr]: {
                    count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                    lastAccess: now,
                  },
                },
              };
            });
          }
          break;
        }
        case ' ':
          if (currentItem) {
            setGameState((prev) => {
              const newSelected = prev.selectedIds.includes(currentItem.id)
                ? prev.selectedIds.filter((id) => id !== currentItem.id)
                : [...prev.selectedIds, currentItem.id];
              return {
                ...prev,
                selectedIds: newSelected,
                cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1),
                previewScroll: 0,
              };
            });
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map((item) => item.id);
            setGameState((prev) => ({ ...prev, selectedIds: allIds, usedCtrlA: true }));
            showNotification(
              getNarrativeAction('Ctrl+A') || `Selected all (${allIds.length} items)`,
              2000
            );
          } else {
            e.preventDefault();
            setGameState((prev) => ({ ...prev, mode: 'input-file', inputBuffer: '' }));
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            // Future: Ctrl+F for something else?
          } else {
            e.preventDefault();
            setGameState((prev) => ({
              ...prev,
              mode: 'filter',
              inputBuffer: '',
              usedFilter: true, // Track filter usage
            }));
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map((item) => item.id);
            const inverted = allIds.filter((id) => !gameState.selectedIds.includes(id));
            setGameState((prev) => ({ ...prev, selectedIds: inverted, usedCtrlR: true }));
            showNotification(
              getNarrativeAction('Ctrl+R') || `Inverted selection (${inverted.length} items)`,
              2000
            );
          } else if (gameState.selectedIds.length > 1) {
            setGameState((prev) => ({
              ...prev,
              notification: 'Batch rename not available in this version',
            }));
          } else if (currentItem) {
            e.preventDefault();
            const protection = isProtected(
              gameState.fs,
              gameState.currentPath,
              currentItem,
              currentLevel,
              'rename'
            );
            if (protection) {
              showNotification(`🔒 PROTECTED: ${protection}`, 4000);
              return;
            }
            setGameState((prev) => ({ ...prev, mode: 'rename', inputBuffer: currentItem.name }));
          }
          break;
        case 'x':
        case 'y':
          if (gameState.clipboard) {
            const isHoneypot = gameState.clipboard.nodes.some(
              (n) => n.content?.includes('HONEYPOT') || n.name === 'access_token.key'
            );
            if (isHoneypot) {
              showNotification('⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard!', 4000);
              break;
            }
          }
          if (gameState.selectedIds.length > 0) {
            // Use items (passed from caller - already handles search mode)
            const nodes = items.filter((n) => gameState.selectedIds.includes(n.id));
            if (e.key === 'x') {
              const protectedItem = nodes
                .map((node) =>
                  isProtected(gameState.fs, gameState.currentPath, node, currentLevel, 'cut')
                )
                .find((res) => res !== null);
              if (protectedItem) {
                showNotification(`🔒 PROTECTED: ${protectedItem}`, 4000);
                return;
              }
            }
            setGameState((prev) => ({
              ...prev,
              clipboard: {
                nodes,
                action: e.key === 'x' ? 'cut' : 'yank',
                originalPath: prev.currentPath,
              },
              selectedIds: [],
              notification:
                getNarrativeAction(e.key) ||
                `${nodes.length} item(s) ${e.key === 'x' ? 'cut' : 'yanked'}`,
            }));
          } else if (currentItem) {
            if (e.key === 'x') {
              const protection = isProtected(
                gameState.fs,
                gameState.currentPath,
                currentItem,
                currentLevel,
                'cut'
              );
              if (protection) {
                showNotification(`🔒 PROTECTED: ${protection}`, 4000);
                return;
              }
            }
            setGameState((prev) => ({
              ...prev,
              clipboard: {
                nodes: [currentItem],
                action: e.key === 'x' ? 'cut' : 'yank',
                originalPath: prev.currentPath,
              },
              notification:
                getNarrativeAction(e.key) ||
                `"${currentItem.name}" ${e.key === 'x' ? 'cut' : 'yanked'}`,
            }));
          }
          break;
        case 'D':
        case 'd': {
          // Enter confirm-delete mode for selected items or current item
          e.preventDefault();
          const toDelete =
            gameState.selectedIds.length > 0
              ? gameState.selectedIds.slice()
              : currentItem
                ? [currentItem.id]
                : [];
          if (toDelete.length === 0) {
            showNotification('Nothing to delete', 2000);
            break;
          }
          setGameState((prev) => ({
            ...prev,
            mode: 'confirm-delete',
            pendingDeleteIds: toDelete,
            deleteType: e.key === 'D' ? 'permanent' : 'trash',
            usedD: prev.usedD || e.key === 'D',
            usedTrashDelete: prev.usedTrashDelete || e.key === 'd',
          }));
          break;
        }
        case 'p':
          if (gameState.clipboard) {
            const isHoneypot = gameState.clipboard.nodes.some(
              (n) => n.content?.includes('HONEYPOT') || n.name === 'access_token.key'
            );
            if (isHoneypot) {
              showNotification('⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard!', 4000);
              break;
            }
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  if (gameState.clipboard.action === 'cut') {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.clipboard.originalPath,
                      node.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      if ((deleteResult as { ok: false; error: FsError }).error !== 'NotFound') {
                        error = (deleteResult as { ok: false; error: FsError }).error;
                        errorNodeName = node.name;
                        break;
                      }
                    } else {
                      newFs = deleteResult.value;
                    }
                  }

                  const addResult: Result<FileNode, FsError> = addNodeWithConflictResolution(
                    newFs,
                    gameState.currentPath,
                    node
                  );
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;
                }

                if (error) {
                  showNotification(`Paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                  setGameState((prev) => ({
                    ...prev,
                    fs: newFs,
                    clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
                    notification:
                      getNarrativeAction('p') || `Deployed ${prev.clipboard?.nodes.length} assets`,
                    usedP: true,
                  }));
                }
              } catch (err) {
                try {
                  reportError(err, { phase: 'paste', action: 'p' });
                } catch {
                  console.error(err);
                }
                showNotification('Paste failed', 4000);
              }
            }
          }
          break;
        case 'P':
          if (e.shiftKey && gameState.clipboard) {
            const isHoneypot = gameState.clipboard.nodes.some(
              (n) => n.content?.includes('HONEYPOT') || n.name === 'access_token.key'
            );
            if (isHoneypot) {
              showNotification('⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard!', 4000);
              break;
            }
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  const existingNode = currentDir.children?.find(
                    (c) => c.name === node.name && c.type === node.type
                  );

                  if (existingNode) {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.currentPath,
                      existingNode.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      error = (deleteResult as { ok: false; error: FsError }).error;
                      errorNodeName = existingNode.name;
                      break;
                    }
                    newFs = deleteResult.value;
                  }

                  const addResult: Result<FileNode, FsError> = addNode(
                    newFs,
                    gameState.currentPath,
                    node
                  );
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;

                  if (gameState.clipboard?.action === 'cut') {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.clipboard.originalPath,
                      node.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      error = (deleteResult as { ok: false; error: FsError }).error;
                      errorNodeName = node.name;
                      break;
                    }
                    newFs = deleteResult.value;
                  }
                }

                if (error) {
                  showNotification(`Force paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                  setGameState((prev) => ({
                    ...prev,
                    fs: newFs,
                    clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
                    notification: `(FORCED) ${getNarrativeAction('p') || `Deployed ${prev.clipboard?.nodes.length} assets`}`,
                    usedP: true,
                    usedShiftP: true,
                  }));
                }
              } catch (err) {
                try {
                  reportError(err, { phase: 'paste', action: 'P' });
                } catch {
                  console.error(err);
                }
                showNotification('Force paste failed', 4000);
              }
            }
          }
          break;
        case '\t':
        case 'Tab':
          e.preventDefault();
          if (!gameState.showInfoPanel && currentItem) {
            const protection = isProtected(
              gameState.fs,
              gameState.currentPath,
              currentItem,
              currentLevel,
              'info'
            );
            if (protection) {
              showNotification(`🔒 ${protection}`, 4000);
              return;
            }
          }
          setGameState((prev) => ({ ...prev, showInfoPanel: !prev.showInfoPanel }));
          break;
        case 's':
          e.preventDefault();
          setGameState((prev) => {
            showNotification(getNarrativeAction('s') || 'Recursive search');
            return {
              ...prev,
              mode: 'search',
              inputBuffer: '',
              searchQuery: null,
              searchResults: [],
            };
          });
          break;
        case '.':
          setGameState((prev) => {
            const narrative = getNarrativeAction('.');
            const message = prev.showHidden ? `Cloaking Engaged` : `Revealing Hidden Traces`;
            showNotification(narrative || message);
            return { ...prev, showHidden: !prev.showHidden };
          });
          break;
        case ',':
          setGameState((prev) => ({ ...prev, mode: 'sort', acceptNextKeyForSort: true }));
          break;
        case 'Z':
          if (e.shiftKey) {
            if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
              return;
            }
            e.preventDefault();
            setGameState((prev) => {
              showNotification(getNarrativeAction('Z') || 'Zoxide jump');
              return {
                ...prev,
                mode: 'zoxide-jump',
                inputBuffer: '',
                fuzzySelectedIndex: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
              };
            });
          }
          break;
        case 'H': {
          // History Back (Shift+H)
          if (e.shiftKey) {
            if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
              return;
            }
            setGameState((prev) => {
              if (!prev.history || prev.history.length === 0) return prev;
              const previous = prev.history[prev.history.length - 1];
              const newHistory = prev.history.slice(0, -1);
              return {
                ...prev,
                currentPath: previous,
                cursorIndex: 0,
                previewScroll: 0,
                history: newHistory,
                future: [prev.currentPath, ...prev.future],
                usedHistoryBack: true,
                usedPreviewDown: false,
                usedPreviewUp: false,
                notification: getNarrativeAction('H') || 'History Back',
              };
            });
          }
          break;
        }
        case 'z':
          if (!e.shiftKey) {
            if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
              return;
            }
            e.preventDefault();
            setGameState((prev) => {
              showNotification(getNarrativeAction('z') || 'FZF file search');
              return {
                ...prev,
                mode: 'fzf-current',
                inputBuffer: '',
                fuzzySelectedIndex: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
              };
            });
          }
          break;
        case 'L': {
          // History Forward (Shift+L)
          if (e.shiftKey) {
            if (checkFilterAndBlockNavigation(e, gameState, setGameState)) {
              return;
            }
            setGameState((prev) => {
              if (!prev.future || prev.future.length === 0) return prev;
              const next = prev.future[0];
              const newFuture = prev.future.slice(1);
              return {
                ...prev,
                currentPath: next,
                cursorIndex: 0,
                previewScroll: 0,
                history: [...prev.history, prev.currentPath],
                future: newFuture,
                usedHistoryForward: true,
                usedPreviewDown: false,
                usedPreviewUp: false,
                notification: getNarrativeAction('L') || 'History Forward',
              };
            });
          }
          break;
        }
        case 'Escape':
          setGameState((prev) => {
            if (prev.searchQuery) {
              showNotification(getNarrativeAction('Escape') || 'Search cleared');
              return {
                ...prev,
                searchQuery: null,
                searchResults: [],
                mode: 'normal',
                inputBuffer: '',
              };
            }
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const hasFilter = currentDir && prev.filters[currentDir.id];
            if (hasFilter) {
              const newFilters = { ...prev.filters };
              delete newFilters[currentDir.id];
              showNotification(getNarrativeAction('Escape') || 'Scan filter deactivated');
              return { ...prev, filters: newFilters };
            }
            if (prev.selectedIds.length > 0) {
              showNotification(getNarrativeAction('Escape') || 'Selection cleared');
              return { ...prev, selectedIds: [] };
            }
            return prev;
          });
          break;
        default:
          break;
      }
      if (e.key === 'Y' || e.key === 'X') {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, clipboard: null }));
        showNotification(getNarrativeAction('Y') || 'CLIPBOARD CLEARED', 2000);
      }
    },
    [showNotification]
  );

  return {
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleNormalModeKeyDown,
    confirmDelete,
    cancelDelete,
  };
};
