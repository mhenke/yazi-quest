import { describe, it, expect } from 'vitest';
import { cloneFS } from '../utils/fsHelpers';
import { INITIAL_FS } from '../constants';
import { simulateCompletionOfLevel } from '../utils/seedLevels';

// normalize filesystem snapshot by removing non-deterministic fields and sorting children
const normalize = (node: any): any => {
  const obj: any = {
    name: node.name,
    type: node.type,
  };
  if (node.content !== undefined) obj.content = node.content;
  if (node.children) {
    const children = node.children.map((c: any) => normalize(c));
    children.sort((a: any, b: any) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    obj.children = children;
  }
  return obj;
};

describe('simulateCompletionOfLevel idempotency', () => {
  const levelsToTest = [4, 5, 6, 7, 8, 10, 11, 15];

  levelsToTest.forEach((lvl) => {
    it(`level ${lvl} should be idempotent when applied twice`, () => {
      const base = cloneFS(INITIAL_FS);
      const once = simulateCompletionOfLevel(base, lvl);
      const twice = simulateCompletionOfLevel(once, lvl);
      expect(normalize(twice)).toEqual(normalize(once));
    });
  });

  it('sequential application order should be stable (structural equivalence)', () => {
    const base = cloneFS(INITIAL_FS);
    let a = cloneFS(base);
    let b = cloneFS(base);

    // apply levels 1..11 in order to a
    for (let i = 1; i <= 11; i++) {
      a = simulateCompletionOfLevel(a, i);
    }

    // apply same levels, but re-apply some levels mid-way to b
    for (let i = 1; i <= 11; i++) {
      b = simulateCompletionOfLevel(b, i);
      if (i === 5 || i === 8) {
        // re-applying should not change state further
        b = simulateCompletionOfLevel(b, i);
      }
    }

    expect(normalize(a)).toEqual(normalize(b));
  });
});
