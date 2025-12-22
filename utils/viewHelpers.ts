import { GameState, FileNode } from '../types';
import { getNodeByPath } from './fsHelpers';
import { sortNodes } from './sortHelpers';

export const getVisibleItems = (state: GameState): FileNode[] => {
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  if (!currentDir || !currentDir.children) return [];

  let items = [...currentDir.children];

  if (!state.showHidden) {
    items = items.filter((c) => !c.name.startsWith('.'));
  }

  const filter = state.filters[currentDir.id] || '';
  if (filter) {
    items = items.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
  }

  return sortNodes(items, state.sortBy, state.sortDirection);
};
