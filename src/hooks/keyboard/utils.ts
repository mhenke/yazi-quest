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
export const hasHiddenViolation = (gameState: GameState): boolean => {
  return gameState.showHidden;
};

/**
 * Unified protocol violation check for navigation.
 * Order of priority: Filter > Search > Sort > Hidden
 *
 * If tasks are NOT complete: Blocks and shows warning modal.
 * If tasks ARE complete: Blocks and allows Shift+Enter auto-fix via UI/App.
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

  // Determine if there is a blocking violation right now
  // Hidden files only block navigation if ALL tasks for the level are complete.
  // Filters, search results, and custom sorting ALWAYS block navigation.
  // EXCEPTION: Vertical navigation (j, k, G, gg) is allowed during Sort.
  const isVerticalNav = ['j', 'k', 'ArrowUp', 'ArrowDown', 'G', 'g'].includes(e.key);
  const isSortBlocking = sort && !isVerticalNav;

  const isBlockingViolation = filter || search || isSortBlocking || (hidden && allTasksComplete);

  if (!isBlockingViolation) return false;

  // Prevent default action (navigation)
  e.preventDefault();

  // Prevent default action (navigation)
  e.preventDefault();

  // Show the appropriate warning modal.
  // Note: During tasks, hidden files do NOT block (isBlockingViolation was false).
  // After tasks, we show the respective modal.
  if (filter) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'filterWarning', visible: true });
  } else if (search) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: true });
  } else if (sort) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
  } else if (hidden) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: true });
  }

  return true;
};
