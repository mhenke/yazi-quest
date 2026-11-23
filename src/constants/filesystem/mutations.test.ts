import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels';
import { INITIAL_FS } from './initial';
import { applyFileSystemMutations } from './mutations';
import { getLevelStartPath } from '../../utils/gameUtils';
import { findPathById, getNodeByPath } from '../../utils/fsHelpers';
import type { FileNode } from '../../types';

const clone = (fs: FileNode): FileNode => JSON.parse(JSON.stringify(fs));

const collect = (fs: FileNode): FileNode[] => {
  const out: FileNode[] = [];
  const stack = [fs];
  while (stack.length) {
    const node = stack.pop()!;
    out.push(node);
    if (node.children) stack.push(...node.children);
  }
  return out;
};

describe('level mutation invariants', () => {
  it('resolves every level start path after applying that level mutations', () => {
    for (const level of LEVELS) {
      const fs = applyFileSystemMutations(clone(INITIAL_FS), level.id);
      const path = getLevelStartPath(fs, level);
      expect(getNodeByPath(fs, path), `level ${level.id}`).toBeDefined();
      expect(findPathById(fs, path[path.length - 1]), `level ${level.id}`).toEqual(path);
    }
  });

  it('is idempotent per level', () => {
    for (const level of LEVELS) {
      const once = applyFileSystemMutations(clone(INITIAL_FS), level.id);
      const twice = applyFileSystemMutations(clone(once), level.id);
      expect(twice, `level ${level.id}`).toEqual(once);
    }
  });

  it('applying level N-1 then N matches applying N directly', () => {
    for (const level of LEVELS.slice(1)) {
      const direct = applyFileSystemMutations(clone(INITIAL_FS), level.id);
      const previous = applyFileSystemMutations(clone(INITIAL_FS), level.id - 1);
      const chained = applyFileSystemMutations(previous, level.id);
      expect(chained, `level ${level.id}`).toEqual(direct);
    }
  });

  it('has no duplicate ids after mutations', () => {
    for (const level of LEVELS) {
      const fs = applyFileSystemMutations(clone(INITIAL_FS), level.id);
      const ids = collect(fs).map((n) => n.id);
      expect(new Set(ids).size, `level ${level.id}`).toBe(ids.length);
    }
  });
});
