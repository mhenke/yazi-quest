import { GameState, FileNode, Level, FsError } from '../../types';
import {
  checkHoneypotTriggered,
  checkCriticalFileDeletion,
  validateDeletions,
} from '../../utils/gameUtils';
import { isProtected, deleteNode, getNodeById } from '../../utils/fsHelpers';
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
      dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
      // Extra cleanup if needed, but GAME_OVER handles mode reset
      dispatch({ type: 'UPDATE_UI_STATE', updates: { pendingDeleteIds: [] } });
      return;
    } else {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_NOTIFICATION', message: honeypot.message || 'Honeypot triggered.' });
      dispatch({ type: 'UPDATE_UI_STATE', updates: { pendingDeleteIds: [] } });
      return;
    }
  }

  // Critical System File Check (Shell Collapse)
  if (checkCriticalFileDeletion(gameState, gameState.pendingDeleteIds)) {
    dispatch({ type: 'GAME_OVER', reason: 'criticalFile' });
    dispatch({ type: 'UPDATE_UI_STATE', updates: { pendingDeleteIds: [] } });
    return;
  }

  // Policy-based protection check
  const validation = validateDeletions(gameState, gameState.pendingDeleteIds, currentLevelParam);
  if (validation.ok === false) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_NOTIFICATION', message: `🔒 PROTECTED: ${validation.error}` });
    dispatch({ type: 'UPDATE_UI_STATE', updates: { pendingDeleteIds: [] } });
    return;
  }

  for (const id of gameState.pendingDeleteIds) {
    // Try to find the node in visibleItems first (faster, and contains path info for search results)
    let node = visibleItems.find((n) => n.id === id);

    // If not found in visible items (e.g. filtered out), look in the FS
    if (!node) {
      node = getNodeById(newFs, id);
    }

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
        continue;
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

  dispatch({
    type: 'DELETE_NODES',
    newFs: newFs,
    notification: errorMsg ? `🔒 PARTIAL: ${errorMsg}` : (getNarrativeAction('d') || 'Items deleted'),
  });
};

export const cancelDelete = (dispatch: React.Dispatch<Action>) => {
  dispatch({ type: 'SET_MODE', mode: 'normal' });
  dispatch({ type: 'UPDATE_UI_STATE', updates: { pendingDeleteIds: [] } });
};

export const handleConfirmDeleteModeKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  visibleItems: FileNode[],
  currentLevelParam: Level
) => {
  if (e.key === 'y' || e.key === 'Enter') {
    e.preventDefault();
    confirmDelete(dispatch, gameState, visibleItems, currentLevelParam);
  } else if (e.key === 'n' || e.key === 'Escape') {
    e.preventDefault();
    cancelDelete(dispatch);
  }
};
