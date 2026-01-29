import { GameState, Level } from '../../types';
import { getNodeByPath, isProtected } from '../../utils/fsHelpers';
import { getVisibleItems } from '../../utils/viewHelpers';
import { checkSearchAndBlockNavigation } from './utils';
import { Action } from '../gameReducer';

export const handleGCommandKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  currentLevel: Level
) => {
  // Level 1 Pedagogical Constraint: Block shortcuts (gd, gw, etc.) to force manual navigation
  // Only allow 'g' (for gg) or Escape
  if (currentLevel.id === 1) {
    if (e.key !== 'g' && e.key !== 'Escape') {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({
          type: 'SET_NOTIFICATION',
          message: 'Shortcuts disabled in Level 1. Use manual navigation.'
      });
      return;
    }
  }

  if (e.key === 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    return;
  }

  // Handle Shift+G (Jump to bottom) specially
  if (e.key === 'G') {
    e.preventDefault();
    try {
      const items = getVisibleItems(gameState) || [];
      const last = Math.max(0, items.length - 1);
      dispatch({ type: 'SET_CURSOR', index: last });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedG' });
      dispatch({ type: 'UPDATE_UI_STATE', updates: { previewScroll: 0, usedPreviewDown: false, usedPreviewUp: false } });
    } catch {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
    }
    return;
  }

  const JUMP_TARGETS: Record<
    string,
    {
      path: string[];
      label: string;
      flag?: 'usedG' | 'usedGI' | 'usedGC' | 'usedGG' | 'usedGR' | 'usedGH';
    }
  > = {
    g: { path: [], label: 'top', flag: 'usedGG' }, // Special handling later, but defined here for completeness
    h: { path: ['root', 'home', 'guest'], label: 'home', flag: 'usedGH' },
    c: { path: ['root', 'home', 'guest', '.config'], label: 'config', flag: 'usedGC' },
    w: { path: ['root', 'home', 'guest', 'workspace'], label: 'workspace' },
    t: { path: ['root', 'tmp'], label: 'tmp' },
    r: { path: ['root'], label: 'root', flag: 'usedGR' },
    i: { path: ['root', 'home', 'guest', 'incoming'], label: 'incoming', flag: 'usedGI' },
    d: { path: ['root', 'home', 'guest', 'datastore'], label: 'datastore' },
  };

  const target = JUMP_TARGETS[e.key];

  if (target) {
    // Special case for 'gg' (top of list) - doesn't change path
    if (e.key === 'g') {
      dispatch({ type: 'SET_CURSOR', index: 0 });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedGG' });
      dispatch({ type: 'UPDATE_UI_STATE', updates: { previewScroll: 0, usedPreviewDown: false, usedPreviewUp: false } });
    } else {
      // Check for active search - block navigation
      if (checkSearchAndBlockNavigation(e, gameState, dispatch)) {
        return;
      }
      // Check for protection
      const targetNode = getNodeByPath(gameState.fs, target.path);
      if (targetNode) {
        const protection = isProtected(
          gameState.fs,
          gameState.currentPath,
          targetNode,
          currentLevel,
          'jump'
        );
        if (protection) {
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'SET_NOTIFICATION', message: `🔒 ${protection}` });
          return;
        }
      }

      // Standard Path Jumps
      dispatch({ type: 'NAVIGATE', path: target.path });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      if (target.flag) {
          dispatch({ type: 'MARK_ACTION_USED', actionKey: target.flag });
      }
      dispatch({ type: 'SET_NOTIFICATION', message: `Jumped to ${target.label}` });
      dispatch({ type: 'UPDATE_UI_STATE', updates: { previewScroll: 0, usedPreviewDown: false, usedPreviewUp: false } });
    }
  } else {
    // Unknown key, exit mode
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }
};
