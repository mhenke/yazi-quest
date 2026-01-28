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
      dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } });
      return;
    }

    // [HONEYPOT EXPANSION] - Level 8 Trap Check
    if (
      gameState.clipboard?.nodes.some(
        (n) => n.name.endsWith('.trap') || n.content?.includes('TRAP')
      )
    ) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          isGameOver: true,
          gameOverReason: 'honeypot',
          notification: null,
          mode: 'normal',
          pendingOverwriteNode: null,
        },
      });
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
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'normal',
          notification: {
            message: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}`,
          },
        },
      });
      return;
    }
    newFs = deleteRes.value;

    const createRes = resolveAndCreatePath(newFs, gameState.currentPath, gameState.inputBuffer);
    if (createRes.error) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          fs: newFs,
          mode: 'normal',
          inputBuffer: '',
          notification: { message: createRes.error },
          pendingOverwriteNode: null,
        },
      });
      return;
    }

    if (createRes.collision && createRes.collisionNode) {
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          fs: newFs,
          mode: 'overwrite-confirm',
          inputBuffer: gameState.inputBuffer,
          pendingOverwriteNode: createRes.collisionNode,
          notification: { message: 'Collision still detected after overwrite attempt.' },
        },
      });
      return;
    }

    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        fs: createRes.fs,
        mode: 'normal',
        inputBuffer: '',
        pendingOverwriteNode: null,
        notification: { message: 'Overwritten successfully.' },
      },
    });
  } else if (e.key === 'n' || e.key === 'Escape') {
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: { mode: 'normal', pendingOverwriteNode: null },
    });
  }
};
