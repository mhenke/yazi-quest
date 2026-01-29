import React from 'react';
import { GameState, Level } from '../../types';
import { getActionIntensity } from './utils';

import { Action } from '../gameReducer';

interface EpisodeWithLevels {
  id: number;
  name: string;
  shortTitle: string;
  color: string;
  border: string;
  bg: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  levels: Level[];
}

export const handleQuestMapModeKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  levels: Level[],
  episodes: EpisodeWithLevels[], // We might need to construct this or pass it in
  onClose: () => void,
  onJumpToLevel: (levelIndex: number) => void
) => {
  // We need to reconstruct the episodes logic or pass it.
  // For now, let's assume we can derive active episode based on questMapTab.
  // Actually, handleQuestMapState logic is simpler if we just manipulate indices.

  const intensity = getActionIntensity(e.key, e.ctrlKey);

  // Helper to get lengths
  const currentTab = gameState.questMapTab || 0;
  const currentMissionIdx = gameState.questMapMissionIdx || 0;

  // Safe bounds checks require knowing how many episodes and levels per episode.
  // We can pass a simplified structure or just the levels and compute.
  // Let's rely on the caller (hook) to provide context if needed, but for pure reducer logic:

  // Actually, we need the counts. Let's look at how to get them cheaply.
  // Or we can just limit blindly and let the UI clamp it? No, UI state needs to be correct.

  // Let's depend on the passed `episodes` array structure which App/Hook should derive.
  const activeEpisode = episodes[currentTab];
  const activeLevelsCount = activeEpisode?.levels?.length || 0;

  switch (e.key) {
    case 'h':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        tab: Math.max(0, (gameState.questMapTab || 0) - 1),
        missionIdx: 0,
      });
      break;
    case 'l':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        tab: Math.min(episodes.length - 1, (gameState.questMapTab || 0) + 1),
        missionIdx: 0,
      });
      break;
    case 'j':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        missionIdx: Math.min(activeLevelsCount - 1, (gameState.questMapMissionIdx || 0) + 1),
      });
      break;
    case 'k':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        missionIdx: Math.max(0, (gameState.questMapMissionIdx || 0) - 1),
      });
      break;
    case 'J': // Shift+J
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_QUEST_MAP',
          missionIdx: Math.min(
            activeLevelsCount - 1,
            (gameState.questMapMissionIdx || 0) + 5
          ),
        });
      }
      break;
    case 'K': // Shift+K
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_QUEST_MAP',
          missionIdx: Math.max(0, (gameState.questMapMissionIdx || 0) - 5),
        });
      }
      break;
    case 'Enter':
      if (e.shiftKey) {
        onClose();
      } else {
        // Jump Logic
        // We need to map (Tab, MissionIdx) -> GlobalLevelIndex
        const selectedLevel = activeEpisode?.levels[currentMissionIdx];
        if (selectedLevel) {
          // Find global index
          const globalIdx = levels.findIndex((l) => l.id === selectedLevel.id);
          // Verify unlocked
          if (globalIdx !== -1 && globalIdx <= gameState.levelIndex) {
            // gameState.levelIndex is "unlocked max" basically? No, it's current.
            // Wait, user can jump to any COMPLETED level or CURRENT level.
            // gameState.levelIndex is the level they are ON.
            // So if globalIdx <= gameState.levelIndex, it's safe.
            onJumpToLevel(globalIdx);
            onClose();
          }
        }
      }
      break;
    case 'Escape':
      onClose();
      break;
  }
};
