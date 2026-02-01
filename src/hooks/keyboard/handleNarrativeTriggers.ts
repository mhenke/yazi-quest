import { GameState, FileNode } from '../../types';
import { Action } from '../gameReducer';
// import { BASE_TIME } from '../../constants'; // Avoid circular dependency

// May 31, 2015 - Midnight
const BASE_TIME = 1433059200000;

/**
 * Level 13: Async Distributed Node Switching
 * Handles keys '1', '2', '3' for manual node jumps in the final mission.
 */
export const handleLevel13NodeSwitch = (
  e: KeyboardEvent,
  currentLevelIndex: number,
  dispatch: React.Dispatch<Action>
): boolean => {
  if (currentLevelIndex !== 12) return false; // Level 13 is index 12

  const NODES: Record<string, { path: string[]; label: string }> = {
    '1': { path: ['root', 'nodes', 'tokyo'], label: 'TOKYO' },
    '2': { path: ['root', 'nodes', 'berlin'], label: 'BERLIN' },
    '3': { path: ['root', 'nodes', 'saopaulo'], label: 'SÃO PAULO' },
  };

  if (NODES[e.key]) {
    const target = NODES[e.key];
    dispatch({ type: 'NAVIGATE', path: target.path });
    dispatch({
      type: 'SET_NOTIFICATION',
      message: `>>> SYNC: ACTIVE NODE CHANGED TO ${target.label} <<<`,
    });
    return true;
  }
  return false;
};

/**
 * Level 11: Scouting Logic
 * Tracks files viewed in the info panel to progress the "Scout mission".
 */
export const checkLevel11Scouting = (
  gameState: GameState,
  newItem: FileNode | null
): GameState['level11Flags'] => {
  // Level 11 is index 10
  if (gameState.levelIndex !== 10 || !gameState.showInfoPanel || !newItem) {
    return gameState.level11Flags;
  }

  const scouted = gameState.level11Flags?.scoutedFiles || [];
  if (!scouted.includes(newItem.id)) {
    return {
      ...gameState.level11Flags,
      scoutedFiles: [...scouted, newItem.id],
      triggeredHoneypot: gameState.level11Flags?.triggeredHoneypot || false,
      selectedModern: gameState.level11Flags?.selectedModern || false,
    };
  }
  return gameState.level11Flags;
};

/**
 * Level 11: Legacy selection guidance
 */
export const getLevel11LegacyThought = (nodes: FileNode[], levelIndex: number): string | null => {
  // Level 11 is index 10
  if (levelIndex !== 10) return null;

  const thirtyDaysAgo = BASE_TIME - 30 * 86400000;
  const hasRecent = nodes.some((n) => (n.modifiedAt || 0) > thirtyDaysAgo);

  if (hasRecent) {
    return 'SCAN: This signature is too recent. Forensics will trace the delta. I need something older... something legacy.';
  }
  return null;
};
