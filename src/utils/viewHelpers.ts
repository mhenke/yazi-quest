import { GameState, FileNode } from '../types';

import { getNodeByPath } from './fsHelpers';
import { sortNodes } from './sortHelpers';

export const getVisibleItems = (state: GameState): FileNode[] => {
  if (state.searchQuery) {
    // If a search is active, return the sorted search results
    // We must apply sorting here to match what the user sees in the UI
    return sortNodes(state.searchResults, state.sortBy, state.sortDirection);
  }

  const currentDir = getNodeByPath(state.fs, state.currentPath);
  if (!currentDir || !currentDir.children) return [];

  let items = [...currentDir.children];

  if (!state.showHidden) {
    items = items.filter((c) => !c.name.startsWith('.'));
  }

  const filter = state.filters[currentDir.id] || '';
  if (filter) {
    // Check if filter contains regex special characters
    const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(filter);

    if (hasRegexChars) {
      // Only allow safe regex patterns - alphanumeric, parentheses, pipe, dots, and dollar signs
      const isSafeRegex = /^[\w().|$^[\]*+?{} ]+$/i.test(filter);

      if (isSafeRegex) {
        try {
          // Try to treat filter as a regex pattern
          // eslint-disable-next-line security/detect-non-literal-regexp
          const regex = new RegExp(filter, 'i');
          items = items.filter((c) => regex.test(c.name));
        } catch {
          // Fall back to simple substring matching if regex is invalid
          items = items.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
        }
      } else {
        // If not a safe regex pattern, use simple substring matching
        items = items.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
      }
    } else {
      // If no special regex chars, use simple substring matching (traditional behavior)
      items = items.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
    }
  }

  return sortNodes(items, state.sortBy, state.sortDirection);
};

export const activeFilterMatches = (
  state: GameState,
  predicate: (n: FileNode) => boolean
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
  fullRootPath: string[] = ['root']
): FileNode[] => {
  if (!query || !rootNode) return [];

  const results: FileNode[] = [];
  const lowerQuery = query.toLowerCase();

  const searchRecursive = (node: FileNode, pathPrefix: string, idPath: string[]) => {
    if (!node.children) return;

    for (const child of node.children) {
      // Skip hidden files unless showHidden is true
      if (!showHidden && child.name.startsWith('.')) continue;

      // Build relative path for display
      const relativePath = pathPrefix ? `${pathPrefix}/${child.name}` : child.name;
      const currentIdPath = [...idPath, child.id];

      // Check if file matches query
      const nameMatch = child.name.toLowerCase().includes(lowerQuery);
      if (child.type === 'file' && nameMatch) {
        // Clone node and add displayPath for showing full relative path
        results.push({ ...child, displayPath: relativePath, path: currentIdPath });
      }

      // Recurse into directories and archives
      if (child.type === 'dir' || child.type === 'archive') {
        // Also check if directory name matches
        if (child.name.toLowerCase().includes(lowerQuery)) {
          results.push({ ...child, displayPath: relativePath, path: currentIdPath });
        }
        searchRecursive(child, relativePath, currentIdPath);
      }
    }
  };

  searchRecursive(rootNode, '', fullRootPath);
  return results;
};
