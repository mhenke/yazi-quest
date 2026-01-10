import { describe, it, expect, beforeEach } from 'vitest';
import { LEVELS, INITIAL_FS } from './constants';
import { GameState, FileNode, Level } from './types';
import { findNodeByName, cloneFS } from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

// Helper functions (reused from previous tests)
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
  usedShiftP: false,
  acceptNextKeyForSort: false,
  completedTaskIds: {},
  ignoreEpisodeIntro: false,
  threatLevel: 0,
  threatStatus: 'CALM',
  ...overrides,
});

const getLevel = (id: number): Level => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
};

describe('Level 8: DAEMON DISGUISE CONSTRUCTION (Simplified)', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = cloneFS(INITIAL_FS);
    // Setup Level 8 initial state
    // Ensure workspace exists (it's created in previous levels usually)
    let workspace = findNodeByName(fs, 'workspace', 'dir');
    if (!workspace) {
      const guest = findNodeByName(fs, 'guest', 'dir');
      if (!guest) throw new Error('Guest home not found');
      workspace = {
        id: 'workspace', // Explicit ID matching verify-damage test expectation if needed, though name is primary
        name: 'workspace',
        type: 'dir',
        children: [],
        parentId: guest.id,
      };
      if (!guest.children) guest.children = [];
      guest.children.push(workspace);
    }

    // Clean out systemd-core if it exists (fresh start)
    workspace.children = workspace.children?.filter((c) => c.name !== 'systemd-core') || [];

    const systemdCore = {
      id: 'systemd-core-corrupted',
      name: 'systemd-core',
      type: 'dir' as const,
      children: [
        {
          id: 'crash-dump',
          name: 'crash_dump.log',
          type: 'file' as const,
          content: '[SYSTEM CRASH DUMP]',
          parentId: 'systemd-core-corrupted',
        },
        {
          id: 'corrupted-placeholder',
          name: 'uplink_v1.conf',
          type: 'file' as const,
          content: '[CORRUPTED DATA - OVERWRITE REQUIRED]\n\nERROR 0x992: SEGMENTATION FAULT',
          parentId: 'systemd-core-corrupted',
        },
      ],
      parentId: workspace.id,
    };
    workspace.children.push(systemdCore);
  });

  describe('Task: investigate-corruption', () => {
    it('should complete when user navigates into systemd-core', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'investigate-corruption')!;
      const systemdCore = findNodeByName(fs, 'systemd-core', 'dir');
      if (!systemdCore) throw new Error('systemd-core not found in workspace for test setup');

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', 'workspace', 'systemd-core-corrupted'],
      });
      // Ensure ID matching logic works in the check function
      // (The mock state uses a manually constructed path which might not match exact ID implementation details
      // so we rely on findNodeByName logic in the task check)

      expect(task.check(state, level)).toBe(true);
    });
  });

  describe('Task: verify-damage', () => {
    it('should NOT complete if cursor is on decoy file (regression test)', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'verify-damage')!;

      const root = findNodeByName(fs, 'root')!;
      const home = findNodeByName(fs, 'home')!;
      const guest = findNodeByName(fs, 'guest')!;
      const workspace = findNodeByName(fs, 'workspace')!;

      // Use explicit ID to avoid ambiguity if findNodeByName matches something else
      const dynamicPath = [root.id, home.id, guest.id, workspace.id, 'systemd-core-corrupted'];

      const state = createTestState(fs, {
        currentPath: dynamicPath,
        cursorIndex: 0, // Pointing to crash_dump.log (alphabetically first)
      });

      expect(task.check(state, level)).toBe(false);
    });

    it('should complete when previewing correct file', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'verify-damage')!;

      const root = findNodeByName(fs, 'root')!;
      const home = findNodeByName(fs, 'home')!;
      const guest = findNodeByName(fs, 'guest')!;
      const workspace = findNodeByName(fs, 'workspace')!;

      // Use explicit ID to avoid ambiguity if findNodeByName matches something else
      const dynamicPath = [root.id, home.id, guest.id, workspace.id, 'systemd-core-corrupted'];

      const state = createTestState(fs, {
        currentPath: dynamicPath,
        cursorIndex: 1, // Pointing to uplink_v1.conf (second item)
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('should NOT complete if cursor is not on the corrupted file', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'verify-damage')!;

      const workspace = findNodeByName(fs, 'workspace', 'dir');
      if (!workspace) throw new Error('workspace not found in test setup');
      const systemdCore = workspace.children?.find((c) => c.name === 'systemd-core');
      if (!systemdCore) throw new Error('Systemd-core not found in workspace for neg test');

      systemdCore.children?.unshift({
        id: 'dummy',
        name: 'dummy',
        type: 'file',
        parentId: systemdCore.id,
      });

      const state = createTestState(fs, {
        currentPath: ['root', 'home', 'guest', 'workspace', 'systemd-core-corrupted'],
        cursorIndex: 0, // Now point to dummy
      });

      expect(task.check(state, level)).toBe(false);
    });
  });

  describe('Task: acquire-patch', () => {
    it('should complete when clean uplink_v1.conf is in clipboard', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'acquire-patch')!;

      const cleanFile: FileNode = {
        id: 'clean',
        name: 'uplink_v1.conf',
        type: 'file',
        content: 'CLEAN DATA',
        parentId: 'vault',
      };

      const state = createTestState(fs, {
        clipboard: { action: 'yank', nodes: [cleanFile], originalPath: ['mock'] },
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('should NOT complete if clipboard contains corrupted file', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'acquire-patch')!;

      const dirtyFile: FileNode = {
        id: 'dirty',
        name: 'uplink_v1.conf',
        type: 'file',
        content: 'CORRUPTED',
        parentId: 'vault',
      };

      const state = createTestState(fs, {
        clipboard: { action: 'yank', nodes: [dirtyFile], originalPath: ['mock'] },
      });

      expect(task.check(state, level)).toBe(false);
    });
  });

  describe('Task: deploy-patch', () => {
    it('should complete when file is overwritten (no corruption) and Shift+P used', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'deploy-patch')!;

      // We need to ensure the FS state reflects the overwrite
      // The check function looks in workspace -> systemd-core -> uplink_v1.conf

      // 1. Find the file in our test FS
      const workspace = findNodeByName(fs, 'workspace', 'dir');
      if (!workspace) throw new Error('Workspace missing in test setup');

      // Note: In beforeEach we append systemd-core to workspace.children
      const systemdCore = workspace.children?.find((c) => c.name === 'systemd-core');
      if (!systemdCore) throw new Error('systemd-core missing in test setup');

      const file = systemdCore.children?.find((c) => c.name === 'uplink_v1.conf');
      if (!file) throw new Error('uplink_v1.conf missing in test setup');

      // 2. "Overwrite" it
      file.content = 'CLEAN DATA';

      const state = createTestState(fs, {
        usedShiftP: true,
      });

      expect(task.check(state, level)).toBe(true);
    });

    it('should NOT complete if Shift+P was NOT used', () => {
      const level = getLevel(8);
      const task = level.tasks.find((t) => t.id === 'deploy-patch')!;

      const workspace = findNodeByName(fs, 'workspace', 'dir');
      if (!workspace) throw new Error('workspace missing in test setup');
      const systemdCore = workspace.children?.find((c) => c.name === 'systemd-core');
      if (!systemdCore) throw new Error('systemd-core missing in test setup');
      const file = systemdCore.children?.find((c) => c.name === 'uplink_v1.conf');
      if (!file) throw new Error('uplink_v1.conf missing in test setup');
      file.content = 'CLEAN DATA';

      const state = createTestState(fs, {
        usedShiftP: false,
      });

      expect(task.check(state, level)).toBe(false);
    });
  });
});
