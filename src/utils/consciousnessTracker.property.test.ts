import {
  assert,
  property,
  constantFrom,
  double,
  integer,
  record,
  type Arbitrary,
} from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  calculateEfficiencyScore,
  calculateThreatManagementScore,
  updateConsciousness,
  type ConsciousnessMetrics,
} from './consciousnessTracker';

const NUM_RUNS = 200;

const arbUnit = double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });
const arbFinite = double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true });
const arbNonNegFinite = double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true });
const arbPositiveFinite = double({ min: 1e-6, max: 1e6, noNaN: true, noDefaultInfinity: true });

const arbValidMetrics: Arbitrary<ConsciousnessMetrics> = record({
  efficiencyScore: arbUnit,
  discoveryRate: arbUnit,
  threatManagement: arbUnit,
});

const arbNonNegMetrics: Arbitrary<ConsciousnessMetrics> = record({
  efficiencyScore: arbNonNegFinite,
  discoveryRate: arbNonNegFinite,
  threatManagement: arbNonNegFinite,
});

const arbAnyFiniteMetrics: Arbitrary<ConsciousnessMetrics> = record({
  efficiencyScore: arbFinite,
  discoveryRate: arbFinite,
  threatManagement: arbFinite,
});

const VALID_THREAT_SCORES = new Set([0.25, 0.5, 0.75, 1]);

