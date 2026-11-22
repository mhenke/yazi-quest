import React from 'react';
import { GameState, Level } from '../../types';
import { Action } from '../gameReducer';
import { getAllDirectoriesWithPaths, resolvePath, getNodeByPath } from '../../utils/fsHelpers';
import { LEVELS } from '../../constants/levels';
import { checkProtocolViolations } from './utils';
import { checkAllTasksComplete } from '../../utils/gameUtils';
import { sortNodes } from '../../utils/sortHelpers';
import { getFuzzyCandidates, FuzzyCandidate } from '../../utils/fuzzyHelpers';

function handleFuzzySelection(
  e: KeyboardEvent,
  selected: FuzzyCandidate,
  gameState: GameState,
  currentLevel: Level,
  dispatch: React.Dispatch<Action>
) {
  if (
    checkProtocolViolations(e, gameState, dispatch, checkAllTasksComplete(gameState, currentLevel))
  ) {
    return;
  }

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

export const handleFuzzyModeKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>
) => {
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
      handleFuzzySelection(e, selected, gameState, currentLevel, dispatch);
    }
    return;
  }

  // Escape
  if (e.key === 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: '' });
    return;
  }

  // Typing
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const newVal = (gameState.inputBuffer || '') + e.key;
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: newVal });
    dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
    return;
  }

  if (e.key === 'Backspace') {
    const newVal = (gameState.inputBuffer || '').slice(0, -1);
    dispatch({ type: 'SET_INPUT_BUFFER', buffer: newVal });
    dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
    return;
  }
};
