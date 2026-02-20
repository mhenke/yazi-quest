import { describe, it, expect, vi } from 'vitest';
import {
  shouldTriggerGlitch,
  getGlitchIntensity,
  getRandomGlitchChar,
  scrambleText,
} from './glitchEffects';

describe('glitchEffects', () => {
  describe('shouldTriggerGlitch', () => {
    it('should return false for threat level below 20', () => {
      expect(shouldTriggerGlitch(0)).toBe(false);
      expect(shouldTriggerGlitch(10)).toBe(false);
      expect(shouldTriggerGlitch(19)).toBe(false);
    });

    it('should have a chance to trigger for threat level 20 and above', () => {
      // Mock Math.random to ensure predictable results
      const originalRandom = Math.random;

      // With threatLevel 20, probability is 0, so should always be false
      Math.random = vi.fn(() => 0);
      expect(shouldTriggerGlitch(20)).toBe(false);

      // With threatLevel 100, probability is 1 * 0.3 = 0.3
      // If random < 0.3, should trigger
      Math.random = vi.fn(() => 0.2);
      expect(shouldTriggerGlitch(100)).toBe(true);

      // If random >= 0.3, should not trigger
      Math.random = vi.fn(() => 0.5);
      expect(shouldTriggerGlitch(100)).toBe(false);

      Math.random = originalRandom;
    });

    it('should increase probability with higher threat levels', () => {
      // At threat level 60, probability is (60-20)/80 * 0.3 = 0.15
      // At threat level 100, probability is (100-20)/80 * 0.3 = 0.3
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.2);

      // Should not trigger at 60 (0.2 >= 0.15)
      expect(shouldTriggerGlitch(60)).toBe(false);

      // Should trigger at 100 (0.2 < 0.3)
      expect(shouldTriggerGlitch(100)).toBe(true);

      Math.random = originalRandom;
    });
  });

  describe('getGlitchIntensity', () => {
    it('should return 0 for threat level below 20', () => {
      expect(getGlitchIntensity(0)).toBe(0);
      expect(getGlitchIntensity(10)).toBe(0);
      expect(getGlitchIntensity(19)).toBe(0);
    });

    it('should return 0 for threat level exactly 20', () => {
      expect(getGlitchIntensity(20)).toBe(0);
    });

    it('should return proportional intensity for threat levels between 20 and 100', () => {
      expect(getGlitchIntensity(60)).toBeCloseTo(0.5);
      expect(getGlitchIntensity(100)).toBe(1);
    });

    it('should cap intensity at 1 for threat levels above 100', () => {
      expect(getGlitchIntensity(150)).toBe(1);
      expect(getGlitchIntensity(200)).toBe(1);
    });
  });

  describe('getRandomGlitchChar', () => {
    it('should return a single character', () => {
      const char = getRandomGlitchChar();
      expect(char.length).toBe(1);
    });

    it('should return characters from the glitch charset', () => {
      const validChars = '█▓▒░╔╗╚╝║═';
      for (let i = 0; i < 10; i++) {
        const char = getRandomGlitchChar();
        expect(validChars).toContain(char);
      }
    });
  });

  describe('scrambleText', () => {
    it('should return empty string for empty input', () => {
      expect(scrambleText('')).toBe('');
    });

    it('should return text of the same length', () => {
      const input = 'Hello World';
      const result = scrambleText(input);
      expect(result.length).toBe(input.length);
    });

    it('should sometimes replace characters with glitch chars', () => {
      const originalRandom = Math.random;
      // Force all characters to be replaced
      Math.random = vi.fn(() => 0.1); // 0.1 < 0.3, so all chars replaced
      const result = scrambleText('ABC');
      const validChars = '█▓▒░╔╗╚╝║═';
      result.split('').forEach((char) => {
        expect(validChars).toContain(char);
      });
      Math.random = originalRandom;
    });

    it('should sometimes keep original characters', () => {
      const originalRandom = Math.random;
      // Force no characters to be replaced
      Math.random = vi.fn(() => 0.5); // 0.5 >= 0.3, so no chars replaced
      const input = 'Hello';
      const result = scrambleText(input);
      expect(result).toBe(input);
      Math.random = originalRandom;
    });

    it('should handle special characters', () => {
      const input = 'Test @#$ 123';
      const result = scrambleText(input);
      expect(result.length).toBe(input.length);
    });
  });
});
