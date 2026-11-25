import {
  assert,
  property,
  array,
  boolean,
  constantFrom,
  oneof,
  string,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getFilterRegex, getRecursiveSearchResults, getVisibleItems } from './viewHelpers';
import { sortNodes } from './sortHelpers';
import type { FileNode, GameState, SortBy, SortDirection } from '../types';

/**
 * Hidden-file handling has two entry points: the search that captures a
 * snapshot (getRecursiveSearchResults) and the render path that consumes it
 * later (getVisibleItems). Both are checked against fixtures whose
 * dot-prefixed entries sit at several depths, and against archives that really
 * do contain matches - so a leak can only hide if the generator failed to
 * produce one, and it always does.
 */

/** `arc` / `.arc` mark archives: listed, never descended into. */
const arbSegment: Arbitrary<string> = constantFrom(
  'needle',
  '.needle',
  'dir',
  '.hidden',
  'plain.txt',
  'arc',
  '.arc',
  '.deepneedle'
);

/** Mixed-case segments to exercise smart-case filter sensitivity. */
const arbMixedSegment: Arbitrary<string> = constantFrom(
  'needle',
  'Needle',
  '.needle',
  '.Needle',
  'readme.md',
  'README.md',
  'dir',
  'Dir',
  '.Hidden',
  'App_1.ts'
);

/** Each array is one root-to-leaf chain; shared prefixes collapse into one node. */
const arbChains = array(array(arbSegment, { minLength: 1, maxLength: 3 }), {
  minLength: 2,
  maxLength: 8,
});

const arbMixedChains = array(array(arbMixedSegment, { minLength: 1, maxLength: 2 }), {
  minLength: 2,
  maxLength: 8,
});

const arbMalformedOrAnyPattern: Arbitrary<string> = oneof(
  string(),
  constantFrom(
    '',
    '[unclosed',
    '(abc',
    '*bad',
    '\\',
    '(?invalid)',
    'a\\',
    '+++',
    '...',
    '^$',
    '\\\\A',
    '\\A',
    'Needle',
    'needle'
  )
);

const upsertChild = (
  parent: FileNode,
  name: string,
  last: boolean,
  archive: boolean,
  nextId: number
): { node: FileNode; nextId: number } => {
  let node = parent.children!.find((c) => c.name === name);

  if (!node) {
    node = {
      id: `x${nextId}`,
      name,
      type: archive ? 'archive' : last ? 'file' : 'dir',
    };
    parent.children!.push(node);
    nextId++;
  } else if (node.type === 'file') {
    // a longer chain extends an earlier leaf: promote it to a container
    node.type = archive ? 'archive' : 'dir';
  }

  if (archive || !last) node.children ??= [];
  return { node, nextId };
};

const insertChain = (root: FileNode, chain: string[], startId: number): number => {
  let next = startId;
  let parent = root;

  for (let depth = 0; depth < chain.length; depth++) {
    const name = chain[depth];
    const result = upsertChild(
      parent,
      name,
      depth === chain.length - 1,
      name === 'arc' || name === '.arc',
      next
    );
    parent = result.node;
    next = result.nextId;
  }
  return next;
};

const buildTree = (chains: string[][]): FileNode => {
  const root: FileNode = { id: 'root', name: 'root', type: 'dir', children: [] };
  let next = 0;
  for (const chain of chains) next = insertChain(root, chain, next);
  return root;
};

/** Query paired with the exact set of display paths it selects. */
const arbQuery = constantFrom(
  { pattern: 'needle', hit: (path: string) => path.includes('needle') },
  { pattern: '.', hit: (path: string) => path.length > 0 },
  { pattern: '^[.]', hit: (path: string) => path.startsWith('.') },
  { pattern: 'NEEDLE', hit: () => false }
);

/** Independent ground truth: visible descendants, archives opaque, then the query. */
const expectedPaths = (
  node: FileNode,
  prefix: string,
  showHidden: boolean,
  hit: (path: string) => boolean
): string[] => {
  const out: string[] = [];
  for (const child of node.children ?? []) {
    if (!showHidden && child.name.startsWith('.')) continue;
    const displayPath = prefix ? `${prefix}/${child.name}` : child.name;
    if (hit(displayPath)) out.push(displayPath);
    if (child.type !== 'archive') out.push(...expectedPaths(child, displayPath, showHidden, hit));
  }
  return out;
};

