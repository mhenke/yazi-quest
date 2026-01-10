/**
 * Fuzzy matching utilities extracted for testing
 * These functions contain the core matching logic from FuzzyFinder
 */

/**
 * Score a candidate path against a query using fuzzy matching
 * Higher scores = better matches
 *
 * Scoring rules:
 * - Contiguous substring match: 100 points
 * - Start of string match: +50 points
 * - Exact match: +200 points
 * - Sequential character matches: 10 points each
 * - Gap penalty: -5 points per gap
 */
export function fuzzyScore(path: string, query: string): number {
  if (!query) return 0;

  const lowerPath = path.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerPath === lowerQuery) return 300;

  // Contiguous substring match
  const idx = lowerPath.indexOf(lowerQuery);
  if (idx >= 0) {
    let score = 100;
    // Bonus for match at start
    if (idx === 0) score += 50;
    // Bonus for match after path separator
    if (idx > 0 && lowerPath[idx - 1] === '/') score += 30;
    return score;
  }

  // Sequential fuzzy match
  let score = 0;
  let queryIdx = 0;
  let lastMatchIdx = -1;

  for (let i = 0; i < lowerPath.length && queryIdx < lowerQuery.length; i++) {
    if (lowerPath[i] === lowerQuery[queryIdx]) {
      score += 10;
      // Bonus for consecutive matches
      if (lastMatchIdx === i - 1) score += 5;
      // Bonus for match after separator
      if (i > 0 && lowerPath[i - 1] === '/') score += 10;
      lastMatchIdx = i;
      queryIdx++;
    }
  }

  // All query characters must match
  if (queryIdx < lowerQuery.length) return -1; // No match

  return score;
}

/**
 * Check if a path matches a query (fuzzy)
 */
export function fuzzyMatch(path: string, query: string): boolean {
  if (!query) return true;

  const lowerPath = path.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Contiguous match
  if (lowerPath.includes(lowerQuery)) return true;

  // Sequential character match
  let queryIdx = 0;
  for (let i = 0; i < lowerPath.length && queryIdx < lowerQuery.length; i++) {
    if (lowerPath[i] === lowerQuery[queryIdx]) {
      queryIdx++;
    }
  }

  return queryIdx === lowerQuery.length;
}

/**
 * Filter and sort candidates by query match quality
 */
export function filterAndRankCandidates<T extends { path: string; score?: number }>(
  candidates: T[],
  query: string,
): T[] {
  if (!query) return candidates;

  return candidates
    .map((c) => ({
      ...c,
      matchScore: fuzzyScore(c.path, query),
    }))
    .filter((c) => c.matchScore >= 0)
    .sort((a, b) => {
      // Higher match score first
      const scoreDiff = b.matchScore - a.matchScore;
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
      // Then by original score (frecency for zoxide)
      const origDiff = (b.score || 0) - (a.score || 0);
      if (Math.abs(origDiff) > 0.1) return origDiff;
      // Then alphabetically
      return a.path.localeCompare(b.path);
    });
}

/**
 * Find matching character indices for highlighting
 * Returns array of indices that should be highlighted
 */
export function getMatchIndices(
  text: string,
  query: string,
): { type: 'contiguous' | 'fuzzy'; indices: number[] } {
  if (!query) return { type: 'contiguous', indices: [] };

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Try contiguous match first
  const idx = lowerText.indexOf(lowerQuery);
  if (idx >= 0) {
    const indices: number[] = [];
    for (let i = idx; i < idx + query.length; i++) {
      indices.push(i);
    }
    return { type: 'contiguous', indices };
  }

  // Fallback to fuzzy match
  const indices: number[] = [];
  let qi = 0;
  for (let i = 0; i < lowerText.length && qi < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[qi]) {
      indices.push(i);
      qi++;
    }
  }

  return { type: 'fuzzy', indices };
}
