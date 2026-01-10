import { describe, it, expect } from 'vitest';
import { sortNodes, getSortLabel } from './sortHelpers';
import { FileNode, SortBy, SortDirection } from '../types';

/**
 * Tests for sortHelpers.ts - File sorting utilities
 *
 * Tests all 5 sort modes (natural, alphabetical, modified, size, extension)
 * in both ascending and descending directions.
 */

// Helper to create test FileNodes
const createFile = (name: string, overrides: Partial<FileNode> = {}): FileNode => ({
  id: `file-${name}`,
  name,
  type: 'file',
  content: '',
  ...overrides,
});

const createDir = (
  name: string,
  children: FileNode[] = [],
  overrides: Partial<FileNode> = {},
): FileNode => ({
  id: `dir-${name}`,
  name,
  type: 'dir',
  children,
  ...overrides,
});

const createArchive = (
  name: string,
  children: FileNode[] = [],
  overrides: Partial<FileNode> = {},
): FileNode => ({
  id: `archive-${name}`,
  name,
  type: 'archive',
  children,
  ...overrides,
});

describe('sortHelpers', () => {
  describe('sortNodes - Natural Sort', () => {
    it('should sort directories before archives before files', () => {
      const nodes: FileNode[] = [
        createFile('zfile.txt'),
        createArchive('archive.zip'),
        createDir('adir'),
        createFile('afile.txt'),
        createDir('zdir'),
      ];

      const sorted = sortNodes(nodes, 'natural', 'asc');
      const names = sorted.map((n) => n.name);

      // Dirs first (alphabetical), then archives, then files
      expect(names).toEqual(['adir', 'zdir', 'archive.zip', 'afile.txt', 'zfile.txt']);
    });

    it('should sort alphabetically within each type', () => {
      const nodes: FileNode[] = [
        createFile('zebra.txt'),
        createFile('apple.txt'),
        createFile('banana.txt'),
        createDir('zoo'),
        createDir('aardvark'),
      ];

      const sorted = sortNodes(nodes, 'natural', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['aardvark', 'zoo', 'apple.txt', 'banana.txt', 'zebra.txt']);
    });

    it('should reverse order with desc direction', () => {
      const nodes: FileNode[] = [createFile('a.txt'), createDir('b'), createFile('c.txt')];

      const sorted = sortNodes(nodes, 'natural', 'desc');
      const names = sorted.map((n) => n.name);

      // Reversed: files first (desc), then dirs
      expect(names).toEqual(['c.txt', 'a.txt', 'b']);
    });
  });

  describe('sortNodes - Alphabetical Sort', () => {
    it('should ignore type and sort purely by name', () => {
      const nodes: FileNode[] = [
        createFile('zebra.txt'),
        createDir('apple'),
        createArchive('banana.zip'),
        createFile('cherry.txt'),
      ];

      const sorted = sortNodes(nodes, 'alphabetical', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['apple', 'banana.zip', 'cherry.txt', 'zebra.txt']);
    });

    it('should reverse with desc direction', () => {
      const nodes: FileNode[] = [createFile('a.txt'), createFile('b.txt'), createFile('c.txt')];

      const sorted = sortNodes(nodes, 'alphabetical', 'desc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['c.txt', 'b.txt', 'a.txt']);
    });
  });

  describe('sortNodes - Modified Sort', () => {
    it('should sort by modification time', () => {
      const nodes: FileNode[] = [
        createFile('recent.txt', { modifiedAt: 3000 }),
        createFile('oldest.txt', { modifiedAt: 1000 }),
        createFile('middle.txt', { modifiedAt: 2000 }),
      ];

      const sorted = sortNodes(nodes, 'modified', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['oldest.txt', 'middle.txt', 'recent.txt']);
    });

    it('should fallback to name when times are equal', () => {
      const nodes: FileNode[] = [
        createFile('zebra.txt', { modifiedAt: 1000 }),
        createFile('apple.txt', { modifiedAt: 1000 }),
      ];

      const sorted = sortNodes(nodes, 'modified', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['apple.txt', 'zebra.txt']);
    });

    it('should treat missing modifiedAt as 0', () => {
      const nodes: FileNode[] = [
        createFile('has-time.txt', { modifiedAt: 1000 }),
        createFile('no-time.txt'),
      ];

      const sorted = sortNodes(nodes, 'modified', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['no-time.txt', 'has-time.txt']);
    });

    it('should reverse with desc direction', () => {
      const nodes: FileNode[] = [
        createFile('old.txt', { modifiedAt: 1000 }),
        createFile('new.txt', { modifiedAt: 2000 }),
      ];

      const sorted = sortNodes(nodes, 'modified', 'desc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['new.txt', 'old.txt']);
    });
  });

  describe('sortNodes - Size Sort', () => {
    it('should sort files by content length', () => {
      const nodes: FileNode[] = [
        createFile('large.txt', { content: 'looooooooong content' }),
        createFile('small.txt', { content: 'hi' }),
        createFile('medium.txt', { content: 'medium' }),
      ];

      const sorted = sortNodes(nodes, 'size', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['small.txt', 'medium.txt', 'large.txt']);
    });

    it('should sort directories by children count', () => {
      const nodes: FileNode[] = [
        createDir('big', [createFile('a'), createFile('b'), createFile('c')]),
        createDir('small', [createFile('x')]),
        createDir('empty', []),
      ];

      const sorted = sortNodes(nodes, 'size', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['empty', 'small', 'big']);
    });

    it('should sort archives by children count', () => {
      const nodes: FileNode[] = [
        createArchive('big.zip', [createFile('a'), createFile('b')]),
        createArchive('small.zip', [createFile('x')]),
      ];

      const sorted = sortNodes(nodes, 'size', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['small.zip', 'big.zip']);
    });

    it('should reverse with desc direction', () => {
      const nodes: FileNode[] = [
        createFile('small.txt', { content: 'hi' }),
        createFile('large.txt', { content: 'looooong' }),
      ];

      const sorted = sortNodes(nodes, 'size', 'desc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['large.txt', 'small.txt']);
    });
  });

  describe('sortNodes - Extension Sort', () => {
    it('should sort by file extension', () => {
      const nodes: FileNode[] = [
        createFile('data.json'),
        createFile('script.py'),
        createFile('readme.md'),
        createFile('config.conf'),
      ];

      const sorted = sortNodes(nodes, 'extension', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['config.conf', 'data.json', 'readme.md', 'script.py']);
    });

    it('should sort by name when extensions match', () => {
      const nodes: FileNode[] = [
        createFile('zebra.txt'),
        createFile('apple.txt'),
        createFile('banana.txt'),
      ];

      const sorted = sortNodes(nodes, 'extension', 'asc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['apple.txt', 'banana.txt', 'zebra.txt']);
    });

    it('should be case insensitive for extensions', () => {
      const nodes: FileNode[] = [createFile('A.TXT'), createFile('b.txt'), createFile('C.Txt')];

      const sorted = sortNodes(nodes, 'extension', 'asc');
      const names = sorted.map((n) => n.name);

      // All have same extension (txt), sort by name
      expect(names).toEqual(['A.TXT', 'b.txt', 'C.Txt']);
    });

    it('should handle files without extensions', () => {
      const nodes: FileNode[] = [
        createFile('Makefile'),
        createFile('script.py'),
        createFile('Dockerfile'),
      ];

      const sorted = sortNodes(nodes, 'extension', 'asc');
      // Files w/o extensions: their last segment IS the extension
      // Makefile -> "Makefile", Dockerfile -> "Dockerfile", script.py -> "py"
      // Sorting: Dockerfile, Makefile, script.py
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['Dockerfile', 'Makefile', 'script.py']);
    });

    it('should reverse with desc direction', () => {
      const nodes: FileNode[] = [createFile('a.txt'), createFile('b.json')];

      const sorted = sortNodes(nodes, 'extension', 'desc');
      const names = sorted.map((n) => n.name);

      expect(names).toEqual(['a.txt', 'b.json']);
    });
  });

  describe('sortNodes - Default Fallback', () => {
    it('should fallback to natural sort for unknown sortBy', () => {
      const nodes: FileNode[] = [createFile('file.txt'), createDir('dir')];

      // Cast to SortBy to test the default/fallback case
      const sorted = sortNodes(nodes, 'invalid' as SortBy, 'asc');
      const names = sorted.map((n) => n.name);

      // Natural sort: dir first
      expect(names).toEqual(['dir', 'file.txt']);
    });
  });

  describe('getSortLabel', () => {
    it('should return correct labels for all sort modes', () => {
      expect(getSortLabel('natural', 'asc')).toBe('Natural ↑');
      expect(getSortLabel('alphabetical', 'asc')).toBe('A-Z ↑');
      expect(getSortLabel('modified', 'asc')).toBe('Modified ↑');
      expect(getSortLabel('size', 'asc')).toBe('Size ↑');
      expect(getSortLabel('extension', 'asc')).toBe('Extension ↑');
    });

    it('should use down arrow for desc direction', () => {
      expect(getSortLabel('natural', 'desc')).toBe('Natural ↓');
      expect(getSortLabel('alphabetical', 'desc')).toBe('A-Z ↓');
      expect(getSortLabel('modified', 'desc')).toBe('Modified ↓');
      expect(getSortLabel('size', 'desc')).toBe('Size ↓');
      expect(getSortLabel('extension', 'desc')).toBe('Extension ↓');
    });

    it('should fallback to Natural for unknown sortBy', () => {
      // Cast to SortBy to test the default/fallback case
      expect(getSortLabel('invalid' as SortBy, 'asc')).toBe('Natural ↑');
    });
  });
});
