import type React from 'react';
import { GameState } from '../../types';
import { Action } from '../gameReducer';
import { getNodeByPath } from '../../utils/fsHelpers';
import { checkAllTasksComplete } from '../../utils/gameUtils';
import { KEYBINDINGS } from '../../constants/keybindings';
import type { KeyInput, LevelModeContext } from './types';

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
export const getActionIntensity = (key: string, ctrlKey = false): number => {
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
const hasFilterViolation = (gameState: GameState): boolean => {
  const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
  return !!(currentDirNode && gameState.filters[currentDirNode.id]);
};

// An empty result list is still an active Search.
export const hasSearchViolation = (gameState: GameState): boolean => {
  return gameState.searchQuery !== null;
};

// Helper to check for custom sort
const hasSortViolation = (gameState: GameState): boolean => {
  return gameState.sortBy !== 'natural' || gameState.sortDirection !== 'asc';
};

// Helper to check for hidden files visible
const hasHiddenViolation = (gameState: GameState): boolean => {
  return gameState.showHidden;
};

/**
 * True when the view is not the baseline CRL requires (hidden files shown, custom
 * sort, an active filter, or an active Search). Mirrors the checks above so the
 * auto-fix path and the navigation guard can never disagree about what a violation is.
 */
export const hasBaselineViolation = (gameState: GameState): boolean =>
  hasHiddenViolation(gameState) ||
  hasSortViolation(gameState) ||
  hasFilterViolation(gameState) ||
  hasSearchViolation(gameState);

export const isProtocolWarningOpen = (gameState: GameState): boolean =>
  gameState.mode === 'filter-warning' ||
  Boolean(
    gameState.showFilterWarning ||
    gameState.showSearchWarning ||
    gameState.showSortWarning ||
    gameState.showHiddenWarning
  );

/**
 * Unified protocol violation check for navigation.
 * Order of priority: Filter > Search > Sort > Hidden
 *
 * If tasks are NOT complete: Blocks and shows warning modal.
 * If tasks ARE complete: Blocks and allows Shift+Enter auto-fix via UI/App.
 */
const checkProtocolViolations = (
  e: KeyInput,
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

  // Show the appropriate warning modal.
  // Note: During tasks, hidden files do NOT block (isBlockingViolation was false).
  // After tasks, we show the respective modal.
  if (filter) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'filterWarning', visible: true });
  } else if (search) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: true });
  } else if (isSortBlocking) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: true });
  } else if (hidden) {
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: true });
  }

  return true;
};

export const guardProtocolViolations = (e: KeyInput, ctx: LevelModeContext): boolean =>
  checkProtocolViolations(
    e,
    ctx.gameState,
    ctx.dispatch,
    checkAllTasksComplete(ctx.gameState, ctx.currentLevel)
  );
