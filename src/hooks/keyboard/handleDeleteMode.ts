import React from 'react';
import { GameState, FileNode, Level, FsError } from '../../types';
import {
  checkHoneypotTriggered,
  checkCriticalFileDeletion,
  validateDeletions,
} from '../../utils/gameUtils';
import { isProtected, deleteNode } from '../../utils/fsHelpers';
import { getNarrativeAction } from './utils';

export const confirmDelete = (
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  visibleItems: FileNode[],
  currentLevelParam: Level
) => {
  setGameState((prev) => {
    let newFs = prev.fs;
    let errorMsg: string | null | undefined = null;

    // Honeypot check
    const honeypot = checkHoneypotTriggered(prev, prev.pendingDeleteIds, currentLevelParam);
    if (honeypot.triggered) {
      if (honeypot.reason === 'honeypot') {
        return {
          ...prev,
          isGameOver: true,
          gameOverReason: 'honeypot',
          notification: honeypot.message ? { message: honeypot.message } : null,
          mode: 'normal',
          pendingDeleteIds: [],
        };
      } else {
        return {
          ...prev,
          mode: 'normal',
          pendingDeleteIds: [],
          notification: { message: honeypot.message || 'Honeypot triggered.' },
        };
      }
    }

    // Critical System File Check (Shell Collapse)
    if (checkCriticalFileDeletion(prev, prev.pendingDeleteIds)) {
      return {
        ...prev,
        isGameOver: true,
        gameOverReason: 'criticalFile',
        notification: null,
        mode: 'normal',
        pendingDeleteIds: [],
      };
    }

    // Policy-based protection check
    const validation = validateDeletions(prev, prev.pendingDeleteIds, currentLevelParam);
    if (validation.ok === false) {
      return {
        ...prev,
        mode: 'normal',
        pendingDeleteIds: [],
        notification: { message: `🔒 PROTECTED: ${validation.error}` },
      };
    }

    for (const id of prev.pendingDeleteIds) {
      const node = visibleItems.find((n) => n.id === id);
      if (node) {
        // Determine the target directory path for this node.
        // Search results include their full path from root; normal items use the currentPath.
        const targetDirPath =
          node.path && node.path.length > 0 ? node.path.slice(0, -1) : prev.currentPath;

        const protection = isProtected(
          newFs,
          targetDirPath,
          node,
          currentLevelParam,
          'delete',
          prev.completedTaskIds
        );
        if (protection) {
          errorMsg = protection;
          break;
        }
        const res = deleteNode(newFs, targetDirPath, id, prev.levelIndex);
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
      return {
        ...prev,
        mode: 'normal',
        pendingDeleteIds: [],
        notification: { message: `🔒 PROTECTED: ${errorMsg}` },
      };
    }
    return {
      ...prev,
      fs: newFs,
      mode: 'normal',
      pendingDeleteIds: [],
      selectedIds: [],
      notification: { message: getNarrativeAction('d') || 'Items deleted' },
      usedD: true,
    };
  });
};

export const cancelDelete = (setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  setGameState((prev) => ({ ...prev, mode: 'normal', pendingDeleteIds: [] }));
};

export const handleConfirmDeleteModeKeyDown = (
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
};
