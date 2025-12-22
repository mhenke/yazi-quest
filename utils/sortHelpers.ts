import { FileNode, SortBy, SortDirection } from '../types';

/**
 * Sort files according to Yazi's sorting methods
 * Real Yazi: ,m (modified), ,a (alphabetical), ,s (size), ,e (extension), ,n (natural)
 */
export function sortNodes(
  nodes: FileNode[],
  sortBy: SortBy,
  sortDirection: SortDirection
): FileNode[] {
  const sorted = [...nodes];

  // Type priority score for natural sorting
  const typeScore = (type: string) => {
    if (type === 'dir') return 0;
    if (type === 'archive') return 1;
    return 2; // file
  };

  switch (sortBy) {
    case 'natural':
      // Natural: dirs -> archives -> files, alphabetical within each type
      sorted.sort((a, b) => {
        const scoreA = typeScore(a.type);
        const scoreB = typeScore(b.type);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name);
      });
      break;

    case 'alphabetical':
      // Pure alphabetical, ignore type
      // Custom logic: underscores sort after letters so reversed puts them at top (Issue #5)
      sorted.sort((a, b) => {
        const aStart = a.name.startsWith('_');
        const bStart = b.name.startsWith('_');
        if (aStart && !bStart) return 1;
        if (!aStart && bStart) return -1;
        return a.name.localeCompare(b.name);
      });
      break;

    case 'modified':
      // Sort by modification time
      sorted.sort((a, b) => {
        const timeA = a.modifiedAt || 0;
        const timeB = b.modifiedAt || 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name); // Fallback to name if same time
      });
      break;

    case 'size':
      // Sort by file size
      sorted.sort((a, b) => {
        const sizeA =
          a.type === 'dir' || a.type === 'archive'
            ? a.children?.length || 0
            : a.content?.length || 0;
        const sizeB =
          b.type === 'dir' || b.type === 'archive'
            ? b.children?.length || 0
            : b.content?.length || 0;
        return sizeA - sizeB;
      });
      break;

    case 'extension':
      // Sort by file extension
      sorted.sort((a, b) => {
        const extA = a.name.split('.').pop()?.toLowerCase() || '';
        const extB = b.name.split('.').pop()?.toLowerCase() || '';
        const extCompare = extA.localeCompare(extB);
        if (extCompare !== 0) return extCompare;
        return a.name.localeCompare(b.name); // Same extension, sort by name
      });
      break;

    default:
      // Fallback to natural
      sorted.sort((a, b) => {
        const scoreA = typeScore(a.type);
        const scoreB = typeScore(b.type);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name);
      });
  }

  // Apply direction
  if (sortDirection === 'desc') {
    sorted.reverse();
  }

  return sorted;
}

/**
 * Get sort label for UI display
 */
export function getSortLabel(sortBy: SortBy, sortDirection: SortDirection): string {
  const dirSymbol = sortDirection === 'asc' ? '↑' : '↓';

  switch (sortBy) {
    case 'natural':
      return `Natural ${dirSymbol}`;
    case 'alphabetical':
      return `A-Z ${dirSymbol}`;
    case 'modified':
      return `Modified ${dirSymbol}`;
    case 'size':
      return `Size ${dirSymbol}`;
    case 'extension':
      return `Extension ${dirSymbol}`;
    default:
      return `Natural ${dirSymbol}`;
  }
}
