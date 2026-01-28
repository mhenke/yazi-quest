import { GameState, FileNode, Level, FsError } from '../../types';
import {
  checkHoneypotTriggered,
  checkCriticalFileDeletion,
  validateDeletions,
} from '../../utils/gameUtils';
import { isProtected, deleteNode } from '../../utils/fsHelpers';
import { getNarrativeAction } from './utils';
import { Action } from '../gameReducer';

export const confirmDelete = (
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  visibleItems: FileNode[],
  currentLevelParam: Level
) => {
  let newFs = gameState.fs;
  let errorMsg: string | null | undefined = null;

  // Honeypot check
  const honeypot = checkHoneypotTriggered(gameState, gameState.pendingDeleteIds, currentLevelParam);
  if (honeypot.triggered) {
    if (honeypot.reason === 'honeypot') {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          isGameOver: true,
          gameOverReason: 'honeypot',
          notification: honeypot.message ? { message: honeypot.message } : null,
          mode: 'normal',
          pendingDeleteIds: [],
        },
      });
      return;
    } else {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'normal',
          pendingDeleteIds: [],
          notification: { message: honeypot.message || 'Honeypot triggered.' },
        },
      });
      return;
    }
  }

  // Critical System File Check (Shell Collapse)
  if (checkCriticalFileDeletion(gameState, gameState.pendingDeleteIds)) {
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        isGameOver: true,
        gameOverReason: 'criticalFile',
        notification: null,
        mode: 'normal',
        pendingDeleteIds: [],
      },
    });
    return;
  }

  // Policy-based protection check
  const validation = validateDeletions(gameState, gameState.pendingDeleteIds, currentLevelParam);
  if (validation.ok === false) {
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        mode: 'normal',
        pendingDeleteIds: [],
        notification: { message: `🔒 PROTECTED: ${validation.error}` },
      },
    });
    return;
  }

  for (const id of gameState.pendingDeleteIds) {
    const node = visibleItems.find((n) => n.id === id);
    if (node) {
      // Determine the target directory path for this node.
      // Search results include their full path from root; normal items use the currentPath.
      const targetDirPath =
        node.path && node.path.length > 0 ? node.path.slice(0, -1) : gameState.currentPath;

      const protection = isProtected(
        newFs,
        targetDirPath,
        node,
        currentLevelParam,
        'delete',
        gameState.completedTaskIds
      );
      if (protection) {
        errorMsg = protection;
        break;
      }
      const res = deleteNode(newFs, targetDirPath, id, gameState.levelIndex);
      if (!res.ok) {
        if ((res as { ok: false; error: FsError }).error !== 'NotFound') {
          errorMsg = (res as { ok: false; error: FsError }).error;
          break;
        }
      } else {
        newFs = res.value;
      }
    }
  }

  if (errorMsg) {
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        mode: 'normal',
        pendingDeleteIds: [],
        notification: { message: `🔒 PROTECTED: ${errorMsg}` },
      },
    });
    return;
  }

  dispatch({
    type: 'DELETE_NODES',
    newFs: newFs,
  });

  // Also dispatch notification and usedD flag via UPDATE_UI_STATE or separately if needed.
  // Actually, I can update DELETE_NODES in gameReducer to handle these common bits.
  // But for now:
  dispatch({
    type: 'UPDATE_UI_STATE',
    updates: {
      notification: { message: getNarrativeAction('d') || 'Items deleted' },
      usedD: true,
    },
  });
};

export const cancelDelete = (dispatch: React.Dispatch<Action>) => {
  dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', pendingDeleteIds: [] } });
};

export const handleConfirmDeleteModeKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  visibleItems: FileNode[],
  currentLevelParam: Level
) => {
  if (e.key === 'y' || e.key === 'Enter') {
    confirmDelete(dispatch, gameState, visibleItems, currentLevelParam);
  } else if (e.key === 'n' || e.key === 'Escape') {
    cancelDelete(dispatch);
  }
};
