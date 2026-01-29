import { GameState } from '../../types';
import { Action } from '../gameReducer';
import { calculateFrecency } from '../../types';
import {
  getRecursiveContent,
  getAllDirectoriesWithPaths,
  resolvePath,
} from '../../utils/fsHelpers';
import { LEVELS } from '../../constants';

// Helper to get candidates (duplicated from FuzzyFinder for logic consistency, or we should lift it)
// ideally we lift it, but for now we re-calculate or just use index bounds safely.
// Actually, we need to know the COUNT of filtered items to clamp the index.
// This is expensive to recalculate on every keypress.
// But we need it to wrap around.

const getFilteredCandidatesCount = (gameState: GameState): number => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const query = (gameState.inputBuffer || '').trim().toLowerCase();

  let candidates: string[] = [];

  if (isZoxide) {
    const zKeys = Object.keys(gameState.zoxideData);
    const currentLevel = LEVELS[gameState.levelIndex];
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

    candidates = baseItems.map(b => b.path);
  } else {
    const currentLevel = LEVELS[gameState.levelIndex];
    // This is expensive... maybe we shouldn't do it here?
    // But we need to clamp index.
    // If we assume the view is consistent, we can just rely on previous rendered count?
    // GameState doesn't store filtered count.
    // Let's approximate or re-calc.
    const items = getRecursiveContent(gameState.fs, gameState.currentPath, currentLevel)
        .filter((c) => c.type === 'file' || c.type === 'archive');

    candidates = items.map((c) => {
          const display = (c as { display?: string; path?: string[] }).display;
          return typeof display === 'string' && display
              ? display
              : String((c as { path?: string[] }).path || []).replace(/,/g, '/');
    });
  }

  if (!query) return candidates.length;
  return candidates.filter(c => c.toLowerCase().includes(query)).length;
};


export const handleFuzzyModeKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>
) => {
  // Navigation
  if (
    e.key === 'ArrowDown' ||
    (e.ctrlKey && e.key === 'n') ||
    (e.ctrlKey && e.key === 'j')
  ) {
    e.preventDefault();
    const count = getFilteredCandidatesCount(gameState);
    if (count === 0) return;
    const next = ((gameState.fuzzySelectedIndex || 0) + 1) % count;
    dispatch({ type: 'UPDATE_UI_STATE', updates: { fuzzySelectedIndex: next } });
    return;
  }

  if (
    e.key === 'ArrowUp' ||
    (e.ctrlKey && e.key === 'p') ||
    (e.ctrlKey && e.key === 'k')
  ) {
    e.preventDefault();
    const count = getFilteredCandidatesCount(gameState);
    if (count === 0) return;
    const prev = ((gameState.fuzzySelectedIndex || 0) - 1 + count) % count;
    dispatch({ type: 'UPDATE_UI_STATE', updates: { fuzzySelectedIndex: prev } });
    return;
  }

  // Selection
  if (e.key === 'Enter') {
    e.preventDefault();
    // We can't easily resolve WHICH item is selected here without re-calculating everything.
    // Instead, we can dispatch a generic 'FUZZY_SELECT' action and let the reducer handle it?
    // But the reducer also doesn't have the filtered list easily.

    // Alternative: We dispatch an action that says "Select item at index X based on current query".
    // Or we duplicate the filtering logic in the reducer (or a helper used by reducer).

    // For now, let's assume the FuzzyFinder component handles selection via `onSelect` prop?
    // But `onSelect` is triggered by click.
    // We need keyboard selection.

    // The previous implementation likely did the calculation here or in the reducer.
    // Given the architecture, let's trigger a helper function that resolves the selection and dispatches SET_PATH.

    // Re-calculate filtered list to find selected item
    const isZoxide = gameState.mode === 'zoxide-jump';
    const query = (gameState.inputBuffer || '').trim().toLowerCase();

    // ... Copy-paste the calculation logic from above ...
    // Ideally this logic should be in a shared utility.

    // Let's implement a minimal version here to unblock.
    // The previous implementation was likely doing this.

    const count = getFilteredCandidatesCount(gameState);
    if (count === 0) return;

    // We need the ACTUAL item.
    // Let's duplicate the logic properly.

    const currentLevel = LEVELS[gameState.levelIndex];
    let candidates: { path: string; pathIds?: string[]; isZoxide: boolean }[] = [];

    if (isZoxide) {
        const zKeys = Object.keys(gameState.zoxideData);
        const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel).map((d) =>
          resolvePath(gameState.fs, d.path)
        );
        const baseItems = dirs
            .filter((path) => zKeys.includes(path))
            .map((path) => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
            .sort((a, b) => {
              const diff = b.score - a.score;
              if (Math.abs(diff) > 0.0001) return diff;
              return a.path.localeCompare(b.path);
            });
         candidates = baseItems.map(b => ({ path: b.path, isZoxide: true }));
    } else {
        const items = getRecursiveContent(gameState.fs, gameState.currentPath, currentLevel)
            .filter((c) => c.type === 'file' || c.type === 'archive');
        candidates = items.map(c => {
             const display = (c as { display?: string; path?: string[] }).display;
             const safePath = typeof display === 'string' && display
              ? display
              : String((c as { path?: string[] }).path || []).replace(/,/g, '/');
             return { path: safePath, pathIds: (c as { path?: string[] }).path, isZoxide: false };
        });
    }

    const filtered = candidates.filter(c => c.path.toLowerCase().includes(query));
    const selected = filtered[gameState.fuzzySelectedIndex || 0];

    if (selected) {
        if (selected.isZoxide) {
             // Zoxide Jump: Set Path
             // We need to find pathIds for the string path.
             // Helper `getAllDirectoriesWithPaths` returns { path: string[], node: FileNode }
             // We can find it there.
             const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel);
             const match = dirs.find(d => resolvePath(gameState.fs, d.path) === selected.path);
             if (match) {
                 dispatch({
                    type: 'SET_PATH',
                    path: match.path,
                 });
                 dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', stats: { ...gameState.stats, fuzzyJumps: gameState.stats.fuzzyJumps + 1 } }
                 });
             }
        } else {
             // FZF Select: Jump to file's parent and select it
             if (selected.pathIds) {
                 const fullPath = selected.pathIds[0] === gameState.fs.id ? selected.pathIds : [...gameState.currentPath, ...selected.pathIds];
                 const parentPath = fullPath.slice(0, -1);
                 const fileId = fullPath[fullPath.length - 1];

                 dispatch({
                    type: 'SET_PATH',
                    path: parentPath,
                 });
                 dispatch({ type: 'SELECT_ID', id: fileId }); // Helper needed? Reducer handles SET_SELECTION? No, reducer has SELECT_FILE?
                 // Actually reducer has 'SET_SELECTION' which takes ids.
                 dispatch({ type: 'UPDATE_UI_STATE', updates: { selectedIds: [fileId] } }); // Or generic update

                 dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', stats: { ...gameState.stats, fzfFinds: gameState.stats.fzfFinds + 1 } }
                 });
             }
        }
    }
    return;
  }

  // Escape
  if (e.key === 'Escape') {
    dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', inputBuffer: '' } });
    return;
  }

  // Typing
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault(); // Prevent default if necessary, but usually we want to control the buffer manually
    const newVal = (gameState.inputBuffer || '') + e.key;
    dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: newVal, fuzzySelectedIndex: 0 } });
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    const newVal = (gameState.inputBuffer || '').slice(0, -1);
    dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: newVal, fuzzySelectedIndex: 0 } });
    return;
  }
};
