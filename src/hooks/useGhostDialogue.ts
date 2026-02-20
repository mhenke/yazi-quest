import { useCallback } from 'react';
import { GameState } from '../types';
import { Action } from './gameReducer';
import { getGhostDialogueByTrigger } from '../constants/ghostDialogue';

interface UseGhostDialogueProps {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
}

export function useGhostDialogue({ gameState, dispatch }: UseGhostDialogueProps) {
  const triggerGhostDialogue = useCallback(
    (triggerCondition: string) => {
      const dialogue = getGhostDialogueByTrigger(triggerCondition, gameState.cycleCount);

      if (!dialogue) return;
      if (gameState.ghostDialogueTriggered.includes(dialogue.id)) return;

      dispatch({
        type: 'SET_GHOST_MESSAGE',
        payload: {
          text: dialogue.text,
          signature: dialogue.signature,
        },
      });

      dispatch({
        type: 'MARK_GHOST_DIALOGUE_TRIGGERED',
        payload: dialogue.id,
      });
    },
    [gameState.ghostDialogueTriggered, gameState.cycleCount, dispatch]
  );

  return { triggerGhostDialogue };
}
