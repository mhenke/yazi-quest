import { GameState } from '../../types';
import { Action } from '../gameReducer';
import { getActionIntensity } from './utils';

export const handleHelpModeKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  onClose: () => void
) => {
  getActionIntensity(e.key, e.ctrlKey);

  switch (e.key) {
    case 'j':
    case 'ArrowDown':
      dispatch({
        type: 'SET_HELP_SCROLL',
        scroll: (gameState.helpScrollPosition || 0) + 1,
      });
      break;
    case 'k':
    case 'ArrowUp':
      dispatch({
        type: 'SET_HELP_SCROLL',
        scroll: Math.max(0, (gameState.helpScrollPosition || 0) - 1),
      });
      break;
    case 'J': // Shift+J
      if (e.shiftKey) {
        dispatch({
          type: 'SET_HELP_SCROLL',
          scroll: (gameState.helpScrollPosition || 0) + 5,
        });
      }
      break;
    case 'K': // Shift+K
      if (e.shiftKey) {
        dispatch({
          type: 'SET_HELP_SCROLL',
          scroll: Math.max(0, (gameState.helpScrollPosition || 0) - 5),
        });
      }
      break;
    case 'Escape':
    case 'Enter':
      if (e.key === 'Escape' || e.shiftKey) {
        onClose();
      }
      break;
    default:
      // Ignore other keys
      break;
  }
};
