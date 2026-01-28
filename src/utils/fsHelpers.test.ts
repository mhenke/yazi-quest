import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNodeById,
  resolvePath,
  addNode,
  deleteNode,
  createPath,
  addNodeWithConflictResolution,
} from './fsHelpers';
import { FileNode } from '../types';

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
});
