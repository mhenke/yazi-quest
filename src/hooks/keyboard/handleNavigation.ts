import { findPathById, resolvePath, isProtected } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import { guardProtocolViolations } from './utils';
import { checkLevel11Scouting } from './handleNarrativeTriggers';
import { checkAllTasksComplete } from '../../utils/gameUtils';
import type { KeyInput, ModeContext, NormalModeContext } from './types';

// Shift+G: jump the cursor to the last visible item.
export const jumpToLastVisibleItem = ({ gameState, dispatch }: ModeContext): void => {
  const items = getVisibleItems(gameState) || [];
  const last = Math.max(0, items.length - 1);
  dispatch({ type: 'SET_CURSOR', index: last });
  dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
  dispatch({ type: 'MARK_ACTION_USED', actionId: 'G' });
};

export const handleNavigationKeyDown = (e: KeyInput, ctx: NormalModeContext): boolean => {
  const {
    gameState,
    dispatch,
    items,
    parent,
    currentItem,
    currentLevel,
    advanceLevel,
    showNotification,
  } = ctx;

  switch (e.key) {
    case 'j':
    case 'ArrowDown': {
      if (guardProtocolViolations(e, ctx)) return true;

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
      if (guardProtocolViolations(e, ctx)) return true;
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
      if (guardProtocolViolations(e, ctx)) return true;
      e.preventDefault();
      jumpToLastVisibleItem({ gameState, dispatch });
      return true;
    }

    case 'h':
    case 'ArrowLeft': {
      if (guardProtocolViolations(e, ctx)) return true;

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

      if (guardProtocolViolations(e, ctx)) return true;

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
        if (guardProtocolViolations(e, ctx)) return true;
        if (gameState.history.length === 0) return true;
        dispatch({ type: 'NAVIGATE_BACK' });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'HistoryBack' });
        showNotification('History Back', 4000);
        return true;
      }
      break;

    case 'L':
      if (e.shiftKey) {
        if (guardProtocolViolations(e, ctx)) return true;
        if (gameState.future.length === 0) return true;
        dispatch({ type: 'NAVIGATE_FORWARD' });
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
        dispatch({ type: 'MARK_ACTION_USED', actionId: 'HistoryForward' });
        showNotification('History Forward', 4000);
        return true;
      }
      break;
  }
  return false;
};
