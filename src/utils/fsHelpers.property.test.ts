import {
  assert,
  property,
  array,
  boolean,
  integer,
  record,
  constantFrom,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import {
  addNode,
  deleteNode,
  findPathById,
  getRecursiveContent,
  getNodeByPath,
  resolvePath,
} from './fsHelpers';
import { sortNodes } from './sortHelpers';
import { FileNode } from '../types';

/**
 * ADR-critical property (repo Critical Rule 1): immutability is non-negotiable.
 * fsHelpers helpers must return fresh state and never mutate the input tree.
 * Expressed as a property so any shape of tree is checked, not only the shapes
 * the example-based tests happened to write down.
 *
 * Helpers are path-addressed: `addNode(fs, parentPath, node)` and
 * `deleteNode(fs, parentPath, nodeId)`.
 */
const leaf = (id: string, name: string, type: FileNode['type']): FileNode => ({ id, name, type });

/** A root with one level of directories, each holding a file. */
const arbTree: Arbitrary<FileNode> = array(stringMatching(/^[a-z0-9]{1,4}$/), {
  minLength: 1,
  maxLength: 4,
}).map((names) => ({
  id: 'root',
  name: 'root',
  type: 'dir' as const,
  children: names.map((n, i) => ({
    id: `d${i}`,
    name: n,
    type: 'dir' as const,
    children: [leaf(`f${i}`, `${n}.txt`, 'file')],
  })),
}));

const dirPaths = (fs: FileNode): string[][] => (fs.children ?? []).map((d) => [fs.id, d.id]);

describe('property: fs helpers preserve immutability', () => {
  it('addNode returns a fresh tree and never mutates the input', () => {
    assert(
      property(arbTree, stringMatching(/^[a-z]{1,6}$/), (fs, name) => {
        const paths = dirPaths(fs);
        const parentPath = paths[0];
        const snapshot = JSON.stringify(fs);

        const result = addNode(fs, parentPath, leaf(`new-${name}`, name, 'file'));

        expect(JSON.stringify(fs)).toBe(snapshot);
        expect(result.ok).toBe(true);
        if (result.ok) expect(JSON.stringify(result.value)).not.toBe(snapshot);
      }),
      { numRuns: 200 }
    );
  });

  it('deleteNode removes exactly the addressed node and never mutates the input', () => {
    assert(
      property(arbTree, (fs) => {
        const parentPath = dirPaths(fs)[0];
        const target = fs.children!.find((d) => d.id === parentPath[1])!.children![0];
        const snapshot = JSON.stringify(fs);

        const result = deleteNode(fs, parentPath, target.id);

        expect(JSON.stringify(fs)).toBe(snapshot);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const stillThere = (result.value.children ?? [])
            .flatMap((d) => d.children ?? [])
            .some((c) => c.id === target.id);
          expect(stillThere).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('deleteNode reports NotFound rather than throwing for an absent id', () => {
    assert(
      property(arbTree, stringMatching(/^missing-[a-z]{3}$/), (fs, absent) => {
        const snapshot = JSON.stringify(fs);
        const result = deleteNode(fs, [fs.id, fs.children![0].id], absent);
        expect(result.ok).toBe(false);
        expect(JSON.stringify(fs)).toBe(snapshot);
      }),
      { numRuns: 50 }
    );
  });
});

describe('property: sortNodes ordering invariants', () => {
  const arbNodes = array(
    record({
      id: stringMatching(/^[a-z0-9]{1,6}$/),
      name: stringMatching(/^[a-z.]{1,8}$/),
      type: constantFrom('file', 'dir', 'archive') as Arbitrary<FileNode['type']>,
    }),
    { minLength: 0, maxLength: 12 }
  );

  it('is a permutation: no node is lost or duplicated', () => {
    assert(
      property(
        arbNodes,
        constantFrom('natural', 'alphabetical', 'modified', 'size', 'extension') as Arbitrary<
          Parameters<typeof sortNodes>[1]
        >,
        constantFrom('asc', 'desc') as Arbitrary<Parameters<typeof sortNodes>[2]>,
        (nodes, sortBy, dir) => {
          const snapshot = JSON.stringify(nodes);
          const sorted = sortNodes(nodes, sortBy, dir);

          expect(sorted.map((n) => n.id).sort()).toEqual(nodes.map((n) => n.id).sort());
          expect(JSON.stringify(nodes)).toBe(snapshot);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('natural mode groups directories ahead of non-directories on asc', () => {
    assert(
      property(arbNodes, (nodes) => {
        const sorted = sortNodes(nodes, 'natural', 'asc');
        const firstNonDir = sorted.findIndex((n) => n.type !== 'dir');
        if (firstNonDir === -1) return;
        expect(sorted.slice(firstNonDir).every((n) => n.type !== 'dir')).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('descending reverses ascending for the total alphabetical order', () => {
    assert(
      property(array(stringMatching(/^[a-z]{1,6}$/), { minLength: 1, maxLength: 8 }), (names) => {
        const nodes = names.map((n, i) => leaf(`n${i}`, n, 'file'));
        const asc = sortNodes(nodes, 'alphabetical', 'asc').map((n) => n.name);
        const desc = sortNodes(nodes, 'alphabetical', 'desc').map((n) => n.name);
        expect(desc).toEqual([...asc].reverse());
      }),
      { numRuns: 100 }
    );
  });
});

/* ------------------------------------------------------------------ *
 * Path algebra + recursive listing (fsHelpers)
 * ------------------------------------------------------------------ */

/**
 * Trees come from a seeded PRNG (mulberry32) so the counterexample fast-check
 * prints rebuilds the exact shape: 0-3 subdirectories and 0-4 files per
 * directory, some entries dot-prefixed, and roughly a third of the directories
 * replaced by an archive that does carry children - the shape the "archives
 * are opaque" rule needs. Names are unique, which makes resolvePath injective
 * and therefore checkable against the ground truth recorded at build time.
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
});

describe('property: getRecursiveContent lists and labels correctly', () => {
  it('labels each item with its resolved path and last id, and never leaks archive children', () => {
    assert(
      property(
        arbForest,
        array(integer({ min: 0, max: 1_000_000 }), { minLength: 1, maxLength: 5 }),
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
