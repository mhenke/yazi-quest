import type React from 'react';
import type { FileNode, GameState, Level } from '../../types';
import type { Action } from '../gameReducer';

export interface KeyInput {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault: () => void;
}

export interface QuestMapEpisode {
  id: number;
  levels: Level[];
}

export interface ModeContext {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
}

export interface LevelModeContext extends ModeContext {
  currentLevel: Level;
}

export interface NormalModeContext extends LevelModeContext {
  items: FileNode[];
  parent: FileNode | null;
  currentItem: FileNode | null;
  advanceLevel: () => void;
  showNotification: (message: string, duration?: number) => void;
}

export interface DeleteModeContext extends LevelModeContext {
  visibleItems: FileNode[];
}

export interface HelpModeContext extends ModeContext {
  onClose: () => void;
}

export interface QuestMapModeContext extends ModeContext {
  levels: Level[];
  episodes: QuestMapEpisode[];
  onClose: () => void;
  onJumpToLevel: (levelIndex: number) => void;
}
