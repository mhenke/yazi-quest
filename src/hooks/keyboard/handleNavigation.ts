import { GameState, FileNode, Level } from '../../types';
import { findPathById, resolvePath, isProtected } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import { checkFilterAndBlockNavigation } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { Action } from '../gameReducer';

export const handleNavigationKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  items: FileNode[],
  parent: FileNode | null,
  currentItem: FileNode | null,
  currentLevel: Level,
  advanceLevel: () => void,
  showNotification: (message: string, duration?: number) => void,
  intensity: number
): boolean => {
  switch (e.key) {
    case 'j':
    case 'ArrowDown': {
      const newCursorIndex =
        gameState.cursorIndex >= items.length - 1 ? 0 : gameState.cursorIndex + 1;
      const newItem = items[newCursorIndex];
      const updatedLevel11Flags = checkLevel11Scouting(gameState, newItem);

      dispatch({ type: 'SET_CURSOR', index: newCursorIndex });
      dispatch({ type: 'UPDATE_LEVEL_FLAGS', flags: updatedLevel11Flags });
      dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedDown' });
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          previewScroll: 0,
          usedPreviewDown: false,
          usedPreviewUp: false,
          lastActionIntensity: intensity,
        },
      });
      return true;
    }

    case 'k':
    case 'ArrowUp':
      dispatch({
        type: 'SET_CURSOR',
        index: gameState.cursorIndex <= 0 ? Math.max(0, items.length - 1) : gameState.cursorIndex - 1
      });
      dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedUp' });
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          previewScroll: 0,
          usedPreviewDown: false,
          usedPreviewUp: false,
          lastActionIntensity: intensity,
        },
      });
      return true;

    case 'J':
      if (e.shiftKey) {
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedPreviewDown' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: gameState.previewScroll + 5,
          },
        });
        return true;
      }
      break;

    case 'K':
      if (e.shiftKey) {
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedPreviewUp' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: Math.max(0, gameState.previewScroll - 5),
          },
        });
        return true;
      }
      break;

    case 'g':
      e.preventDefault();
      dispatch({ type: 'SET_MODE', mode: 'g-command' });
      return true;

    case 'G': {
      e.preventDefault();
      if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
        return true;
      }
      try {
        const items = getVisibleItems(gameState) || [];
        const last = Math.max(0, items.length - 1);
        dispatch({ type: 'SET_CURSOR', index: last });
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedG' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
            lastActionIntensity: 1,
          },
        });
      } catch {
        // ignore
      }
      return true;
    }

    case 'h':
    case 'ArrowLeft': {
      if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
        return true;
      }

      if (gameState.searchQuery && currentItem) {
        const itemPath = findPathById(gameState.fs, currentItem.id);
        if (itemPath && itemPath.length > 1) {
          const parentPath = itemPath.slice(0, -1);
          dispatch({ type: 'NAVIGATE', path: parentPath });
          dispatch({ type: 'SET_SEARCH', query: null, results: [] });
          dispatch({ type: 'UPDATE_UI_STATE', updates: { previewScroll: 0 } });
          return true;
        }
      }

      if (parent) {
        dispatch({ type: 'NAVIGATE', path: gameState.currentPath.slice(0, -1) });
        dispatch({ type: 'SET_SEARCH', query: null, results: [] });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
            lastActionIntensity: intensity,
          },
        });
        return true;
      }
      break;
    }

    case 'o':
    case 'l':
    case 'Enter':
    case 'ArrowRight': {
      if (checkFilterAndBlockNavigation(e, gameState, dispatch, 'forward')) {
        return true;
      }
      const allComplete = currentLevel.tasks.every((t) => t.completed);
      if (allComplete && !gameState.showHidden && e.key === 'Enter' && e.shiftKey) {
        advanceLevel();
        return true;
      }
      if (currentItem && (currentItem.type === 'dir' || currentItem.type === 'archive')) {
        const protection = isProtected(
          gameState.fs,
          gameState.currentPath,
          currentItem,
          currentLevel,
          'enter'
        );
        if (protection) {
          showNotification(`🔒 ${protection}`, 4000);
          return true;
        }

        if (gameState.searchQuery) {
          const itemPath = findPathById(gameState.fs, currentItem.id);
          if (itemPath) {
            const pathStr = resolvePath(gameState.fs, itemPath);
            dispatch({ type: 'NAVIGATE', path: itemPath });
            dispatch({ type: 'UPDATE_ZOXIDE', path: pathStr });
            dispatch({ type: 'SET_SEARCH', query: null, results: [] });
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                usedG: false,
                usedGG: false,
                usedPreviewDown: false,
                usedPreviewUp: false,
                previewScroll: 0,
              },
            });
            return true;
          }
        }

        const nextPath = [...gameState.currentPath, currentItem.id];
        const pathStr = resolvePath(gameState.fs, nextPath);
        dispatch({ type: 'NAVIGATE', path: nextPath });
        dispatch({ type: 'UPDATE_ZOXIDE', path: pathStr });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            usedG: false,
            usedGG: false,
            usedPreviewDown: false,
            usedPreviewUp: false,
            previewScroll: 0,
            lastActionIntensity: intensity,
          },
        });
        return true;
      }
      break;
    }

    case 'H':
      if (e.shiftKey) {
        if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
          return true;
        }
        if (gameState.history.length === 0) return true;
        dispatch({ type: 'NAVIGATE_BACK' });
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedHistoryBack' });
        dispatch({ type: 'SET_NOTIFICATION', message: 'History Back' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          },
        });
        return true;
      }
      break;

    case 'L':
      if (e.shiftKey) {
        if (checkFilterAndBlockNavigation(e, gameState, dispatch)) {
          return true;
        }
        if (gameState.future.length === 0) return true;
        dispatch({ type: 'NAVIGATE_FORWARD' });
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedHistoryForward' });
        dispatch({ type: 'SET_NOTIFICATION', message: 'History Forward' });
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          },
        });
        return true;
      }
      break;
  }
  return false;
};
