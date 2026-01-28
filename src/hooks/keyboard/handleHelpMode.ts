import { GameState } from '../../types';
import { Action } from '../gameReducer';
import { getActionIntensity } from './utils';

export const handleHelpModeKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState,
  onClose: () => void
) => {
  const intensity = getActionIntensity(e.key, e.ctrlKey);

  switch (e.key) {
    case 'j':
    case 'ArrowDown':
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          helpScrollPosition: (gameState.helpScrollPosition || 0) + 1,
          lastActionIntensity: intensity,
        },
      });
      break;
    case 'k':
    case 'ArrowUp':
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          helpScrollPosition: Math.max(0, (gameState.helpScrollPosition || 0) - 1),
          lastActionIntensity: intensity,
        },
      });
      break;
    case 'J': // Shift+J
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            helpScrollPosition: (gameState.helpScrollPosition || 0) + 5,
          },
        });
      }
      break;
    case 'K': // Shift+K
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            helpScrollPosition: Math.max(0, (gameState.helpScrollPosition || 0) - 5),
          },
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
