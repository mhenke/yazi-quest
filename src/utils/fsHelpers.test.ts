import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNodeById,
  resolvePath,
  addNode,
  deleteNode,
  createPath,
  addNodeWithConflictResolution,
  findPathById,
  getNodeByPath,
  getParentNode,
  isProtected,
} from './fsHelpers';
import { FileNode, Level, LevelTask } from '../types';

describe('fsHelpers', () => {
  let root: FileNode;

  beforeEach(() => {
    // Setup a fresh file system for each test
    // Mimics a simple structure:
    // / (root)
    // ├── home
    // │   └── guest
    // │       └── test.txt
    // └── bin
    root = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [
        {
          id: 'home',
          name: 'home',
          type: 'dir',
          parentId: 'root',
          children: [
            {
              id: 'guest',
              name: 'guest',
              type: 'dir',
              parentId: 'home',
              children: [
                {
                  id: 'file1',
                  name: 'test.txt',
                  type: 'file',
                  parentId: 'guest',
                  content: 'hello'
                }
              ]
            }
          ]
        },
        {
          id: 'bin',
          name: 'bin',
          type: 'dir',
          parentId: 'root',
          children: []
        }
      ]
    };
  });

  describe('getNodeById', () => {
    it('should find the root node', () => {
      const node = getNodeById(root, 'root');
      expect(node).toBeDefined();
      expect(node?.id).toBe('root');
    });

    it('should find a nested node', () => {
      const node = getNodeById(root, 'guest');
      expect(node).toBeDefined();
      expect(node?.id).toBe('guest');
    });

    it('should return undefined for non-existent node', () => {
      const node = getNodeById(root, 'non-existent');
      expect(node).toBeUndefined();
    });

    it('should return undefined for undefined id', () => {
        const node = getNodeById(root, undefined);
        expect(node).toBeUndefined();
    });
  });

  describe('findPathById', () => {
    it('should find path to root', () => {
      const path = findPathById(root, 'root');
      expect(path).toEqual(['root']);
    });

    it('should find path to nested node', () => {
      const path = findPathById(root, 'file1');
      expect(path).toEqual(['root', 'home', 'guest', 'file1']);
    });

    it('should return undefined for non-existent node', () => {
      const path = findPathById(root, 'missing');
      expect(path).toBeUndefined();
    });
  });

  describe('getNodeByPath', () => {
    it('should return root for path with root id', () => {
        const node = getNodeByPath(root, ['root']);
        expect(node?.id).toBe('root');
    });

    it('should return nested node', () => {
        const node = getNodeByPath(root, ['root', 'home', 'guest']);
        expect(node?.id).toBe('guest');
    });

    it('should return undefined for invalid path', () => {
        const node = getNodeByPath(root, ['root', 'non-existent']);
        expect(node).toBeUndefined();
    });

    it('should return undefined for empty path array', () => {
         const node = getNodeByPath(root, []);
         expect(node).toBeUndefined();
    });
  });

  describe('getParentNode', () => {
    it('should return parent of nested node', () => {
        const parent = getParentNode(root, ['root', 'home', 'guest']);
        expect(parent?.id).toBe('home');
    });

    it('should return null for root path', () => {
        const parent = getParentNode(root, ['root']);
        expect(parent).toBeNull();
    });

    it('should return null for empty path', () => {
        const parent = getParentNode(root, []);
        expect(parent).toBeNull();
    });
  });

  describe('resolvePath', () => {
    it('should resolve root path', () => {
      const path = resolvePath(root, ['root']);
      expect(path).toBe('/');
    });

    it('should resolve nested path', () => {
      const path = resolvePath(root, ['root', 'home', 'guest']);
      expect(path).toBe('/home/guest');
    });

    it('should return / if path is empty', () => {
      const path = resolvePath(root, []);
      expect(path).toBe('/');
    });

    it('should handle undefined path', () => {
        const path = resolvePath(root, undefined);
        expect(path).toBe('/');
    });
  });

  describe('addNode', () => {
    it('should add a node to a directory', () => {
      const newNode: FileNode = {
        id: 'new-file',
        name: 'new.txt',
        type: 'file',
        parentId: 'bin'
      };

      const result = addNode(root, ['root', 'bin'], newNode);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const added = getNodeById(result.value, 'new-file');
        expect(added).toBeDefined();
        expect(added?.name).toBe('new.txt');
        // Original root should not be mutated (fsHelpers clones)
        const oldBin = getNodeById(root, 'bin');
        expect(oldBin?.children).toHaveLength(0);
      }
    });

    it('should return error if parent not found', () => {
      const newNode: FileNode = {
        id: 'new-file',
        name: 'new.txt',
        type: 'file',
        parentId: 'missing'
      };

      const result = addNode(root, ['root', 'missing'], newNode);
      expect(result.ok).toBe(false);
    });
  });

  describe('deleteNode', () => {
    it('should delete a node', () => {
      const result = deleteNode(root, ['root', 'home'], 'guest');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const deleted = getNodeById(result.value, 'guest');
        expect(deleted).toBeUndefined();
        // Original root should not be mutated
        const oldHome = getNodeById(root, 'home');
        expect(oldHome?.children).toHaveLength(1);
      }
    });

    it('should return error if parent not found', () => {
      const result = deleteNode(root, ['root', 'missing'], 'guest');
      expect(result.ok).toBe(false);
    });

    it('should return error if node not found in parent', () => {
      const result = deleteNode(root, ['root', 'home'], 'missing-child');
      expect(result.ok).toBe(false);
    });
  });

  describe('createPath', () => {
    it('should create a new file', () => {
      const result = createPath(root, ['root', 'home'], 'notes.txt');
      expect(result.error).toBeNull();
      expect(result.collision).toBe(false);

      const created = getNodeById(result.fs, result.newNodeId);
      expect(created).toBeDefined();
      expect(created?.name).toBe('notes.txt');
      expect(created?.type).toBe('file');
    });

    it('should create a new directory when name ends with /', () => {
      const result = createPath(root, ['root', 'home'], 'projects/');
      expect(result.error).toBeNull();
      expect(result.collision).toBe(false);

      const created = getNodeById(result.fs, result.newNodeId);
      expect(created).toBeDefined();
      expect(created?.name).toBe('projects');
      expect(created?.type).toBe('dir');
    });

    it('should detect collision with existing file', () => {
      // First create a file
      const setup = createPath(root, ['root', 'home'], 'notes.txt');
      const fsWithFile = setup.fs;

      // Try to create it again
      const result = createPath(fsWithFile, ['root', 'home'], 'notes.txt');
      expect(result.collision).toBe(true);
      expect(result.collisionNode?.name).toBe('notes.txt');
    });
  });

  describe('addNodeWithConflictResolution', () => {
    it('should add a node without conflict if name is unique', () => {
      const newNode: FileNode = {
        id: 'new-file',
        name: 'unique.txt',
        type: 'file',
        parentId: 'guest'
      };

      const result = addNodeWithConflictResolution(root, ['root', 'home', 'guest'], newNode);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // The helper regenerates the ID, so we look up by parent and name
        const parent = getNodeById(result.value, 'guest');
        const added = parent?.children?.find(c => c.name === 'unique.txt');
        expect(added).toBeDefined();
        expect(added?.name).toBe('unique.txt');
      }
    });

    it('should rename node with _1 suffix if name conflicts', () => {
      // Existing file is test.txt
      const newNode: FileNode = {
        id: 'conflict-file',
        name: 'test.txt',
        type: 'file',
        parentId: 'guest'
      };

      const result = addNodeWithConflictResolution(root, ['root', 'home', 'guest'], newNode);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // ID should be new generated ID, not the one passed in (fsHelpers usually regens ID on conflict add?)
        // Let's check finding by name in parent
        const parent = getNodeById(result.value, 'guest');
        const renamed = parent?.children?.find(c => c.name === 'test_1.txt');
        expect(renamed).toBeDefined();
      }
    });

    it('should increment suffix if _1 also exists', () => {
      // Add test_1.txt first
      const firstConflict: FileNode = {
        id: 'conflict-1',
        name: 'test.txt',
        type: 'file',
        parentId: 'guest'
      };
      let result = addNodeWithConflictResolution(root, ['root', 'home', 'guest'], firstConflict);
      // Now add another test.txt
      const secondConflict: FileNode = {
        id: 'conflict-2',
        name: 'test.txt',
        type: 'file',
        parentId: 'guest'
      };

      if (result.ok) {
        result = addNodeWithConflictResolution(result.value, ['root', 'home', 'guest'], secondConflict);
        expect(result.ok).toBe(true);
        if (result.ok) {
           const parent = getNodeById(result.value, 'guest');
           const renamed = parent?.children?.find(c => c.name === 'test_2.txt');
           expect(renamed).toBeDefined();
        }
      }
    });
  });

  describe('isProtected', () => {
    // Helper to create mock levels
    const createMockLevel = (id: number, tasks: LevelTask[] = []): Level => ({
      id,
      episodeId: 1,
      title: 'Mock Level',
      subtitle: 'Testing',
      lore: [],
      color: 'blue',
      tasks,
      hint: 'hint',
      // defaults
    } as unknown as Level);

    const mockNode: FileNode = {
      id: 'node1',
      name: 'some-node',
      type: 'file',
      parentId: 'root'
    };

    it('should return null for unprotected node', () => {
      const level = createMockLevel(1);
      const result = isProtected(root, [], mockNode, level, 'delete');
      expect(result).toBeNull();
    });

    it('should protect node with protected: true flag from destructive actions', () => {
      const protectedNode: FileNode = { ...mockNode, protected: true };
      const level = createMockLevel(1);

      const resultDelete = isProtected(root, [], protectedNode, level, 'delete');
      expect(resultDelete).toContain('cannot be purged');

      const resultCut = isProtected(root, [], protectedNode, level, 'cut');
      expect(resultCut).toContain('cannot be purged');

      const resultRename = isProtected(root, [], protectedNode, level, 'rename');
      expect(resultRename).toContain('immutable');
    });

    it('should allow navigation into protected node (except quarantined)', () => {
        const protectedDir: FileNode = { ...mockNode, type: 'dir', protected: true, name: 'other' };
        const level = createMockLevel(1);

        const resultEnter = isProtected(root, [], protectedDir, level, 'enter');
        expect(resultEnter).toBeNull();
    });

    it('should quarantine workspace before level 6', () => {
        const workspace: FileNode = { ...mockNode, type: 'dir', protected: true, name: 'workspace' };

        // Level 5
        const level5 = createMockLevel(5);
        expect(isProtected(root, [], workspace, level5, 'enter')).toContain('quarantined');

        // Level 6
        const level6 = createMockLevel(6);
        expect(isProtected(root, [], workspace, level6, 'enter')).toBeNull();
    });

    it('should quarantine daemons before level 11', () => {
        const daemons: FileNode = { ...mockNode, type: 'dir', protected: true, name: 'daemons' };

        // Level 10
        const level10 = createMockLevel(10);
        expect(isProtected(root, [], daemons, level10, 'enter')).toContain('restricted system area');

        // Level 11
        const level11 = createMockLevel(11);
        expect(isProtected(root, [], daemons, level11, 'enter')).toBeNull();
    });

    it('should allow cut of systemd-core in level 12', () => {
        const systemd: FileNode = { ...mockNode, protected: true, name: 'systemd-core' };
        const level12 = createMockLevel(12);

        expect(isProtected(root, [], systemd, level12, 'cut')).toBeNull();
        // Should still protect delete? Implementation says "if level.id === 12 && action === 'cut' ... return null", then falls through to "if (node.protected) ... return 'cannot be purged'".
        // So delete should still be blocked.
        expect(isProtected(root, [], systemd, level12, 'delete')).toContain('cannot be purged');
    });

    it('should protect watcher_agent.sys in level 2 until task complete', () => {
        const watcher: FileNode = { ...mockNode, name: 'watcher_agent.sys' };
        const level2 = createMockLevel(2, [
            { id: 'locate-watcher', completed: false, description: 'Locate watcher', check: () => false }
        ]);

        expect(isProtected(root, [], watcher, level2, 'delete')).toContain('Complete threat analysis first');

        // Complete the task
        level2.tasks[0].completed = true;
        expect(isProtected(root, [], watcher, level2, 'delete')).toBeNull();
    });
  });
});
