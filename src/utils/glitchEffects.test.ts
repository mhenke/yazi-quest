import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { shouldTriggerGlitch, getGlitchIntensity } from './glitchEffects';

describe('glitchEffects', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock Math.random to return 0.5 for consistent test results
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('should not trigger glitch at low threat', () => {
    expect(shouldTriggerGlitch(10)).toBe(false);
  });

  it('should trigger glitch at high threat', () => {
    // At threat 80, probability = 80/100 * 0.3 = 0.24
    // With Math.random() = 0.1, this should return true (0.1 < 0.24)
    randomSpy.mockReturnValue(0.1);
    expect(shouldTriggerGlitch(80)).toBe(true);
  });

  it('should calculate intensity based on threat level', () => {
    expect(getGlitchIntensity(0)).toBe(0);
    expect(getGlitchIntensity(50)).toBeCloseTo(0.5);
    expect(getGlitchIntensity(100)).toBe(1);
  });
});
