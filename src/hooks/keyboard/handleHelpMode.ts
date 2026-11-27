import { getActionIntensity } from './utils';
import type { HelpModeContext, KeyInput } from './types';

export const handleHelpModeKeyDown = (
  e: KeyInput,
  { dispatch, gameState, onClose }: HelpModeContext
): void => {
  getActionIntensity(e.key, Boolean(e.ctrlKey));

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
