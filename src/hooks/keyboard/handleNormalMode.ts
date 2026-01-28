import { GameState, FileNode, Level } from '../../types';
import { getActionIntensity } from './utils';
import { handleLevel13NodeSwitch } from './handleNarrativeTriggers';
import { handleNavigationKeyDown } from './handleNavigation';
import { handleClipboardKeyDown } from './handleClipboard';
import { handleSystemParamsKeyDown } from './handleSystemParams';
import { Action } from '../gameReducer';

export const handleNormalModeKeyDown = (
  e: KeyboardEvent,
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  items: FileNode[],
  parent: FileNode | null,
  currentItem: FileNode | null,
  currentLevel: Level,
  advanceLevel: () => void,
  showNotification: (message: string, duration?: number) => void
) => {
  // 1. Level 13: Async Distributed Node Switching
  if (handleLevel13NodeSwitch(e, gameState.levelIndex, dispatch)) {
    return;
  }

  // 2. Retrieve intensity for this keypress
  const intensity = getActionIntensity(e.key, e.ctrlKey);

  // 3. Delegate to themed sub-handlers

  // Navigation & History
  if (
    handleNavigationKeyDown(
      e,
      gameState,
      dispatch,
      items,
      parent,
      currentItem,
      currentLevel,
      advanceLevel,
      showNotification,
      intensity
    )
  )
    return;

  // Clipboard & Selection & Deletion
  if (
    handleClipboardKeyDown(
      e,
      gameState,
      dispatch,
      items,
      currentItem,
      currentLevel,
      showNotification
    )
  )
    return;

  // System Params, UI Toggles & Search
  if (
    handleSystemParamsKeyDown(e, gameState, dispatch, currentItem, currentLevel, showNotification)
  )
    return;
};