const sorted = (values: string[]): string[] => [...values].sort();

const isHiddenResult = (item: FileNode): boolean =>
  item.displayPath!.split('/').some((seg) => seg.startsWith('.'));

describe('property: recursive search honours showHidden at every depth', () => {
  it('showHidden=false returns no result whose path has a dot-prefixed segment', () => {
    assert(
      property(arbChains, arbQuery, (chains, query) => {
        const root = buildTree(chains);
        const results = getRecursiveSearchResults(root, query.pattern, false);

        expect(sorted(results.map((r) => r.displayPath!))).toEqual(
          sorted(expectedPaths(root, '', false, query.hit))
        );
        for (const result of results) {
          expect(isHiddenResult(result)).toBe(false);
          expect(result.path!.at(-1)).toBe(result.id);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('showHidden=true includes hidden matches and never descends into an archive', () => {
    assert(
      property(arbChains, arbQuery, (chains, query) => {
        const root = buildTree(chains);
        const withHidden = getRecursiveSearchResults(root, query.pattern, true);
        const hiddenOff = getRecursiveSearchResults(root, query.pattern, false);
        const expected = sorted(expectedPaths(root, '', true, query.hit));

        expect(sorted(withHidden.map((r) => r.displayPath!))).toEqual(expected);
        expect(withHidden.length).toBeGreaterThanOrEqual(hiddenOff.length);

        // A fixture holding hidden matches must actually surface them.
        const hidden = expected.filter((p) => p.split('/').some((s) => s.startsWith('.')));
        if (hidden.length) {
          expect(withHidden.map((r) => r.displayPath!)).toContain(hidden[0]);
          expect(hiddenOff.map((r) => r.displayPath!)).not.toContain(hidden[0]);
        }
        for (const archive of withHidden.filter((r) => r.type === 'archive')) {
          const prefix = `${archive.displayPath!}/`;
          expect(withHidden.some((r) => r.displayPath!.startsWith(prefix))).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('searching from a subdirectory reports paths relative to that directory', () => {
    assert(
      property(arbChains, arbQuery, boolean(), (chains, query, showHidden) => {
        const root = buildTree(chains);
        const dirs = (root.children ?? []).filter((c) => c.type === 'dir' && c.children?.length);
        if (!dirs.length) return;
        const start = dirs[0];

        const results = getRecursiveSearchResults(root, query.pattern, showHidden, [
          root.id,
          start.id,
        ]);
        expect(sorted(results.map((r) => r.displayPath!))).toEqual(
          sorted(expectedPaths(start, '', showHidden, query.hit))
        );
      }),
      { numRuns: 200 }
    );
  });

  it('never throws on arbitrary or malformed query strings and never leaks hidden files when showHidden=false', () => {
    assert(
      property(arbChains, arbMalformedOrAnyPattern, boolean(), (chains, query, showHidden) => {
        const root = buildTree(chains);
        const results = getRecursiveSearchResults(root, query, showHidden);
        const regex = getFilterRegex(query);

        if (!regex) {
          expect(results).toEqual([]);
          return;
        }

        for (const result of results) {
          expect(result.path!.at(-1)).toBe(result.id);
          expect(regex.test(result.displayPath!)).toBe(true);
          if (!showHidden) {
            expect(isHiddenResult(result)).toBe(false);
          }
        }
        for (const archive of results.filter((r) => r.type === 'archive')) {
          const prefix = `${archive.displayPath!}/`;
          expect(results.some((r) => r.displayPath!.startsWith(prefix))).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });
});

const arbSortBy: Arbitrary<SortBy> = constantFrom(
  'natural',
  'alphabetical',
  'modified',
  'size',
  'extension'
);
const arbDirection: Arbitrary<SortDirection> = constantFrom('asc', 'desc');

const baseState = (fs: FileNode, overrides: Partial<GameState>): GameState =>
  ({
    fs,
    currentPath: [fs.id],
    searchQuery: null,
    searchResults: [],
    filters: {},
    sortBy: 'natural',
    sortDirection: 'asc',
    showHidden: false,
    ...overrides,
  }) as unknown as GameState;

describe('property: getVisibleItems re-filters a stale search snapshot', () => {
  it('drops hidden results when showHidden=false and retains them when true', () => {
    assert(
      property(arbChains, arbQuery, arbSortBy, (chains, query, sortBy) => {
        const root = buildTree(chains);
        // Snapshot captured while hidden files were shown - the stale case.
        const snapshot = getRecursiveSearchResults(root, query.pattern, true);
        const ordered = sortNodes(snapshot, sortBy, 'asc');
        const state = baseState(root, {
          searchQuery: query.pattern,
          searchResults: snapshot,
          sortBy,
        });

        const off = getVisibleItems({ ...state, showHidden: false });
        const on = getVisibleItems({ ...state, showHidden: true });

        // showHidden=true keeps the whole snapshot, in the sorted order.
        expect(on.map((i) => i.id)).toEqual(ordered.map((i) => i.id));
        // showHidden=false is exactly that same order with hidden rows removed.
        expect(off.map((i) => i.id)).toEqual(
          ordered.filter((i) => !isHiddenResult(i)).map((i) => i.id)
        );
        for (const item of off) expect(isHiddenResult(item)).toBe(false);
      }),
      { numRuns: 150 }
    );
  });

  it('non-search mode returns the sorted visible subset of the current directory', () => {
    assert(
      property(
        arbChains,
        arbSortBy,
        arbDirection,
        boolean(),
        (chains, sortBy, sortDirection, showHidden) => {
          const root = buildTree(chains);
          const children = root.children ?? [];
          const visible = showHidden ? children : children.filter((c) => !c.name.startsWith('.'));

          const items = getVisibleItems(baseState(root, { sortBy, sortDirection, showHidden }));
          const expectedOrder = sortNodes(visible, sortBy, sortDirection).map((n) => n.id);

          expect(items.map((i) => i.id)).toEqual(expectedOrder);
          for (const item of items) expect(children).toContain(item);
          if (!showHidden) for (const item of items) expect(item.name.startsWith('.')).toBe(false);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('an active smart-case filter narrows mixed-case children and never resurrects hidden entries', () => {
    const arbSmartFilter = oneof(
      stringMatching(/^[a-zA-Z]{1,4}$/),
      constantFrom(
        'needle',
        'Needle',
        'NEEDLE',
        'readme',
        'README',
        'dir',
        'Dir',
        'App_1',
        'app_1',
        '\\D',
        '\\\\N'
      )
    );
    assert(
      property(arbMixedChains, arbSmartFilter, boolean(), (chains, filter, showHidden) => {
        const root = buildTree(chains);
        const children = root.children ?? [];
        const isCaseSensitive = /[A-Z]/.test(filter.replace(/\\./g, ''));
        // eslint-disable-next-line security/detect-non-literal-regexp -- oracle for smart-case getFilterRegex semantics
        const regex = new RegExp(filter, isCaseSensitive ? '' : 'i');
        const expected = children
          .filter((c) => (showHidden ? true : !c.name.startsWith('.')))
          .filter((c) => regex.test(c.name));

        const items = getVisibleItems(
          baseState(root, { showHidden, filters: { [root.id]: filter } })
        );

        expect(sorted(items.map((i) => i.id))).toEqual(sorted(expected.map((c) => c.id)));
        if (!showHidden) {
          for (const item of items) expect(item.name.startsWith('.')).toBe(false);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('arbitrary or malformed filters never throw, fall back safely, and respect showHidden in both modes', () => {
    assert(
      property(
        arbMixedChains,
        arbMalformedOrAnyPattern,
        boolean(),
        boolean(),
        (chains, filter, showHidden, inSearchMode) => {
          const root = buildTree(chains);
          const snapshot = inSearchMode ? getRecursiveSearchResults(root, '.', true) : [];
          const state = baseState(root, {
            showHidden,
            filters: { [root.id]: filter },
            ...(inSearchMode ? { searchQuery: '.', searchResults: snapshot } : {}),
          });

          const items = getVisibleItems(state);
          const unfiltered = getVisibleItems(baseState(root, { ...state, filters: {} }));
          const unfilteredIds = new Set(unfiltered.map((i) => i.id));

          if (filter === '') {
            expect(items.map((i) => i.id)).toEqual(unfiltered.map((i) => i.id));
          } else if (getFilterRegex(filter) === null) {
            expect(items).toEqual([]);
          } else {
            for (const item of items) {
              expect(unfilteredIds.has(item.id)).toBe(true);
            }
          }

          if (!showHidden) {
            for (const item of items) {
              expect(inSearchMode ? isHiddenResult(item) : item.name.startsWith('.')).toBe(false);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
