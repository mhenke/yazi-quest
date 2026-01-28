import { GameState, FileNode, Level, FsError, Result } from '../../types';
import {
  getNodeById,
  getNodeByPath,
  deleteNode,
  addNode,
  addNodeWithConflictResolution,
  isProtected,
  findPathById,
} from '../../utils/fsHelpers';
import { checkGrabbingHoneypot, checkPastingHoneypot } from '../../utils/gameUtils';
import { getNarrativeAction } from './utils';
import { getLevel11LegacyThought } from './handleNarrativeTriggers';
import { Action } from '../gameReducer';

export const handleClipboardKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  items: FileNode[],
  currentItem: FileNode | null,
  currentLevel: Level,
  showNotification: (message: string, duration?: number) => void
): boolean => {
  switch (e.key) {
    case ' ':
      if (currentItem) {
        dispatch({ type: 'TOGGLE_SELECTION', id: currentItem.id, itemCount: items.length });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { previewScroll: 0, lastActionIntensity: 1 },
        });
        return true;
      }
      break;

    case 'a':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const allIds = items.map((item) => item.id);
        dispatch({ type: 'SET_SELECTION', ids: allIds });
        dispatch({ type: 'UPDATE_UI_STATE', updates: { usedCtrlA: true } });
        showNotification(
          getNarrativeAction('Ctrl+A') || `Selected all (${allIds.length} items)`,
          500
        );
        return true;
      } else {
        e.preventDefault();
        dispatch({ type: 'SET_MODE', mode: 'input-file' });
        return true;
      }

    case 'r':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const allIds = items.map((item) => item.id);
        const inverted = allIds.filter((id) => !gameState.selectedIds.includes(id));
        dispatch({ type: 'SET_SELECTION', ids: inverted });
        dispatch({ type: 'UPDATE_UI_STATE', updates: { usedCtrlR: true } });
        showNotification(
          getNarrativeAction('Ctrl+R') || `Inverted selection (${inverted.length} items)`,
          500
        );
        return true;
      } else if (gameState.selectedIds.length > 1) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { notification: { message: 'Batch rename not available in this version' } },
        });
        return true;
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
          return true;
        }
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { mode: 'rename', inputBuffer: currentItem.name },
        });
        return true;
      }
      break;

    case 'x':
    case 'y': {
      let nodesToGrab: FileNode[] = [];
      if (gameState.selectedIds.length > 0) {
        nodesToGrab = gameState.selectedIds
          .map((id) => getNodeById(gameState.fs, id))
          .filter((n): n is FileNode => !!n);
      } else if (currentItem) {
        nodesToGrab = [currentItem];
      }

      const uniqueNodes = Array.from(new Map(nodesToGrab.map((n) => [n.id, n])).values());

      if (checkGrabbingHoneypot(uniqueNodes)) {
        showNotification(
          '🚨 HONEYPOT DETECTED! You grabbed a security trap file. Clear clipboard (Y) immediately!',
          4000
        );
      }

      const legacyThought = getLevel11LegacyThought(uniqueNodes, gameState.levelIndex);
      if (legacyThought) {
        dispatch({
          type: 'SET_THOUGHT',
          message: legacyThought,
          author: 'AI-7734',
        });
      }

      if (uniqueNodes.length > 0) {
        const nodesWithPaths = gameState.searchQuery
          ? uniqueNodes.map((n) => {
              const fullPath = findPathById(gameState.fs, n.id);
              return {
                ...n,
                actualParentPath: fullPath ? fullPath.slice(0, -1) : gameState.currentPath,
              };
            })
          : uniqueNodes;

        dispatch({
          type: 'SET_CLIPBOARD',
          nodes: nodesWithPaths,
          action: e.key === 'x' ? 'cut' : 'yank',
          originalPath: gameState.currentPath,
        });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            selectedIds: [],
            usedY: gameState.usedY || e.key === 'y',
            notification: {
              message:
                getNarrativeAction(e.key) ||
                `${nodesWithPaths.length} item(s) ${e.key === 'x' ? 'cut' : 'yanked'}`,
            },
          },
        });
        return true;
      }
      break;
    }

    case 'Y':
      if (e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'CLEAR_CLIPBOARD' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { notification: { message: 'Clipboard Aborted' } },
        });
        return true;
      }
      break;

    case 'D':
    case 'd': {
      e.preventDefault();

      if ((currentLevel.id === 14 || currentLevel.id === 9) && e.key === 'd') {
        showNotification(
          '🚫 TRASH DELETE BLOCKED! Trace requires permanent erasure. Use D (Shift+D).',
          4000
        );
        return true;
      }

      const toDelete =
        gameState.selectedIds.length > 0
          ? gameState.selectedIds.slice()
          : currentItem
            ? [currentItem.id]
            : [];
      if (toDelete.length === 0) {
        showNotification('Nothing to delete', 500);
        return true;
      }
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'confirm-delete',
          pendingDeleteIds: toDelete,
          deleteType: e.key === 'D' ? 'permanent' : 'trash',
          usedD: gameState.usedD || e.key === 'D',
          usedTrashDelete: gameState.usedTrashDelete || e.key === 'd',
        },
      });
      return true;
    }

    case 'p':
      if (gameState.clipboard) {
        const pasteCheck = checkPastingHoneypot(gameState.clipboard.nodes);
        if (pasteCheck.triggered) {
          if (pasteCheck.type === 'fatal') {
            dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
          } else {
            showNotification(pasteCheck.message || '⚠️ SYSTEM TRAP ACTIVE!', 4000);
          }
          return true;
        }
        try {
          let newFs = gameState.fs;
          let error: string | undefined | null = null;
          let errorNodeName: string | null = null;

          for (const node of gameState.clipboard.nodes) {
            if (gameState.clipboard.action === 'cut') {
              const sourcePath = node.actualParentPath || gameState.clipboard.originalPath;
              const deleteResult: Result<FileNode, FsError> = deleteNode(
                newFs,
                sourcePath,
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

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;

            const addResult: Result<FileNode, FsError> = addNodeWithConflictResolution(
              newFs,
              gameState.currentPath,
              cleanNode
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
            dispatch({ type: 'PASTE', newFs, action: gameState.clipboard.action });
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                notification: {
                  message:
                    getNarrativeAction('p') ||
                    `Deployed ${gameState.clipboard?.nodes.length} assets`,
                },
                usedP: true,
              },
            });
          }
        } catch (err) {
          console.error(err);
          showNotification('Paste failed', 4000);
        }
        return true;
      }
      break;

    case 'P':
      if (e.shiftKey && gameState.clipboard) {
        const pasteCheck = checkPastingHoneypot(gameState.clipboard.nodes);
        if (pasteCheck.triggered) {
          if (pasteCheck.type === 'fatal') {
            dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
          } else {
            showNotification(pasteCheck.message || '⚠️ SYSTEM TRAP ACTIVE!', 4000);
          }
          return true;
        }
        try {
          let newFs = gameState.fs;
          let error: string | undefined | null = null;
          let errorNodeName: string | null = null;

          const targetDirNode = getNodeByPath(newFs, gameState.currentPath);

          for (const node of gameState.clipboard.nodes) {
            const existingNode = targetDirNode?.children?.find(
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

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;

            const addResult: Result<FileNode, FsError> = addNode(
              newFs,
              gameState.currentPath,
              cleanNode
            );
            if (!addResult.ok) {
              error = (addResult as { ok: false; error: FsError }).error;
              errorNodeName = node.name;
              break;
            }
            newFs = addResult.value;

            if (gameState.clipboard?.action === 'cut') {
              const sourcePath = node.actualParentPath || gameState.clipboard.originalPath;
              const deleteResult: Result<FileNode, FsError> = deleteNode(
                newFs,
                sourcePath,
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
            dispatch({ type: 'PASTE', newFs, action: gameState.clipboard.action });
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                notification: {
                  message: `(FORCED) ${getNarrativeAction('p') || `Deployed ${gameState.clipboard?.nodes.length} assets`}`,
                },
                usedP: true,
                usedShiftP: true,
              },
            });
          }
        } catch (err) {
          console.error(err);
          showNotification('Force paste failed', 4000);
        }
        return true;
      }
      break;
  }
  return false;
};
