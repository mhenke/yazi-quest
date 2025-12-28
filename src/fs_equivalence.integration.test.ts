import { describe, it, expect } from 'vitest';
import { cloneFS } from '../utils/fsHelpers';
import { INITIAL_FS, LEVELS } from '../constants';
import { simulateCompletionOfLevel } from '../utils/seedLevels';

// Normalize structure by removing ids/timestamps and sorting children by name
const normalize = (node: any): any => {
  const obj: any = { name: node.name, type: node.type };
  if (node.content !== undefined) obj.content = node.content;
  if (node.children) {
    const children = node.children.map((c: any) => normalize(c));
    children.sort((a: any, b: any) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    obj.children = children;
  }
  return obj;
};

// Mimic App.tsx initializer jump-path: run onEnter for prior levels, auto-unprotect releaseLevel, then apply simulateCompletionOfLevel for each prior level
const appInitializerSim = (baseFs: any, targetIndex: number) => {
  let fs = cloneFS(baseFs);
  const jumpedToLevel = targetIndex > 0;
  const isFreshStart = false; // for jump scenarios

  if (jumpedToLevel) {
    for (let i = 0; i < targetIndex && i < LEVELS.length; i++) {
      const lvl = LEVELS[i];
      if (lvl.onEnter) {
        if (!lvl.seedMode || lvl.seedMode !== 'fresh' || isFreshStart) {
          try {
            fs = lvl.onEnter(fs);
          } catch (e) {
            // swallow for test
          }
        }
      }
    }

    // auto-unprotect pass
    const targetLevelId = LEVELS[targetIndex]?.id;
    if (typeof targetLevelId === 'number') {
      const releasePass = (node: any) => {
        if (
          node.protection &&
          typeof node.protection.releaseLevel === 'number' &&
          node.protection.releaseLevel !== -1 &&
          node.protection.releaseLevel <= targetLevelId
        ) {
          node.protection = undefined;
        }
        if (node.children) node.children.forEach(releasePass);
      };
      releasePass(fs);
    }

    // apply post-level completion simulation for each prior level
    for (let i = 0; i < targetIndex && i < LEVELS.length; i++) {
      const lvl = LEVELS[i];
      try {
        fs = simulateCompletionOfLevel(fs, lvl.id);
      } catch (e) {
        // swallow
      }
    }
  }

  return fs;
};

// Simulate a sequential playthrough: for each level, run onEnter (level start), then simulateCompletionOfLevel (complete it)
const sequentialPlaySim = (baseFs: any, targetIndex: number) => {
  let fs = cloneFS(baseFs);
  for (let i = 0; i < targetIndex && i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (lvl.onEnter) {
      try {
        fs = lvl.onEnter(fs);
      } catch (e) {
        // swallow
      }
    }
    try {
      fs = simulateCompletionOfLevel(fs, lvl.id);
    } catch (e) {
      // swallow
    }
  }
  return fs;
};

describe('FS equivalence: App initializer vs sequential playthrough', () => {
  const targets = [4, 5, 6, 8, 10, 11, 15];

  targets.forEach((target) => {
    it(`jump to level index ${target} should produce equivalent FS to sequential playthrough up to that level`, () => {
      const base = cloneFS(INITIAL_FS);
      const appFs = appInitializerSim(base, target);
      const playFs = sequentialPlaySim(base, target);

      expect(normalize(appFs)).toEqual(normalize(playFs));
    });
  });
});
