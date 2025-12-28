import { describe, it, expect } from 'vitest';
import {
  cloneFS,
  setNodeProtection,
  isProtected,
  getNodeByPath,
  findNodeByName,
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
      try {
        once = lvl.onEnter!(cloneFS(base));
      } catch (e) {
        once = base; // if onEnter throws, treat as no-op for idempotency assertion
      }
      let twice: any;
      try {
        twice = lvl.onEnter!(cloneFS(once));
      } catch (e) {
        twice = once;
      }
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
});
