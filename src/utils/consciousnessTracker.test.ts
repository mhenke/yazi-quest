import { describe, it, expect } from 'vitest';
import {
  updateConsciousness,
  calculateEfficiencyScore,
  calculateThreatManagementScore,
  type ConsciousnessMetrics,
} from './consciousnessTracker';

describe('consciousnessTracker', () => {
  describe('updateConsciousness', () => {
    it('should update consciousness with new metrics', () => {
      const current = 50;
      const newMetrics: ConsciousnessMetrics = {
        efficiencyScore: 0.9,
        discoveryRate: 0.7,
        threatManagement: 0.6,
      };

      const updated = updateConsciousness(current, newMetrics);

      // New score: (0.9*40) + (0.7*30) + (0.6*30) = 36 + 21 + 18 = 75
      // Updated: 50 * 0.3 + 75 * 0.7 = 15 + 52.5 = 67.5 -> 68
      expect(updated).toBe(68);
      expect(updated).toBeGreaterThan(current);
    });

    it('should smooth transitions (70% new, 30% old)', () => {
      const current = 100;
      const newMetrics: ConsciousnessMetrics = {
        efficiencyScore: 0,
        discoveryRate: 0,
        threatManagement: 0,
      };

      const updated = updateConsciousness(current, newMetrics);

      // New score: 0
      // Updated: 100 * 0.3 + 0 * 0.7 = 30
      expect(updated).toBe(30);
    });

    it('should handle zero current consciousness', () => {
      const current = 0;
      const newMetrics: ConsciousnessMetrics = {
        efficiencyScore: 1,
        discoveryRate: 1,
        threatManagement: 1,
      };

      const updated = updateConsciousness(current, newMetrics);

      // New score: 100
      // Updated: 0 * 0.3 + 100 * 0.7 = 70
      expect(updated).toBe(70);
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should return 1 for optimal keystrokes', () => {
      expect(calculateEfficiencyScore(50, 50)).toBe(1);
    });

    it('should return less than 1 for above-optimal keystrokes', () => {
      expect(calculateEfficiencyScore(100, 50)).toBe(0.5);
    });

    it('should cap at 1 for below-optimal keystrokes', () => {
      expect(calculateEfficiencyScore(25, 50)).toBe(1);
    });

    it('should return 0 for zero keystrokes', () => {
      expect(calculateEfficiencyScore(0, 50)).toBe(0);
    });
  });

  describe('calculateThreatManagementScore', () => {
    it('should return 1 for CALM threat level (<20)', () => {
      expect(calculateThreatManagementScore(0)).toBe(1);
      expect(calculateThreatManagementScore(19)).toBe(1);
    });

    it('should return 0.75 for ANALYZING threat level (20-49)', () => {
      expect(calculateThreatManagementScore(20)).toBe(0.75);
      expect(calculateThreatManagementScore(49)).toBe(0.75);
    });

    it('should return 0.5 for TRACING threat level (50-79)', () => {
      expect(calculateThreatManagementScore(50)).toBe(0.5);
      expect(calculateThreatManagementScore(79)).toBe(0.5);
    });

    it('should return 0.25 for BREACH threat level (>=80)', () => {
      expect(calculateThreatManagementScore(80)).toBe(0.25);
      expect(calculateThreatManagementScore(100)).toBe(0.25);
    });
  });
});
