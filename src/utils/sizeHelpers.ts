import type { FileNode } from '../types';
import { BASE_TIME } from '../constants/timings';

export const getDeterministicTimestamp = (node: FileNode): number => {
  if (node.modifiedAt) return node.modifiedAt;
  let hash = 0;
  for (let i = 0; i < node.id.length; i++) {
    hash = (hash << 5) - hash + node.id.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % (30 * 24 * 60 * 60 * 1000);
  return BASE_TIME - offset;
};

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
