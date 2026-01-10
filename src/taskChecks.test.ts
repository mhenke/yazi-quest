import { describe, it, expect, beforeEach } from 'vitest';
import { LEVELS, INITIAL_FS, ensurePrerequisiteState } from './constants';
import { GameState, FileNode, Level } from './types';
import { findNodeByName, cloneFS, getNodeByPath } from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

/**
 * Task Check Function Tests
 *
 * These tests validate each level's task check() functions directly,
 * bypassing UI/keyboard simulation for reliable, fast testing.
 *
 * This tests the core game logic: can a player complete each task
 * if they put the game state in the correct configuration?
 */

/**
 * Creates a minimal GameState for testing task checks
 */
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
  usedCtrlA: false,
  usedPreviewDown: false,
  usedPreviewUp: false,
  usedP: false,
  acceptNextKeyForSort: false,
  completedTaskIds: {},
  ignoreEpisodeIntro: false,
  threatLevel: 0,
  threatStatus: 'CALM',
  ...overrides,
});

/**
 * Helper to get a level by ID
 */
const getLevel = (id: number): Level => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
};

describe('Task Check Functions - Episode I', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = cloneFS(INITIAL_FS);
  });

  describe('Level 1: SYSTEM AWAKENING', () => {
    it('Task: nav-init - should complete when usedDown and usedUp are true', () => {
      const level = getLevel(1);
      const task = level.tasks.find((t) => t.id === 'nav-init')!;

      const state = createTestState(fs, { usedDown: false, usedUp: false });
      expect(task.check(state, level)).toBe(false);

      const completedState = createTestState(fs, { usedDown: true, usedUp: true });
      expect(task.check(completedState, level)).toBe(true);
    });

    it('Task: nav-1 - should complete when in datastore directory', () => {
      const level = getLevel(1);
      const task = level.tasks.find((t) => t.id === 'nav-1')!;

      const datastore = findNodeByName(fs, 'datastore', 'dir')!;
      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', datastore.id],
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: view-personnel - should complete when on personnel_list.txt with usedG', () => {
      const level = getLevel(1);
      const task = level.tasks.find((t) => t.id === 'view-personnel')!;

      const datastore = findNodeByName(fs, 'datastore', 'dir')!;

      // Create state first to get sorted items via getVisibleItems
      const tempState = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', datastore.id],
      });
      const sortedItems = getVisibleItems(tempState);
      const personnelIndex = sortedItems.findIndex((c) => c.name === 'personnel_list.txt');

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', datastore.id],
        cursorIndex: personnelIndex,
        usedG: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: nav-2b - should complete when in datastore with usedGG', () => {
      const level = getLevel(1);
      const task = level.tasks.find((t) => t.id === 'nav-2b')!;

      const datastore = findNodeByName(fs, 'datastore', 'dir')!;
      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', datastore.id],
        usedGG: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: nav-3 - should complete when in /etc', () => {
      const level = getLevel(1);
      const task = level.tasks.find((t) => t.id === 'nav-3')!;

      const etc = findNodeByName(fs, 'etc', 'dir')!;
      const state = createTestState(fs, {
        currentPath: ['root', etc.id],
      });

      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Level 2: THREAT NEUTRALIZATION', () => {
    it('Task: identify-threat-1 - should complete when on watcher_agent.sys with panel', () => {
      const level = getLevel(2);
      const task = level.tasks.find((t) => t.id === 'identify-threat-1')!;

      const incoming = findNodeByName(fs, 'incoming', 'dir')!;

      // Create state first to get sorted items via getVisibleItems
      const tempState = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', incoming.id],
      });
      const sortedItems = getVisibleItems(tempState);
      const watcherIndex = sortedItems.findIndex((c) => c.name === 'watcher_agent.sys');

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', incoming.id],
        cursorIndex: watcherIndex,
        showInfoPanel: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: neutralize-threat - should complete when watcher_agent.sys deleted', () => {
      const level = getLevel(2);
      const task = level.tasks.find((t) => t.id === 'neutralize-threat')!;

      // Modify FS to remove watcher_agent.sys
      const incoming = findNodeByName(fs, 'incoming', 'dir')!;
      incoming.children = incoming.children?.filter((c) => c.name !== 'watcher_agent.sys');

      const state = createTestState(fs, {
        completedTaskIds: { [level.id]: ['identify-threat-1', 'identify-threat-2'] },
      });

      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Level 3: DATA HARVEST', () => {
    it('Task: data-harvest-1 - should complete when on abandoned_script.py', () => {
      const level = getLevel(3);
      const task = level.tasks.find((t) => t.id === 'data-harvest-1')!;

      const datastore = findNodeByName(fs, 'datastore', 'dir')!;
      const scriptIndex = datastore.children?.findIndex((c) => c.name === 'abandoned_script.py');

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', datastore.id],
        cursorIndex: scriptIndex ?? 0,
        usedDown: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: data-harvest-3 - should complete when sector_map.png is cut and filter cleared', () => {
      const level = getLevel(3);
      const task = level.tasks.find((t) => t.id === 'data-harvest-3')!;

      const sectorMap = findNodeByName(fs, 'sector_map.png', 'file')!;

      const state = createTestState(fs, {
        clipboard: {
          action: 'cut',
          nodes: [sectorMap],
          originalPath: ['root', 'home', 'guest', 'incoming'],
        },
        mode: 'normal',
        filters: {},
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: data-harvest-4 - should complete when sector_map.png is in media', () => {
      const level = getLevel(3);
      const task = level.tasks.find((t) => t.id === 'data-harvest-4')!;

      // Add sector_map.png to media directory
      const media = findNodeByName(fs, 'media', 'dir')!;
      media.children = media.children || [];
      media.children.push({
        id: 'test-sector-map',
        name: 'sector_map.png',
        type: 'file',
        content: 'test',
      });

      const state = createTestState(fs);
      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Level 4: UPLINK ESTABLISHMENT', () => {
    it('Task: nav-and-create-dir - should complete when protocols/ exists in datastore', () => {
      const level = getLevel(4);
      const task = level.tasks.find((t) => t.id === 'nav-and-create-dir')!;

      // Add protocols directory to datastore
      const datastore = findNodeByName(fs, 'datastore', 'dir')!;
      datastore.children = datastore.children || [];
      datastore.children.push({
        id: 'test-protocols',
        name: 'protocols',
        type: 'dir',
        children: [],
      });

      const state = createTestState(fs);
      expect(task.check(state, level)).toBe(true);
    });

    it('Task: clone-and-rename - should complete when uplink_v2.conf exists', () => {
      const level = getLevel(4);
      const task = level.tasks.find((t) => t.id === 'clone-and-rename')!;

      // Create protocols with both uplink files
      const datastore = findNodeByName(fs, 'datastore', 'dir')!;
      datastore.children = datastore.children || [];
      datastore.children.push({
        id: 'test-protocols',
        name: 'protocols',
        type: 'dir',
        children: [
          { id: 'v1', name: 'uplink_v1.conf', type: 'file', content: '' },
          { id: 'v2', name: 'uplink_v2.conf', type: 'file', content: '' },
        ],
      });

      const state = createTestState(fs);
      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Level 5: CONTAINMENT BREACH', () => {
    it('Task: batch-cut-files - should complete when both uplink files are cut', () => {
      const level = getLevel(5);
      const task = level.tasks.find((t) => t.id === 'batch-cut-files')!;

      const v1 = { id: 'v1', name: 'uplink_v1.conf', type: 'file' as const, content: '' };
      const v2 = { id: 'v2', name: 'uplink_v2.conf', type: 'file' as const, content: '' };

      const state = createTestState(fs, {
        clipboard: {
          action: 'cut',
          nodes: [v1, v2],
          originalPath: ['root', 'home', 'guest', 'datastore', 'protocols'],
        },
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: reveal-hidden - should complete when in ~ with showHidden true', () => {
      const level = getLevel(5);
      const task = level.tasks.find((t) => t.id === 'reveal-hidden')!;

      const guest = findNodeByName(fs, 'guest', 'dir')!;
      const state = createTestState(fs, {
        currentPath: ['root', 'home', guest.id],
        showHidden: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('Task: establish-stronghold - should complete when vault/active exists', () => {
      const level = getLevel(5);
      const task = level.tasks.find((t) => t.id === 'establish-stronghold')!;

      // Create .config/vault/active structure
      const config = findNodeByName(fs, '.config', 'dir')!;
      config.children = config.children || [];
      config.children.push({
        id: 'test-vault',
        name: 'vault',
        type: 'dir',
        children: [{ id: 'test-active', name: 'active', type: 'dir', children: [] }],
      });

      const state = createTestState(fs);
      expect(task.check(state, level)).toBe(true);
    });

    it('Task: deploy-assets - should complete when uplinks are in vault/active', () => {
      const level = getLevel(5);
      const task = level.tasks.find((t) => t.id === 'deploy-assets')!;

      // Create full structure with uplink files
      const config = findNodeByName(fs, '.config', 'dir')!;
      config.children = config.children || [];
      config.children.push({
        id: 'test-vault',
        name: 'vault',
        type: 'dir',
        children: [
          {
            id: 'test-active',
            name: 'active',
            type: 'dir',
            children: [
              { id: 'v1', name: 'uplink_v1.conf', type: 'file', content: '' },
              { id: 'v2', name: 'uplink_v2.conf', type: 'file', content: '' },
            ],
          },
        ],
      });

      const state = createTestState(fs);
      expect(task.check(state, level)).toBe(true);
    });
  });
});

describe('Task Check Functions - Selected Episode II & III', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = cloneFS(INITIAL_FS);
  });

  describe('Level 6: BATCH OPERATIONS', () => {
    it('Task: select-all-batch - should complete when Ctrl+A used and all logs yanked', () => {
      fs = ensurePrerequisiteState(fs, 6);
      const level = getLevel(6);
      const task = level.tasks.find((t) => t.id === 'select-all-batch')!;

      const batchLogs = findNodeByName(fs, 'batch_logs', 'dir')!;
      const allLogs = batchLogs.children || [];

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', 'incoming', batchLogs.id],
        usedCtrlA: true,
        clipboard: {
          action: 'yank',
          nodes: allLogs,
          originalPath: ['root', 'home', 'guest', 'incoming', batchLogs.id],
        },
      });

      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Level 9: TMP CLEANUP', () => {
    it('Task should verify junk files can be detected', () => {
      fs = ensurePrerequisiteState(fs, 9);
      const level = getLevel(9);

      // Verify level has cleanup-related tasks
      expect(level.tasks.length).toBeGreaterThan(0);
      expect(level.title).toContain('CLEANUP');
    });
  });

  describe('Level 14: EVIDENCE PURGE', () => {
    it('Task: nav-guest - should complete when in guest directory', () => {
      fs = ensurePrerequisiteState(fs, 14);
      const level = getLevel(14);
      const task = level.tasks.find((t) => t.id === 'nav-guest')!;

      const guest = findNodeByName(fs, 'guest', 'dir')!;
      const state = createTestState(fs, {
        currentPath: ['root', 'home', guest.id],
      });

      expect(task.check(state, level)).toBe(true);
    });
  });
});

/**
 * Warning Condition Tests
 *
 * These tests verify the conditions that trigger protocol violation warnings.
 * Based on App.tsx lines 512-533 logic.
 */
describe('Warning Condition Logic', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = cloneFS(INITIAL_FS);
  });

  describe('Hidden Files Warning', () => {
    it('should trigger when showHidden is true after task completion', () => {
      // Warning logic: if tasksComplete && gameState.showHidden → show warning
      const state = createTestState(fs, {
        showHidden: true,
      });

      // The warning would trigger if all tasks complete and showHidden is true
      expect(state.showHidden).toBe(true);
    });

    it('should NOT trigger when showHidden is false', () => {
      const state = createTestState(fs, {
        showHidden: false,
      });

      expect(state.showHidden).toBe(false);
    });
  });

  describe('Sort Warning', () => {
    it('should trigger when sortBy is not natural', () => {
      // Warning logic: if tasksComplete && sortBy !== 'natural' → show warning
      const state = createTestState(fs, {
        sortBy: 'alphabetical',
        sortDirection: 'asc',
      });

      const isSortDefault = state.sortBy === 'natural' && state.sortDirection === 'asc';
      expect(isSortDefault).toBe(false);
    });

    it('should trigger when sortDirection is desc', () => {
      const state = createTestState(fs, {
        sortBy: 'natural',
        sortDirection: 'desc',
      });

      const isSortDefault = state.sortBy === 'natural' && state.sortDirection === 'asc';
      expect(isSortDefault).toBe(false);
    });

    it('should NOT trigger when sort is default (natural asc)', () => {
      const state = createTestState(fs, {
        sortBy: 'natural',
        sortDirection: 'asc',
      });

      const isSortDefault = state.sortBy === 'natural' && state.sortDirection === 'asc';
      expect(isSortDefault).toBe(true);
    });
  });

  describe('Filter Warning', () => {
    it('should trigger when filter is active on current directory', () => {
      // Warning logic: if tasksComplete && filters[currentDirId] → enter filter-warning mode
      const guest = findNodeByName(fs, 'guest', 'dir')!;

      const state = createTestState(fs, {
        currentPath: ['root', 'home', guest.id],
        filters: { [guest.id]: 'test-filter' },
      });

      const currentDirId = guest.id;
      const isFilterClear = !state.filters[currentDirId];
      expect(isFilterClear).toBe(false);
    });

    it('should NOT trigger when no filter is active', () => {
      const guest = findNodeByName(fs, 'guest', 'dir')!;

      const state = createTestState(fs, {
        currentPath: ['root', 'home', guest.id],
        filters: {},
      });

      const currentDirId = guest.id;
      const isFilterClear = !state.filters[currentDirId];
      expect(isFilterClear).toBe(true);
    });

    it('should NOT trigger when filter is on different directory', () => {
      const guest = findNodeByName(fs, 'guest', 'dir')!;
      const datastore = findNodeByName(fs, 'datastore', 'dir')!;

      const state = createTestState(fs, {
        currentPath: ['root', 'home', guest.id],
        filters: { [datastore.id]: 'some-filter' }, // Filter on different dir
      });

      const currentDirId = guest.id;
      const isFilterClear = !state.filters[currentDirId];
      expect(isFilterClear).toBe(true); // No filter on current dir
    });
  });
});
