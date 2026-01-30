import React from 'react';
import { GameState, calculateFrecency } from '../../types';
import { Action } from '../gameReducer';
import {
  getRecursiveContent,
  getAllDirectoriesWithPaths,
  resolvePath,
  getNodeByPath,
} from '../../utils/fsHelpers';
import { LEVELS } from '../../constants';
import { checkProtocolViolations } from './utils';
import { checkAllTasksComplete } from '../../utils/gameUtils';

// Helper to get candidates (duplicated from FuzzyFinder for logic consistency)
const getFilteredCandidates = (gameState: GameState) => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const query = (gameState.inputBuffer || '').trim().toLowerCase();

  const currentLevel = LEVELS[gameState.levelIndex];
  let candidates: { path: string; pathIds?: string[]; isZoxide: boolean }[] = [];

  if (isZoxide) {
    const zKeys = Object.keys(gameState.zoxideData);
    const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel).map((d) =>
      resolvePath(gameState.fs, d.path)
    );

    // Base items sorted by frecency
    const baseItems = dirs
      .filter((path) => zKeys.includes(path))
      .map((path) => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
      .sort((a, b) => {
        const diff = b.score - a.score;
        if (Math.abs(diff) > 0.0001) return diff;
        return a.path.localeCompare(b.path);
      });

    candidates = baseItems.map((b) => ({ path: b.path, isZoxide: true }));
  } else {
    const items = getRecursiveContent(gameState.fs, gameState.currentPath, currentLevel).filter(
      (c) => c.type === 'file' || c.type === 'archive'
    );

    candidates = items.map((c) => {
      const display = (c as { display?: string; path?: string[] }).display;
      const safePath =
        typeof display === 'string' && display
          ? display
          : String((c as { path?: string[] }).path || []).replace(/,/g, '/');
      return { path: safePath, pathIds: (c as { path?: string[] }).path, isZoxide: false };
    });
  }

  if (!query) return candidates;
  return candidates.filter((c) => c.path.toLowerCase().includes(query));
};

export const handleFuzzyModeKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>
) => {
  const currentLevel = LEVELS[gameState.levelIndex];
  // Navigation
  if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n') || (e.ctrlKey && e.key === 'j')) {
    e.preventDefault();
    const candidates = getFilteredCandidates(gameState);
    if (candidates.length === 0) return;
    const next = ((gameState.fuzzySelectedIndex || 0) + 1) % candidates.length;
    dispatch({ type: 'SET_FUZZY_INDEX', index: next });
    return;
  }

  if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 'k')) {
    e.preventDefault();
    const candidates = getFilteredCandidates(gameState);
    if (candidates.length === 0) return;
    const prev = ((gameState.fuzzySelectedIndex || 0) - 1 + candidates.length) % candidates.length;
    dispatch({ type: 'SET_FUZZY_INDEX', index: prev });
    return;
  }

  // Selection
  if (e.key === 'Enter') {
    e.preventDefault();
    const candidates = getFilteredCandidates(gameState);
    const selected = candidates[gameState.fuzzySelectedIndex || 0];

    if (selected) {
      if (selected.isZoxide) {
        // Zoxide Jump
        const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel);
        const match = dirs.find((d) => resolvePath(gameState.fs, d.path) === selected.path);
        if (match) {
          if (
            checkProtocolViolations(
              e,
              gameState,
              dispatch,
              checkAllTasksComplete(gameState, currentLevel)
            )
          ) {
            return;
          }
          dispatch({ type: 'SET_CURSOR', index: 0 }); // Reset cursor for directory jump
          dispatch({ type: 'NAVIGATE', path: match.path });
          dispatch({ type: 'SET_MODE', mode: 'normal' });
          dispatch({ type: 'INCREMENT_STAT', stat: 'fuzzyJumps' });
        }
      } else {
        // FZF Select
        if (selected.pathIds) {
          // Logic to navigate to parent and select file
          // selected.pathIds is the full path to the file.
          // We want to navigate to its parent.
          // Note: findPathById returns path including root.

          // If item is root (impossible for file), handle gracefully.
          if (selected.pathIds.length > 0) {
            const parentPath = selected.pathIds.slice(0, -1);
            const fileId = selected.pathIds[selected.pathIds.length - 1];

            if (
              checkProtocolViolations(
                e,
                gameState,
                dispatch,
                checkAllTasksComplete(gameState, currentLevel)
              )
            ) {
              return;
            }

            const parentNode = getNodeByPath(gameState.fs, parentPath);
            if (parentNode && parentNode.children) {
              const idx = parentNode.children.findIndex((c) => c.id === fileId);
              if (idx !== -1) {
                dispatch({ type: 'SET_CURSOR', index: idx });
              }
            }

            dispatch({ type: 'NAVIGATE', path: parentPath });
            dispatch({ type: 'SET_SELECTION', ids: [fileId] });
            dispatch({ type: 'SET_MODE', mode: 'normal' });
            dispatch({ type: 'INCREMENT_STAT', stat: 'fzfFinds' });
          }
        }
      }
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
    console.log(`FUZZY_MODE: Typing. New buffer: "${newVal}"`);
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
