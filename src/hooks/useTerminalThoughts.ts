import { useCallback } from 'react';
import { GameState } from '../types';
import { Action } from './gameReducer';
import { getThoughtByTrigger, getThoughtsForPhase } from '../constants/terminalThoughts';

interface UseTerminalThoughtsProps {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
}

export function useTerminalThoughts({ gameState, dispatch }: UseTerminalThoughtsProps) {
  const calculatedPhase = Math.ceil((gameState.levelIndex + 1) / 5);
  const currentPhase = Math.min(Math.max(calculatedPhase, 1), 3) as 1 | 2 | 3;

  const triggerThought = useCallback(
    (triggerCondition: string) => {
      const thought = getThoughtByTrigger(triggerCondition);

      if (!thought) return;

      // Prevent duplicates within same episode
      if (gameState.triggeredThoughts.includes(thought.id)) return;
      if (gameState.lastThoughtId === thought.id) return;

      // Check phase alignment
      if (thought.phase !== currentPhase) return;

      dispatch({
        type: 'SET_THOUGHT',
        payload: {
          text: thought.text,
          author: thought.author === '7733' ? 'AI-7733' : 'AI-7734',
        },
      });

      dispatch({
        type: 'MARK_THOUGHT_TRIGGERED',
        payload: thought.id,
      });
    },
    [gameState.triggeredThoughts, gameState.lastThoughtId, currentPhase, dispatch]
  );

  const triggerPhaseThoughts = useCallback(() => {
    const phaseThoughts = getThoughtsForPhase(currentPhase);
    phaseThoughts.forEach((thought) => {
      triggerThought(thought.trigger.condition);
    });
  }, [currentPhase, triggerThought]);

  return {
    triggerThought,
    triggerPhaseThoughts,
    currentPhase,
  };
}