describe('property: calculateThreatManagementScore', () => {
  it('always returns a finite discrete score in {0.25, 0.5, 0.75, 1} for any threat level', () => {
    assert(
      property(
        double({ min: -1e6, max: 1e6, noNaN: false, noDefaultInfinity: false }),
        (threatLevel) => {
          const score = calculateThreatManagementScore(threatLevel);
          expect(Number.isFinite(score)).toBe(true);
          expect(Number.isNaN(score)).toBe(false);
          expect(VALID_THREAT_SCORES.has(score)).toBe(true);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('is monotonically non-increasing as threat level rises', () => {
    assert(
      property(arbFinite, arbNonNegFinite, (baseThreat, delta) => {
        const lower = calculateThreatManagementScore(baseThreat);
        const higher = calculateThreatManagementScore(baseThreat + delta);
        expect(higher).toBeLessThanOrEqual(lower);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('matches exact tier boundaries across negative, [0, 100], and >100 threat values', () => {
    assert(
      property(arbFinite, (threat) => {
        const score = calculateThreatManagementScore(threat);
        if (threat < 20) expect(score).toBe(1);
        else if (threat < 50) expect(score).toBe(0.75);
        else if (threat < 80) expect(score).toBe(0.5);
        else expect(score).toBe(0.25);
      }),
      { numRuns: NUM_RUNS }
    );

    expect(calculateThreatManagementScore(0)).toBe(1);
    expect(calculateThreatManagementScore(20)).toBe(0.75);
    expect(calculateThreatManagementScore(50)).toBe(0.5);
    expect(calculateThreatManagementScore(80)).toBe(0.25);
    expect(calculateThreatManagementScore(100)).toBe(0.25);
    expect(calculateThreatManagementScore(1000)).toBe(0.25);
  });
});

describe('property: calculateEfficiencyScore', () => {
  it('is finite, never NaN, and bounded in [0, 1] for any finite keystrokes and non-negative optimalKeystrokes', () => {
    assert(
      property(arbFinite, arbNonNegFinite, (keystrokes, optimalKeystrokes) => {
        const score = calculateEfficiencyScore(keystrokes, optimalKeystrokes);
        expect(Number.isFinite(score)).toBe(true);
        expect(Number.isNaN(score)).toBe(false);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('returns 0 when keystrokes <= 0 or optimalKeystrokes === 0', () => {
    assert(
      property(
        double({ min: -1e6, max: 0, noNaN: true, noDefaultInfinity: true }),
        arbFinite,
        (nonPosKeystrokes, optimalKeystrokes) => {
          expect(calculateEfficiencyScore(nonPosKeystrokes, optimalKeystrokes)).toBe(0);
        }
      ),
      { numRuns: NUM_RUNS }
    );

    assert(
      property(arbFinite, (keystrokes) => {
        expect(calculateEfficiencyScore(keystrokes, 0)).toBe(0);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('saturates at 1 for 0 < keystrokes <= optimal and is non-increasing as positive keystrokes grow', () => {
    assert(
      property(
        arbPositiveFinite,
        arbNonNegFinite,
        arbNonNegFinite,
        (k1, extraKeystrokes, optimal) => {
          const k2 = k1 + extraKeystrokes;
          const s1 = calculateEfficiencyScore(k1, optimal);
          const s2 = calculateEfficiencyScore(k2, optimal);

          expect(s2).toBeLessThanOrEqual(s1);
          if (k1 <= optimal) {
            expect(s1).toBe(1);
          } else {
            expect(s1).toBeLessThan(1);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('is non-decreasing as optimalKeystrokes increases for fixed positive keystrokes, and defaults optimal to 50', () => {
    assert(
      property(arbPositiveFinite, arbNonNegFinite, arbNonNegFinite, (keystrokes, opt1, delta) => {
        const s1 = calculateEfficiencyScore(keystrokes, opt1);
        const s2 = calculateEfficiencyScore(keystrokes, opt1 + delta);
        expect(s2).toBeGreaterThanOrEqual(s1);
        expect(calculateEfficiencyScore(keystrokes)).toBe(calculateEfficiencyScore(keystrokes, 50));
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('property: updateConsciousness', () => {
  it('returns a finite integer in [0, 100] for valid current in [0, 100] and non-negative metrics (including metrics > 1)', () => {
    assert(
      property(
        double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        arbNonNegMetrics,
        (current, metrics) => {
          const next = updateConsciousness(current, metrics);
          expect(Number.isFinite(next)).toBe(true);
          expect(Number.isNaN(next)).toBe(false);
          expect(Number.isInteger(next)).toBe(true);
          expect(next).toBeGreaterThanOrEqual(0);
          expect(next).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('returns a finite integer and never NaN even for out-of-range finite inputs', () => {
    assert(
      property(arbFinite, arbAnyFiniteMetrics, (current, metrics) => {
        const next = updateConsciousness(current, metrics);
        expect(Number.isFinite(next)).toBe(true);
        expect(Number.isNaN(next)).toBe(false);
        expect(Number.isInteger(next)).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('is monotonically non-decreasing in current consciousness and in each metric component', () => {
    assert(
      property(
        arbFinite,
        arbNonNegFinite,
        arbAnyFiniteMetrics,
        arbNonNegFinite,
        arbNonNegFinite,
        arbNonNegFinite,
        (current, deltaCurrent, baseMetrics, dEff, dDisc, dThreat) => {
          const betterMetrics: ConsciousnessMetrics = {
            efficiencyScore: baseMetrics.efficiencyScore + dEff,
            discoveryRate: baseMetrics.discoveryRate + dDisc,
            threatManagement: baseMetrics.threatManagement + dThreat,
          };

          // Higher current -> non-decreasing next consciousness.
          expect(updateConsciousness(current + deltaCurrent, baseMetrics)).toBeGreaterThanOrEqual(
            updateConsciousness(current, baseMetrics)
          );

          // Better metrics -> non-decreasing next consciousness (hence non-decreasing delta).
          const fromBase = updateConsciousness(current, baseMetrics);
          const fromBetter = updateConsciousness(current, betterMetrics);
          expect(fromBetter).toBeGreaterThanOrEqual(fromBase);
          expect(fromBetter - current).toBeGreaterThanOrEqual(fromBase - current);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('contracts toward the target metric score without overshooting and converges at its fixed point', () => {
    assert(
      property(integer({ min: 0, max: 100 }), arbValidMetrics, (current, metrics) => {
        const target = Math.min(
          Math.round(
            metrics.efficiencyScore * 0.4 * 100 +
              metrics.discoveryRate * 0.3 * 100 +
              metrics.threatManagement * 0.3 * 100
          ),
          100
        );

        const next = updateConsciousness(current, metrics);
        expect(next).toBeGreaterThanOrEqual(Math.min(current, target));
        expect(next).toBeLessThanOrEqual(Math.max(current, target));
        expect(Math.abs(next - target)).toBeLessThanOrEqual(Math.abs(current - target));

        // Fixed point: already at target stays at target.
        expect(updateConsciousness(target, metrics)).toBe(target);

        // Repeated updates with constant metrics converge exactly to target.
        let value = current;
        for (let step = 0; step < 10; step++) {
          value = updateConsciousness(value, metrics);
        }
        expect(value).toBe(target);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('composes cleanly with calculateEfficiencyScore and calculateThreatManagementScore across boundaries', () => {
    assert(
      property(
        constantFrom(0, 1, 50, 99, 100),
        integer({ min: 0, max: 500 }),
        integer({ min: 0, max: 200 }),
        arbUnit,
        arbFinite,
        (current, keystrokes, optimalKeystrokes, discoveryRate, threatLevel) => {
          const metrics: ConsciousnessMetrics = {
            efficiencyScore: calculateEfficiencyScore(keystrokes, optimalKeystrokes),
            discoveryRate,
            threatManagement: calculateThreatManagementScore(threatLevel),
          };
          const updated = updateConsciousness(current, metrics);
          expect(Number.isInteger(updated)).toBe(true);
          expect(updated).toBeGreaterThanOrEqual(0);
          expect(updated).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
