import { describe, it, expect, beforeEach } from 'vitest';
import {
  cloneFS,
  getNodeById,
  getNodeByPath,
  getParentNode,
  findNodeByName,
  getAllDirectories,
  getAllDirectoriesWithPaths,
  resolvePath,
  getRecursiveContent,
  deleteNode,
  addNode,
  renameNode,
  createPath,
  resolveAndCreatePath,
  addNodeWithConflictResolution,
  isProtected,
} from './fsHelpers';
import { FileNode, Level } from '../types';

/**
 * Tests for fsHelpers.ts - Core filesystem operations
 */

// Create a simple test filesystem structure
const createTestFS = (): FileNode => ({
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
              name: 'readme.txt',
              type: 'file',
              parentId: 'guest',
              content: 'Hello World',
            },
            {
              id: 'docs',
              name: 'docs',
              type: 'dir',
              parentId: 'guest',
              children: [
                {
                  id: 'file2',
                  name: 'notes.md',
                  type: 'file',
                  parentId: 'docs',
                  content: 'Notes here',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      parentId: 'root',
      children: [
        {
          id: 'hosts',
          name: 'hosts',
          type: 'file',
          parentId: 'etc',
          content: 'localhost',
          protected: true,
        },
      ],
    },
  ],
});

describe('fsHelpers - Cloning', () => {
  it('cloneFS should create a deep copy', () => {
    const fs = createTestFS();
    const clone = cloneFS(fs);

    expect(clone).toEqual(fs);
    expect(clone).not.toBe(fs);
    expect(clone.children![0]).not.toBe(fs.children![0]);
  });

  it('cloneFS modifications should not affect original', () => {
    const fs = createTestFS();
    const clone = cloneFS(fs);

    clone.children![0].name = 'MODIFIED';

    expect(fs.children![0].name).toBe('home');
    expect(clone.children![0].name).toBe('MODIFIED');
  });
});

describe('fsHelpers - Node Retrieval', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('getNodeById', () => {
    it('should find root by id', () => {
      expect(getNodeById(fs, 'root')?.name).toBe('root');
    });

    it('should find nested node by id', () => {
      expect(getNodeById(fs, 'guest')?.name).toBe('guest');
      expect(getNodeById(fs, 'file2')?.name).toBe('notes.md');
    });

    it('should return undefined for non-existent id', () => {
      expect(getNodeById(fs, 'nonexistent')).toBeUndefined();
    });

    it('should return undefined for undefined id', () => {
      expect(getNodeById(fs, undefined)).toBeUndefined();
    });
  });

  describe('getNodeByPath', () => {
    it('should find root by path', () => {
      expect(getNodeByPath(fs, ['root'])?.name).toBe('root');
    });

    it('should find nested node by path', () => {
      expect(getNodeByPath(fs, ['root', 'home', 'guest'])?.name).toBe('guest');
      expect(getNodeByPath(fs, ['root', 'home', 'guest', 'docs', 'file2'])?.name).toBe('notes.md');
    });

    it('should return undefined for invalid path', () => {
      expect(getNodeByPath(fs, ['root', 'invalid'])).toBeUndefined();
    });

    it('should return undefined for empty or undefined path', () => {
      expect(getNodeByPath(fs, [])).toBeUndefined();
      expect(getNodeByPath(fs, undefined)).toBeUndefined();
    });
  });

  describe('getParentNode', () => {
    it('should return parent for nested path', () => {
      expect(getParentNode(fs, ['root', 'home', 'guest'])?.name).toBe('home');
    });

    it('should return null for root-level path', () => {
      expect(getParentNode(fs, ['root'])).toBeNull();
    });

    it('should return null for empty path', () => {
      expect(getParentNode(fs, [])).toBeNull();
      expect(getParentNode(fs, undefined)).toBeNull();
    });
  });

  describe('findNodeByName', () => {
    it('should find node by name', () => {
      expect(findNodeByName(fs, 'guest')?.id).toBe('guest');
      expect(findNodeByName(fs, 'readme.txt')?.id).toBe('file1');
    });

    it('should filter by type', () => {
      expect(findNodeByName(fs, 'guest', 'dir')?.id).toBe('guest');
      expect(findNodeByName(fs, 'readme.txt', 'file')?.id).toBe('file1');
      expect(findNodeByName(fs, 'guest', 'file')).toBeUndefined();
    });

    it('should return undefined for non-existent name', () => {
      expect(findNodeByName(fs, 'nonexistent')).toBeUndefined();
    });
  });
});

