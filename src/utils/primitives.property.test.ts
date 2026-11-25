import {
  anything,
  assert,
  property,
  array,
  boolean,
  constantFrom,
  float,
  integer,
  jsonValue,
  oneof,
  option,
  record,
  string,
  stringMatching,
  tuple,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import { isValidZoxideData } from './validation';
import { calculateFrecency, type FileNode, type ZoxideEntry } from '../types';
import { computeNodeBytes, countVisibleChildren, formatBytes } from './sizeHelpers';
import { dirsToLoad } from './folderCache';
import { getNodeById } from './fsHelpers';
import { getFilterRegex } from './viewHelpers';

const NUM_RUNS = 150;
const HOUR = 60 * 60 * 1000;

// Fixed clock so tier math is deterministic.
const NOW = 1_700_000_000_000;

const arbFiniteNumber = float({ noNaN: true, noDefaultInfinity: true });

const isValidEntryShape = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return Number.isFinite(entry.count) && Number.isFinite(entry.lastAccess);
};

const isValidZoxideShape = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isValidEntryShape);
};

describe('isValidZoxideData', () => {
  const arbEntry: Arbitrary<unknown> = record({
    count: arbFiniteNumber,
    lastAccess: arbFiniteNumber,
  });

  it('accepts every well-formed Record<string, {count, lastAccess}>', () => {
    const arbRecord = array(tuple(string(), arbEntry), { minLength: 0, maxLength: 5 }).map(
      (pairs) => Object.fromEntries(pairs)
    );
    assert(
      property(arbRecord, (data) => isValidZoxideData(data)),
      { numRuns: NUM_RUNS }
    );
  });

  // Regression: typeof 'number' alone let NaN/±Infinity through the
  // trust-boundary validator; the contract requires finite numbers.
  it('rejects non-finite and otherwise malformed entries', () => {
    const arbBadEntry = constantFrom<unknown>(
      { count: NaN, lastAccess: 1 },
      { count: 1, lastAccess: Infinity },
      { count: -Infinity, lastAccess: 1 },
      { count: 1 },
      { lastAccess: 1 },
      { count: '1', lastAccess: 1 },
      { count: null, lastAccess: undefined },
      {},
      5,
      'x',
      null,
      []
    );
    assert(
      property(arbBadEntry, (entry) => !isValidZoxideData({ '/some/path': entry })),
      { numRuns: NUM_RUNS }
    );
    expect(isValidZoxideData({ p: { count: NaN, lastAccess: 1 } })).toBe(false);
    expect(isValidZoxideData({ p: { count: 1, lastAccess: Infinity } })).toBe(false);
    expect(isValidZoxideData(null)).toBe(false);
    expect(isValidZoxideData([])).toBe(false);
    expect(isValidZoxideData('nope')).toBe(false);
  });

  it('rejects arbitrary anything() / jsonValue() inputs that do not satisfy the record shape', () => {
    const arbInvalid = oneof(anything(), jsonValue()).filter((v) => !isValidZoxideShape(v));
    assert(
      property(arbInvalid, (data) => !isValidZoxideData(data)),
      { numRuns: NUM_RUNS }
    );
  });

  it('rejects mixed records containing valid entries alongside any invalid entry', () => {
    const arbValidPairs = array(tuple(stringMatching(/^\/valid\/[a-z]{1,4}$/), arbEntry), {
      minLength: 1,
      maxLength: 4,
    });
    const arbBadValue = oneof(anything(), jsonValue()).filter((v) => !isValidEntryShape(v));

    assert(
      property(arbValidPairs, arbBadValue, (validPairs, badValue) => {
        const mixed = {
          ...Object.fromEntries(validPairs),
          '/invalid/entry': badValue,
        };
        return !isValidZoxideData(mixed);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('calculateFrecency', () => {
  const arbCount = integer({ min: 0, max: 500_000 });
  // Domain starts at epoch 0: `lastAccess ?? now` must treat it as a real
  // timestamp (×0.25 tier), not as "missing" (which would give ×4).
  const arbLastAccess = integer({ min: 0, max: NOW });

  it('returns 0 for an undefined entry', () => {
    expect(calculateFrecency(undefined, NOW)).toBe(0);
  });

  // Regression: `entry.lastAccess || now` scored epoch-0 as "just accessed".
  it('scores an epoch-0 lastAccess in the oldest tier, not as "now"', () => {
    expect(calculateFrecency({ count: 10, lastAccess: 0 }, NOW)).toBe(2.5);
  });

  it('is always non-negative for count >= 0 and lastAccess <= now', () => {
    assert(
      property(arbCount, arbLastAccess, (count, lastAccess) => {
        const score = calculateFrecency({ count, lastAccess }, NOW);
        return score >= 0;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Multipliers step down 4 → 2 → 0.5 → 0.25 as elapsed time crosses the
  // hour/day/week tiers, so the score can only fall as `now` advances.
  it('is non-increasing as now advances across tier boundaries', () => {
    assert(
      property(
        arbCount,
        arbLastAccess,
        integer({ min: NOW, max: NOW + 30 * 24 * HOUR }),
        integer({ min: 0, max: 30 * 24 * HOUR }),
        (count, lastAccess, now0, delta) => {
          const entry: ZoxideEntry = { count, lastAccess };
          return calculateFrecency(entry, now0 + delta) <= calculateFrecency(entry, now0);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  // Doubling count must exactly double the score: all four multipliers are
  // powers of two, so integer scaling is exact in binary floating point.
  it('is linear in count for a fixed time (f(2c) = 2f(c))', () => {
    assert(
      property(arbCount, arbLastAccess, (count, lastAccess) => {
        const single = calculateFrecency({ count, lastAccess }, NOW);
        const double = calculateFrecency({ count: 2 * count, lastAccess }, NOW);
        return double === 2 * single;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

const parseFormattedBytes = (formatted: string): { value: number; rank: number } => {
  const match = /^(\d+(?:\.\d)?)(B|K|M)$/.exec(formatted);
  if (!match) throw new Error(`unexpected formatBytes output: ${formatted}`);
  const num = Number(match[1]);
  const unit = match[2];
  if (unit === 'B') return { value: num, rank: 0 };
  if (unit === 'K') return { value: num * 1024, rank: 1 };
  return { value: num * 1024 * 1024, rank: 2 };
};

describe('formatBytes', () => {
  it('renders every integer 0..2^30 as digits with one optional decimal and B/K/M', () => {
    assert(
      property(integer({ min: 0, max: 2 ** 30 }), (bytes) => {
        return /^\d+(\.\d)?(B|K|M)$/.test(formatBytes(bytes));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('is monotonically non-decreasing in parsed size and unit tier across B/K/M boundaries', () => {
    const arbBytes = oneof(
      integer({ min: 0, max: 2 ** 30 }),
      integer({ min: 0, max: 2048 }),
      integer({ min: 1024 * 1024 - 2048, max: 1024 * 1024 + 2048 })
    );
    assert(
      property(arbBytes, arbBytes, (a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const pLo = parseFormattedBytes(formatBytes(lo));
        const pHi = parseFormattedBytes(formatBytes(hi));
        return pLo.value <= pHi.value && pLo.rank <= pHi.rank;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('formats the unit boundaries exactly', () => {
    expect(formatBytes(0)).toBe('0B');
    expect(formatBytes(1023)).toBe('1023B');
    expect(formatBytes(1024)).toBe('1.0K');
    expect(formatBytes(1024 * 1024)).toBe('1.0M');
  });
});

/** Small seeded tree generator with files carrying variable-length content and hidden names. */
const buildSizedTree = (seed: number, idPrefix = 's'): FileNode => {
  let s = seed >>> 0;
  const nextRand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let nextId = 0;
  const make = (type: FileNode['type'], depth: number): FileNode => {
    const n = nextId++;
    const name = nextRand() < 0.35 ? `.item${n}` : `item${n}`;
    if (type === 'file') {
      const hasContent = nextRand() < 0.8;
      const contentLen = Math.floor(nextRand() * 40);
      return {
        id: `${idPrefix}${n}`,
        name,
        type: 'file',
        ...(hasContent ? { content: 'x'.repeat(contentLen) } : {}),
      };
    }
    const children: FileNode[] = [];
    if (depth < 3) {
      const subCount = Math.floor(nextRand() * 3);
      const fileCount = Math.floor(nextRand() * 4);
      for (let i = 0; i < subCount; i++) {
        children.push(make(nextRand() < 0.3 ? 'archive' : 'dir', depth + 1));
      }
      for (let i = 0; i < fileCount; i++) {
        children.push(make('file', depth + 1));
      }
    }
    return { id: `${idPrefix}${n}`, name, type, children };
  };
  return make('dir', 0);
};

const sumLeafBytes = (node: FileNode): number => {
  if (node.type === 'file') return node.content?.length ?? 0;
  return (node.children ?? []).reduce((sum, child) => sum + sumLeafBytes(child), 0);
};

const arbSeed = integer({ min: 1, max: 2 ** 31 - 1 });

describe('computeNodeBytes & countVisibleChildren', () => {
  it('computeNodeBytes is non-negative, matches recursive file content length, and is additive', () => {
    assert(
      property(
        arbSeed,
        arbSeed,
        constantFrom<'dir' | 'archive'>('dir', 'archive'),
        (seedA, seedB, parentType) => {
          const treeA = buildSizedTree(seedA, 'a');
          const treeB = buildSizedTree(seedB, 'b');

          const bytesA = computeNodeBytes(treeA);
          const bytesB = computeNodeBytes(treeB);

          expect(bytesA).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(bytesA)).toBe(true);
          expect(bytesA).toBe(sumLeafBytes(treeA));

          const combined: FileNode = {
            id: 'combined',
            name: 'combined',
            type: parentType,
            children: [treeA, treeB],
          };
          expect(computeNodeBytes(combined)).toBe(bytesA + bytesB);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('countVisibleChildren bounds hidden-off count by total count and matches dot-prefix difference', () => {
    assert(
      property(arbSeed, (seed) => {
        const tree = buildSizedTree(seed);
        const walk = (node: FileNode) => {
          const visibleOnly = countVisibleChildren(node, false);
          const allChildren = countVisibleChildren(node, true);
          const directChildren = node.children ?? [];
          const hiddenCount = directChildren.filter((c) => c.name.startsWith('.')).length;

          expect(visibleOnly).toBeGreaterThanOrEqual(0);
          expect(visibleOnly).toBeLessThanOrEqual(allChildren);
          expect(allChildren).toBe(directChildren.length);
          expect(allChildren - visibleOnly).toBe(hiddenCount);

          for (const child of directChildren) walk(child);
        };
        walk(tree);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('dirsToLoad', () => {
  const collectDirPaths = (
    node: FileNode,
    path: string[]
  ): { node: FileNode; path: string[] }[] => {
    const out: { node: FileNode; path: string[] }[] = [];
    if (node.type === 'dir') out.push({ node, path });
    for (const child of node.children ?? []) {
      out.push(...collectDirPaths(child, [...path, child.id]));
    }
    return out;
  };

  it('returns current dir plus hovered child dir only, with unique in-tree IDs', () => {
    assert(
      property(
        arbSeed,
        integer({ min: 0, max: 1_000_000 }),
        option(integer({ min: 0, max: 1_000_000 }), { nil: null }),
        (seed, dirPick, childPick) => {
          const root = buildSizedTree(seed);
          const dirEntries = collectDirPaths(root, [root.id]);
          const current = dirEntries[dirPick % dirEntries.length];
          const children = current.node.children ?? [];
          const hovered =
            childPick === null || children.length === 0
              ? null
              : children[childPick % children.length];

          const ids = dirsToLoad(root, current.path, hovered);

          // Every returned ID resolves in the tree and is unique for child hover.
          expect(new Set(ids).size).toBe(ids.length);
          for (const id of ids) {
            expect(getNodeById(root, id)).toBeDefined();
          }

          if (hovered?.type === 'dir') {
            expect(ids).toEqual([current.node.id, hovered.id]);
          } else {
            expect(ids).toEqual([current.node.id]);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('omits unresolved currentPath and never includes files or archives', () => {
    assert(
      property(
        arbSeed,
        constantFrom<'file' | 'dir' | 'archive'>('file', 'dir', 'archive'),
        boolean(),
        (seed, itemType, withItem) => {
          const root = buildSizedTree(seed);
          const item: FileNode | null = withItem
            ? { id: 'hovered-node', name: 'h', type: itemType }
            : null;

          const ids = dirsToLoad(root, [root.id, 'does-not-exist'], item);

          if (item?.type === 'dir') {
            expect(ids).toEqual([item.id]);
          } else {
            expect(ids).toEqual([]);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('getFilterRegex', () => {
  it('never throws for arbitrary strings, and returns null or a RegExp', () => {
    assert(
      property(string(), (input) => {
        const regex = getFilterRegex(input);
        return regex === null || regex instanceof RegExp;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('returns null for empty and syntactically invalid regex patterns', () => {
    expect(getFilterRegex('')).toBeNull();
    assert(
      property(
        constantFrom('[unclosed', '(abc', '*bad', '\\', '(?bad)', 'a\\'),
        (bad) => getFilterRegex(bad) === null
      ),
      { numRuns: 30 }
    );
  });

  // Literal uppercase letters (no backslashes involved) force case-sensitivity.
  it('drops the i flag when a literal uppercase letter is present', () => {
    const arbTail = array(constantFrom('a', 'b', '7', '_', '.', '/', '-'), {
      minLength: 0,
      maxLength: 8,
    }).map((parts) => parts.join(''));
    assert(
      property(constantFrom('A', 'B', 'Z', 'M'), arbTail, (upper, tail) => {
        const regex = getFilterRegex(upper + tail);
        // tail cannot produce an invalid pattern, so this must be a usable regex
        return regex !== null && !regex.flags.includes('i');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Uppercase appearing only inside escape pairs (\A, \W, ...) must NOT
  // trigger case-sensitivity: smart-case ignores escaped characters.
  it('keeps the i flag when uppercase appears only in escape pairs', () => {
    const arbEscaped = array(
      constantFrom('\\A', '\\W', '\\S', '\\D', '\\E', '\\Q', '\\.', 'a', '7', '_'),
      { minLength: 1, maxLength: 6 }
    ).map((parts) => parts.join(''));
    assert(
      property(arbEscaped, (input) => {
        const regex = getFilterRegex(input);
        return regex !== null && regex.flags.includes('i');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Escaped backslash pairs before uppercase (\\A, \\\\A) leave A unescaped,
  // so smart-case must drop 'i'; odd backslashes (\A, \\\A) escape A and keep 'i'.
  it('respects backslash parity before uppercase letters (\\\\A drops i, \\A keeps i)', () => {
    const arbSafe = stringMatching(/^[a-z0-9_-]{0,4}$/);
    const arbUpper = constantFrom('A', 'B', 'M', 'Z');
    assert(
      property(
        arbSafe,
        integer({ min: 1, max: 4 }),
        arbUpper,
        arbSafe,
        (prefix, pairs, upper, suffix) => {
          const evenBackslashes = '\\\\'.repeat(pairs);
          const evenPattern = `${prefix}${evenBackslashes}${upper}${suffix}`;
          const evenRegex = getFilterRegex(evenPattern);
          expect(evenRegex).not.toBeNull();
          expect(evenRegex!.flags.includes('i')).toBe(false);

          const oddBackslashes = `${'\\\\'.repeat(pairs - 1)}\\`;
          const oddPattern = `${prefix}${oddBackslashes}${upper}${suffix}`;
          const oddRegex = getFilterRegex(oddPattern);
          expect(oddRegex).not.toBeNull();
          expect(oddRegex!.flags.includes('i')).toBe(true);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
