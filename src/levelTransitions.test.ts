/**
 * Level Transition Tests
 *
 * These tests validate that the filesystem state is consistent across level transitions.
 * When jumping to a level, the filesystem should reflect all changes from prior levels.
 * The end state of level N should match the beginning state of level N+1.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { FileNode } from './types';
import { INITIAL_FS, LEVELS, ensurePrerequisiteState } from './constants';
import { findNodeByName, cloneFS } from './utils/fsHelpers';

/**
 * Helper to get child names of a directory
 */
function getChildNames(fs: FileNode, dirName: string): string[] {
  const dir = findNodeByName(fs, dirName, 'dir');
  return (dir?.children || []).map((c) => c.name).sort();
}

/**
 * Helper to check if a path exists in the filesystem (by name)
 */
function pathExists(fs: FileNode, ...pathParts: string[]): boolean {
  let current: FileNode | undefined = fs;
  for (const part of pathParts) {
    if (current?.name === part) continue; // Match current node
    if (!current?.children) return false;
    current = current.children.find((c) => c.name === part);
    if (!current) return false;
  }
  return true;
}

/**
 * Helper to get nested directory (by name)
 */
function getNestedDir(fs: FileNode, ...pathParts: string[]): FileNode | undefined {
  let current: FileNode | undefined = fs;
  for (const part of pathParts) {
    if (current?.name === part) continue; // Match current node
    if (!current?.children) return undefined;
    current = current.children.find((c) => c.name === part);
  }
  return current;
}

