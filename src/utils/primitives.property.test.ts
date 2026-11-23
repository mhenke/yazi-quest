import {
  assert,
  property,
  array,
  constantFrom,
  float,
  integer,
  record,
  string,
  tuple,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import { isValidZoxideData } from './validation';
import { calculateFrecency, type ZoxideEntry } from '../types';
import { formatBytes } from './sizeHelpers';
import { getFilterRegex } from './viewHelpers';

const NUM_RUNS = 150;
const HOUR = 60 * 60 * 1000;

// Fixed clock so tier math is deterministic and lastAccess is never the
// falsy-0 quirk value (`entry.lastAccess || now` inside calculateFrecency).
const NOW = 1_700_000_000_000;

const arbFiniteNumber = float({ noNaN: true, noDefaultInfinity: true });

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
});

describe('calculateFrecency', () => {
  const arbCount = integer({ min: 0, max: 500_000 });
  const arbLastAccess = integer({ min: NOW - 30 * 24 * HOUR, max: NOW });

  it('returns 0 for an undefined entry', () => {
    expect(calculateFrecency(undefined, NOW)).toBe(0);
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

describe('formatBytes', () => {
  it('renders every integer 0..2^30 as digits with one optional decimal and B/K/M', () => {
    assert(
      property(integer({ min: 0, max: 2 ** 30 }), (bytes) => {
        return /^\d+(\.\d)?(B|K|M)$/.test(formatBytes(bytes));
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
});
