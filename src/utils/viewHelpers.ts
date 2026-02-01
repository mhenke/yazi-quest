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
      const flags = isCaseSensitive ? '' : 'i';

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

export const getVisibleItems = (state: GameState): FileNode[] => {
  if (state.searchQuery) {
    // If a search is active, return the sorted search results
    // We must apply sorting here to match what the user sees in the UI
    let items = [...state.searchResults];

    // Apply active filter if present (allows filtering within search results)
    const currentDir = getNodeByPath(state.fs, state.currentPath);
    if (currentDir) {
      const filter = state.filters[currentDir.id] || '';
      if (filter) {
        const regex = getFilterRegex(filter);
        if (regex) {
          items = items.filter((c) => regex.test(c.name));
        } else {
          items = [];
        }
      }
    }

    return sortNodes(items, state.sortBy, state.sortDirection);
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
      // If regex is invalid, show no items (Yazi/fd behavior)
      items = [];
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
  console.log('SEARCH DEBUG:', { query, rootNodeName: rootNode.name, startPath, showHidden });
  const regex = getFilterRegex(query);
  console.log('SEARCH REGEX:', regex);
  if (!regex) return [];

  const startNode = getNodeByPath(rootNode, startPath);
  console.log('SEARCH START NODE:', startNode?.name);
  if (!startNode) return [];

  const allDescendants = getAllFiles(startNode, '', startPath);
  console.log('SEARCH TOTAL DESCENDANTS:', allDescendants.length);

  const results = allDescendants
    .filter((item) => {
      if (!showHidden && item.node.name.startsWith('.')) {
        return false;
      }
      const matched = regex.test(item.displayPath);
      if (item.node.name.endsWith('.log')) {
        // console.log('LOG MATCH CHECK:', { path: item.displayPath, matched });
      }
      return matched;
    })
    .map((item) => ({
      ...item.node,
      displayPath: item.displayPath,
      path: item.path,
    }));

  console.log('SEARCH RESULTS COUNT:', results.length);
  return results;
};