describe('fsHelpers - Directory Listing', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('getAllDirectories', () => {
    it('should return all directories', () => {
      const dirs = getAllDirectories(fs);
      const names = dirs.map((d) => d.name);

      expect(names).toContain('root');
      expect(names).toContain('home');
      expect(names).toContain('guest');
      expect(names).toContain('docs');
      expect(names).toContain('etc');
      expect(names).not.toContain('readme.txt'); // file, not dir
    });
  });

  describe('getAllDirectoriesWithPaths', () => {
    it('should return directories with their paths', () => {
      const result = getAllDirectoriesWithPaths(fs);
      const guestEntry = result.find((r) => r.node.name === 'guest');

      expect(guestEntry).toBeDefined();
      expect(guestEntry?.path).toEqual(['root', 'home', 'guest']);
    });
  });

  describe('resolvePath', () => {
    it('should resolve path to string', () => {
      expect(resolvePath(fs, ['root', 'home', 'guest'])).toBe('/home/guest');
    });

    it('should handle root path', () => {
      expect(resolvePath(fs, ['root'])).toBe('/');
    });

    it('should handle empty path', () => {
      expect(resolvePath(fs, [])).toBe('/');
      expect(resolvePath(fs, undefined)).toBe('/');
    });
  });

  describe('getRecursiveContent', () => {
    it('should return all children recursively', () => {
      const content = getRecursiveContent(fs, ['root', 'home', 'guest']);
      const names = content.map((n) => n.name);

      expect(names).toContain('readme.txt');
      expect(names).toContain('docs');
      expect(names).toContain('notes.md');
    });

    it('should add path and display properties', () => {
      const content = getRecursiveContent(fs, ['root', 'home', 'guest']);
      const docsNode = content.find((n) => n.name === 'docs');

      expect(docsNode?.path).toBeDefined();
      expect(docsNode?.display).toContain('docs');
    });
  });
});

describe('fsHelpers - CRUD Operations', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('deleteNode', () => {
    it('should delete a node and return new FS', () => {
      const result = deleteNode(fs, ['root', 'home', 'guest'], 'file1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const guest = findNodeByName(result.value, 'guest', 'dir');
        expect(guest?.children?.find((c) => c.id === 'file1')).toBeUndefined();
      }
    });

    it('should not modify original FS', () => {
      deleteNode(fs, ['root', 'home', 'guest'], 'file1');

      const guest = findNodeByName(fs, 'guest', 'dir');
      expect(guest?.children?.find((c) => c.id === 'file1')).toBeDefined();
    });

    it('should return NotFound for non-existent node', () => {
      const result = deleteNode(fs, ['root', 'home', 'guest'], 'nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result as any).error).toBe('NotFound');
      }
    });

    it('should return NotFound for invalid parent path', () => {
      const result = deleteNode(fs, ['invalid', 'path'], 'file1');

      expect(result.ok).toBe(false);
    });
  });

  describe('addNode', () => {
    it('should add a node to parent', () => {
      const newFile: FileNode = {
        id: 'new-file',
        name: 'new.txt',
        type: 'file',
        content: 'New content',
      };

      const result = addNode(fs, ['root', 'home', 'guest'], newFile);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const guest = findNodeByName(result.value, 'guest', 'dir');
        expect(guest?.children?.find((c) => c.name === 'new.txt')).toBeDefined();
      }
    });

    it('should not modify original FS', () => {
      const newFile: FileNode = {
        id: 'new-file',
        name: 'new.txt',
        type: 'file',
      };

      addNode(fs, ['root', 'home', 'guest'], newFile);

      const guest = findNodeByName(fs, 'guest', 'dir');
      expect(guest?.children?.find((c) => c.name === 'new.txt')).toBeUndefined();
    });

    it('should return NotFound for invalid parent path', () => {
      const newFile: FileNode = { id: 'x', name: 'x', type: 'file' };
      const result = addNode(fs, ['invalid'], newFile);

      expect(result.ok).toBe(false);
    });
  });

  describe('renameNode', () => {
    it('should rename a node', () => {
      const result = renameNode(fs, ['root', 'home', 'guest'], 'file1', 'renamed.txt');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const node = getNodeById(result.value, 'file1');
        expect(node?.name).toBe('renamed.txt');
      }
    });

    it('should not modify original FS', () => {
      renameNode(fs, ['root', 'home', 'guest'], 'file1', 'renamed.txt');

      const node = getNodeById(fs, 'file1');
      expect(node?.name).toBe('readme.txt');
    });

    it('should return NotFound for non-existent node', () => {
      const result = renameNode(fs, ['root'], 'nonexistent', 'new-name');

      expect(result.ok).toBe(false);
    });
  });
});

