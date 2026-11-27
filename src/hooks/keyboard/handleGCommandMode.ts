import { JUMP_TARGETS } from '../../constants/keybindings';
import { getNodeByPath, isProtected } from '../../utils/fsHelpers';
import { guardProtocolViolations } from './utils';
import { jumpToLastVisibleItem } from './handleNavigation';
import type { KeyInput, LevelModeContext } from './types';

export const handleGCommandKeyDown = (e: KeyInput, ctx: LevelModeContext): void => {
  const { dispatch, gameState, currentLevel } = ctx;

  // Level 1 Pedagogical Constraint: Block shortcuts (gd, gw, etc.) to force manual navigation
  // Only allow 'g' (for gg) or Escape
  if (currentLevel.id === 1 && e.key !== 'g' && e.key !== 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({
      type: 'SET_NOTIFICATION',
      message: 'Shortcuts disabled in Level 1. Use manual navigation.',
    });
    return;
  }

  if (e.key === 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    return;
  }

  // Handle Shift+G (Jump to bottom) specially
  if (e.key === 'G') {
    if (guardProtocolViolations(e, ctx)) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }
    e.preventDefault();
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    jumpToLastVisibleItem({ gameState, dispatch });
    return;
  }

  const target = JUMP_TARGETS[e.key];
  if (!target) {
    // Unknown key, exit mode
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    return;
  }

  // Special case for 'gg' (top of list) - doesn't change path
  if (e.key === 'g') {
    if (guardProtocolViolations(e, ctx)) {
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      return;
    }
    dispatch({ type: 'SET_CURSOR', index: 0 });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'MARK_ACTION_USED', actionId: 'GG' });
    dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
    return;
  }

  // Check for active protocol violations - exit g-command cleanly before showing warning
  if (guardProtocolViolations(e, ctx)) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    return;
  }

  const targetNode = getNodeByPath(gameState.fs, target.path);
  if (!targetNode) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({
      type: 'SET_NOTIFICATION',
      message: `Directory not found: ${target.label}`,
    });
    return;
  }

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

  // Standard Path Jumps
  dispatch({ type: 'NAVIGATE', path: target.path });
  dispatch({ type: 'SET_MODE', mode: 'normal' });
  dispatch({ type: 'SET_NOTIFICATION', message: `Jumped to ${target.label}` });
  dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: 0 });
  if (target.flag) {
    dispatch({ type: 'MARK_ACTION_USED', actionId: target.flag });
  }
};
