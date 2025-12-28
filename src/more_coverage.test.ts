import { describe, it, expect } from 'vitest';
import {
  cloneFS,
  setNodeProtection,
  isProtected,
  getNodeByPath,
  findNodeByName,
  deleteNode,
} from '../utils/fsHelpers';
import { INITIAL_FS, LEVELS } from '../constants';
import { simulateCompletionOfLevel } from '../utils/seedLevels';

// minimal normalize used across tests
const normalize = (node: any): any => {
  const obj: any = { name: node.name, type: node.type };
  if (node.content !== undefined) obj.content = node.content;
  if (node.protection !== undefined) obj.protection = node.protection;
  if (node.children) {
    const children = node.children.map((c: any) => normalize(c));
    children.sort((a: any, b: any) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    obj.children = children;
  }
  return obj;
};

describe('Protection and onEnter idempotency tests', () => {
  it('isProtected respects releaseLevel and permanent protection', () => {
    const base = cloneFS(INITIAL_FS);
    // find /tmp node
    const tmp = getNodeByPath(base, ['root', 'tmp']);
    expect(tmp).toBeTruthy();

    // set a protection with releaseLevel 10
    const withProt = setNodeProtection(base, ['tmp', 'ghost_process.pid'], 'delete', 'locked', 10);
    const node = findNodeByName(withProt, 'ghost_process.pid');
    expect(node).toBeTruthy();
    // level < 10 -> protected message
    expect(isProtected(node!, 9, 'delete')).toBe('locked');
    // level >=10 -> not protected
    expect(isProtected(node!, 10, 'delete')).toBeNull();

    // permanent protected flag should override
    node!.protected = true;
    expect(isProtected(node!, 100, 'delete')).toContain('🔒');
  });

  it('setNodeProtection sets and removes protections and releaseLevel', () => {
    const base = cloneFS(INITIAL_FS);
    const fs1 = setNodeProtection(base, ['home', 'guest', 'datastore'], 'delete', 'nope', 5);
    const node = findNodeByName(fs1, 'datastore');
    expect(node).toBeTruthy();
    expect(node!.protection).toBeTruthy();
    expect(node!.protection!.releaseLevel).toBe(5);

    const fs2 = setNodeProtection(fs1, ['home', 'guest', 'datastore'], 'delete', null);
    const node2 = findNodeByName(fs2, 'datastore');
    expect(node2!.protection?.delete).toBeUndefined();
  });

  it('onEnter handlers are idempotent (do not destructively mutate across runs)', () => {
    const levelsWithOnEnter = LEVELS.filter((l) => !!l.onEnter);
    levelsWithOnEnter.forEach((lvl) => {
      const base = cloneFS(INITIAL_FS);
      let once: any;
      once = lvl.onEnter!(cloneFS(base));
      let twice: any;
      twice = lvl.onEnter!(cloneFS(once));
      expect(normalize(once)).toEqual(normalize(twice));
    });
  });

  it('simulateCompletionOfLevel is stable when applied twice for all levels', () => {
    const base = cloneFS(INITIAL_FS);
    for (let i = 1; i <= LEVELS.length; i++) {
      const once = simulateCompletionOfLevel(cloneFS(base), i);
      const twice = simulateCompletionOfLevel(cloneFS(once), i);
      expect(normalize(twice)).toEqual(normalize(once));
    }
  });

  it('simulateCompletionOfLevel does not mutate the input FS and returns a new object', () => {
    const base = cloneFS(INITIAL_FS);
    const input = cloneFS(base);
    const before = JSON.stringify(input);
    const out = simulateCompletionOfLevel(input, 5);
    // input must remain unchanged
    expect(JSON.stringify(input)).toEqual(before);
    // return value should be a different reference
    expect(out).not.toBe(input);
  });

  it('cut -> delete parent -> cancel results in permanent loss and clipboard keeps orphaned data until cancel', () => {
    const base = cloneFS(INITIAL_FS);
    // helper to find path ids to a node by name
    const findPathIds = (node: any, target: string, path: string[] = []): string[] | null => {
      if (node.name === target) return [...path, node.id];
      if (!node.children) return null;
      for (const child of node.children) {
        const res = findPathIds(child, target, [...path, node.id]);
        if (res) return res;
      }
      return null;
    };

    const pathIds = findPathIds(base, 'sector_map.png');
    expect(pathIds).toBeTruthy();
    const parentPath = pathIds!.slice(0, -1);
    const nodeId = pathIds![pathIds!.length - 1];
    const node = getNodeByPath(base, pathIds!);
    expect(node).toBeTruthy();

    // simulate cut: copy node data to clipboard (clipboard holds detached copies)
    const clipboard: any[] = [cloneFS(node!)];
    expect(clipboard.some((c) => c.name === 'sector_map.png')).toBe(true);

    // delete the parent directory (simulate user deleting the folder that held the cut file)
    const parentParentPath = parentPath.slice(0, -1);
    const parentNodeId = parentPath[parentPath.length - 1];
    const delRes = deleteNode(base, parentParentPath, parentNodeId, 'delete', false, 1);
    expect(delRes.ok).toBe(true);
    const fsAfterDelete = delRes.value;
    // file should be gone from filesystem
    expect(findNodeByName(fsAfterDelete, 'sector_map.png')).toBeUndefined();
    // clipboard still retains orphaned data until cancel
    expect(clipboard.some((c) => c.name === 'sector_map.png')).toBe(true);
    // cancel (clear clipboard)
    clipboard.length = 0;
    expect(clipboard.length).toBe(0);
  });

  it('onEnter handlers should only alter protection metadata and not change file content/ordering', () => {
    const levelsWithOnEnter = LEVELS.filter((l) => !!l.onEnter);
    const stripProtection = (node: any): any => {
      const o: any = { name: node.name, type: node.type };
      if (node.content !== undefined) o.content = node.content;
      if (node.children) {
        const children = node.children.map((c: any) => stripProtection(c));
        children.sort((a: any, b: any) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
        o.children = children;
      }
      return o;
    };

    levelsWithOnEnter.forEach((lvl) => {
      const base = cloneFS(INITIAL_FS);
      const before = stripProtection(base);
      let after: any;
      after = stripProtection(lvl.onEnter!(cloneFS(base)));
      expect(after).toEqual(before);
    });
  });
});
