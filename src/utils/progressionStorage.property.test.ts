// @vitest-environment jsdom
import { assert, property, array, integer, oneof, constantFrom, string } from 'fast-check';
import { describe, it } from 'vitest';
import { LEVELS } from '../constants/levels';
import {
  loadUnlockedLevelIndex,
  persistUnlockedLevelIndex,
  resetUnlockedLevel,
} from './progressionStorage';

const NUM_RUNS = 150;
const STORAGE_KEY = 'yazi-quest-unlocked-level';

describe('property: progressionStorage invariants', () => {
  it('maintains monotonic clamped high-water mark over arbitrary index sequences', () => {
    const arbIndex = oneof(
      integer({ min: -5, max: LEVELS.length + 5 }),
      constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5)
    );

    assert(
      property(array(arbIndex, { minLength: 0, maxLength: 12 }), (indices) => {
        localStorage.clear();
        let expectedMax = -1;

        for (const index of indices) {
          const prev = loadUnlockedLevelIndex();
          persistUnlockedLevelIndex(index);
          const next = loadUnlockedLevelIndex();

          if (Number.isSafeInteger(index)) {
            const clamped = Math.min(Math.max(index, 0), LEVELS.length - 1);
            expectedMax = Math.max(expectedMax, clamped);
          }

          if (next < prev || next !== expectedMax) {
            return false;
          }
        }

        resetUnlockedLevel();
        return loadUnlockedLevelIndex() === -1;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('recovers safely from arbitrary corrupt localStorage values and validates level IDs strictly', () => {
    const validIds = new Set(LEVELS.map((l) => l.id));
    const arbRaw = oneof(
      string({ minLength: 0, maxLength: 16 }),
      constantFrom('1', '15', '0', '-1', '999', 'null', 'undefined', 'NaN', '1.5', '')
    );

    assert(
      property(arbRaw, (raw) => {
        localStorage.setItem(STORAGE_KEY, raw);
        const parsed = loadUnlockedLevelIndex();
        const num = Number(raw);
        const isKnownId = Number.isSafeInteger(num) && validIds.has(num);

        if (isKnownId) {
          return parsed === LEVELS.findIndex((l) => l.id === num);
        }
        return parsed === -1;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
