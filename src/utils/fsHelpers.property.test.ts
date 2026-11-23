import {
  assert,
  property,
  array,
  record,
  constantFrom,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import { addNode, deleteNode } from './fsHelpers';
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
