import { describe, it, expect, beforeEach } from 'vitest';
import { getVisibleItems, activeFilterMatches, getRecursiveSearchResults } from './viewHelpers';
import { GameState, FileNode } from '../types';
import { cloneFS, getNodeByPath } from './fsHelpers';

/**
 * Tests for viewHelpers.ts - View layer utilities
 *
 * Tests getVisibleItems (filtering, sorting, hidden files)
 * and activeFilterMatches (predicate matching on filtered items).
 */

// Create a test filesystem
const createTestFS = (): FileNode => ({
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          children: [
            { id: 'file1', name: 'readme.txt', type: 'file', content: 'Hello' },
            { id: 'file2', name: 'notes.md', type: 'file', content: 'Notes' },
            { id: 'file3', name: '.hidden', type: 'file', content: 'Secret' },
            { id: 'file4', name: '.config', type: 'dir', children: [] },
            { id: 'dir1', name: 'docs', type: 'dir', children: [] },
            { id: 'archive1', name: 'backup.zip', type: 'archive', children: [] },
          ],
        },
      ],
    },
  ],
});

// Helper to create minimal GameState for testing
const createTestState = (fs: FileNode, overrides: Partial<GameState> = {}): GameState => ({
  currentPath: ['root', 'home', 'guest'],
  cursorIndex: 0,
  clipboard: null,
  mode: 'normal',
  inputBuffer: '',
  filters: {},
  sortBy: 'natural',
  sortDirection: 'asc',
  linemode: 'size',
  history: [],
  future: [],
  previewScroll: 0,
  zoxideData: {},
  levelIndex: 0,
  fs,
  levelStartFS: fs,
  levelStartPath: ['root', 'home', 'guest'],
  notification: null,
  selectedIds: [],
  pendingDeleteIds: [],
  deleteType: null,
  pendingOverwriteNode: null,
  showHelp: false,
  showHint: false,
  hintStage: 0,
  showHidden: false,
  showInfoPanel: false,
  showEpisodeIntro: false,
  timeLeft: null,
  keystrokes: 0,
  isGameOver: false,
  stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
  settings: { soundEnabled: false },
  usedDown: false,
  usedUp: false,
  usedG: false,
  usedGG: false,
  usedGI: false,
  usedGC: false,
  usedGR: false,
  usedCtrlA: false,
  usedPreviewDown: false,
  usedPreviewUp: false,
  usedP: false,
  acceptNextKeyForSort: false,
  completedTaskIds: {},
  ignoreEpisodeIntro: false,
  threatLevel: 0,
  threatStatus: 'CALM',
  searchQuery: null,
  searchResults: [],
  usedSearch: false,
  ...overrides,
});

