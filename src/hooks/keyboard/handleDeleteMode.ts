import type React from 'react';
import {
  checkHoneypotTriggered,
  checkCriticalFileDeletion,
  validateDeletions,
} from '../../utils/gameUtils';
import { isProtected, deleteNode, findPathById, getNodeById } from '../../utils/fsHelpers';
import { getNarrativeAction } from './utils';
import { Action } from '../gameReducer';
import type { DeleteModeContext, KeyInput } from './types';

const runPreDeleteGuards = ({ dispatch, gameState, currentLevel }: DeleteModeContext): boolean => {
  const honeypot = checkHoneypotTriggered(gameState, gameState.pendingDeleteIds, currentLevel);
  if (honeypot.triggered) {
    if (honeypot.reason === 'honeypot') {
      dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
      dispatch(
        honeypot.message
          ? { type: 'SET_NOTIFICATION', message: honeypot.message }
          : { type: 'CLEAR_NOTIFICATION' }
      );
      return true;
    }
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
    dispatch({
      type: 'SET_NOTIFICATION',
      message: honeypot.message || 'Honeypot triggered.',
    });
    return true;
  }

  // Critical System File Check (Shell Collapse)
  if (checkCriticalFileDeletion(gameState, gameState.pendingDeleteIds)) {
    dispatch({ type: 'GAME_OVER', reason: 'criticalFile' });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
    dispatch({ type: 'CLEAR_NOTIFICATION' });
    return true;
  }

  // Policy-based protection check
  const validation = validateDeletions(gameState, gameState.pendingDeleteIds, currentLevel);
  if (validation.ok === false) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
    dispatch({ type: 'SET_NOTIFICATION', message: `🔒 PROTECTED: ${validation.error}` });
    return true;
  }

  return false;
};

const applyPendingDeletions = (
  gameState: DeleteModeContext['gameState'],
  visibleItems: DeleteModeContext['visibleItems'],
  currentLevel: DeleteModeContext['currentLevel']
) => {
  let newFs = gameState.fs;
  let errorMsg: string | null = null;

  for (const id of gameState.pendingDeleteIds) {
    const node = visibleItems.find((n) => n.id === id) || getNodeById(newFs, id);
    if (!node) continue;

    // Selection can include nodes outside the current directory.
    const targetDirPath = findPathById(newFs, id)?.slice(0, -1);
    if (!targetDirPath) continue;

    const protection = isProtected(
      newFs,
      targetDirPath,
      node,
      currentLevel,
      'delete',
      gameState.completedTaskIds
    );
    if (protection) {
      errorMsg = protection;
      continue;
    }

    const res = deleteNode(newFs, targetDirPath, id, gameState.levelIndex);
    if (!res.ok) {
      if (res.error !== 'NotFound') {
        errorMsg = res.error;
        break;
      }
      continue;
    }
    newFs = res.value;
  }

  return { newFs, errorMsg };
};

export const confirmDelete = (ctx: DeleteModeContext): void => {
  if (runPreDeleteGuards(ctx)) {
    return;
  }

  const { dispatch, gameState, visibleItems, currentLevel } = ctx;
  const { newFs, errorMsg } = applyPendingDeletions(gameState, visibleItems, currentLevel);

  dispatch({
    type: 'DELETE_NODES',
    newFs,
  });

  if (errorMsg) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
    dispatch({ type: 'SET_NOTIFICATION', message: `🔒 PARTIAL: ${errorMsg}` });
    dispatch({ type: 'MARK_ACTION_USED', actionId: 'D' });
    return;
  }

  dispatch({
    type: 'SET_NOTIFICATION',
    message: getNarrativeAction('d') || 'Items deleted',
  });
  dispatch({ type: 'MARK_ACTION_USED', actionId: 'D' });
};

export const cancelDelete = (dispatch: React.Dispatch<Action>): void => {
  dispatch({ type: 'SET_MODE', mode: 'normal' });
  dispatch({ type: 'SET_DELETE_PENDING', ids: [] });
};

export const handleConfirmDeleteModeKeyDown = (e: KeyInput, ctx: DeleteModeContext): void => {
  const key = e.key.toLowerCase();
  if (key === 'y') {
    confirmDelete(ctx);
  } else if (key === 'n' || e.key === 'Escape') {
    cancelDelete(ctx.dispatch);
  }
};
