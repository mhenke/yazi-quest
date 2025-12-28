import { describe, it, expect } from 'vitest';
import {
  addNode,
  getNodeByPath,
  cloneFS,
  createPath,
  findNodeByName,
  deleteNode,
  renameNode,
} from '../utils/fsHelpers';
import { INITIAL_FS } from '../constants';
import { FileNode } from '../types';

describe('fsHelpers.ts', () => {
  describe('addNode', () => {
    it('should correctly add a new file to an existing directory', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const newNode: FileNode = {
        id: 'new-file-id',
        name: 'test_file.txt',
        type: 'file',
        parentId: 'datastore',
        content: 'Test content',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      const result = addNode(initialFs, parentPath, newNode);

      expect(result.ok).toBe(true);
      const newFs = result.value;

      // Verify immutability
      expect(newFs).not.toBe(initialFs); // The root object should be new
      expect(getNodeByPath(initialFs, parentPath)).not.toBe(getNodeByPath(newFs, parentPath)); // Parent node should be new

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children).toBeDefined();
      expect(parentNode?.children?.some((n) => n.name === 'test_file.txt')).toBe(true);
    });

    it('should correctly add a new directory to an existing directory', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const newNode: FileNode = {
        id: 'new-dir-id',
        name: 'test_dir',
        type: 'dir',
        parentId: 'datastore',
        children: [],
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      const result = addNode(initialFs, parentPath, newNode);
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children).toBeDefined();
      expect(parentNode?.children?.some((n) => n.name === 'test_dir')).toBe(true);
    });

    it('should return an error if adding a node to an invalid path', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const invalidPath = ['root', 'non-existent', 'path'];
      const newNode: FileNode = {
        id: 'new-file-id',
        name: 'test_file.txt',
        type: 'file',
        parentId: 'non-existent',
        content: 'Test content',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      const result = addNode(initialFs, invalidPath, newNode);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('InvalidPath');
    });

    it('should return an error on collision with an existing file of the same type', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];

      // Get an existing file in datastore using findNodeByName
      const legacyDataTar = findNodeByName(initialFs, 'legacy_data.tar');
      expect(legacyDataTar).toBeDefined(); // Sanity check

      const newNode: FileNode = {
        id: 'duplicate-id',
        name: legacyDataTar!.name, // Same name as an existing file
        type: legacyDataTar!.type, // Same type as an existing file
        parentId: legacyDataTar!.parentId,
        content: 'Duplicate content',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      // Try to add the new node to the same parent path
      const result = addNode(initialFs, parentPath, newNode);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Collision');
    });
  });

  describe('deleteNode', () => {
    it('should correctly delete an existing file', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const fileToDelete = findNodeByName(initialFs, 'legacy_data.tar');
      expect(fileToDelete).toBeDefined();

      const result = deleteNode(initialFs, parentPath, fileToDelete!.id, 'delete', false, 0);
      expect(result.ok).toBe(true);
      const newFs = result.value;

      // Verify immutability
      expect(newFs).not.toBe(initialFs);
      expect(getNodeByPath(initialFs, parentPath)).not.toBe(getNodeByPath(newFs, parentPath));

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.id === fileToDelete!.id)).toBe(false);
    });

    it('should correctly delete an existing directory', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest'];
      const dirToDelete = findNodeByName(initialFs, 'datastore');
      expect(dirToDelete).toBeDefined();

      const result = deleteNode(initialFs, parentPath, dirToDelete!.id, 'delete', false, 0);
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.id === dirToDelete!.id)).toBe(false);
    });

    it('should return an error if trying to delete from an invalid parent path', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const invalidPath = ['root', 'non-existent'];
      const fileToDelete = findNodeByName(initialFs, 'legacy_data.tar');

      const result = deleteNode(initialFs, invalidPath, fileToDelete!.id, 'delete', false, 0);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('InvalidPath');
    });

    it('should return an error if the node to delete is not found', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const nonExistentId = 'non-existent-id';

      const result = deleteNode(initialFs, parentPath, nonExistentId, 'delete', false, 0);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('NotFound');
    });

    it('should return an error if trying to delete a protected node without force', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'tmp'];
      const protectedFile = findNodeByName(initialFs, 'ghost_process.pid'); // Has releaseLevel: 9
      expect(protectedFile).toBeDefined();

      // Attempt to delete it at a level where it's still protected
      const result = deleteNode(initialFs, parentPath, protectedFile!.id, 'delete', false, 0);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Protected');
    });

    it('should delete a protected node if force flag is true', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'tmp'];
      const protectedFile = findNodeByName(initialFs, 'ghost_process.pid'); // Has releaseLevel: 9
      expect(protectedFile).toBeDefined();

      const result = deleteNode(initialFs, parentPath, protectedFile!.id, 'delete', true, 0); // Force = true
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.id === protectedFile!.id)).toBe(false);
    });

    it('should delete a protected node if releaseLevel is met', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'tmp'];
      const protectedFile = findNodeByName(initialFs, 'ghost_process.pid'); // Has releaseLevel: 9
      expect(protectedFile).toBeDefined();

      const result = deleteNode(initialFs, parentPath, protectedFile!.id, 'delete', false, 9); // Level 9 meets releaseLevel
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.id === protectedFile!.id)).toBe(false);
    });
  });

  describe('renameNode', () => {
    it('should correctly rename an existing file', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const fileToRename = findNodeByName(initialFs, 'legacy_data.tar');
      expect(fileToRename).toBeDefined();

      const newName = 'renamed_file.txt';
      const result = renameNode(initialFs, parentPath, fileToRename!.id, newName, 0, false);
      expect(result.ok).toBe(true);
      const newFs = result.value;

      // Verify immutability
      expect(newFs).not.toBe(initialFs);
      expect(getNodeByPath(initialFs, parentPath)).not.toBe(getNodeByPath(newFs, parentPath));

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.name === newName)).toBe(true);
      expect(parentNode?.children?.some((n) => n.name === fileToRename!.name)).toBe(false);
    });

    it('should return an error if trying to rename from an invalid parent path', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const invalidPath = ['root', 'non-existent'];
      const fileToRename = findNodeByName(initialFs, 'legacy_data.tar');

      const result = renameNode(initialFs, invalidPath, fileToRename!.id, 'new_name.txt', 0, false);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('InvalidPath');
    });

    it('should return an error if the node to rename is not found', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const nonExistentId = 'non-existent-id';

      const result = renameNode(initialFs, parentPath, nonExistentId, 'new_name.txt', 0, false);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('NotFound');
    });

    it('should return an error on collision with an existing file of the same type (without force)', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const fileToRename = findNodeByName(initialFs, 'legacy_data.tar');
      const collisionFile = findNodeByName(initialFs, 'source_code.zip'); // Another file in the same dir
      expect(fileToRename).toBeDefined();
      expect(collisionFile).toBeDefined();

      const result = renameNode(
        initialFs,
        parentPath,
        fileToRename!.id,
        collisionFile!.name,
        0,
        false
      );
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Collision');
    });

    it('should overwrite an existing file on collision if force flag is true', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'home', 'guest', 'datastore'];
      const fileToRename = findNodeByName(initialFs, 'legacy_data.tar');
      const fileToOverwrite = findNodeByName(initialFs, 'source_code.zip');
      expect(fileToRename).toBeDefined();
      expect(fileToOverwrite).toBeDefined();

      const newName = fileToOverwrite!.name; // Will cause collision
      const result = renameNode(initialFs, parentPath, fileToRename!.id, newName, 0, true); // Force = true
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(
        parentNode?.children?.some((n) => n.name === newName && n.id === fileToRename!.id)
      ).toBe(true); // Renamed file exists
      expect(parentNode?.children?.some((n) => n.id === fileToOverwrite!.id)).toBe(false); // Original collision file is gone
    });

    it('should return an error if trying to rename a protected node without releaseLevel met', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'tmp'];
      const fileToRename = findNodeByName(initialFs, 'ghost_process.pid'); // Protected
      expect(fileToRename).toBeDefined();

      const result = renameNode(initialFs, parentPath, fileToRename!.id, 'new_name.pid', 0, false);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Protected');
    });

    it('should rename a protected node if releaseLevel is met', () => {
      const initialFs = cloneFS(INITIAL_FS);
      const parentPath = ['root', 'tmp'];
      const fileToRename = findNodeByName(initialFs, 'ghost_process.pid'); // Protected
      expect(fileToRename).toBeDefined();

      const newName = 'unlocked_ghost.pid';
      const result = renameNode(initialFs, parentPath, fileToRename!.id, newName, 9, false); // Level 9 meets releaseLevel
      expect(result.ok).toBe(true);
      const newFs = result.value;

      const parentNode = getNodeByPath(newFs, parentPath);
      expect(parentNode?.children?.some((n) => n.name === newName)).toBe(true);
      expect(parentNode?.children?.some((n) => n.name === fileToRename!.name)).toBe(false);
    });
  });
});
