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
    dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal', acceptNextKeyForSort: false } });
    return;
  }

  if (key === 'l') {
    const modes: Linemode[] = ['none', 'size', 'mtime', 'permissions'];
    const nextIndex = (modes.indexOf(gameState.linemode) + 1) % modes.length;
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        mode: 'normal',
        acceptNextKeyForSort: false,
        linemode: modes[nextIndex],
      },
    });
    return;
  }

  if (key === '-') {
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        mode: 'normal',
        acceptNextKeyForSort: false,
        linemode: 'none',
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
    dispatch({
      type: 'UPDATE_UI_STATE',
      updates: {
        mode: 'normal',
        acceptNextKeyForSort: false,
        sortBy: config.by,
        sortDirection: shift ? config.reverseDir : config.defaultDir,
        linemode: config.linemode || gameState.linemode,
        usedSortM: gameState.usedSortM || key.toLowerCase() === 'm',
        notification: { message: `Sort: ${config.label}${shift ? ' (rev)' : ''}` },
      },
    });
  }
};
