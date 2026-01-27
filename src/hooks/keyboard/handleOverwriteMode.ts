import React from 'react';
import { GameState, FsError } from '../../types';
import { deleteNode, resolveAndCreatePath } from '../../utils/fsHelpers';

export const handleOverwriteConfirmKeyDown = (
  e: KeyboardEvent,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  if (e.key === 'y' || e.key === 'Enter') {
    setGameState((prev) => {
      if (!prev.pendingOverwriteNode) return { ...prev, mode: 'normal' };

      // [HONEYPOT EXPANSION] - Level 8 Trap Check
      if (
        prev.clipboard?.nodes.some(
          (n) => n.name.endsWith('.trap') || n.content?.includes('TRAP')
        )
      ) {
        return {
          ...prev,
          isGameOver: true,
          gameOverReason: 'honeypot',
          notification: null,
          mode: 'normal',
          pendingOverwriteNode: null,
        };
      }

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
          notification: {
            message: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}`,
          },
        };
      newFs = deleteRes.value;

      const createRes = resolveAndCreatePath(newFs, prev.currentPath, prev.inputBuffer);
      if (createRes.error) {
        return {
          ...prev,
          fs: newFs,
          mode: 'normal',
          inputBuffer: '',
          notification: { message: createRes.error },
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
          notification: { message: 'Collision still detected after overwrite attempt.' },
        };
      }

      return {
        ...prev,
        fs: createRes.fs,
        mode: 'normal',
        inputBuffer: '',
        pendingOverwriteNode: null,
        notification: { message: 'Overwritten successfully.' },
      };
    });
  } else if (e.key === 'n' || e.key === 'Escape') {
    setGameState((prev) => ({ ...prev, mode: 'normal', pendingOverwriteNode: null }));
  }
};
