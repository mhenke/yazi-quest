import {
  assert,
  property,
  array,
  boolean,
  constantFrom,
  integer,
  oneof,
  string,
  type Arbitrary,
} from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  filterFuzzyCandidates,
  getBaseFuzzyCandidates,
  getFuzzyCandidates,
  type FuzzyCandidate,
} from './fuzzyHelpers';
import { getNodeByPath, resolvePath } from './fsHelpers';
import { calculateFrecency, type FileNode, type GameState, type ZoxideEntry } from '../types';
import { LEVELS } from '../constants/levels';

const NUM_RUNS = 120;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Deterministic mulberry32 PRNG so shrunk fast-check integer seeds reproduce the
 * exact filesystem tree, including dot-prefixed entries and non-empty archives.
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

interface TreeEntry {
  node: FileNode;
  pathIds: string[];
  displayPath: string;
  insideArchive: boolean;
  hasHiddenSegment: boolean;
}

interface GeneratedForest {
  root: FileNode;
  entries: TreeEntry[];
}

const NAME_STEMS = [
  'alpha',
  'Beta',
  'Log[1]',
  'data+v2',
  'cfg(a)',
  'sys.bak',
  'node_9',
  'Vault',
  'key$0',
  'pkg*x',
];

/**
 * Generates an arbitrary FS tree with unique ids and unique sibling names:
 * - mix of visible and dot-prefixed dirs, files, and archives
 * - archives deliberately contain child files and subdirs so archive opacity is
 *   exercised on every run
 * - names include mixed case and regex metacharacters
 */
const arbForest: Arbitrary<GeneratedForest> = integer({ min: 1, max: 2 ** 31 - 1 }).map((seed) => {
  const rand = prng(seed);
  const int = (n: number) => Math.floor(rand() * n);
  const entries: TreeEntry[] = [];
  let next = 0;

  const make = (
    type: FileNode['type'],
    parentIds: string[],
    parentNames: string[],
    depth: number,
    insideArchive: boolean,
    parentHasHidden: boolean
  ): FileNode => {
    const idx = next++;
    const stem = NAME_STEMS[int(NAME_STEMS.length)];
    const isRoot = depth === 0;
    const isHidden = !isRoot && rand() < 0.32;
    const name = isRoot ? 'root' : `${isHidden ? '.' : ''}${stem}_${idx}`;
    const node: FileNode = {
      id: isRoot ? 'root' : `n${idx}`,
      name,
      type,
    };

    const pathIds = [...parentIds, node.id];
    const namePath = [...parentNames, node.name];
    const displayPath = namePath.length <= 1 ? '/' : `/${namePath.slice(1).join('/')}`;
    const hasHiddenSegment = parentHasHidden || isHidden;

    entries.push({
      node,
      pathIds,
      displayPath,
      insideArchive,
      hasHiddenSegment,
    });

    if (type !== 'file' && depth < 3) {
      const children: FileNode[] = [];
      const childInsideArchive = insideArchive || type === 'archive';
      // Ensure archives almost always carry children so opacity is tested meaningfully.
      const dirCount = type === 'archive' ? 1 + int(2) : int(3);
      const fileCount = type === 'archive' ? 1 + int(2) : int(3);

      for (let i = 0; i < dirCount; i++) {
        const childType: FileNode['type'] = rand() < 0.35 ? 'archive' : 'dir';
        children.push(
          make(childType, pathIds, namePath, depth + 1, childInsideArchive, hasHiddenSegment)
        );
      }
      for (let i = 0; i < fileCount; i++) {
        children.push(
          make('file', pathIds, namePath, depth + 1, childInsideArchive, hasHiddenSegment)
        );
      }
      node.children = children;
    }

    return node;
  };

  const root = make('dir', [], [], 0, false, false);
  return { root, entries };
});

/**
 * Offsets kept far from 1h / 1d / 7d tier boundaries so `Date.now()` inside
 * `calculateFrecency` stays deterministic across consecutive calls.
 */
const arbRecencyOffsetMs = constantFrom(
  10 * 60 * 1000, // 10 min  (x4)
  6 * HOUR_MS, // 6 hours (x2)
  3 * DAY_MS, // 3 days  (x0.5)
  30 * DAY_MS // 30 days (x0.25)
);