describe('viewHelpers', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('getVisibleItems', () => {
    it('should return empty array for invalid path', () => {
      const state = createTestState(fs, {
        currentPath: ['root', 'nonexistent'],
      });

      const items = getVisibleItems(state);
      expect(items).toEqual([]);
    });

    it('should return children of current directory', () => {
      const state = createTestState(fs);

      const items = getVisibleItems(state);
      // With showHidden=false, should exclude .hidden and .config
      expect(items.length).toBe(4); // readme.txt, notes.md, docs, backup.zip
    });

    it('should filter out hidden files when showHidden is false', () => {
      const state = createTestState(fs, { showHidden: false });

      const items = getVisibleItems(state);
      const names = items.map((n) => n.name);

      expect(names).not.toContain('.hidden');
      expect(names).not.toContain('.config');
      expect(names).toContain('readme.txt');
    });

    it('should show hidden files when showHidden is true', () => {
      const state = createTestState(fs, { showHidden: true });

      const items = getVisibleItems(state);
      const names = items.map((n) => n.name);

      expect(names).toContain('.hidden');
      expect(names).toContain('.config');
    });

    it('should apply active filter', () => {
      const state = createTestState(fs, {
        filters: { guest: 'readme' },
      });

      const items = getVisibleItems(state);
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('readme.txt');
    });

    it('should be case-insensitive when filtering', () => {
      const state = createTestState(fs, {
        filters: { guest: 'README' },
      });

      const items = getVisibleItems(state);
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('readme.txt');
    });

    it('should sort results according to sortBy', () => {
      const state = createTestState(fs, { sortBy: 'alphabetical' });

      const items = getVisibleItems(state);
      const names = items.map((n) => n.name);

      // Alphabetical sort ignores type
      expect(names).toEqual(['backup.zip', 'docs', 'notes.md', 'readme.txt']);
    });

    it('should sort with natural sorting by default (dirs first)', () => {
      const state = createTestState(fs, { sortBy: 'natural', sortDirection: 'asc' });

      const items = getVisibleItems(state);
      const types = items.map((n) => n.type);

      // Natural sort: dirs first, then archives, then files
      expect(types[0]).toBe('dir'); // docs
      expect(types[1]).toBe('archive'); // backup.zip
    });

    it('should apply both filter and hidden file logic', () => {
      const state = createTestState(fs, {
        showHidden: true,
        filters: { guest: '.' },
      });

      const items = getVisibleItems(state);
      const names = items.map((n) => n.name);

      // Only items containing '.'
      expect(names).toContain('.hidden');
      expect(names).toContain('.config');
      expect(names).toContain('readme.txt');
      expect(names).toContain('notes.md');
      expect(names).toContain('backup.zip');
      expect(names).not.toContain('docs'); // No '.' in name
    });
  });

  describe('activeFilterMatches', () => {
    it('should return false when no filter is active', () => {
      const state = createTestState(fs, { filters: {} });

      const result = activeFilterMatches(state, () => true);
      expect(result).toBe(false);
    });

    it('should return false when filter is on different directory', () => {
      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest'],
        filters: { 'other-dir': 'filter' },
      });

      const result = activeFilterMatches(state, () => true);
      expect(result).toBe(false);
    });

    it('should return true when all visible items match predicate', () => {
      const state = createTestState(fs, {
        filters: { guest: 'txt' }, // Only readme.txt matches
      });

      const result = activeFilterMatches(state, (n) => n.name.endsWith('.txt'));
      expect(result).toBe(true);
    });

    it('should return false when some items do not match predicate', () => {
      const state = createTestState(fs, {
        filters: { guest: 'e' }, // readme.txt, notes.md, backup.zip all contain 'e'
      });

      const result = activeFilterMatches(state, (n) => n.name.endsWith('.txt'));
      expect(result).toBe(false); // notes.md and backup.zip don't match
    });

    it('should return false when filter results in no visible items', () => {
      const state = createTestState(fs, {
        filters: { guest: 'nonexistent' },
      });

      const result = activeFilterMatches(state, () => true);
      expect(result).toBe(false);
    });

    it('should work with complex predicates', () => {
      const state = createTestState(fs, {
        filters: { guest: '.md' }, // Only notes.md
      });

      const result = activeFilterMatches(
        state,
        (n) => n.type === 'file' && n.name.includes('notes'),
      );
      expect(result).toBe(true);
    });
  });

  describe('getRecursiveSearchResults', () => {
    // Import valid function first (it was exported in implementation)
    // Tested function is imported at top level

    it('should return empty array for empty query', () => {
      const items = getRecursiveSearchResults(fs, '');
      expect(items).toEqual([]);
    });

    it('should find files matching query in current directory', () => {
      const items = getRecursiveSearchResults(fs, 'readme');
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('readme.txt');
    });

    it('should find files matching query in nested directories', () => {
      // Create nested file
      const root = cloneFS(fs);
      const guest = getNodeByPath(root, ['root', 'home', 'guest']);
      if (guest && guest.children) {
        guest.children[4].children = [
          {
            id: 'doc1',
            name: 'nested_readme.txt',
            type: 'file',
            content: 'Nested',
            parentId: 'dir1',
          },
        ];
      }

      const items = getRecursiveSearchResults(root, 'readme');
      expect(items.length).toBe(2);
      expect(items.some((n: FileNode) => n.name === 'readme.txt')).toBe(true);
      expect(items.some((n: FileNode) => n.name === 'nested_readme.txt')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const items = getRecursiveSearchResults(fs, 'README');
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('readme.txt');
    });

    it('should includes matching directories', () => {
      const items = getRecursiveSearchResults(fs, 'docs');
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('docs');
      expect(items[0].type).toBe('dir');
    });

    it('should respect hidden file settings (default: false)', () => {
      const items = getRecursiveSearchResults(fs, 'hidden');
      expect(items.length).toBe(0); // .hidden should be skipped
    });

    it('should show hidden files if showHidden is true', () => {
      const items = getRecursiveSearchResults(fs, 'hidden', true);
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('.hidden');
    });

    it('should search inside archives', () => {
      const root = cloneFS(fs);
      const guest = getNodeByPath(root, ['root', 'home', 'guest']);
      const archive = guest?.children?.find((c) => c.name === 'backup.zip');
      if (archive) {
        archive.children = [
          {
            id: 'archived1',
            name: 'archived_file.txt',
            type: 'file',
            content: '',
            parentId: archive.id,
          },
        ];
      }

      const items = getRecursiveSearchResults(root, 'archived');
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('archived_file.txt');
    });
  });
});
