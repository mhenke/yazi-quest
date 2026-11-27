import {
  assert,
  property,
  array,
  constantFrom,
  integer,
  option,
  record,
  string,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getSortLabel, sortNodes } from './sortHelpers';
import type { FileNode, SortBy, SortDirection } from '../types';

/**
 * The documented sort contract, checked pairwise against arbitrary node lists.
 * Each mode restates its own key (the spec living in sortHelpers.ts): if the
 * implementation and the spec ever drift, the property fails with a seed and a
 * counterexample instead of a fixture quietly going stale.
 */
const typeScore = (type: FileNode['type']): number =>
  type === 'dir' ? 0 : type === 'archive' ? 1 : 2;

/** Mirrors sortHelpers: dir/archive size is child count, file size is content length. */
const sizeOf = (node: FileNode): number =>
  node.type === 'dir' || node.type === 'archive'
    ? node.children?.length || 0
    : node.content?.length || 0;

const extOf = (node: FileNode): string => node.name.split('.').pop()?.toLowerCase() || '';

const arbNode = record({
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded, anchored character classes
  name: stringMatching(/^[.a-z][a-z0-9]{0,5}(\.[a-z]{1,3})?$/),
  type: constantFrom('file', 'dir', 'archive') as Arbitrary<FileNode['type']>,
  modifiedAt: option(integer({ min: 0, max: 40 }), { nil: undefined }),
  content: option(stringMatching(/^[a-z]{0,12}$/), { nil: undefined }),
  childCount: integer({ min: 0, max: 4 }),
});

// ids are assigned after generation so they stay unique per counterexample
const arbNodes = array(arbNode, { minLength: 2, maxLength: 12 }).map((nodes) =>
  nodes.map(({ name, type, modifiedAt, content, childCount }, index) => {
    const node: FileNode = { id: `n${index}`, name, type };
    if (modifiedAt !== undefined) node.modifiedAt = modifiedAt;
    if (content !== undefined) node.content = content;
    if (type !== 'file') {
      node.children = Array.from({ length: childCount }, (_, i) => ({
        id: `n${index}c${i}`,
        name: `child${i}`,
        type: 'file' as const,
      }));
    }
    return node;
  })
);

const sortBys: Arbitrary<SortBy> = constantFrom(
  'natural',
  'alphabetical',
  'modified',
  'size',
  'extension'
);

const directions: Arbitrary<SortDirection> = constantFrom('asc', 'desc');

/** Assert `cmp(a, b) <= 0` for every ordered pair of the ascending output. */
const assertPairwise = (sorted: FileNode[], cmp: (a: FileNode, b: FileNode) => number): void => {
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      expect(cmp(sorted[i], sorted[j])).toBeLessThanOrEqual(0);
    }
  }
};

describe('property: sortNodes honours its documented key per mode', () => {
  it('natural orders by type score (dir < archive < file) then name', () => {
    assert(
      property(arbNodes, (nodes) => {
        assertPairwise(sortNodes(nodes, 'natural', 'asc'), (a, b) => {
          if (typeScore(a.type) !== typeScore(b.type)) {
            return typeScore(a.type) - typeScore(b.type);
          }
          return a.name.localeCompare(b.name);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('alphabetical orders by name and ignores type', () => {
    assert(
      property(arbNodes, (nodes) => {
        assertPairwise(sortNodes(nodes, 'alphabetical', 'asc'), (a, b) =>
          a.name.localeCompare(b.name)
        );
      }),
      { numRuns: 200 }
    );
  });

  it('modified orders by modifiedAt then name, treating missing as 0', () => {
    assert(
      property(arbNodes, (nodes) => {
        assertPairwise(sortNodes(nodes, 'modified', 'asc'), (a, b) => {
          if ((a.modifiedAt || 0) !== (b.modifiedAt || 0)) {
            return (a.modifiedAt || 0) - (b.modifiedAt || 0);
          }
          return a.name.localeCompare(b.name);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('size orders by content length for files and child count for containers', () => {
    assert(
      property(arbNodes, (nodes) => {
        assertPairwise(sortNodes(nodes, 'size', 'asc'), (a, b) => sizeOf(a) - sizeOf(b));
      }),
      { numRuns: 200 }
    );
  });

  it('extension orders by lowercased trailing segment then name', () => {
    assert(
      property(arbNodes, (nodes) => {
        assertPairwise(sortNodes(nodes, 'extension', 'asc'), (a, b) => {
          if (extOf(a) !== extOf(b)) return extOf(a).localeCompare(extOf(b));
          return a.name.localeCompare(b.name);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('every mode returns a permutation of the input without mutating it', () => {
    assert(
      property(arbNodes, sortBys, directions, (nodes, sortBy, sortDirection) => {
        const snapshot = JSON.stringify(nodes);
        const ids = nodes.map((n) => n.id);
        const sorted = sortNodes(nodes, sortBy, sortDirection);

        expect(sorted).not.toBe(nodes);
        expect(sorted.length).toBe(nodes.length);
        expect(sorted.map((n) => n.id).sort()).toEqual([...ids].sort());
        // permutation, not reconstruction: the same node objects come back
        for (const node of sorted) expect(nodes).toContain(node);
        expect(JSON.stringify(nodes)).toBe(snapshot);
      }),
      { numRuns: 200 }
    );
  });

  it('size is the only mode whose ties may reorder: other modes are total on the key', () => {
    assert(
      property(arbNodes, (nodes) => {
        const asc = sortNodes(nodes, 'size', 'asc');
        const desc = sortNodes(nodes, 'size', 'desc');
        // desc is the reverse of the asc run order, so sizes still bracket
        expect(desc.length).toBe(asc.length);
        for (let i = 1; i < desc.length; i++) {
          expect(sizeOf(desc[i])).toBeLessThanOrEqual(sizeOf(desc[i - 1]));
        }
      }),
      { numRuns: 150 }
    );
  });

  it('an unknown sort mode falls back to natural ordering', () => {
    assert(
      property(arbNodes, (nodes) => {
        const fallback = sortNodes(nodes, 'bogus' as SortBy, 'asc').map((n) => n.id);
        expect(fallback).toEqual(sortNodes(nodes, 'natural', 'asc').map((n) => n.id));
      }),
      { numRuns: 100 }
    );
  });
});

const SORT_LABELS: Record<SortBy, string> = {
  natural: 'Natural',
  alphabetical: 'A-Z',
  modified: 'Modified',
  size: 'Size',
  extension: 'Extension',
};

describe('property: getSortLabel formats every sort mode and direction', () => {
  it('pairs the documented mode label with the ascending or descending arrow', () => {
    assert(
      property(sortBys, directions, (sortBy, sortDirection) => {
        const arrow = sortDirection === 'asc' ? '↑' : '↓';
        expect(getSortLabel(sortBy, sortDirection)).toBe(`${SORT_LABELS[sortBy]} ${arrow}`);
      }),
      { numRuns: 100 }
    );
  });

  it('falls back to Natural for unrecognized sort modes', () => {
    const known = new Set<string>(Object.keys(SORT_LABELS));
    assert(
      property(
        string().filter((s) => !known.has(s)),
        directions,
        (unknownMode, sortDirection) => {
          const arrow = sortDirection === 'asc' ? '↑' : '↓';
          expect(getSortLabel(unknownMode as SortBy, sortDirection)).toBe(`Natural ${arrow}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
