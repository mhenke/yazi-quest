import { GameState, FsError } from '../../types';
import { deleteNode, resolveAndCreatePath } from '../../utils/fsHelpers';
import { Action } from '../gameReducer';

export const handleOverwriteConfirmKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState
) => {
  if (e.key === 'y' || e.key === 'Enter') {
    if (!gameState.pendingOverwriteNode) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }

    // [HONEYPOT EXPANSION] - Level 8 Trap Check
    if (
      gameState.clipboard?.nodes.some(
        (n) => n.name.endsWith('.trap') || n.content?.includes('TRAP')
      )
    ) {
      dispatch({ type: 'GAME_OVER', reason: 'honeypot' });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_OVERWRITE_PENDING', node: null });
      dispatch({ type: 'CLEAR_NOTIFICATION' });
      return;
    }

    let newFs = gameState.fs;
    const deleteRes = deleteNode(
      newFs,
      gameState.currentPath,
      gameState.pendingOverwriteNode.id,
      gameState.levelIndex
    );
    if (!deleteRes.ok) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({
        type: 'SET_NOTIFICATION',
        message: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}`,
      });
      return;
    }
    newFs = deleteRes.value;

    const createRes = resolveAndCreatePath(newFs, gameState.currentPath, gameState.inputBuffer);
    if (createRes.error) {
      dispatch({ type: 'UPDATE_FS', fs: newFs });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
      dispatch({ type: 'SET_NOTIFICATION', message: createRes.error });
      dispatch({ type: 'SET_OVERWRITE_PENDING', node: null });
      return;
    }

    if (createRes.collision && createRes.collisionNode) {
      dispatch({ type: 'UPDATE_FS', fs: newFs });
      dispatch({ type: 'SET_MODE', mode: 'overwrite-confirm' });
      dispatch({ type: 'SET_OVERWRITE_PENDING', node: createRes.collisionNode });
      dispatch({
        type: 'SET_NOTIFICATION',
        message: 'Collision still detected after overwrite attempt.',
      });
      return;
    }

    dispatch({ type: 'UPDATE_FS', fs: createRes.fs });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
    dispatch({ type: 'SET_OVERWRITE_PENDING', node: null });
    dispatch({ type: 'SET_NOTIFICATION', message: 'Overwritten successfully.' });
  } else if (e.key === 'n' || e.key === 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_OVERWRITE_PENDING', node: null });
  }
};
