import { describe, expect, it } from 'vitest';
import type { FileNode } from '../types';
import { dirsToLoad } from './folderCache';

const hovered: FileNode = { id: 'hovered', name: 'hovered', type: 'dir', children: [] };
const fs: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [{ id: 'current', name: 'current', type: 'dir', children: [hovered] }],
};

describe('dirsToLoad', () => {
  it('returns the current directory and a hovered child directory', () => {
    expect(dirsToLoad(fs, ['root', 'current'], hovered)).toEqual(['current', 'hovered']);
  });

  it('returns only the current directory when a file is hovered', () => {
    const file: FileNode = { id: 'file', name: 'file', type: 'file', content: '' };

    expect(dirsToLoad(fs, ['root', 'current'], file)).toEqual(['current']);
  });
});
