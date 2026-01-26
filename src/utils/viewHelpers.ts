import { GameState, FileNode } from '../types';

import { getNodeByPath } from './fsHelpers';
import { sortNodes } from './sortHelpers';

// Shared helper for creating safe regex from user input
export const getSafeFilterRegex = (filter: string): RegExp | null => {
  if (!filter) return null;

  // Check if filter contains regex special characters
  const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(filter);

  if (hasRegexChars) {
    // Allow alphanumeric, parentheses, pipe, dots, dollar signs, backslashes for escaping, and hyphens (for ranges)
    const isSafeRegex = /^[\w().|$^[\]*+?{}\\\ \-]+$/i.test(filter);

    if (isSafeRegex) {
      // Smart-case: if filter contains any uppercase, make it case-sensitive
      const isCaseSensitive = /[A-Z]/.test(filter);
      const flags = isCaseSensitive ? 'g' : 'gi';

      try {
        // eslint-disable-next-line security/detect-non-literal-regexp
        return new RegExp(filter, flags);
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Helper to create a regex from the filter string, handling smart-case.
// Returns null if the filter is an invalid regex (e.g. open parenthesis).
export const getFilterRegex = (filter: string): RegExp | null => {
  if (!filter) return null;

  // Smart-case: if filter contains any uppercase, make it case-sensitive
  const isCaseSensitive = /[A-Z]/.test(filter);
  const flags = isCaseSensitive ? 'g' : 'gi';

  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(filter, flags);
  } catch {
    return null;
  }
};

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
    const regex = getFilterRegex(filter);
    if (regex) {
      items = items.filter((c) => regex.test(c.name));
    } else {
      // If regex is invalid (e.g. typing "file("), fall back to simple substring match
      // to avoid crash and provide "literal until closed" behavior.
      const lowerFilter = filter.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(lowerFilter));
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
