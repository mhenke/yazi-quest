import { GameState, calculateFrecency } from '../types';
import { getRecursiveContent, getAllDirectoriesWithPaths, resolvePath } from './fsHelpers';
import { LEVELS } from '../constants/levels';

export interface FuzzyCandidate {
  path: string;
  pathIds?: string[];
  isZoxide: boolean;
  score?: number;
  type?: 'file' | 'archive';
  id?: string;
}

export function getBaseFuzzyCandidates(gameState: GameState): FuzzyCandidate[] {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const currentLevel = LEVELS[gameState.levelIndex];

  if (isZoxide) {
    const zKeys = Object.keys(gameState.zoxideData || {});
    const dirs = getAllDirectoriesWithPaths(gameState.fs, currentLevel).map((d) =>
      resolvePath(gameState.fs, d.path)
    );

    return dirs
      .filter((path) => zKeys.includes(path))
      .map((path) => ({
        path,
        score: calculateFrecency(gameState.zoxideData[path]),
        isZoxide: true,
      }))
      .sort((a, b) => {
        const diff = (b.score ?? 0) - (a.score ?? 0);
        if (Math.abs(diff) > 0.0001) return diff;
        return a.path.localeCompare(b.path);
      });
  }

  const items = getRecursiveContent(
    gameState.fs,
    gameState.currentPath,
    currentLevel,
    gameState.showHidden
  ).filter((c) => c.type === 'file' || c.type === 'archive');

  return items.map((c) => {
    const display = (c as { display?: string; path?: string[] }).display;
    const safePath =
      typeof display === 'string' && display
        ? display
        : String((c as { path?: string[] }).path || []).replace(/,/g, '/');
    return {
      path: safePath,
      pathIds: (c as { path?: string[] }).path,
      type: c.type as 'file' | 'archive',
      id: c.id,
      score: 0,
      isZoxide: false,
    };
  });
}

export function filterFuzzyCandidates(
  baseCandidates: FuzzyCandidate[],
  query?: string
): FuzzyCandidate[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return baseCandidates;
  return baseCandidates.filter((c) => c.path.toLowerCase().includes(q));
}

export function getFuzzyCandidates(gameState: GameState, query?: string): FuzzyCandidate[] {
  return filterFuzzyCandidates(getBaseFuzzyCandidates(gameState), query ?? gameState.inputBuffer);
}
