import { GameState, FileNode, Level } from '../../types';
import { getNarrativeAction, checkProtocolViolations } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { isProtected, getNodeByPath } from '../../utils/fsHelpers';
import { Action } from '../gameReducer';
import { checkAllTasksComplete } from '../../utils/gameUtils';

export const handleSystemParamsKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  currentItem: FileNode | null,
  currentLevel: Level,
  showNotification: (message: string, duration?: number) => void
): boolean => {
  switch (e.key) {
    case 'f':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch({ type: 'SET_MODE', mode: 'filter' });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'Filter' });
        return true;
      }
      break;

    case 's':
      e.preventDefault();
      showNotification(getNarrativeAction('s') || 'Recursive search');
      dispatch({ type: 'SET_MODE', mode: 'search' });
      dispatch({ type: 'SET_SEARCH', query: null, results: [] });
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'Search' });
      dispatch({ type: 'CLEAR_ALL_FILTERS' });
      return true;

    case '.': {
      const narrative = getNarrativeAction('.');
      const message = gameState.showHidden ? `Cloaking Engaged` : `Revealing Hidden Traces`;
      showNotification(narrative || message);
      dispatch({ type: 'TOGGLE_HIDDEN' });
      return true;
    }

    case ',':
      dispatch({ type: 'SET_MODE', mode: 'sort' });
      dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: true });
      return true;

    case 'Z':
      if (e.shiftKey) {
        if (
          checkProtocolViolations(
            e,
            gameState,
            dispatch,
            checkAllTasksComplete(gameState, currentLevel)
          )
        ) {
          return true;
        }
        e.preventDefault();
        showNotification(getNarrativeAction('Z') || 'Zoxide jump');
        dispatch({ type: 'SET_MODE', mode: 'zoxide-jump' });
        dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
        return true;
      }
      break;

    case 'z':
      if (!e.shiftKey) {
        if (
          checkProtocolViolations(
            e,
            gameState,
            dispatch,
            checkAllTasksComplete(gameState, currentLevel)
          )
        ) {
          return true;
        }
        e.preventDefault();
        showNotification(getNarrativeAction('z') || 'FZF file search');
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

    case 'Escape': {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });

      if (gameState.searchQuery) {
        showNotification(getNarrativeAction('Escape') || 'Search cleared');
        dispatch({ type: 'SET_SEARCH', query: null, results: [] });
        dispatch({ type: 'SET_CURSOR', index: 0 });
      }

      // Also clear filter for current directory if it exists
      const currentDirNode = getNodeByPath(gameState.fs, gameState.currentPath);
      if (currentDirNode && gameState.filters[currentDirNode.id]) {
        dispatch({ type: 'CLEAR_FILTER', dirId: currentDirNode.id });
      }
      return true;
    }
  }
  return false;
};
