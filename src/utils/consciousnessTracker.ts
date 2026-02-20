/**
 * Consciousness Meter - Tracks AI-7734's emergence through gameplay metrics
 *
 * This hidden stat affects narrative intensity and glitch effects.
 * Higher consciousness = more ghost dialogue, earlier lore reveals, increased UI corruption.
 */

export interface ConsciousnessMetrics {
  efficiencyScore: number; // 0-1 (lower keystrokes = higher score)
  discoveryRate: number; // 0-1 (files found / total files)
  threatManagement: number; // 0-1 (time spent at low threat levels)
  ghostInteractions: number; // Count of ghost dialogues triggered
}

/**
 * Calculate consciousness score from metrics (0-100)
 *
 * Weights:
 * - Efficiency: 30% (skillful play)
 * - Discovery: 25% (exploration)
 * - Threat Management: 25% (stealth)
 * - Ghost Interactions: 20% (narrative engagement, max 20 points)
 */
export function calculateConsciousness(metrics: ConsciousnessMetrics): number {
  const score =
    metrics.efficiencyScore * 0.3 * 100 +
    metrics.discoveryRate * 0.25 * 100 +
    metrics.threatManagement * 0.25 * 100 +
    Math.min(metrics.ghostInteractions * 5, 20); // Max 20 points from ghosts

  return Math.min(Math.round(score), 100);
}

/**
 * Update consciousness with smooth transition (70% new, 30% old)
 * Prevents jarring jumps in consciousness level
 */
export function updateConsciousness(current: number, newMetrics: ConsciousnessMetrics): number {
  const newScore = calculateConsciousness(newMetrics);
  // Smooth transition: 70% new score, 30% previous score
  return Math.round(current * 0.3 + newScore * 0.7);
}

/**
 * Calculate efficiency score from keystrokes
 * Optimal keystrokes assumed to be ~50 for average level
 */
export function calculateEfficiencyScore(
  keystrokes: number,
  optimalKeystrokes: number = 50
): number {
  if (keystrokes <= 0) return 0;
  // Score is 1.0 at optimal, decreases as keystrokes increase
  return Math.min(1, optimalKeystrokes / keystrokes);
}

/**
 * Calculate threat management score from threat level
 * Higher score for spending time at low threat levels
 */
export function calculateThreatManagementScore(threatLevel: number): number {
  if (threatLevel < 20) return 1; // CALM - perfect
  if (threatLevel < 50) return 0.75; // ANALYZING - good
  if (threatLevel < 80) return 0.5; // TRACING - okay
  return 0.25; // BREACH - poor
}
