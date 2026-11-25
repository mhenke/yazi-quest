import {
  assert,
  property,
  array,
  boolean,
  constantFrom,
  integer,
  option,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import {
  addNode,
  cloneSubtreeWithFreshIds,
  deleteNode,
  findNodeByName,
  findPathById,
  getAllDirectoriesWithPaths,
  getNodeByPath,
  getParentNode,
  getRecursiveContent,
  resolvePath,
} from './fsHelpers';
import { FileNode } from '../types';

/**
 * Trees come from a seeded PRNG (mulberry32) so the counterexample fast-check
 * prints rebuilds the exact shape: 0-3 subdirectories and 0-4 files per
 * directory, some entries dot-prefixed, and roughly a third of the directories
 * replaced by an archive that does carry children - the shape the "archives
 * are opaque" rule needs. Names are unique, which makes resolvePath and
 * findNodeByName injective and checkable against build-time ground truth.
 */
const prng = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Entry = { node: FileNode; path: string[]; namePath: string[] };
type Forest = { root: FileNode; entries: Entry[] };

const arbForest: Arbitrary<Forest> = integer({ min: 1, max: 2 ** 31 - 1 }).map((seed) => {
  const rand = prng(seed);
  const int = (n: number) => Math.floor(rand() * n);
  const entries: Entry[] = [];
  let next = 0;
  const make = (
    type: FileNode['type'],
    parentPath: string[],
    parentNamePath: string[],
    depth: number
  ): FileNode => {
    const base = `fnd${next}`;
    const node: FileNode = { id: `n${next++}`, name: rand() < 0.3 ? `.${base}` : base, type };
    const path = [...parentPath, node.id];
    const namePath = [...parentNamePath, node.name];
    entries.push({ node, path, namePath });
    if (type !== 'file' && depth < 4) {
      const children: FileNode[] = [];
      for (let i = int(4); i > 0; i--) {
        children.push(make(rand() < 0.33 ? 'archive' : 'dir', path, namePath, depth + 1));
      }
      for (let i = int(5); i > 0; i--) children.push(make('file', path, namePath, depth + 1));
      node.children = children;
    }
    return node;
  };
  return { root: make('dir', [], [], 0), entries };
});

const arbNonEmptyForest = arbForest.filter((f) => f.entries.length > 1);
const arbPick = integer({ min: 0, max: 1_000_000 });

/** `/name/...` for a descendant, `/` for the root, from build-time names. */
const expectedDisplay = (namePath: string[]): string =>
  namePath.length <= 1 ? '/' : `/${namePath.slice(1).join('/')}`;

/**
 * Ground truth for getRecursiveContent: every node below the start whose own
 * name is visible and whose intermediate ancestors are neither hidden nor an
 * archive. The start itself is never filtered - opening an archive lists its
 * contents, which is exactly what entering a level's directory does.
 */
const expectedRecursive = (forest: Forest, startPath: string[], showHidden: boolean): string[] => {
  const byId = new Map(forest.entries.map((e) => [e.node.id, e]));
  return forest.entries
    .filter(({ node, path }) => {
      // strict descendant of the start node
      if (path.length <= startPath.length) return false;
      if (!startPath.every((id, i) => path[i] === id)) return false;
      if (!showHidden && node.name.startsWith('.')) return false;
      return path.slice(startPath.length, -1).every((id) => {
        const anc = byId.get(id)!;
        if (anc.node.type === 'archive') return false;
        return showHidden || !anc.node.name.startsWith('.');
      });
    })
    .map((e) => e.node.id)
    .sort();
};

const collectTreeIds = (node: FileNode): string[] => {
  const ids = [node.id];
  for (const child of node.children ?? []) {
    ids.push(...collectTreeIds(child));
  }
  return ids;
};

const assertSameShape = (orig: FileNode, copy: FileNode): void => {
  expect(copy.name).toBe(orig.name);
  expect(copy.type).toBe(orig.type);
  const origChildren = orig.children ?? [];
  const copyChildren = copy.children ?? [];
  expect(copyChildren.length).toBe(origChildren.length);
  for (let i = 0; i < origChildren.length; i++) {
    expect(copyChildren[i].parentId).toBe(copy.id);
    assertSameShape(origChildren[i], copyChildren[i]);
  }
};

/* ------------------------------------------------------------------ *
 * Immutability & subtree mutations across multi-level nested trees
 * ------------------------------------------------------------------ */

describe('property: fs helpers preserve immutability', () => {
  it('addNode adds at any nested container path and never mutates the input', () => {
    assert(
      property(
        arbForest,
        arbPick,
        stringMatching(/^[a-z]{1,6}$/),
        constantFrom<'file' | 'dir'>('file', 'dir'),
        (forest, pick, name, type) => {
          const containers = forest.entries.filter((e) => e.node.type !== 'file');
          const target = containers[pick % containers.length];
          const snapshot = JSON.stringify(forest.root);
          const added: FileNode = {
            id: `added-${name}`,
            name,
            type,
            ...(type === 'dir' ? { children: [] } : {}),
          };

          const result = addNode(forest.root, target.path, added);

          expect(JSON.stringify(forest.root)).toBe(snapshot);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(JSON.stringify(result.value)).not.toBe(snapshot);
            const expectedPath = [...target.path, added.id];
            expect(findPathById(result.value, added.id)).toEqual(expectedPath);
            expect(getNodeByPath(result.value, expectedPath)).toEqual(added);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('deleteNode removes exactly the addressed nested subtree and never mutates the input', () => {
    assert(
      property(arbNonEmptyForest, arbPick, (forest, pick) => {
        const nonRoot = forest.entries.slice(1);
        const target = nonRoot[pick % nonRoot.length];
        const parentPath = target.path.slice(0, -1);
        const snapshot = JSON.stringify(forest.root);

        const result = deleteNode(forest.root, parentPath, target.node.id);

        expect(JSON.stringify(forest.root)).toBe(snapshot);
        expect(result.ok).toBe(true);
        if (result.ok) {
          for (const entry of forest.entries) {
            const isInDeletedSubtree =
              entry.path.length >= target.path.length &&
              target.path.every((id, i) => entry.path[i] === id);
            if (isInDeletedSubtree) {
              expect(findPathById(result.value, entry.node.id)).toBeUndefined();
            } else {
              expect(findPathById(result.value, entry.node.id)).toEqual(entry.path);
            }
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('deleteNode and addNode report NotFound without mutating for absent targets or parent paths', () => {
    assert(
      property(arbForest, arbPick, stringMatching(/^missing-[a-z]{3}$/), (forest, pick, absent) => {
        const containers = forest.entries.filter((e) => e.node.type !== 'file');
        const parentPath = containers[pick % containers.length].path;
        const snapshot = JSON.stringify(forest.root);

        const delMissingNode = deleteNode(forest.root, parentPath, absent);
        expect(delMissingNode).toEqual({ ok: false, error: 'NotFound' });
        expect(JSON.stringify(forest.root)).toBe(snapshot);

        const badParentPath = [forest.root.id, absent];
        const addBadParent = addNode(forest.root, badParentPath, {
          id: 'new-1',
          name: 'x',
          type: 'file',
        });
        expect(addBadParent).toEqual({ ok: false, error: 'NotFound' });
        expect(JSON.stringify(forest.root)).toBe(snapshot);
      }),
      { numRuns: 100 }
    );
  });
});

/* ------------------------------------------------------------------ *
 * Path algebra, lookup, cloning, and recursive listing (fsHelpers)
 * ------------------------------------------------------------------ */

describe('property: path algebra is self-consistent', () => {
  it('every node has a path that round-trips through getNodeByPath', () => {
    assert(
      property(arbForest, (forest) => {
        const { root, entries } = forest;
        expect(new Set(entries.map((e) => e.node.id)).size).toBe(entries.length);
        for (const { node, path, namePath } of entries) {
          const found = findPathById(root, node.id);
          expect(found).toEqual(path);
          expect(getNodeByPath(root, found)).toBe(node);
          expect(resolvePath(root, found)).toBe(expectedDisplay(namePath));
        }
      }),
      { numRuns: 200 }
    );
  });

  it('getNodeByPath returns undefined for ids outside the tree', () => {
    assert(
      property(arbForest, stringMatching(/^zz[0-9]{1,4}$/), (forest, absent) => {
        expect(findPathById(forest.root, absent)).toBeUndefined();
        expect(getNodeByPath(forest.root, [forest.root.id, absent])).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('getParentNode returns null at root/invalid paths and the exact parent for every descendant', () => {
    assert(
      property(arbForest, stringMatching(/^zz[0-9]{1,4}$/), (forest, absent) => {
        const { root, entries } = forest;
        expect(getParentNode(root, undefined)).toBeNull();
        expect(getParentNode(root, [])).toBeNull();
        expect(getParentNode(root, [root.id])).toBeNull();
        expect(getParentNode(root, [root.id, absent, 'leaf'])).toBeNull();

        for (const { node, path } of entries.slice(1)) {
          const parent = getParentNode(root, path);
          expect(parent).toBe(getNodeByPath(root, path.slice(0, -1)));
          expect(parent?.children).toContain(node);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('findNodeByName matches unique names and respects optional type filters (dir includes archive)', () => {
    assert(
      property(arbForest, stringMatching(/^missing-[a-z]{1,4}$/), (forest, absent) => {
        const { root, entries } = forest;

        for (const { node } of entries) {
          expect(findNodeByName(root, node.name)).toBe(node);
          expect(findNodeByName(root, node.name, node.type)).toBe(node);
          expect(findNodeByName(root, node.name, 'file')).toBe(
            node.type === 'file' ? node : undefined
          );
          expect(findNodeByName(root, node.name, 'archive')).toBe(
            node.type === 'archive' ? node : undefined
          );
          expect(findNodeByName(root, node.name, 'dir')).toBe(
            node.type === 'dir' || node.type === 'archive' ? node : undefined
          );
        }

        expect(findNodeByName(root, absent)).toBeUndefined();
        expect(findNodeByName(root, absent, 'file')).toBeUndefined();
        expect(findNodeByName(root, absent, 'dir')).toBeUndefined();
        expect(findNodeByName(root, absent, 'archive')).toBeUndefined();
      }),
      { numRuns: 150 }
    );
  });
});

describe('property: cloneSubtreeWithFreshIds', () => {
  it('preserves structure/name/type, mints unique fresh IDs, rewires parentId, and never mutates original', () => {
    assert(
      property(
        arbForest,
        arbPick,
        option(stringMatching(/^parent-[a-z]{1,4}$/), { nil: undefined }),
        boolean(),
        (forest, pick, parentId, preserveRootId) => {
          const target = forest.entries[pick % forest.entries.length].node;
          const snapshot = JSON.stringify(target);
          const origIds = new Set(collectTreeIds(target));

          const cloned = cloneSubtreeWithFreshIds(target, parentId, preserveRootId);

          expect(JSON.stringify(target)).toBe(snapshot);
          expect(cloned).not.toBe(target);
          expect(cloned.parentId).toBe(parentId ?? target.parentId);
          assertSameShape(target, cloned);

          const clonedIds = collectTreeIds(cloned);
          expect(new Set(clonedIds).size).toBe(clonedIds.length);

          if (preserveRootId) {
            expect(cloned.id).toBe(target.id);
            for (const descendantId of clonedIds.slice(1)) {
              expect(origIds.has(descendantId)).toBe(false);
            }
          } else {
            for (const freshId of clonedIds) {
              expect(origIds.has(freshId)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 150 }
    );
  });
});

describe('property: getAllDirectoriesWithPaths', () => {
  it('returns every non-archive-nested dir and archive with its exact path and excludes files', () => {
    assert(
      property(arbForest, (forest) => {
        const byId = new Map(forest.entries.map((e) => [e.node.id, e]));
        const expectedIds = forest.entries
          .filter(({ node, path }) => {
            if (node.type === 'file') return false;
            return path.slice(0, -1).every((ancId) => byId.get(ancId)!.node.type !== 'archive');
          })
          .map((e) => e.node.id)
          .sort();

        const dirs = getAllDirectoriesWithPaths(forest.root);

        expect(dirs.map((d) => d.node.id).sort()).toEqual(expectedIds);
        for (const { node, path } of dirs) {
          expect(node.type).not.toBe('file');
          expect(path.at(-1)).toBe(node.id);
          expect(getNodeByPath(forest.root, path)).toBe(node);
          expect(path).toEqual(byId.get(node.id)!.path);
        }

        // Archives stay opaque: no returned directory lies strictly beneath an archive.
        for (const archive of dirs.filter((d) => d.node.type === 'archive')) {
          const prefix = `${archive.path.join('/')}/`;
          expect(dirs.some((other) => other.path.join('/').startsWith(prefix))).toBe(false);
        }
      }),
      { numRuns: 150 }
    );
  });
});

describe('property: getRecursiveContent lists and labels correctly', () => {
  it('labels each item with its resolved path and last id, and never leaks archive children', () => {
    assert(
      property(
        arbForest,
        array(arbPick, { minLength: 1, maxLength: 5 }),
        boolean(),
        (forest, picks, showHidden) => {
          const containers = forest.entries.filter((e) => e.node.type !== 'file');
          const starts = picks.map((p) => containers[p % containers.length]);
          starts.unshift(forest.entries[0]);
          const byId = new Map(forest.entries.map((e) => [e.node.id, e]));
          for (const start of starts) {
            const items = getRecursiveContent(forest.root, start.path, undefined, showHidden);

            expect(items.map((i) => i.id).sort()).toEqual(
              expectedRecursive(forest, start.path, showHidden)
            );
            for (const item of items) {
              expect(item.path!.at(-1)).toBe(item.id);
              expect(item.display).toBe(resolvePath(forest.root, item.path));
              expect(item.display).toBe(expectedDisplay(byId.get(item.id)!.namePath));
              expect(getNodeByPath(forest.root, item.path)).toBe(byId.get(item.id)!.node);
            }

            // Archives stay opaque: nothing below a returned archive is listed.
            for (const archive of items.filter((i) => i.type === 'archive')) {
              const prefix = `${archive.path!.join('/')}/`;
              expect(items.some((other) => other.path!.join('/').startsWith(prefix))).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
