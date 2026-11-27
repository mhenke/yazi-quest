import { getActionIntensity } from './utils';
import type { KeyInput, QuestMapModeContext } from './types';

export const handleQuestMapModeKeyDown = (
  e: KeyInput,
  { gameState, dispatch, levels, episodes, onClose, onJumpToLevel }: QuestMapModeContext
): void => {
  getActionIntensity(e.key, Boolean(e.ctrlKey));

  const currentTab = gameState.questMapTab || 0;
  const currentMissionIdx = gameState.questMapMissionIdx || 0;
  const activeEpisode = episodes[currentTab];
  const activeLevelsCount = activeEpisode?.levels?.length || 0;

  switch (e.key) {
    case 'h':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        tab: Math.max(0, currentTab - 1),
        missionIdx: 0,
      });
      break;
    case 'l':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        tab: Math.min(episodes.length - 1, currentTab + 1),
        missionIdx: 0,
      });
      break;
    case 'j':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        missionIdx: Math.min(activeLevelsCount - 1, currentMissionIdx + 1),
      });
      break;
    case 'k':
      dispatch({
        type: 'UPDATE_QUEST_MAP',
        missionIdx: Math.max(0, currentMissionIdx - 1),
      });
      break;
    case 'J': // Shift+J
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_QUEST_MAP',
          missionIdx: Math.min(activeLevelsCount - 1, currentMissionIdx + 5),
        });
      }
      break;
    case 'K': // Shift+K
      if (e.shiftKey) {
        dispatch({
          type: 'UPDATE_QUEST_MAP',
          missionIdx: Math.max(0, currentMissionIdx - 5),
        });
      }
      break;
    case 'Enter':
      if (e.shiftKey) {
        onClose();
      } else {
        const selectedLevel = activeEpisode?.levels[currentMissionIdx];
        if (selectedLevel) {
          const globalIdx = levels.findIndex((l) => l.id === selectedLevel.id);
          if (globalIdx !== -1 && globalIdx <= gameState.unlockedLevelIndex) {
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