describe('fsHelpers - Path Creation', () => {
  let fs: FileNode;

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('createPath', () => {
    it('should create a file', () => {
      const result = createPath(fs, ['root', 'home', 'guest'], 'newfile.txt');

      expect(result.error).toBeNull();
      expect(result.collision).toBe(false);
      const guest = findNodeByName(result.fs, 'guest', 'dir');
      expect(guest?.children?.find((c) => c.name === 'newfile.txt')).toBeDefined();
    });

    it('should create a directory when name ends with /', () => {
      const result = createPath(fs, ['root', 'home', 'guest'], 'newdir/');

      expect(result.error).toBeNull();
      const newDir = findNodeByName(result.fs, 'newdir', 'dir');
      expect(newDir?.type).toBe('dir');
      expect(newDir?.children).toEqual([]);
    });

    it('should detect collision with existing same-type node', () => {
      const result = createPath(fs, ['root', 'home', 'guest'], 'readme.txt');

      expect(result.collision).toBe(true);
      expect(result.collisionNode?.name).toBe('readme.txt');
    });

    it('should detect collision with existing directory', () => {
      const result = createPath(fs, ['root', 'home', 'guest'], 'docs/');

      expect(result.collision).toBe(true);
      expect(result.collisionNode?.name).toBe('docs');
    });
  });

  describe('resolveAndCreatePath', () => {
    it('should create nested directories', () => {
      const result = resolveAndCreatePath(fs, ['root', 'home', 'guest'], 'a/b/c/');

      expect(result.error).toBeNull();
      expect(result.collision).toBeFalsy();
      expect(result.targetNode?.name).toBe('c');

      // Verify path was created
      const aDir = findNodeByName(result.fs, 'a', 'dir');
      expect(aDir).toBeDefined();
      const bDir = aDir?.children?.find((c) => c.name === 'b');
      expect(bDir).toBeDefined();
    });

    it('should handle absolute paths from /', () => {
      const result = resolveAndCreatePath(fs, ['root', 'home', 'guest'], '/tmp/test/');

      expect(result.error).toBeNull();
      const tmpDir = findNodeByName(result.fs, 'tmp', 'dir');
      expect(tmpDir).toBeDefined();
    });

    it('should handle ~ paths', () => {
      const result = resolveAndCreatePath(fs, ['root'], '~/newdir/');

      expect(result.error).toBeNull();
      const guest = findNodeByName(result.fs, 'guest', 'dir');
      expect(guest?.children?.find((c) => c.name === 'newdir')).toBeDefined();
    });

    it('should return collision for existing path', () => {
      const result = resolveAndCreatePath(fs, ['root', 'home', 'guest'], 'docs/');

      expect(result.collision).toBe(true);
      expect(result.collisionNode?.name).toBe('docs');
    });
  });

  describe('addNodeWithConflictResolution', () => {
    it('should add node with unique name when collision exists', () => {
      const newFile: FileNode = {
        id: 'dup',
        name: 'readme.txt',
        type: 'file',
      };

      const result = addNodeWithConflictResolution(fs, ['root', 'home', 'guest'], newFile);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const guest = findNodeByName(result.value, 'guest', 'dir');
        expect(guest?.children?.find((c) => c.name === 'readme_1.txt')).toBeDefined();
      }
    });

    it('should handle multiple collisions', () => {
      // Add first duplicate
      const dup1: FileNode = { id: 'd1', name: 'readme.txt', type: 'file' };
      const result1 = addNodeWithConflictResolution(fs, ['root', 'home', 'guest'], dup1);

      if (!result1.ok) throw new Error('Failed to add first dup');

      // Add second duplicate
      const dup2: FileNode = { id: 'd2', name: 'readme.txt', type: 'file' };
      const result2 = addNodeWithConflictResolution(result1.value, ['root', 'home', 'guest'], dup2);

      expect(result2.ok).toBe(true);
      if (result2.ok) {
        const guest = findNodeByName(result2.value, 'guest', 'dir');
        expect(guest?.children?.find((c) => c.name === 'readme_2.txt')).toBeDefined();
      }
    });
  });
});

describe('fsHelpers - Protection', () => {
  let fs: FileNode;
  const mockLevel: Level = {
    id: 1,
    episodeId: 1,
    title: 'Test',
    hint: '',
    tasks: [],
  };

  beforeEach(() => {
    fs = createTestFS();
  });

  describe('isProtected', () => {
    it('should return message for protected node', () => {
      const hosts = findNodeByName(fs, 'hosts', 'file')!;
      const result = isProtected(fs, ['root', 'etc'], hosts, mockLevel, 'delete');

      expect(result).toContain('protected');
    });

    it('should return null for unprotected node', () => {
      const readme = findNodeByName(fs, 'readme.txt', 'file')!;
      const result = isProtected(fs, ['root', 'home', 'guest'], readme, mockLevel, 'delete');

      expect(result).toBeNull();
    });

    it('should return specific message for rename on protected node', () => {
      const hosts = findNodeByName(fs, 'hosts', 'file')!;
      const result = isProtected(fs, ['root', 'etc'], hosts, mockLevel, 'rename');

      expect(result).toContain('Re-labeling');
    });

    it('should check Level 2 watcher_agent.sys protection', () => {
      // Add watcher_agent.sys to test
      const incoming: FileNode = {
        id: 'incoming',
        name: 'incoming',
        type: 'dir',
        parentId: 'guest',
        children: [{ id: 'watcher', name: 'watcher_agent.sys', type: 'file', content: 'malware' }],
      };
      fs.children![0].children![0].children!.push(incoming);

      const watcher = findNodeByName(fs, 'watcher_agent.sys', 'file')!;
      const level2: Level = {
        id: 2,
        episodeId: 1,
        title: 'Test L2',
        hint: '',
        tasks: [{ id: 'identify-threat-2', description: '', check: () => false, completed: false }],
      };

      const result = isProtected(
        fs,
        ['root', 'home', 'guest', 'incoming'],
        watcher,
        level2,
        'delete',
      );

      expect(result).toContain('Complete threat analysis');
    });
  });
});
