/**
 * Glitch Effects Utilities
 * Provides functions for random glitch triggering, intensity calculation,
 * and text scrambling for UI corruption effects.
 */

/**
 * Determines if a glitch should trigger based on threat level
 * @param threatLevel - Current threat level (0-100)
 * @returns true if glitch should trigger, false otherwise
 */
export function shouldTriggerGlitch(threatLevel: number): boolean {
  if (threatLevel < 20) return false;
  const probability = (threatLevel - 20) / 80;
  return Math.random() < probability * 0.3;
}

/**
 * Gets the intensity of glitch effects based on threat level
 * @param threatLevel - Current threat level (0-100)
 * @returns Intensity value between 0 and 1
 */
export function getGlitchIntensity(threatLevel: number): number {
  if (threatLevel < 20) return 0;
  return Math.min((threatLevel - 20) / 80, 1);
}

/**
 * Gets a random glitch character for visual corruption
 * @returns A random glitch character from the glitch charset
 */
export function getRandomGlitchChar(): string {
  const chars = '█▓▒░╔╗╚╝║═';
  return chars[Math.floor(Math.random() * chars.length)];
}

/**
 * Scrambles text by randomly replacing characters with glitch chars
 * @param text - The text to scramble
 * @returns Scrambled text with some characters replaced by glitch chars
 */
export function scrambleText(text: string): string {
  return text
    .split('')
    .map((char) => (Math.random() < 0.3 ? getRandomGlitchChar() : char))
    .join('');
}
