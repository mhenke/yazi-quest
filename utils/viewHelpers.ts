import { GameState, FileNode } from '../types';
import { getNodeByPath } from './fsHelpers';
import { sortNodes } from './sortHelpers';

export const matchesFilter = (name: string, filter: string): boolean => {
  if (!filter) return true;
  // Yazi "smart-case": if filter contains any uppercase letter, perform case-sensitive match
  const hasUpper = /[A-Z]/.test(filter);
  if (hasUpper) return name.includes(filter);
  return name.toLowerCase().includes(filter.toLowerCase());
};

export const getVisibleItems = (state: GameState): FileNode[] => {
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  if (!currentDir || !currentDir.children) return [];

  let items = [...currentDir.children];

  if (!state.showHidden) {
    items = items.filter((c) => !c.name.startsWith('.'));
  }

  const filter = state.filters[currentDir.id] || '';
  if (filter) {
    items = items.filter((c) => matchesFilter(c.name, filter));
  }

  return sortNodes(items, state.sortBy, state.sortDirection);
};
