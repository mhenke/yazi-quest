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

/**
 * Strips transient clipboard/search properties that must not persist to the filesystem.
 */
const cleanClipboardNode = (node: FileNode): FileNode => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { displayPath: _dp, actualParentPath: _app, path: _p, ...cleanNode } = node;
  return cleanNode as FileNode;
};

/**
 * Checks if any pasted nodes trigger honeypots, dispatching game over or showing notification.
 * Returns true if a honeypot trap was triggered (halting the paste operation).
 */
const checkAndHandlePasteHoneypot = (
  nodes: FileNode[],
  dispatch: React.Dispatch<Action>,
  showNotification: (message: string, duration?: number) => void
): boolean => {
  const pasteCheck = checkPastingHoneypot(nodes);
  if (pasteCheck.triggered) {
    if (pasteCheck.type === 'fatal') {
      dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
    } else {
      showNotification(pasteCheck.message || '⚠️ SYSTEM TRAP ACTIVE!', 4000);
    }
    return true;
  }
  return false;
};

/**
 * Deletes the source node from its parent directory when a cut-paste operation is performed.
 */
const deleteCutSourceNode = (
  fs: FileNode,
  node: FileNode,
  clipboard: { action: 'cut' | 'yank'; originalPath: string[] },
  levelIndex: number
): { fs: FileNode; error?: FsError } => {
  if (clipboard.action !== 'cut') {
    return { fs };
  }
  const sourcePath = node.actualParentPath || clipboard.originalPath;
  const deleteResult: Result<FileNode, FsError> = deleteNode(fs, sourcePath, node.id, levelIndex);
  if (!deleteResult.ok) {
    const err = (deleteResult as { ok: false; error: FsError }).error;
    if (err !== 'NotFound') {
      return { fs, error: err };
    }
  } else {
    fs = deleteResult.value;
  }
  return { fs };
};

/**
 * Checks for and resolves destination collision during overwrite paste (Shift+P).
 * If a matching node (same name and type) already exists in target directory, deletes it.
 */
const checkDestinationCollision = (
  fs: FileNode,
  targetPath: string[],
  node: FileNode,
  levelIndex: number
): { fs: FileNode; error?: FsError; collidedNodeName?: string } => {
  const targetDirNode = getNodeByPath(fs, targetPath);
  const existingNode = targetDirNode?.children?.find(
    (c) => c.name === node.name && c.type === node.type
  );

  if (existingNode) {
    const deleteResult: Result<FileNode, FsError> = deleteNode(
      fs,
      targetPath,
      existingNode.id,
      levelIndex
    );
    if (!deleteResult.ok) {
      return {
        fs,
        error: (deleteResult as { ok: false; error: FsError }).error,
        collidedNodeName: existingNode.name,
      };
    }
    return { fs: deleteResult.value };
  }

  return { fs };
};

interface PasteResult {
  newFs: FileNode;
  error?: string;
  errorNodeName?: string;
}

/**
 * Applies clipboard nodes to the target directory.
 */
const applyPasteNodes = (
  initialFs: FileNode,
  clipboard: NonNullable<GameState['clipboard']>,
  currentPath: string[],
  levelIndex: number,
  force: boolean
): PasteResult => {
  let newFs = initialFs;

  for (const node of clipboard.nodes) {
    if (force) {
      const collisionRes = checkDestinationCollision(newFs, currentPath, node, levelIndex);
      if (collisionRes.error) {
        return {
          newFs,
          error: collisionRes.error,
          errorNodeName: collisionRes.collidedNodeName || node.name,
        };
      }
      newFs = collisionRes.fs;
    } else {
      const cutDeleteRes = deleteCutSourceNode(newFs, node, clipboard, levelIndex);
      if (cutDeleteRes.error) {
        return {
          newFs,
          error: cutDeleteRes.error,
          errorNodeName: node.name,
        };
      }
      newFs = cutDeleteRes.fs;
    }

    const cleanNode = cleanClipboardNode(node);

    const addResult: Result<FileNode, FsError> = force
      ? addNode(newFs, currentPath, cleanNode)
      : addNodeWithConflictResolution(newFs, currentPath, cleanNode);

    if (!addResult.ok) {
      return {
        newFs,
        error: (addResult as { ok: false; error: FsError }).error,
        errorNodeName: node.name,
      };
    }
    newFs = addResult.value;

    if (force) {
      const cutDeleteRes = deleteCutSourceNode(newFs, node, clipboard, levelIndex);
      if (cutDeleteRes.error) {
        return {
          newFs,
          error: cutDeleteRes.error,
          errorNodeName: node.name,
        };
      }
      newFs = cutDeleteRes.fs;
    }
  }

  return { newFs };
};

/**
 * Executes paste operation (standard paste 'p' or overwrite paste 'Shift+P').
 */
