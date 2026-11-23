import { GameState, FileNode } from '../types';

import { getNodeByPath } from './fsHelpers';
import { sortNodes } from './sortHelpers';

// Helper to create a regex from the filter string, handling smart-case.
// Returns null if the filter is an invalid regex.
// Note: This strictly follows Yazi/fd behavior where input is raw regex (. = wildcard).
export const getFilterRegex = (input: string): RegExp | null => {
  if (!input) return null;

  // Smart-case: if filter contains any uppercase, make it case-sensitive.
  // We do NOT treat escapes as case-sensitive triggers, because the user might just be escaping a dot.
  const isCaseSensitive = /[A-Z]/.test(input);
  const flags = isCaseSensitive ? '' : 'i';

  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(input, flags);
  } catch {
    // Return a regex that matches nothing if input is invalid
    // Prevents crashing and signals invalidity
    return null;
  }
};

// Apply the active filter to a list of nodes.
// An empty filter is a no-op; an invalid regex matches nothing (Yazi/fd behavior).
const applyActiveFilter = (items: FileNode[], filter: string): FileNode[] => {
  if (!filter) return items;

  const regex = getFilterRegex(filter);
  if (!regex) return [];

  return items.filter((c) => regex.test(c.name));
};

export const getVisibleItems = (state: GameState): FileNode[] => {
  if (state.searchQuery) {
    // If a search is active, return the sorted search results
    // We must apply sorting here to match what the user sees in the UI
    let items = [...state.searchResults];

    // Apply active filter if present (allows filtering within search results);
    // no currentDir means no filtering of search results.
    const currentDir = getNodeByPath(state.fs, state.currentPath);
    const filter = currentDir ? state.filters[currentDir.id] || '' : '';
    items = applyActiveFilter(items, filter);

    return sortNodes(items, state.sortBy, state.sortDirection);
  }

  const currentDir = getNodeByPath(state.fs, state.currentPath);
  if (!currentDir || !currentDir.children) return [];

  let items = [...currentDir.children];

  if (!state.showHidden) {
    items = items.filter((c) => !c.name.startsWith('.'));
  }

  items = applyActiveFilter(items, state.filters[currentDir.id] || '');

  return sortNodes(items, state.sortBy, state.sortDirection);
};

/**
 * Recursively search for files matching a query string.
 * Searches all files in the given directory and its subdirectories.
 * Returns flattened array of matching FileNodes with displayPath for full relative paths.
 */
const getAllFiles = (
  node: FileNode,
  pathPrefix: string,
  idPath: string[]
): { node: FileNode; displayPath: string; path: string[] }[] => {
  let files: { node: FileNode; displayPath: string; path: string[] }[] = [];

  if (node.children) {
    for (const child of node.children) {
      const newDisplayPath = pathPrefix ? `${pathPrefix}/${child.name}` : child.name;
      const newIdPath = [...idPath, child.id];
      files.push({ node: child, displayPath: newDisplayPath, path: newIdPath });

      if (child.children) {
        // FIX: Do not recurse into archives. They are opaque to search.
        if (child.type === 'archive') continue;
        files = files.concat(getAllFiles(child, newDisplayPath, newIdPath));
      }
    }
  }
  return files;
};

export const getRecursiveSearchResults = (
  rootNode: FileNode,
  query: string,
  showHidden: boolean = false,
  startPath: string[] = ['root']
): FileNode[] => {
  const regex = getFilterRegex(query);
  if (!regex) return [];

  const startNode = getNodeByPath(rootNode, startPath);
  if (!startNode) return [];

  const allDescendants = getAllFiles(startNode, '', startPath);

  const results = allDescendants
    .filter((item) => {
      if (!showHidden && item.node.name.startsWith('.')) {
        return false;
      }
      return regex.test(item.displayPath);
    })
    .map((item) => ({
      ...item.node,
      displayPath: item.displayPath,
      path: item.path,
    }));

  return results;
};
