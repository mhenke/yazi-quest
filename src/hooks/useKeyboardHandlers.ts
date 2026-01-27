import React, { useCallback } from 'react';

import { GameState, FileNode, Level } from '../types';
import { handleSortModeKeyDown } from './keyboard/handleSortMode';
import {
  handleConfirmDeleteModeKeyDown,
  confirmDelete,
  cancelDelete,
} from './keyboard/handleDeleteMode';
import { handleOverwriteConfirmKeyDown } from './keyboard/handleOverwriteMode';
import { handleGCommandKeyDown } from './keyboard/handleGCommandMode';
import { handleNormalModeKeyDown } from './keyboard/handleNormalMode';

export const useKeyboardHandlers = (
  showNotification: (message: string, duration?: number) => void
) => {
  const handleSortModeKeyDownCallback = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      handleSortModeKeyDown(e, setGameState);
    },
    []
  );

  const confirmDeleteCallback = useCallback(
    (
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      visibleItems: FileNode[],
      currentLevelParam: Level
    ) => {
      confirmDelete(setGameState, visibleItems, currentLevelParam);
    },
    []
  );

  const cancelDeleteCallback = useCallback(
    (setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      cancelDelete(setGameState);
    },
    []
  );

  const handleConfirmDeleteModeKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      visibleItems: FileNode[],
      currentLevelParam: Level
    ) => {
      handleConfirmDeleteModeKeyDown(e, setGameState, visibleItems, currentLevelParam);
    },
    []
  );

  const handleOverwriteConfirmKeyDownCallback = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      handleOverwriteConfirmKeyDown(e, setGameState);
    },
    []
  );

  const handleGCommandKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      gameState: GameState,
      currentLevel: Level
    ) => {
      handleGCommandKeyDown(e, setGameState, gameState, currentLevel);
    },
    []
  );

  const handleNormalModeKeyDownCallback = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      items: FileNode[],
      parent: FileNode | null,
      currentItem: FileNode | null,
      currentLevel: Level,
      advanceLevel: () => void
    ) => {
      handleNormalModeKeyDown(
        e,
        gameState,
        setGameState,
        items,
        parent,
        currentItem,
        currentLevel,
        advanceLevel,
        showNotification
      );
    },
    [showNotification]
  );

  return {
    handleSortModeKeyDown: handleSortModeKeyDownCallback,
    handleConfirmDeleteModeKeyDown: handleConfirmDeleteModeKeyDownCallback,
    handleOverwriteConfirmKeyDown: handleOverwriteConfirmKeyDownCallback,
    handleGCommandKeyDown: handleGCommandKeyDownCallback,
    handleNormalModeKeyDown: handleNormalModeKeyDownCallback,
    confirmDelete: confirmDeleteCallback,
    cancelDelete: cancelDeleteCallback,
  };
};
