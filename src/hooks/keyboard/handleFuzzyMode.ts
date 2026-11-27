import { getAllDirectoriesWithPaths, resolvePath, getNodeByPath } from '../../utils/fsHelpers';
import { LEVELS } from '../../constants/levels';
import { guardProtocolViolations } from './utils';
import { sortNodes } from '../../utils/sortHelpers';
import { getFuzzyCandidates, FuzzyCandidate } from '../../utils/fuzzyHelpers';
import type { KeyInput, LevelModeContext, ModeContext } from './types';

function handleFuzzySelection(e: KeyInput, selected: FuzzyCandidate, ctx: LevelModeContext): void {
  const { gameState, currentLevel, dispatch } = ctx;
  if (guardProtocolViolations(e, ctx)) return;

  if (selected.isZoxide) {
    const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel);
    const match = dirs.find((d) => resolvePath(gameState.fs, d.path) === selected.path);
    if (match) {
      dispatch({ type: 'SET_CURSOR', index: 0 });
      dispatch({ type: 'NAVIGATE', path: match.path });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
      dispatch({ type: 'INCREMENT_STAT', stat: 'fuzzyJumps' });
    }
  } else if (selected.pathIds && selected.pathIds.length > 0) {
    const parentPath = selected.pathIds.slice(0, -1);
    const fileId = selected.pathIds[selected.pathIds.length - 1];

    const parentNode = getNodeByPath(gameState.fs, parentPath);
    let idx = 0;
    if (parentNode && parentNode.children) {
      const sortedNodes = sortNodes(parentNode.children, gameState.sortBy, gameState.sortDirection);
      idx = sortedNodes.findIndex((c) => c.id === fileId);
    }

    dispatch({ type: 'NAVIGATE', path: parentPath, cursorIndex: idx !== -1 ? idx : 0 });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'INCREMENT_STAT', stat: 'fzfFinds' });
  }
}

export const handleFuzzyModeKeyDown = (e: KeyInput, ctx: ModeContext): void => {
  const { gameState, dispatch } = ctx;
  const currentLevel = LEVELS[gameState.levelIndex];

  // Navigation
  if (e.key === 'ArrowDown' || (e.ctrlKey && (e.key === 'n' || e.key === 'j'))) {
    e.preventDefault();
    const candidates = getFuzzyCandidates(gameState);
    if (candidates.length === 0) return;
    const next = ((gameState.fuzzySelectedIndex || 0) + 1) % candidates.length;
    dispatch({ type: 'SET_FUZZY_INDEX', index: next });
    return;
  }

  if (e.key === 'ArrowUp' || (e.ctrlKey && (e.key === 'p' || e.key === 'k'))) {
    e.preventDefault();
    const candidates = getFuzzyCandidates(gameState);
    if (candidates.length === 0) return;
    const prev = ((gameState.fuzzySelectedIndex || 0) - 1 + candidates.length) % candidates.length;
    dispatch({ type: 'SET_FUZZY_INDEX', index: prev });
    return;
  }

  // Selection
  if (e.key === 'Enter') {
    e.preventDefault();
    const candidates = getFuzzyCandidates(gameState);
    const selected = candidates[gameState.fuzzySelectedIndex || 0];
    if (selected) {
      handleFuzzySelection(e, selected, { ...ctx, currentLevel });
    }
    return;
  }

  // Escape
  if (e.key === 'Escape') {
    e.preventDefault();
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
  }
};