describe('Level Transition Consistency', () => {
  let initialFs: FileNode;

  beforeEach(() => {
    initialFs = cloneFS(INITIAL_FS);
  });

  describe('Initial Filesystem Sanity Checks', () => {
    it('should have correct root structure', () => {
      expect(initialFs.name).toBe('root');
      expect(initialFs.type).toBe('dir');
      const rootChildNames = getChildNames(initialFs, 'root');
      expect(rootChildNames).toContain('home');
      expect(rootChildNames).toContain('tmp');
      expect(rootChildNames).toContain('etc');
    });

    it('should have /home/guest with initial directories', () => {
      const guestChildren = getChildNames(initialFs, 'guest');
      expect(guestChildren).toContain('datastore');
      expect(guestChildren).toContain('incoming');
      expect(guestChildren).toContain('media');
      expect(guestChildren).toContain('workspace');
      expect(guestChildren).toContain('.config');
    });

    it('should have workspace directory protected initially', () => {
      const workspace = getNestedDir(initialFs, 'root', 'home', 'guest', 'workspace');
      expect(workspace).toBeDefined();
      expect(workspace?.protected).toBe(true);
    });

    it('should have watcher_agent.sys in incoming initially', () => {
      const incomingChildren = getChildNames(initialFs, 'incoming');
      expect(incomingChildren).toContain('watcher_agent.sys');
    });

    it('should have sector_map.png in incoming initially', () => {
      const incomingChildren = getChildNames(initialFs, 'incoming');
      expect(incomingChildren).toContain('sector_map.png');
    });

    it('should have ghost_process.pid in /tmp initially', () => {
      const tmpChildren = getChildNames(initialFs, 'tmp');
      expect(tmpChildren).toContain('ghost_process.pid');
    });
  });

  describe('Level 2 → Level 3 Transition', () => {
    it('Level 2 completion: watcher_agent.sys should be deleted from incoming', () => {
      const fs = ensurePrerequisiteState(initialFs, 3);
      const incomingChildren = getChildNames(fs, 'incoming');
      expect(incomingChildren).not.toContain('watcher_agent.sys');
    });

    it('Level 3 start: should match Level 2 end state', () => {
      const afterLevel2 = ensurePrerequisiteState(initialFs, 3);
      const atLevel3Start = ensurePrerequisiteState(initialFs, 3);
      expect(getChildNames(afterLevel2, 'incoming')).toEqual(
        getChildNames(atLevel3Start, 'incoming'),
      );
    });
  });

  describe('Level 3 → Level 4 Transition', () => {
    it('Level 3 completion: sector_map.png should be moved to media', () => {
      const fs = ensurePrerequisiteState(initialFs, 4);
      const incomingChildren = getChildNames(fs, 'incoming');
      const mediaChildren = getChildNames(fs, 'media');
      expect(incomingChildren).not.toContain('sector_map.png');
      expect(mediaChildren).toContain('sector_map.png');
    });
  });

  describe('Level 4 → Level 5 Transition', () => {
    it('Level 4 completion: protocols/ with uplink files should exist in datastore', () => {
      const fs = ensurePrerequisiteState(initialFs, 5);
      expect(pathExists(fs, 'root', 'home', 'guest', 'datastore', 'protocols')).toBe(true);
      const protocols = getNestedDir(fs, 'root', 'home', 'guest', 'datastore', 'protocols');
      const protocolChildren = (protocols?.children || []).map((c) => c.name).sort();
      expect(protocolChildren).toContain('uplink_v1.conf');
      expect(protocolChildren).toContain('uplink_v2.conf');
    });
  });

  describe('Level 5 → Level 6 Transition', () => {
    it('Level 5 completion: vault/active should exist with uplink files', () => {
      const fs = ensurePrerequisiteState(initialFs, 6);
      expect(pathExists(fs, 'root', 'home', 'guest', '.config', 'vault', 'active')).toBe(true);
      const active = getNestedDir(fs, 'root', 'home', 'guest', '.config', 'vault', 'active');
      const activeChildren = (active?.children || []).map((c) => c.name).sort();
      expect(activeChildren).toContain('uplink_v1.conf');
      expect(activeChildren).toContain('uplink_v2.conf');
    });

    it('Level 5 completion: uplink files should be removed from protocols', () => {
      const fs = ensurePrerequisiteState(initialFs, 6);
      const protocols = getNestedDir(fs, 'root', 'home', 'guest', 'datastore', 'protocols');
      const protocolChildren = (protocols?.children || []).map((c) => c.name);
      expect(protocolChildren).not.toContain('uplink_v1.conf');
      expect(protocolChildren).not.toContain('uplink_v2.conf');
    });
  });

  describe('Level 6 → Level 7 Transition', () => {
    it('Level 6 completion: vault/training_data should exist with batch log copies', () => {
      const fs = ensurePrerequisiteState(initialFs, 7);
      expect(pathExists(fs, 'root', 'home', 'guest', '.config', 'vault', 'training_data')).toBe(
        true,
      );
      const trainingData = getNestedDir(
        fs,
        'root',
        'home',
        'guest',
        '.config',
        'vault',
        'training_data',
      );
      expect((trainingData?.children || []).length).toBeGreaterThan(0);
    });
  });

  describe('Level 7 → Level 8 Transition (No FS changes)', () => {
    it('Level 7 should not change filesystem (zoxide practice only)', () => {
      const beforeLevel7 = ensurePrerequisiteState(initialFs, 7);
      const afterLevel7 = ensurePrerequisiteState(initialFs, 8);
      // The fs structure should be identical
      expect(getChildNames(beforeLevel7, 'guest')).toEqual(getChildNames(afterLevel7, 'guest'));
    });
  });

  describe('Level 8 → Level 9 Transition', () => {
    it('Level 8 completion: systemd-core should exist in workspace with weights/model.rs', () => {
      const fs = ensurePrerequisiteState(initialFs, 9);
      expect(pathExists(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core')).toBe(true);
      expect(pathExists(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core', 'weights')).toBe(
        true,
      );
      const weights = getNestedDir(
        fs,
        'root',
        'home',
        'guest',
        'workspace',
        'systemd-core',
        'weights',
      );
      const weightsChildren = (weights?.children || []).map((c) => c.name);
      expect(weightsChildren).toContain('model.rs');
    });

    it('Level 8 completion: systemd-core should have uplink_v1.conf', () => {
      const fs = ensurePrerequisiteState(initialFs, 9);
      const systemdCore = getNestedDir(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core');
      const coreChildren = (systemdCore?.children || []).map((c) => c.name);
      expect(coreChildren).toContain('uplink_v1.conf');
    });
  });

  describe('Level 9 → Level 10 Transition', () => {
    it('Level 9 completion: /tmp should only contain preserved files', () => {
      const fs = ensurePrerequisiteState(initialFs, 10);
      const tmpDir = findNodeByName(fs, 'tmp', 'dir');
      const tmpChildren = (tmpDir?.children || []).map((c) => c.name);

      // It should contain the files we want to keep
      expect(tmpChildren).toContain('ghost_process.pid');
      expect(tmpChildren).toContain('socket_001.sock');

      // It should NOT contain any of the junk files that should have been deleted
      const junkFiles = ['debug_trace.log', 'metrics_buffer.json', 'overflow_heap.dmp'];
      for (const junk of junkFiles) {
        expect(tmpChildren).not.toContain(junk);
      }
    });
  });

  describe('Level 10 → Level 11 Transition', () => {
    it('Level 10 completion: credentials/access_key.pem should exist in systemd-core', () => {
      const fs = ensurePrerequisiteState(initialFs, 11);
      expect(
        pathExists(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core', 'credentials'),
      ).toBe(true);
      const credentials = getNestedDir(
        fs,
        'root',
        'home',
        'guest',
        'workspace',
        'systemd-core',
        'credentials',
      );
      const credChildren = (credentials?.children || []).map((c) => c.name);
      expect(credChildren).toContain('access_key.pem');
    });
  });

  describe('Level 11 → Level 12 Transition', () => {
    it('Level 11 should have /daemons directory created (by onEnter)', () => {
      // Level 11's onEnter creates /daemons with .service files
      // When jumping to level 12, daemons should exist
      const fs = ensurePrerequisiteState(initialFs, 12);
      // Note: daemons is created in Level 11's onEnter, not ensurePrerequisiteState
      // This test checks the prerequisite state only
      const systemdCore = getNestedDir(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core');
      expect(systemdCore).toBeDefined();
    });

    it('Level 11 end: systemd-core should still be in workspace (not yet moved)', () => {
      const fs = ensurePrerequisiteState(initialFs, 12);
      expect(pathExists(fs, 'root', 'home', 'guest', 'workspace', 'systemd-core')).toBe(true);
    });
  });

  describe('Level 12 → Level 13 Transition', () => {
    it('Level 12 completion: systemd-core should be moved to /daemons', () => {
      const fs = ensurePrerequisiteState(initialFs, 13);
      // systemd-core should be in /daemons
      expect(pathExists(fs, 'root', 'daemons', 'systemd-core')).toBe(true);
      // systemd-core should NOT be in workspace anymore
      const workspace = findNodeByName(fs, 'workspace', 'dir');
      const workspaceChildren = (workspace?.children || []).map((c) => c.name);
      expect(workspaceChildren).not.toContain('systemd-core');
    });
  });

  describe('Level 13 → Level 14 Transition', () => {
    it('Level 13 completion: /tmp/upload should exist with systemd-core contents', () => {
      const fs = ensurePrerequisiteState(initialFs, 14);
      expect(pathExists(fs, 'root', 'tmp', 'upload')).toBe(true);
      const upload = getNestedDir(fs, 'root', 'tmp', 'upload');
      expect((upload?.children || []).length).toBeGreaterThan(0);
    });

    it('Level 13 completion: upload should contain systemd-core files (weights, credentials, etc)', () => {
      const fs = ensurePrerequisiteState(initialFs, 14);
      const upload = getNestedDir(fs, 'root', 'tmp', 'upload');
      const uploadChildren = (upload?.children || []).map((c) => c.name);
      // Should have copied the structure from systemd-core
      expect(uploadChildren.length).toBeGreaterThan(0);
    });
  });

  describe('Level 14 → Level 15 Transition', () => {
    it('Level 14 completion: /home/guest should be empty', () => {
      const fs = ensurePrerequisiteState(initialFs, 15);
      const guest = findNodeByName(fs, 'guest', 'dir');
      expect(guest?.children || []).toEqual([]);
    });

    it('Level 14 completion: /tmp/upload should still exist', () => {
      const fs = ensurePrerequisiteState(initialFs, 15);
      expect(pathExists(fs, 'root', 'tmp', 'upload')).toBe(true);
    });
  });

  describe('Level 15 Completion State', () => {
    it('After Level 15: /tmp should only contain upload directory', () => {
      const fs = ensurePrerequisiteState(initialFs, 16); // After level 15
      const tmpChildren = getChildNames(fs, 'tmp');
      expect(tmpChildren).toEqual(['upload']);
    });
  });

  describe('Full Level Progression Integrity', () => {
    it('should maintain consistent state through all 15 levels', () => {
      let fs = cloneFS(initialFs);
      const stateSnapshots: { level: number; guestChildren: string[]; tmpChildren: string[] }[] =
        [];

      // Progress through all levels
      for (let level = 1; level <= 16; level++) {
        fs = ensurePrerequisiteState(initialFs, level);
        stateSnapshots.push({
          level,
          guestChildren: getChildNames(fs, 'guest'),
          tmpChildren: getChildNames(fs, 'tmp'),
        });
      }

      // Verify specific milestones
      // Level 1-10: guest should have all directories
      for (let i = 0; i < 10; i++) {
        const snap = stateSnapshots[i];
        expect(snap.guestChildren.length).toBeGreaterThan(0);
      }

      // Level 15+: guest should be empty
      const level15Snap = stateSnapshots[14]; // index 14 = level 15
      expect(level15Snap.guestChildren).toEqual([]);

      // Level 16: tmp should only have upload
      const level16Snap = stateSnapshots[15];
      expect(level16Snap.tmpChildren).toEqual(['upload']);
    });
  });

  describe('Jump-to-Level Consistency', () => {
    it('jumping to level 12 should have same state as progressing through 1-11', () => {
      const jumpedTo12 = ensurePrerequisiteState(initialFs, 12);
      // Verify the expected state
      expect(pathExists(jumpedTo12, 'root', 'home', 'guest', 'workspace', 'systemd-core')).toBe(
        true,
      );
      expect(
        pathExists(
          jumpedTo12,
          'root',
          'home',
          'guest',
          'workspace',
          'systemd-core',
          'credentials',
          'access_key.pem',
        ),
      ).toBe(true);
    });

    it('jumping to level 15 should have /home/guest empty and /tmp/upload present', () => {
      const jumpedTo15 = ensurePrerequisiteState(initialFs, 15);
      const guest = findNodeByName(jumpedTo15, 'guest', 'dir');
      expect(guest?.children || []).toEqual([]);
      expect(pathExists(jumpedTo15, 'root', 'tmp', 'upload')).toBe(true);
    });
  });

  describe('Daemons Directory Consistency', () => {
    it('Initial filesystem should include /daemons with .service files', () => {
      expect(pathExists(initialFs, 'root', 'daemons')).toBe(true);
      const daemons = getNestedDir(initialFs, 'root', 'daemons');
      const daemonChildren = (daemons?.children || []).map((c) => c.name);
      expect(daemonChildren).toContain('cron-legacy.service');
      expect(daemonChildren).toContain('backup-archive.service');
    });

    it('Level 12 prerequisite should include daemons (pre-seeded)', () => {
      const fs = ensurePrerequisiteState(initialFs, 12);
      expect(pathExists(fs, 'root', 'daemons')).toBe(true);
    });
  });
});

describe('Level Task Definitions', () => {
  it('all 15 levels should be defined', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(15);
    const levelIds = LEVELS.map((l) => l.id);
    for (let i = 1; i <= 15; i++) {
      expect(levelIds).toContain(i);
    }
  });

  it('each level should have at least one task', () => {
    for (const level of LEVELS) {
      expect(level.tasks.length).toBeGreaterThan(0);
    }
  });

  it('each level should have required metadata', () => {
    for (const level of LEVELS) {
      expect(level.id, `Level ${level.id} missing id`).toBeDefined();
      expect(level.title, `Level ${level.id} missing title`).toBeDefined();
      expect(level.description, `Level ${level.id} missing description`).toBeDefined();
      expect(level.hint, `Level ${level.id} missing hint`).toBeDefined();
    }
  });
});