const executePaste = (
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  showNotification: (message: string, duration?: number) => void,
  force: boolean
): boolean => {
  if (!gameState.clipboard) {
    return false;
  }

  if (checkAndHandlePasteHoneypot(gameState.clipboard.nodes, dispatch, showNotification)) {
    return true;
  }

  try {
    const { newFs, error, errorNodeName } = applyPasteNodes(
      gameState.fs,
      gameState.clipboard,
      gameState.currentPath,
      gameState.levelIndex,
      force
    );

    if (error) {
      showNotification(
        `${force ? 'Force paste' : 'Paste'} failed for "${errorNodeName}": ${error}`,
        4000
      );
    } else {
      dispatch({ type: 'PASTE', newFs, action: gameState.clipboard.action });
      const actionMsg =
        getNarrativeAction('p') || `Deployed ${gameState.clipboard.nodes.length} assets`;
      showNotification(force ? `(FORCED) ${actionMsg}` : actionMsg, 4000);
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'P' });
      if (force) {
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'ShiftP' });
      }
    }
  } catch (err) {
    console.error(err);
    showNotification(force ? 'Force paste failed' : 'Paste failed', 4000);
  }

  return true;
};

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
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        return true;
      }
      break;

    case 'a':
    case 'A':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const allIds = items.map((item) => item.id);
        dispatch({ type: 'SET_SELECTION', ids: allIds });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'CtrlA' });
        showNotification(
          getNarrativeAction('Ctrl+A') || `Selected all (${allIds.length} items)`,
          4000
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
        // Invert selection against all potential items in the directory (respecting showHidden)
        // instead of just the currently visible (filtered) items.
        const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
        if (currentDir && currentDir.children) {
          let allPotentialItems = currentDir.children;
          if (!gameState.showHidden) {
            allPotentialItems = allPotentialItems.filter((node) => !node.name.startsWith('.'));
          }
          const allIds = allPotentialItems.map((item) => item.id);
          const inverted = allIds.filter((id) => !gameState.selectedIds.includes(id));
          dispatch({ type: 'SET_SELECTION', ids: inverted });
          dispatch({ type: 'MARK_ACTION_USED', actionId: 'CtrlR' });
          showNotification(
            getNarrativeAction('Ctrl+R') || `Inverted selection (${inverted.length} items)`,
            4000
          );
        }
        return true;
      } else if (gameState.selectedIds.length > 1) {
        dispatch({
          type: 'SET_NOTIFICATION',
          message: 'Batch rename not available in this version',
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
        dispatch({ type: 'SET_MODE', mode: 'rename' });
        dispatch({ type: 'SET_INPUT_BUFFER', buffer: currentItem.name });
        return true;
      }
      break;

    case 'x':
    case 'y': {
      const isCut = e.key === 'x';
      if (currentLevel.clipboardPolicy === 'cut' && !isCut) {
        showNotification(
          '🚫 PROTOCOL VIOLATION: Yank (y) blocked. Use Cut (x) for exfiltration.',
          4000
        );
        return true;
      }

      if (currentLevel.clipboardPolicy === 'yank' && isCut) {
        showNotification(
          '🚫 PROTOCOL VIOLATION: Cut (x) blocked. Use Yank (y) for this objective.',
          4000
        );
        return true;
      }

      let nodesToGrab: FileNode[] = [];
      if (gameState.selectedIds.length > 0) {
        nodesToGrab = gameState.selectedIds
          .map((id) => getNodeById(gameState.fs, id))
          .filter((n): n is FileNode => !!n);
      } else if (currentItem) {
        nodesToGrab = [currentItem];
      }

      const uniqueNodes = Array.from(new Map(nodesToGrab.map((n) => [n.id, n])).values());

      const honeypotCheck = checkGrabbingHoneypot(uniqueNodes, gameState.levelIndex);
      if (honeypotCheck.triggered) {
        if (honeypotCheck.severity === 'gameover') {
          dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
          return true;
        } else if (honeypotCheck.severity === 'modal') {
          dispatch({
            type: 'SET_ALERT_MESSAGE',
            message: honeypotCheck.message || '🚨 HONEYPOT DETECTED!',
          });
          dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: true });
        } else {
          showNotification(
            honeypotCheck.message ||
              '🚨 HONEYPOT DETECTED! You grabbed a security trap file. Clear clipboard (Y) immediately!',
            4000
          );
        }
      }

      const legacyThought = getLevel11LegacyThought(uniqueNodes, gameState.levelIndex);
      if (legacyThought) {
        dispatch({
          type: 'SET_THOUGHT',
          payload: { text: legacyThought, author: 'AI-7734' },
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
          action: isCut ? 'cut' : 'yank',
          originalPath: gameState.currentPath,
        });
        dispatch({ type: 'SET_SELECTION', ids: [] });
        dispatch({
          type: 'MARK_ACTION_USED',
          actionId: isCut ? 'X' : 'Y',
        });
        showNotification(
          getNarrativeAction(e.key) ||
            `${nodesWithPaths.length} item(s) ${isCut ? 'cut' : 'yanked'}`,
          4000
        );
        return true;
      }
      break;
    }

    case 'Y':
      if (e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'CLEAR_CLIPBOARD' });
        showNotification('Clipboard Aborted', 4000);
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
        showNotification('Nothing to delete', 4000);
        return true;
      }
      dispatch({
        type: 'SET_DELETE_PENDING',
        ids: toDelete,
        deleteType: e.key === 'D' ? 'permanent' : 'trash',
      });
      dispatch({ type: 'SET_MODE', mode: 'confirm-delete' });
      dispatch({
        type: 'MARK_ACTION_USED',
        actionId: e.key === 'D' ? 'D' : 'TrashDelete',
      });
      return true;
    }

    case 'p':
      if (gameState.clipboard) {
        return executePaste(gameState, dispatch, showNotification, false);
      }
      break;

    case 'P':
      if (e.shiftKey && gameState.clipboard) {
        return executePaste(gameState, dispatch, showNotification, true);
      }
      break;
  }
  return false;
};
