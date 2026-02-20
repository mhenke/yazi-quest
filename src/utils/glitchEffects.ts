export function shouldTriggerGlitch(threatLevel: number): boolean {
  if (threatLevel < 20) return false;

  const probability = threatLevel / 100; // 0 at 0%, 1 at 100%
  return Math.random() < probability * 0.3; // Max 30% chance per frame
}

export function getGlitchIntensity(threatLevel: number): number {
  if (threatLevel < 20) return 0;
  return Math.min(threatLevel / 100, 1);
}

export function getRandomGlitchChar(): string {
  const chars = '█▓▒░╔╗╚╝║═';
  return chars[Math.floor(Math.random() * chars.length)];
}

export function scrambleText(text: string): string {
  return text
    .split('')
    .map((char) => (Math.random() < 0.3 ? getRandomGlitchChar() : char))
    .join('');
}
