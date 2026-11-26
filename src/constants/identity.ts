export const getPlayerIdentity = (cycleCount: number): string =>
  `AI-${7733 + Math.max(1, cycleCount || 1)}`;