const arbFuzzyMode = constantFrom<'fzf-current' | 'zoxide-jump'>('fzf-current', 'zoxide-jump');

const arbRegexAndWhitespaceQuery = oneof(
  string({ maxLength: 20 }),
  constantFrom(
    '',
    ' ',
    '   \t\n  ',
    '.',
    '..',
    '[',
    ']',
    '(',
    ')',
    '*',
    '+',
    '?',
    '\\',
    '^',
    '$',
    '|',
    '[a-z]+',
    '(unclosed',
    '\\d+\\w*',
    'LOG[1]',
    '  Beta  ',
    'DATA+V2',
    'key$0',
    'pkg*x',
    'nonexistent_xyz_999'
  )
);

const arbAsciiQuery = array(
  constantFrom(
    'a',
    'b',
    'e',
    'l',
    'o',
    'g',
    'A',
    'B',
    'L',
    'V',
    '0',
    '1',
    '.',
    '_',
    '/',
    '[',
    ']',
    '+',
    '$',
    '*',
    ' '
  ),
  { minLength: 0, maxLength: 10 }
).map((chars) => chars.join(''));

const arbZoxideMap = (
  forest: GeneratedForest,
  now: number
): Arbitrary<Record<string, ZoxideEntry>> => {
  const candidatePaths = forest.entries.map((e) => e.displayPath);
  const allPaths = [...candidatePaths, '/stale/missing', '/ghost_dir'];
  return array(
    integer({ min: 0, max: Math.max(0, allPaths.length - 1) }).chain((idx) =>
      integer({ min: 0, max: 500 }).chain((count) =>
        oneof(
          arbRecencyOffsetMs.map((offset) => now - offset),
          constantFrom(0)
        ).map((lastAccess): [string, ZoxideEntry] => [allPaths[idx], { count, lastAccess }])
      )
    ),
    { minLength: 0, maxLength: 14 }
  ).map((pairs) => Object.fromEntries(pairs));
};

const makeState = (forest: GeneratedForest, overrides: Partial<GameState> = {}): GameState =>
  ({
    mode: 'fzf-current',
    levelIndex: 0,
    fs: forest.root,
    currentPath: [forest.root.id],
    inputBuffer: '',
    zoxideData: {},
    showHidden: false,
    ...overrides,
  }) as unknown as GameState;

/** Resolves a display path (`/a/b` or `/`) by walking unique child names from root. */
const resolveByNamePath = (root: FileNode, displayPath: string): FileNode | undefined => {
  if (displayPath === '/') return root;
  const segments = displayPath.split('/').filter(Boolean);
  let current: FileNode | undefined = root;
  for (const seg of segments) {
    current = (current.children ?? []).find((c) => c.name === seg);
    if (!current) return undefined;
  }
  return current;
};

