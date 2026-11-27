import type { FileNode } from '../../types';

export interface DirSpec {
  id: string;
  name: string;
  protected?: boolean;
  modifiedAt?: number;
  matchTypeOnly?: boolean;
  normalizeId?: boolean;
}

export const ensureDir = (parent: FileNode, spec: DirSpec): FileNode => {
  const existing = parent.children?.find(
    (c) => c.name === spec.name && (!spec.matchTypeOnly || c.type === 'dir')
  );
  if (existing) {
    if (spec.normalizeId && existing.id !== spec.id) {
      existing.id = spec.id;
    }
    return existing;
  }

  const dir: FileNode = {
    id: spec.id,
    name: spec.name,
    type: 'dir',
    children: [],
    parentId: parent.id,
    ...(spec.protected !== undefined ? { protected: spec.protected } : {}),
    ...(spec.modifiedAt !== undefined ? { modifiedAt: spec.modifiedAt } : {}),
  };
  parent.children ??= [];
  parent.children.push(dir);
  return dir;
};

export type FileSpec = Omit<FileNode, 'type' | 'parentId'>;

export const ensureFileByName = (parent: FileNode, spec: FileSpec): boolean => {
  if (parent.children?.some((c) => c.name === spec.name)) return false;
  parent.children ??= [];
  parent.children.push({ ...spec, type: 'file', parentId: parent.id });
  return true;
};

export const ensureFileById = (parent: FileNode, spec: FileSpec): boolean => {
  if (parent.children?.some((c) => c.id === spec.id)) return false;
  parent.children ??= [];
  parent.children.push({ ...spec, type: 'file', parentId: parent.id });
  return true;
};

export const filterChildren = (
  parent: FileNode | undefined,
  keep: (child: FileNode) => boolean
): void => {
  if (parent?.children) {
    parent.children = parent.children.filter(keep);
  }
};

export const collectFiles = (
  nodes: FileNode[],
  predicate: (node: FileNode) => boolean
): FileNode[] => {
  const matches: FileNode[] = [];
  for (const node of nodes) {
    if (predicate(node)) {
      matches.push(node);
    } else if (node.children) {
      matches.push(...collectFiles(node.children, predicate));
    }
  }
  return matches;
};
