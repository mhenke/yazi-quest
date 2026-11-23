import type { FileNode } from '../types';

export const computeNodeBytes = (node: FileNode): number => {
  if (node.type === 'dir' || node.type === 'archive') {
    return (node.children ?? []).reduce((sum, child) => sum + computeNodeBytes(child), 0);
  }
  return node.content?.length ?? 0;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

export const countVisibleChildren = (node: FileNode, showHidden: boolean): number =>
  (node.children ?? []).filter((child) => showHidden || !child.name.startsWith('.')).length;
