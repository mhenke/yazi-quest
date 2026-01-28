import { GameState, FileNode, Level } from '../../types';
import { getNarrativeAction, checkFilterAndBlockNavigation } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { isProtected, getNodeByPath } from '../../utils/fsHelpers';
import { Action } from '../gameReducer';

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
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'filter',
            inputBuffer: '',
            usedFilter: true,
          },
        });
        return true;
      }
      break;

    case 's':
      e.preventDefault();
      showNotification(getNarrativeAction('s') || 'Recursive search');
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          mode: 'search',
          inputBuffer: '',
          searchQuery: null,
          searchResults: [],
          usedSearch: true,
        },
      });
      // Also need to clear filters? The original code had filters: {}
      // But gameReducer clear_filter is per dirId.
      // Let's use UPDATE_UI_STATE for now if we want to clear ALL filters.
      dispatch({ type: 'UPDATE_UI_STATE', updates: { filters: {} } });
      return true;

    case '.': {
      const narrative = getNarrativeAction('.');
      const message = gameState.showHidden ? `Cloaking Engaged` : `Revealing Hidden Traces`;
      showNotification(narrative || message);
      dispatch({ type: 'TOGGLE_HIDDEN' });
      return true;
    }

    case ',':
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: { mode: 'sort' as const, acceptNextKeyForSort: true },
      });
      return true;

    case 'Z':
      if (e.shiftKey) {
        if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
          return true;
        }
        e.preventDefault();
        showNotification(getNarrativeAction('Z') || 'Zoxide jump');
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'zoxide-jump',
            inputBuffer: '',
            fuzzySelectedIndex: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          },
        });
        return true;
      }
      break;

    case 'z':
      if (!e.shiftKey) {
        if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
          return true;
        }
        e.preventDefault();
        showNotification(getNarrativeAction('z') || 'FZF file search');
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            mode: 'fzf-current',
            inputBuffer: '',
            fuzzySelectedIndex: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          },
        });
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
        dispatch({ type: 'UPDATE_UI_STATE', updates: { level11Flags: updatedLevel11Flags } });
      }
      return true;

    case 'Escape': {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });

      if (gameState.searchQuery) {
        showNotification(getNarrativeAction('Escape') || 'Search cleared');
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            searchQuery: null,
            searchResults: [],
            cursorIndex: 0,
          },
        });
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
