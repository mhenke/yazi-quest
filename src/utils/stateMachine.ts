import { GameState } from '../types';

export type GameMode = GameState['mode'];

const VALID_TRANSITIONS: Record<GameMode, GameMode[]> = {
  'normal': [
    'input-file',
    'input-dir',
    'confirm-delete',
    'filter',
    'search',
    'zoxide-jump',
    'rename',
    'bulk-rename',
    'fzf-current',
    'sort',
    'g-command',
    'z-prompt',
    'filter-warning',
    'search-warning',
    'overwrite-confirm', // Allowed via logic flow in App.tsx (collision check)
    'go',
    'cd-interactive'
  ],
  'input-file': ['normal', 'overwrite-confirm'],
  'input-dir': ['normal'],
  'confirm-delete': ['normal'],
  'filter': ['normal'],
  'search': ['normal'], // Search confirms or cancels to normal
  'zoxide-jump': ['normal'],
  'rename': ['normal'],
  'bulk-rename': ['normal'],
  'go': ['normal'],
  'cd-interactive': ['normal'],
  'fzf-current': ['normal'],
  'overwrite-confirm': ['normal'], // Confirm or Cancel
  'sort': ['normal'],
  'g-command': ['normal'],
  'z-prompt': ['normal'],
  'filter-warning': ['normal'],
  'search-warning': ['normal']
};

/**
 * Validates if a transition from currentMode to nextMode is allowed.
 * Returns true if allowed, false otherwise.
 * Transitions to the same mode are always allowed.
 */
export const isValidTransition = (currentMode: GameMode, nextMode: GameMode): boolean => {
  if (currentMode === nextMode) return true;

  const allowed = VALID_TRANSITIONS[currentMode];
  if (!allowed) {
    console.warn(`StateMachine: Unknown current mode '${currentMode}'`);
    return false;
  }

  return allowed.includes(nextMode);
};