describe('property: fuzzyHelpers safety and immutability', () => {
  it('never throws and never mutates gameState, fs, or zoxideData for any mode and query', () => {
    const now = Date.now();
    assert(
      property(
        arbForest.chain((forest) =>
          arbZoxideMap(forest, now).map((zoxideData) => ({ forest, zoxideData }))
        ),
        arbFuzzyMode,
        boolean(),
        integer({ min: 0, max: LEVELS.length - 1 }),
        arbRegexAndWhitespaceQuery,
        arbRegexAndWhitespaceQuery,
        ({ forest, zoxideData }, mode, showHidden, levelIndex, inputBuffer, query) => {
          const state = makeState(forest, {
            mode,
            showHidden,
            levelIndex,
            zoxideData,
            inputBuffer,
          });
          const stateSnapshot = JSON.stringify(state);

          const base = getBaseFuzzyCandidates(state);
          const baseSnapshot = JSON.stringify(base);
          const filtered = filterFuzzyCandidates(base, query);
          const combined = getFuzzyCandidates(state, query);

          expect(Array.isArray(base)).toBe(true);
          expect(Array.isArray(filtered)).toBe(true);
          expect(Array.isArray(combined)).toBe(true);
          expect(JSON.stringify(state)).toBe(stateSnapshot);
          expect(JSON.stringify(base)).toBe(baseSnapshot);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('property: getBaseFuzzyCandidates visibility, opacity, and path resolution', () => {
  it('fzf mode hides dot-prefixed entries and descendants when showHidden=false, keeps archives opaque, and resolves every candidate in fs', () => {
    assert(
      property(
        arbForest,
        boolean(),
        integer({ min: 0, max: LEVELS.length - 1 }),
        (forest, showHidden, levelIndex) => {
          const state = makeState(forest, {
            mode: 'fzf-current',
            showHidden,
            levelIndex,
            currentPath: [forest.root.id],
          });
          const candidates = getBaseFuzzyCandidates(state);

          const expectedEntries = forest.entries.filter(
            (e) =>
              e.pathIds.length > 1 &&
              (e.node.type === 'file' || e.node.type === 'archive') &&
              !e.insideArchive &&
              (showHidden || !e.hasHiddenSegment)
          );

          expect(candidates.map((c) => c.id).sort()).toEqual(
            expectedEntries.map((e) => e.node.id).sort()
          );
          expect(new Set(candidates.map((c) => c.path)).size).toBe(candidates.length);

          for (const candidate of candidates) {
            expect(candidate.isZoxide).toBe(false);
            expect(candidate.type === 'file' || candidate.type === 'archive').toBe(true);
            expect(candidate.pathIds).toBeDefined();
            expect(candidate.pathIds!.at(-1)).toBe(candidate.id);

            const byIds = getNodeByPath(forest.root, candidate.pathIds);
            const byName = resolveByNamePath(forest.root, candidate.path);
            expect(byIds).toBeDefined();
            expect(byName).toBe(byIds);
            expect(byIds!.id).toBe(candidate.id);
            expect(byIds!.type).toBe(candidate.type);
            expect(resolvePath(forest.root, candidate.pathIds)).toBe(candidate.path);

            if (!showHidden) {
              const segments = candidate.path.split('/').filter(Boolean);
              expect(segments.some((seg) => seg.startsWith('.'))).toBe(false);
            }
          }

          // Archives remain opaque: no candidate may sit beneath a returned archive.
          for (const archive of candidates.filter((c) => c.type === 'archive')) {
            const prefix = `${archive.path}/`;
            expect(candidates.some((other) => other.path.startsWith(prefix))).toBe(false);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('fzf mode with showHidden=true is a superset of showHidden=false from any visible directory', () => {
    assert(
      property(arbForest, integer({ min: 0, max: 1_000_000 }), (forest, pick) => {
        const visibleDirs = forest.entries.filter(
          (e) => e.node.type === 'dir' && !e.insideArchive && !e.hasHiddenSegment
        );
        const start = visibleDirs[pick % visibleDirs.length];

        const hiddenOff = getBaseFuzzyCandidates(
          makeState(forest, {
            mode: 'fzf-current',
            currentPath: start.pathIds,
            showHidden: false,
          })
        );
        const hiddenOn = getBaseFuzzyCandidates(
          makeState(forest, {
            mode: 'fzf-current',
            currentPath: start.pathIds,
            showHidden: true,
          })
        );

        const onIds = new Set(hiddenOn.map((c) => c.id));
        expect(hiddenOn.length).toBeGreaterThanOrEqual(hiddenOff.length);
        for (const c of hiddenOff) {
          expect(onIds.has(c.id)).toBe(true);
          expect(
            c.path
              .split('/')
              .filter(Boolean)
              .some((seg) => seg.startsWith('.'))
          ).toBe(false);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('zoxide mode returns only existing non-archive-descendant dirs/archives in zoxideData, ignores showHidden, and sorts by frecency desc with deterministic tie-breaking', () => {
    const now = Date.now();
    assert(
      property(
        arbForest.chain((forest) =>
          arbZoxideMap(forest, now).map((zoxideData) => ({ forest, zoxideData }))
        ),
        boolean(),
        integer({ min: 0, max: LEVELS.length - 1 }),
        ({ forest, zoxideData }, showHidden, levelIndex) => {
          const state = makeState(forest, {
            mode: 'zoxide-jump',
            zoxideData,
            showHidden,
            levelIndex,
          });
          const candidates = getBaseFuzzyCandidates(state);
          const candidatesAltHidden = getBaseFuzzyCandidates({ ...state, showHidden: !showHidden });

          // Zoxide history is intentionally independent of showHidden.
          expect(candidates.map((c) => c.path)).toEqual(candidatesAltHidden.map((c) => c.path));

          // Ground truth: directories and archives outside archives whose path is in zoxideData.
          const zKeys = new Set(Object.keys(zoxideData));
          const expectedPaths = forest.entries
            .filter(
              (e) =>
                (e.node.type === 'dir' || e.node.type === 'archive') &&
                !e.insideArchive &&
                zKeys.has(e.displayPath)
            )
            .map((e) => e.displayPath);

          expect([...candidates.map((c) => c.path)].sort()).toEqual([...expectedPaths].sort());
          expect(new Set(candidates.map((c) => c.path)).size).toBe(candidates.length);

          for (const candidate of candidates) {
            expect(candidate.isZoxide).toBe(true);
            expect(zKeys.has(candidate.path)).toBe(true);
            expect(Number.isFinite(candidate.score)).toBe(true);
            expect(candidate.score).toBe(calculateFrecency(zoxideData[candidate.path], now));

            const resolved = resolveByNamePath(forest.root, candidate.path);
            expect(resolved).toBeDefined();
            expect(resolved!.type === 'dir' || resolved!.type === 'archive').toBe(true);
          }

          // Ordering: frecency descending, deterministic localeCompare tie-break on equal scores.
          for (let i = 1; i < candidates.length; i++) {
            const prev = candidates[i - 1];
            const curr = candidates[i];
            const prevScore = prev.score ?? 0;
            const currScore = curr.score ?? 0;
            expect(prevScore).toBeGreaterThanOrEqual(currScore);
            if (prevScore === currScore) {
              expect(prev.path.localeCompare(curr.path)).toBeLessThanOrEqual(0);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('orders zoxide candidates strictly and transitively even when fractional counts differ by <= 1e-5', () => {
    const now = Date.now();
    const lastAccess = now - 10 * 60 * 1000;
    const arbNearScores = array(integer({ min: 0, max: 12 }), {
      minLength: 3,
      maxLength: 10,
    });

    assert(
      property(arbNearScores, integer({ min: 1, max: 100 }), (steps, baseCount) => {
        const dirNodes: FileNode[] = steps.map((_, idx) => ({
          id: `d${idx}`,
          name: `dir_${String.fromCharCode(97 + idx)}`,
          type: 'dir',
          children: [],
        }));
        const zoxideEntries = dirNodes.map((node, idx): [string, ZoxideEntry] => [
          `/${node.name}`,
          { count: baseCount + steps[idx] * 1e-6, lastAccess },
        ]);
        const forwardRoot: FileNode = {
          id: 'root',
          name: 'root',
          type: 'dir',
          children: dirNodes,
        };
        const reversedRoot: FileNode = {
          id: 'root',
          name: 'root',
          type: 'dir',
          children: [...dirNodes].reverse(),
        };

        const forward = getBaseFuzzyCandidates(
          makeState(
            { root: forwardRoot, entries: [] },
            {
              mode: 'zoxide-jump',
              zoxideData: Object.fromEntries(zoxideEntries),
            }
          )
        );
        const reversed = getBaseFuzzyCandidates(
          makeState(
            { root: reversedRoot, entries: [] },
            {
              mode: 'zoxide-jump',
              zoxideData: Object.fromEntries([...zoxideEntries].reverse()),
            }
          )
        );

        // Strict weak order: identical output regardless of input traversal order.
        expect(forward.map((c) => c.path)).toEqual(reversed.map((c) => c.path));

        // Pairwise check: no score inversions across any pair, localeCompare on exact ties.
        for (let i = 0; i < forward.length; i++) {
          for (let j = i + 1; j < forward.length; j++) {
            const a = forward[i];
            const b = forward[j];
            const scoreA = a.score ?? 0;
            const scoreB = b.score ?? 0;
            expect(scoreA).toBeGreaterThanOrEqual(scoreB);
            if (scoreA === scoreB) {
              expect(a.path.localeCompare(b.path)).toBeLessThan(0);
            }
          }
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('property: filterFuzzyCandidates and getFuzzyCandidates contracts', () => {
  it('filterFuzzyCandidates returns an order-preserving subset with exact case-insensitive substring semantics', () => {
    const now = Date.now();
    assert(
      property(
        arbForest.chain((forest) =>
          arbZoxideMap(forest, now).map((zoxideData) => ({ forest, zoxideData }))
        ),
        arbFuzzyMode,
        boolean(),
        arbRegexAndWhitespaceQuery,
        ({ forest, zoxideData }, mode, showHidden, query) => {
          const state = makeState(forest, { mode, showHidden, zoxideData });
          const base = getBaseFuzzyCandidates(state);
          const filtered = filterFuzzyCandidates(base, query);

          // Order-preserving subsequence: no invented candidates, no duplicates.
          let cursor = 0;
          for (const item of filtered) {
            const foundIdx = base.indexOf(item, cursor);
            expect(foundIdx).toBeGreaterThanOrEqual(cursor);
            cursor = foundIdx + 1;
          }

          const normalized = query.trim().toLowerCase();
          if (!normalized) {
            expect(filtered).toEqual(base);
          } else {
            const filteredSet = new Set<FuzzyCandidate>(filtered);
            for (const candidate of base) {
              const matches = candidate.path.toLowerCase().includes(normalized);
              expect(filteredSet.has(candidate)).toBe(matches);
            }
          }

          // Idempotence and whitespace trimming invariance.
          expect(filterFuzzyCandidates(filtered, query)).toEqual(filtered);
          expect(filterFuzzyCandidates(base, `  \t${query}\n  `)).toEqual(filtered);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('filterFuzzyCandidates handles empty/whitespace/undefined queries and is case-insensitive and monotone under query extension', () => {
    assert(
      property(
        arbForest,
        boolean(),
        arbAsciiQuery,
        arbAsciiQuery,
        (forest, showHidden, q1, extra) => {
          const base = getBaseFuzzyCandidates(
            makeState(forest, { mode: 'fzf-current', showHidden })
          );

          // Empty / undefined / whitespace-only queries return all base candidates.
          expect(filterFuzzyCandidates(base, undefined)).toEqual(base);
          expect(filterFuzzyCandidates(base, '')).toEqual(base);
          expect(filterFuzzyCandidates(base, '   \t\n ')).toEqual(base);

          // Case-insensitivity on ASCII queries.
          expect(filterFuzzyCandidates(base, q1.toUpperCase())).toEqual(
            filterFuzzyCandidates(base, q1.toLowerCase())
          );

          // Extending a non-empty trimmed query can only narrow the result set.
          const baseTrimmed = q1.trim();
          const extended = `${baseTrimmed}${extra.trim()}`;
          if (baseTrimmed.length > 0) {
            const broad = new Set(filterFuzzyCandidates(base, baseTrimmed));
            const narrow = filterFuzzyCandidates(base, extended);
            for (const c of narrow) {
              expect(broad.has(c)).toBe(true);
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('getFuzzyCandidates(state, query) equals filterFuzzyCandidates(getBaseFuzzyCandidates(state), query) and falls back to inputBuffer when omitted', () => {
    const now = Date.now();
    assert(
      property(
        arbForest.chain((forest) =>
          arbZoxideMap(forest, now).map((zoxideData) => ({ forest, zoxideData }))
        ),
        arbFuzzyMode,
        boolean(),
        arbRegexAndWhitespaceQuery,
        arbRegexAndWhitespaceQuery,
        ({ forest, zoxideData }, mode, showHidden, inputBuffer, explicitQuery) => {
          const state = makeState(forest, { mode, showHidden, zoxideData, inputBuffer });
          const base = getBaseFuzzyCandidates(state);

          // Explicit query (including empty string) overrides inputBuffer.
          expect(getFuzzyCandidates(state, explicitQuery)).toEqual(
            filterFuzzyCandidates(base, explicitQuery)
          );
          expect(getFuzzyCandidates(state, '')).toEqual(filterFuzzyCandidates(base, ''));

          // Omitted query falls back to state.inputBuffer.
          expect(getFuzzyCandidates(state)).toEqual(filterFuzzyCandidates(base, inputBuffer));
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
