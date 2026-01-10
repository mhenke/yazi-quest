import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyMatch, filterAndRankCandidates, getMatchIndices } from './fuzzyMatch';

describe('fuzzyMatch utilities', () => {
  describe('fuzzyScore', () => {
    it('should return 0 for empty query', () => {
      expect(fuzzyScore('/home/guest', '')).toBe(0);
    });

    it('should return 300 for exact match', () => {
      expect(fuzzyScore('/home/guest', '/home/guest')).toBe(300);
    });

    it('should score contiguous substring matches at 100+', () => {
      const score = fuzzyScore('/home/guest/docs', 'guest');
      expect(score).toBeGreaterThanOrEqual(100);
    });

    it('should give bonus for match at start', () => {
      const startScore = fuzzyScore('/home', '/hom');
      const middleScore = fuzzyScore('/path/home', 'home');
      expect(startScore).toBeGreaterThan(middleScore);
    });

    it('should give bonus for match after path separator', () => {
      const afterSlash = fuzzyScore('/home/guest', 'guest');
      const inMiddle = fuzzyScore('/homeguest', 'guest');
      expect(afterSlash).toBeGreaterThan(inMiddle);
    });

    it('should return -1 for no match', () => {
      expect(fuzzyScore('/home/guest', 'xyz')).toBe(-1);
    });

    it('should handle fuzzy sequential matches', () => {
      // 'hgt' matches h-ome/-g-uest
      const score = fuzzyScore('/home/guest', 'hgt');
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('fuzzyMatch', () => {
    it('should return true for empty query', () => {
      expect(fuzzyMatch('/any/path', '')).toBe(true);
    });

    it('should match contiguous substrings', () => {
      expect(fuzzyMatch('/home/guest/docs', 'guest')).toBe(true);
      expect(fuzzyMatch('/home/guest/docs', 'docs')).toBe(true);
    });

    it('should match sequential characters', () => {
      expect(fuzzyMatch('/home/guest', 'hgt')).toBe(true);
      expect(fuzzyMatch('/datastore', 'dsr')).toBe(true);
    });

    it('should return false for non-matching query', () => {
      expect(fuzzyMatch('/home/guest', 'xyz')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(fuzzyMatch('/Home/Guest', 'guest')).toBe(true);
      expect(fuzzyMatch('/home/guest', 'GUEST')).toBe(true);
    });
  });

  describe('filterAndRankCandidates', () => {
    const candidates = [
      { path: '/home/guest', score: 10 },
      { path: '/home/guest/documents', score: 5 },
      { path: '/etc/hosts', score: 8 },
      { path: '/tmp', score: 3 },
    ];

    it('should return all candidates for empty query', () => {
      const result = filterAndRankCandidates(candidates, '');
      expect(result).toHaveLength(4);
    });

    it('should filter out non-matching candidates', () => {
      const result = filterAndRankCandidates(candidates, 'xyz');
      expect(result).toHaveLength(0);
    });

    it('should rank exact matches higher', () => {
      const result = filterAndRankCandidates(candidates, 'guest');
      expect(result[0].path).toBe('/home/guest');
    });

    it('should sort by match quality then original score', () => {
      const result = filterAndRankCandidates(candidates, 'home');
      // Both /home/guest and /home/guest/documents match 'home'
      // They should be sorted by score (frecency) after match quality
      expect(result).toHaveLength(2);
    });

    it('should preserve original score property', () => {
      const result = filterAndRankCandidates(candidates, 'tmp');
      expect(result[0].score).toBe(3);
    });
  });

  describe('getMatchIndices', () => {
    it('should return empty indices for empty query', () => {
      const result = getMatchIndices('hello', '');
      expect(result.indices).toHaveLength(0);
    });

    it('should return contiguous indices for substring match', () => {
      const result = getMatchIndices('hello world', 'world');
      expect(result.type).toBe('contiguous');
      expect(result.indices).toEqual([6, 7, 8, 9, 10]);
    });

    it('should return type contiguous for substring matches', () => {
      const result = getMatchIndices('/home/guest', 'guest');
      expect(result.type).toBe('contiguous');
    });

    it('should return fuzzy indices when no contiguous match', () => {
      const result = getMatchIndices('hello', 'hlo');
      expect(result.type).toBe('fuzzy');
      expect(result.indices).toEqual([0, 2, 4]); // h-e-l-l-o, matches h, first l, o
    });

    it('should be case insensitive', () => {
      const result = getMatchIndices('Hello', 'ell');
      expect(result.type).toBe('contiguous');
      expect(result.indices).toEqual([1, 2, 3]);
    });
  });
});
