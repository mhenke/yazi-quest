import { GameState } from '../../types';
import { Action } from '../gameReducer';
import { getNodeByPath } from '../../utils/fsHelpers';
import { KEYBINDINGS } from '../../constants';

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

// Helper to check for active filter in the current directory
export const hasFilterViolation = (gameState: GameState): boolean => {
  const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
  return !!(currentDirNode && gameState.filters[currentDirNode.id]);
};

// Helper to check for active search results
export const hasSearchViolation = (gameState: GameState): boolean => {
  return !!(gameState.searchQuery && gameState.searchResults.length > 0);
};

// Helper to check for custom sort
export const hasSortViolation = (gameState: GameState): boolean => {
  return gameState.sortBy !== 'natural' || gameState.sortDirection !== 'asc';
};

// Helper to check for hidden files visible
// NOTE: Hidden files no longer block navigation as per game design requirements
export const hasHiddenViolation = (_gameState: GameState): boolean => {
  return false;
};

/**
 * Unified protocol violation check for navigation.
 * Order of priority: Filter > Search > Sort > Hidden
 *
 * If tasks are NOT complete: Blocks and shows warning modal.
 * If tasks ARE complete: Triggers auto-fix and blocks one press.
 */
export const checkProtocolViolations = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  allTasksComplete: boolean
): boolean => {
  const filter = hasFilterViolation(gameState);
  const search = hasSearchViolation(gameState);
  const sort = hasSortViolation(gameState);
  const hidden = hasHiddenViolation(gameState);

  if (!filter && !search && !sort && !hidden) return false;

  e.preventDefault();

  if (allTasksComplete) {
    // AUTO-FIX LOGIC
    dispatch({
      type: 'SET_NOTIFICATION',
      message: 'PROTOCOL BREACH DETECTED: AUTO-CORRECTING...',
      duration: 3000,
    });
    // Trigger the glitch effect in App.tsx via a dedicated action or mode
    dispatch({ type: 'SET_MODE', mode: 'auto-fix' });

    // Clear all violations
    if (filter) {
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      if (currentDirNode) dispatch({ type: 'CLEAR_FILTER', dirId: currentDirNode.id });
    }
    if (search) {
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
    }
    if (sort) {
      dispatch({ type: 'SET_SORT', sortBy: 'natural', direction: 'asc' });
    }
    if (hidden) {
      dispatch({ type: 'TOGGLE_HIDDEN' });
    }

    // After a delay, return to normal mode (the pulse/glitch effect)
    setTimeout(() => {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
    }, 1000);

    return true; // Navigation blocked for this press
  }

  // STANDARD WARNING MODALS (During tasks)
  if (filter) {
    dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
  } else if (search) {
    dispatch({ type: 'SET_MODE', mode: 'search-warning' });
  } else if (sort) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
  } else if (hidden) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: true });
  }

  return true;
};
