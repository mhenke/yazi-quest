import { FileNode, SortBy, SortDirection } from '../types';

/**
 * Sort files according to Yazi's sorting methods
 * Real Yazi alignment:
 * m -> modified
 * b -> created (birth)
 * a -> alphabetical
 * n -> natural
 * s -> size
 * e -> extension
 * r -> random
 */
export function sortNodes(
  nodes: FileNode[],
  sortBy: SortBy,
  sortDirection: SortDirection
): FileNode[] {
  const sorted = [...nodes];

  if (sortBy === 'random') {
    // Random doesn't care about direction usually, but we'll shuffle
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    return sorted;
  }

  // Type priority score (Real Yazi defaults to sorting directories first)
  const typeScore = (type: string) => {
    if (type === 'dir') return 0;
    if (type === 'archive') return 1;
    return 2; // file
  };

  const getSortValue = (node: FileNode) => {
    switch (sortBy) {
      case 'natural':
        // Natural sort is numeric-aware and case-insensitive
        return node.name;
      case 'alphabetical':
        // Standard strict string comparison (lexicographical)
        return node.name;
      case 'created':
        return node.createdAt || 0;
      case 'modified':
        return node.modifiedAt || 0;
      case 'size':
        return node.type === 'dir' || node.type === 'archive'
          ? (node.children?.length || 0)
          : (node.content?.length || 0);
      case 'extension':
        return node.name.split('.').pop()?.toLowerCase() || '';
      default:
        return node.name;
    }
  };

  sorted.sort((a, b) => {
    // 1. Dir-first logic (Baseline Yazi behavior)
    const tA = typeScore(a.type);
    const tB = typeScore(b.type);
    if (tA !== tB) return tA - tB;

    // 2. Main sort criteria
    const vA = getSortValue(a);
    const vB = getSortValue(b);

    let result = 0;
    if (sortBy === 'natural' && typeof vA === 'string' && typeof vB === 'string') {
      // Natural: Numeric aware, base sensitivity (case-insensitive)
      result = vA.localeCompare(vB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'alphabetical' && typeof vA === 'string' && typeof vB === 'string') {
      // Alphabetical: Strict lexicographical (case-sensitive)
      result = vA < vB ? -1 : vA > vB ? 1 : 0;
    } else if (typeof vA === 'number' && typeof vB === 'number') {
      result = vA - vB;
    } else {
      result = String(vA).localeCompare(String(vB));
    }

    return sortDirection === 'asc' ? result : -result;
  });

  return sorted;
}

/**
 * Get sort label for UI display
 */
export function getSortLabel(sortBy: SortBy, sortDirection: SortDirection): string {
  const dirSymbol = sortDirection === 'asc' ? '↑' : '↓';

  switch (sortBy) {
    case 'natural': return `Natural ${dirSymbol}`;
    case 'alphabetical': return `Alphabetical ${dirSymbol}`;
    case 'created': return `Created ${dirSymbol}`;
    case 'modified': return `Modified ${dirSymbol}`;
    case 'size': return `Size ${dirSymbol}`;
    case 'extension': return `Extension ${dirSymbol}`;
    case 'random': return `Random`;
    default: return `Natural ${dirSymbol}`;
  }
}
