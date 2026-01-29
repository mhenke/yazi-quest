import { GameState, Linemode } from '../../types';
import { Action } from '../gameReducer';

export const handleSortModeKeyDown = (
  e: KeyboardEvent,
  dispatch: React.Dispatch<Action>,
  gameState: GameState
) => {
  const key = e.key;
  const shift = e.shiftKey;

  if (key === 'Escape') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'UPDATE_UI_STATE', updates: { acceptNextKeyForSort: false } });
    return;
  }

  if (key === 'l') {
    const modes: Linemode[] = ['none', 'size', 'mtime', 'permissions'];
    const nextIndex = (modes.indexOf(gameState.linemode) + 1) % modes.length;
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_LINEMODE', mode: modes[nextIndex] });
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        acceptNextKeyForSort: false,
      },
    });
    return;
  }

  if (key === '-') {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({ type: 'SET_LINEMODE', mode: 'none' });
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        acceptNextKeyForSort: false,
      },
    });
    return;
  }

  // Config for standard sort keys
  const SORT_CONFIG: Record<
    string,
    {
      by: GameState['sortBy'];
      defaultDir: GameState['sortDirection'];
      reverseDir: GameState['sortDirection'];
      label: string;
      linemode?: GameState['linemode'];
    }
  > = {
    n: {
      by: 'natural',
      defaultDir: 'asc',
      reverseDir: 'desc',
      label: 'Natural',
    },
    a: {
      by: 'alphabetical',
      defaultDir: 'asc',
      reverseDir: 'desc',
      label: 'A-Z',
    },
    m: {
      by: 'modified',
      defaultDir: 'desc',
      reverseDir: 'asc',
      label: 'Modified',
      linemode: 'mtime',
    },
    s: {
      by: 'size',
      defaultDir: 'desc',
      reverseDir: 'asc',
      label: 'Size',
      linemode: 'size',
    },
    e: {
      by: 'extension',
      defaultDir: 'asc',
      reverseDir: 'desc',
      label: 'Extension',
    },
  };

  const config = SORT_CONFIG[key.toLowerCase()];

  if (config) {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
    dispatch({
      type: 'SET_SORT',
      sortBy: config.by,
      direction: shift ? config.reverseDir : config.defaultDir,
    });
    if (config.linemode) {
      dispatch({ type: 'SET_LINEMODE', mode: config.linemode });
    }
    dispatch({ type: 'UPDATE_UI_STATE', updates: { acceptNextKeyForSort: false } });
    if (key.toLowerCase() === 'm') {
        dispatch({ type: 'MARK_ACTION_USED', actionKey: 'usedSortM' });
    }
    dispatch({
        type: 'SET_NOTIFICATION',
        message: `Sort: ${config.label}${shift ? ' (rev)' : ''}`
    });
  }
};
