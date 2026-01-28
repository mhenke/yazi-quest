import React from 'react';
import { GameState } from '../../types';
import { getNodeByPath } from '../../utils/fsHelpers';
import { KEYBINDINGS } from '../../constants/keybindings';

// Helper to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// Find the narrative description for a given key
export const getNarrativeAction = (key: string): string | null => {
  const binding = KEYBINDINGS.find((b) => b.keys.includes(key));
  if (binding && binding.narrativeDescription) {
    if (Array.isArray(binding.narrativeDescription)) {
      return getRandomElement(binding.narrativeDescription);
    }
    return binding.narrativeDescription as string;
  }
  return null;
};

// Helper to determine action intensity (Instruction Noise)
// Ep 3 mechanic: Some actions are "louder" than others
export const getActionIntensity = (key: string, ctrlKey: boolean): number => {
  // Navigation (Low Noise)
  if (
    ['j', 'k', 'l', 'h', 'g', 'G', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
  ) {
    return 1;
  }
  // Analysis (Medium Noise)
  if (['f', 's', '/'].includes(key)) {
    return 3;
  }
  // Exfiltration/Destruction (High Noise)
  if (['x', 'p', 'd', 'D', 'y'].includes(key) || (ctrlKey && ['a', 'x', 'v'].includes(key))) {
    return 5;
  }
  // Default (Low)
  return 1;
};

// Helper to check for active filter in the current directory and block navigation
export const checkFilterAndBlockNavigation = (
  e: KeyboardEvent,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  direction: 'forward' | 'backward' = 'backward'
): boolean => {
  const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
  if (currentDirNode && gameState.filters[currentDirNode.id]) {
    if (direction === 'forward') {
      // When navigating INTO a subdirectory, clear the filter and allow navigation
      e.preventDefault();
      setGameState((prev) => {
        const newFilters = { ...prev.filters };
        delete newFilters[currentDirNode.id];
        return { ...prev, filters: newFilters };
      });
      return false; // Allow navigation after clearing filter
    }
    // Backward navigation with filter active - show warning
    e.preventDefault();
    setGameState((prev) => ({ ...prev, mode: 'filter-warning' }));
    return true; // Navigation blocked
  }
  return false; // Navigation allowed
};

export const checkSearchAndBlockNavigation = (
  e: KeyboardEvent,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
): boolean => {
  if (gameState.searchQuery && gameState.searchResults.length > 0) {
    e.preventDefault();
    setGameState((prev) => ({ ...prev, mode: 'search-warning' }));
    return true; // Navigation blocked
  }
  return false; // Navigation allowed
};
