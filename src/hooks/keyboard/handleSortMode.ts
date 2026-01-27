import React from 'react';
import { GameState } from '../../types';

export const handleSortModeKeyDown = (
  e: KeyboardEvent,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const key = e.key;
  const shift = e.shiftKey;

  if (key === 'Escape') {
    setGameState((prev) => ({ ...prev, mode: 'normal', acceptNextKeyForSort: false }));
    return;
  }

  if (key === 'l') {
    setGameState((prev) => {
      const modes: ('none' | 'size' | 'mtime' | 'permissions')[] = [
        'none',
        'size',
        'mtime',
        'permissions',
      ];
      const nextIndex = (modes.indexOf(prev.linemode) + 1) % modes.length;
      return {
        ...prev,
        mode: 'normal',
        acceptNextKeyForSort: false,

        linemode: modes[nextIndex],
      };
    });
    return;
  }

  if (key === '-') {
    setGameState((prev) => ({
      ...prev,
      mode: 'normal',
      acceptNextKeyForSort: false,
      linemode: 'none',
    }));
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
    setGameState((prev) => ({
      ...prev,
      mode: 'normal',
      acceptNextKeyForSort: false,
      sortBy: config.by,
      sortDirection: shift ? config.reverseDir : config.defaultDir,
      linemode: config.linemode || prev.linemode,
      usedSortM: prev.usedSortM || key.toLowerCase() === 'm',
      notification: { message: `Sort: ${config.label}${shift ? ' (rev)' : ''}` },
    }));
  }
};
