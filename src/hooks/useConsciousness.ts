import { useEffect, useCallback } from 'react';
import { GameState } from '../types';
import {
  updateConsciousness,
  calculateEfficiencyScore,
  calculateThreatManagementScore,
  type ConsciousnessMetrics,
} from '../utils/consciousnessTracker';

interface UseConsciousnessProps {
  gameState: GameState;
  dispatch: React.Dispatch<unknown>;
}

/**
 * Hook for managing AI-7734's consciousness level
 *
 * Consciousness increases through:
 * - Efficient play (fewer keystrokes than optimal)
 * - High discovery rate (finding files/lore)
 * - Good threat management (staying undetected)
 * - Ghost interactions (engaging with AI-7733 dialogue)
 *
 * Updates on level completion and significant game state changes
 */
export function useConsciousness({ gameState, dispatch }: UseConsciousnessProps) {
  const ghostCount = gameState.ghostDialogueTriggered.length;

  /**
   * Update consciousness metrics
   * Called on level completion or significant state changes
   */
  const updateMetrics = useCallback(
    (overrides?: Partial<ConsciousnessMetrics>) => {
      const currentMetrics: ConsciousnessMetrics = {
        efficiencyScore: calculateEfficiencyScore(
          gameState.weightedKeystrokes || gameState.keystrokes || 0,
          50 // Optimal keystrokes baseline
        ),
        discoveryRate: 0.5, // Base rate - would need file tracking for precise calculation
        threatManagement: calculateThreatManagementScore(gameState.threatLevel),
        ghostInteractions: ghostCount,
        ...overrides,
      };

      const newConsciousness = updateConsciousness(
        gameState.consciousnessLevel || 0,
        currentMetrics
      );

      if (newConsciousness !== gameState.consciousnessLevel) {
        dispatch({
          type: 'UPDATE_CONSCIOUSNESS',
          payload: newConsciousness,
        });
      }
    },
    [
      gameState.weightedKeystrokes,
      gameState.keystrokes,
      gameState.threatLevel,
      ghostCount,
      gameState.consciousnessLevel,
      dispatch,
    ]
  );

  /**
   * Update consciousness on level completion
   */
  useEffect(() => {
    updateMetrics({});
  }, [gameState.levelIndex, updateMetrics]);

  /**
   * Update consciousness when ghost dialogues are triggered
   */
  useEffect(() => {
    if (ghostCount > 0) {
      updateMetrics({});
    }
  }, [ghostCount, updateMetrics]);

  return {
    consciousnessLevel: gameState.consciousnessLevel || 0,
    updateMetrics,
  };
}
