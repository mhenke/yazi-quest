import React, { useCallback } from 'react';

import { GameState, FileNode, Level } from '../types';
import { Action } from './gameReducer';
import { handleSortModeKeyDown } from './keyboard/handleSortMode';
import {
  handleConfirmDeleteModeKeyDown,
  confirmDelete,
  cancelDelete,
} from './keyboard/handleDeleteMode';
import { handleOverwriteConfirmKeyDown } from './keyboard/handleOverwriteMode';
import { handleGCommandKeyDown } from './keyboard/handleGCommandMode';
import { handleNormalModeKeyDown } from './keyboard/handleNormalMode';
import { handleHelpModeKeyDown } from './keyboard/handleHelpMode';
import { handleQuestMapModeKeyDown } from './keyboard/handleQuestMapMode';

export const useKeyboardHandlers = (
  dispatch: React.Dispatch<Action>,
  showNotification: (message: string, duration?: number) => void
) => {
  const handleSortModeKeyDownCallback = useCallback(
    (e: KeyboardEvent, gameState: GameState) => {
      handleSortModeKeyDown(e, dispatch, gameState);
    },
    [dispatch]
  );

  const confirmDeleteCallback = useCallback(
    (visibleItems: FileNode[], currentLevelParam: Level, gameState: GameState) => {
      confirmDelete(dispatch, gameState, visibleItems, currentLevelParam);
    },
    [dispatch]
  );

  const cancelDeleteCallback = useCallback(() => {
    cancelDelete(dispatch);
  }, [dispatch]);

  const handleConfirmDeleteModeKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      visibleItems: FileNode[],
      currentLevelParam: Level,
      gameState: GameState
    ) => {
      handleConfirmDeleteModeKeyDown(e, dispatch, gameState, visibleItems, currentLevelParam);
    },
    [dispatch]
  );

  const handleOverwriteConfirmKeyDownCallback = useCallback(
    (e: KeyboardEvent, gameState: GameState) => {
      handleOverwriteConfirmKeyDown(e, dispatch, gameState);
    },
    [dispatch]
  );

  const handleGCommandKeyDownCallback = useCallback(
    (e: KeyboardEvent, gameState: GameState, currentLevel: Level) => {
      handleGCommandKeyDown(e, dispatch, gameState, currentLevel);
    },
    [dispatch]
  );

  const handleNormalModeKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      items: FileNode[],
      parent: FileNode | null,
      currentItem: FileNode | null,
      currentLevel: Level,
      advanceLevel: () => void
    ) => {
      handleNormalModeKeyDown(
        e,
        gameState,
        dispatch,
        items,
        parent,
        currentItem,
        currentLevel,
        advanceLevel,
        showNotification
      );
    },
    [dispatch, showNotification]
  );

  const handleHelpModeKeyDownCallback = useCallback(
    (e: KeyboardEvent, gameState: GameState, onClose: () => void) => {
      handleHelpModeKeyDown(e, dispatch, gameState, onClose);
    },
    [dispatch]
  );

  const handleQuestMapModeKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      levels: Level[],
      episodes: {
        id: number;
        name: string;
        shortTitle: string;
        color: string;
        border: string;
        bg: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        levels: Level[];
      }[],
      onClose: () => void,
      onJumpToLevel: (levelIndex: number) => void
    ) => {
      handleQuestMapModeKeyDown(e, gameState, dispatch, levels, episodes, onClose, onJumpToLevel);
    },
    [dispatch]
  );

  return {
    handleSortModeKeyDown: handleSortModeKeyDownCallback,
    handleConfirmDeleteModeKeyDown: handleConfirmDeleteModeKeyDownCallback,
    handleOverwriteConfirmKeyDown: handleOverwriteConfirmKeyDownCallback,
    handleGCommandKeyDown: handleGCommandKeyDownCallback,
    handleNormalModeKeyDown: handleNormalModeKeyDownCallback,
    handleHelpModeKeyDown: handleHelpModeKeyDownCallback,
    handleQuestMapModeKeyDown: handleQuestMapModeKeyDownCallback,
    confirmDelete: confirmDeleteCallback,
    cancelDelete: cancelDeleteCallback,
  };
};
