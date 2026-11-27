import { GameState } from '../../types';
import { getNarrativeAction, guardProtocolViolations, hasSearchViolation } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { isProtected, getNodeByPath } from '../../utils/fsHelpers';
import { Action } from '../gameReducer';
import type { KeyInput, NormalModeContext } from './types';

const handleEscapeKey = (
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  showNotification: (message: string, duration?: number) => void
): boolean => {
  dispatch({ type: 'SET_MODE', mode: 'normal' });
  dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });

  const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
  const hasActiveFilter = !!(currentDirNode && gameState.filters[currentDirNode.id]);

  // Without a filter, Escape clears selections. Clearing a filter keeps them.
  if (!hasActiveFilter) {
    if (gameState.selectedIds.length > 0) {
      showNotification('Selection cleared', 4000);
    }
    dispatch({ type: 'SET_SELECTION', ids: [] });
  }

  // Dismiss all protocol violation modals
  dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'filterWarning', visible: false });
  dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'searchWarning', visible: false });
  dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: false });
  dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'hiddenWarning', visible: false });

  if (hasSearchViolation(gameState)) {
    showNotification(getNarrativeAction('Escape') || 'Search cleared', 4000);
    dispatch({ type: 'SET_SEARCH', query: null, results: [] });
    dispatch({ type: 'SET_CURSOR', index: 0 });
    dispatch({ type: 'MARK_ACTION_USED', actionId: 'SearchCleared' });
  }

  if (hasActiveFilter && currentDirNode) {
    dispatch({ type: 'CLEAR_FILTER', dirId: currentDirNode.id });
    showNotification('Filter cleared', 4000);
  }
  return true;
};

export const handleSystemParamsKeyDown = (e: KeyInput, ctx: NormalModeContext): boolean => {
  const { gameState, dispatch, currentItem, currentLevel, showNotification } = ctx;
  switch (e.key) {
    case 'f':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
        dispatch({ type: 'SET_MODE', mode: 'filter' });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'Filter' });
        return true;
      }
      break;

    case 's':
      e.preventDefault();
      showNotification(getNarrativeAction('s') || 'Recursive search', 4000);
      dispatch({ type: 'SET_MODE', mode: 'search' });
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'Search' });
      dispatch({ type: 'CLEAR_ALL_FILTERS' });
      return true;

    case '.': {
      const narrative = getNarrativeAction('.');
      const message = gameState.showHidden ? `Cloaking Engaged` : `Revealing Hidden Traces`;
      showNotification(narrative || message, 4000);
      dispatch({ type: 'TOGGLE_HIDDEN' });
      return true;
    }

    case ',':
      dispatch({ type: 'SET_MODE', mode: 'sort' });
      dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: true });
      return true;

    case 'Z':
      if (e.shiftKey) {
        if (guardProtocolViolations(e, ctx)) return true;
        e.preventDefault();
        showNotification(getNarrativeAction('Z') || 'Zoxide jump', 4000);
        dispatch({ type: 'SET_MODE', mode: 'zoxide-jump' });
        dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
        return true;
      }
      break;

    case 'z':
      if (!e.shiftKey) {
        if (guardProtocolViolations(e, ctx)) return true;
        e.preventDefault();
        showNotification(getNarrativeAction('z') || 'FZF file search', 4000);
        dispatch({ type: 'SET_MODE', mode: 'fzf-current' });
        dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
        return true;
      }
      break;

    case '\t':
    case 'Tab':
      e.preventDefault();
      if (!gameState.showInfoPanel && currentItem) {
        const protection = isProtected(
          gameState.fs,
          gameState.currentPath,
          currentItem,
          currentLevel,
          'info'
        );
        if (protection) {
          showNotification(`🔒 ${protection}`, 4000);
          return true;
        }
      }
      dispatch({ type: 'TOGGLE_INFO_PANEL' });
      if (currentItem) {
        const updatedLevel11Flags = checkLevel11Scouting(gameState, currentItem);
        dispatch({ type: 'UPDATE_LEVEL_11_FLAGS', flags: updatedLevel11Flags });
      }
      return true;

    case 'Escape':
      return handleEscapeKey(gameState, dispatch, showNotification);
  }
  return false;
};
