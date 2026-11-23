import { describe, expect, it } from 'vitest';
import type { FileNode } from '../types';
import { computeNodeBytes, countVisibleChildren, formatBytes } from './sizeHelpers';

const file = (name: string, content = ''): FileNode => ({
  id: name,
  name,
  type: 'file',
  content,
});

const dir = (name: string, children: FileNode[]): FileNode => ({
  id: name,
  name,
  type: 'dir',
  children,
});

describe('computeNodeBytes', () => {
  it('sums file content through nested directories and archives', () => {
    const archive: FileNode = {
      id: 'logs.tar',
      name: 'logs.tar',
      type: 'archive',
      children: [file('a.log', 'abc'), dir('nested', [file('b.log', 'de')])],
    };
    const root = dir('root', [file('top.txt', 'x'), archive]);

    expect(computeNodeBytes(root)).toBe(6);
  });

  it('is zero for an empty directory', () => {
    expect(computeNodeBytes(dir('empty', []))).toBe(0);
  });
});

describe('formatBytes', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatBytes(0)).toBe('0B');
    expect(formatBytes(1023)).toBe('1023B');
    expect(formatBytes(1024)).toBe('1.0K');
    expect(formatBytes(1024 * 1024)).toBe('1.0M');
  });
});

describe('countVisibleChildren', () => {
  it('counts direct children only', () => {
    expect(countVisibleChildren(dir('root', [file('a'), file('b')]), true)).toBe(2);
  });

  it('excludes dotfiles when hidden entries are off', () => {
    const root = dir('root', [file('a'), file('.secret')]);

    expect(countVisibleChildren(root, false)).toBe(1);
    expect(countVisibleChildren(root, true)).toBe(2);
  });
});
