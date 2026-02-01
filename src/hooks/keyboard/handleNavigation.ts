import { GameState, FileNode, Level } from '../../types';
import { findPathById, resolvePath, isProtected } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import { checkProtocolViolations } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { Action } from '../gameReducer';
import { checkAllTasksComplete } from '../../utils/gameUtils';

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
  _intensity: number
): boolean => {
  switch (e.key) {
    case 'j':
    case 'ArrowDown': {
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

      const newCursorIndex =
        gameState.cursorIndex >= items.length - 1 ? 0 : gameState.cursorIndex + 1;
      const newItem = items[newCursorIndex];
      const updatedLevel11Flags = checkLevel11Scouting(gameState, newItem);

      dispatch({ type: 'SET_CURSOR', index: newCursorIndex });
      dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'Down' });
      if (updatedLevel11Flags) {
        dispatch({
          type: 'UPDATE_LEVEL_11_FLAGS',
          flags: updatedLevel11Flags,
        });
      }
      return true;
    }

    case 'k':
    case 'ArrowUp':
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
      dispatch({
        type: 'SET_CURSOR',
        index:
          gameState.cursorIndex <= 0 ? Math.max(0, items.length - 1) : gameState.cursorIndex - 1,
      });
      dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
      dispatch({ type: 'MARK_ACTION_USED', actionId: 'Up' });
      return true;

    case 'J':
      if (e.shiftKey) {
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: gameState.previewScroll + 5 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'PreviewDown' });
        return true;
      }
      break;

    case 'K':
      if (e.shiftKey) {
        dispatch({
          type: 'SET_PREVIEW_SCROLL',
          scroll: Math.max(0, gameState.previewScroll - 5),
        });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'PreviewUp' });
        return true;
      }
      break;

    case 'g':
      e.preventDefault();
      dispatch({ type: 'SET_MODE', mode: 'g-command' });
      return true;

    case 'G': {
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
      try {
        const items = getVisibleItems(gameState) || [];
        const last = Math.max(0, items.length - 1);
        dispatch({ type: 'SET_CURSOR', index: last });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'G' });
      } catch {
        // ignore
      }
      return true;
    }

    case 'h':
    case 'ArrowLeft': {
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

      if (gameState.searchQuery && currentItem) {
        const itemPath = findPathById(gameState.fs, currentItem.id);
        if (itemPath && itemPath.length > 1) {
          const parentPath = itemPath.slice(0, -1);
          dispatch({ type: 'NAVIGATE', path: parentPath });
          dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
          dispatch({ type: 'SET_SEARCH', query: null, results: [] });
          return true;
        }
      }

      if (parent) {
        dispatch({ type: 'NAVIGATE', path: gameState.currentPath.slice(0, -1) });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'SET_SEARCH', query: null, results: [] });
        return true;
      }
      break;
    }

    case 'o':
    case 'l':
    case 'Enter':
    case 'ArrowRight': {
      const allComplete = checkAllTasksComplete(gameState, currentLevel);
      if (allComplete && !gameState.showHidden && e.key === 'Enter' && e.shiftKey) {
        advanceLevel();
        return true;
      }

      if (checkProtocolViolations(e, gameState, dispatch, allComplete)) {
        return true;
      }

      if (currentItem && currentItem.type === 'dir') {
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
            dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
            dispatch({ type: 'SET_SEARCH', query: null, results: [] });
            return true;
          }
        }

        const nextPath = [...gameState.currentPath, currentItem.id];
        const pathStr = resolvePath(gameState.fs, nextPath);
        dispatch({ type: 'NAVIGATE', path: nextPath });
        dispatch({ type: 'UPDATE_ZOXIDE', path: pathStr });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        return true;
      }
      break;
    }

    case 'H':
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
        if (gameState.history.length === 0) return true;
        dispatch({ type: 'NAVIGATE_BACK' });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'HistoryBack' });
        dispatch({ type: 'SET_NOTIFICATION', message: 'History Back' });
        return true;
      }
      break;

    case 'L':
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
        if (gameState.future.length === 0) return true;
        dispatch({ type: 'NAVIGATE_FORWARD' });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'HistoryForward' });
        dispatch({ type: 'SET_NOTIFICATION', message: 'History Forward' });
        return true;
      }
      break;
  }
  return false;
};
