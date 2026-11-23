import type { FileNode } from '../types';
import { getNodeByPath } from './fsHelpers';

export const dirsToLoad = (
  fs: FileNode,
  currentPath: string[],
  currentItem: FileNode | null
): string[] => {
  const currentDirId = getNodeByPath(fs, currentPath)?.id;
  const hoveredDirId = currentItem?.type === 'dir' ? currentItem.id : null;
  return [currentDirId, hoveredDirId].filter((id): id is string => Boolean(id));
};
