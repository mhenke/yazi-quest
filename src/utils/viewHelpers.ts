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

export const activeFilterMatches = (
  state: GameState,
  predicate: (n: FileNode) => boolean,
): boolean => {
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  if (!currentDir || !currentDir.children) return false;

  const filter = state.filters[currentDir.id] || '';
  if (!filter) return false;

  const visible = getVisibleItems(state);
  if (visible.length === 0) return false;

  return visible.every(predicate);
};

/**
 * Recursively search for files matching a query string.
 * Searches all files in the given directory and its subdirectories.
 * Returns flattened array of matching FileNodes with displayPath for full relative paths.
 */
export const getRecursiveSearchResults = (
  rootNode: FileNode,
  query: string,
  showHidden: boolean = false,
): FileNode[] => {
  if (!query || !rootNode) return [];

  const results: FileNode[] = [];
  const lowerQuery = query.toLowerCase();

  const searchRecursive = (node: FileNode, pathPrefix: string) => {
    if (!node.children) return;

    for (const child of node.children) {
      // Skip hidden files unless showHidden is true
      if (!showHidden && child.name.startsWith('.')) continue;

      // Build relative path for display
      const relativePath = pathPrefix ? `${pathPrefix}/${child.name}` : child.name;

      // Check if file matches query
      if (child.type === 'file' && child.name.toLowerCase().includes(lowerQuery)) {
        // Clone node and add displayPath for showing full relative path
        results.push({ ...child, displayPath: relativePath });
      }

      // Recurse into directories and archives
      if (child.type === 'dir' || child.type === 'archive') {
        // Also check if directory name matches
        if (child.name.toLowerCase().includes(lowerQuery)) {
          results.push({ ...child, displayPath: relativePath });
        }
        searchRecursive(child, relativePath);
      }
    }
  };

  searchRecursive(rootNode, '');
  return results;
};
