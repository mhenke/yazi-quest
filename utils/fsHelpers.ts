import { FileNode, Result, FsError, FileProtection } from '../types';

// --- Query Helpers ---

export const getNodeByPath = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (pathIds.length === 0) return null;
  if (pathIds[0] !== root.id) return null;

  let current = root;
  for (let i = 1; i < pathIds.length; i++) {
    if (!current.children) return null;
    const next = current.children.find((c) => c.id === pathIds[i]);
    if (!next) return null;
    current = next;
  }
  return current;
};

export const findNodeByName = (root: FileNode, name: string): FileNode | undefined => {
  if (root.name === name) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return undefined;
};

export const getParentNode = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (pathIds.length <= 1) return null; // Root has no parent in this context
  const parentPath = pathIds.slice(0, -1);
  return getNodeByPath(root, parentPath);
};

export const resolvePath = (root: FileNode, pathIds: string[]): string => {
  if (pathIds.length === 0 || pathIds[0] !== root.id) return '/';
  if (pathIds.length === 1) return '/';
  let pathString = '';
  let tempRoot = root;
  for (let i = 1; i < pathIds.length; i++) {
    const id = pathIds[i];
    const child = tempRoot.children?.find((c) => c.id === id);
    if (!child) return pathString; // broken path
    tempRoot = child;
    pathString += `/${child.name}`;
  }
  return pathString || '/';
};

export const getAllDirectories = (root: FileNode): { path: string[]; display: string }[] => {
  const results: { path: string[]; display: string }[] = [];
  const traverse = (node: FileNode, currentPathIds: string[], currentPathStr: string) => {
    results.push({ path: currentPathIds, display: currentPathStr });
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'dir') {
          const childPathStr =
            currentPathStr === '/' ? `/${child.name}` : `${currentPathStr}/${child.name}`;
          traverse(child, [...currentPathIds, child.id], childPathStr);
        }
      }
    }
  };
  traverse(root, [root.id], '/');
  return results;
};

export const getRecursiveContent = (
  root: FileNode,
  startPathIds: string[]
): { path: string[]; display: string; type: string; id: string }[] => {
  const startNode = getNodeByPath(root, startPathIds);
  if (!startNode) return [];
  const results: { path: string[]; display: string; type: string; id: string }[] = [];
  const traverse = (node: FileNode, prefixIds: string[], prefixStr: string) => {
    if (node.children) {
      for (const child of node.children) {
        const childRelativePathIds = [...prefixIds, child.id];
        const childDisplay = prefixStr ? `${prefixStr}/${child.name}` : child.name;
        results.push({
          path: childRelativePathIds,
          display: childDisplay,
          type: child.type,
          id: child.id,
        });
        if (child.children && (child.type === 'dir' || child.type === 'archive')) {
          traverse(child, childRelativePathIds, childDisplay);
        }
      }
    }
  };
  traverse(startNode, [], '');
  return results;
};

// --- Basic Helpers ---

export const cloneFS = (node: FileNode): FileNode => {
  return JSON.parse(JSON.stringify(node));
};

export const regenerateIds = (node: FileNode, newParentId: string | null = null): FileNode => {
  const newId = Math.random().toString(36).substr(2, 9);
  return {
    ...node,
    id: newId,
    parentId: newParentId,
    children: node.children ? node.children.map((child) => regenerateIds(child, newId)) : undefined,
  };
};

// --- Modification Helpers ---

export const deleteNode = (
  root: FileNode,
  parentPathIds: string[],
  nodeId: string,
  action: 'delete' | 'cut' = 'delete',
  force: boolean = false,
  levelId: number
): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (!parent || !parent.children) return { ok: false, error: 'InvalidPath' };
  const nodeToDelete = parent.children.find((c) => c.id === nodeId);
  if (!nodeToDelete) return { ok: false, error: 'NotFound' };
  const protectionMessage = force ? null : isProtected(nodeToDelete, levelId, action);
  if (protectionMessage) return { ok: false, error: 'Protected' };
  parent.children = parent.children.filter((c) => c.id !== nodeId);
  return { ok: true, value: newRoot };
};

export const addNode = (
  root: FileNode,
  parentPathIds: string[],
  newNode: FileNode
): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (!parent) return { ok: false, error: 'InvalidPath' };
  if (parent.protected) return { ok: false, error: 'Protected' };
  if (!parent.children) parent.children = [];
  const collision = parent.children.find((c) => c.name === newNode.name && c.type === newNode.type);
  if (collision) return { ok: false, error: 'Collision' };
  let nodeToInsert = regenerateIds(newNode, parent.id);
  const now = Date.now();
  nodeToInsert.createdAt = newNode.createdAt || now;
  nodeToInsert.modifiedAt = now;
  parent.children.push(nodeToInsert);
  parent.children.sort((a, b) => {
    const typeScore = (t: string) => (t === 'dir' ? 0 : t === 'archive' ? 1 : 2);
    const scoreA = typeScore(a.type);
    const scoreB = typeScore(b.type);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.name.localeCompare(b.name);
  });
  return { ok: true, value: newRoot };
};

export const renameNode = (
  root: FileNode,
  parentPathIds: string[],
  nodeId: string,
  newName: string,
  levelId: number,
  force: boolean = false
): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (!parent || !parent.children) return { ok: false, error: 'InvalidPath' };
  const nodeToRename = parent.children.find((c) => c.id === nodeId);
  if (!nodeToRename) return { ok: false, error: 'NotFound' };
  const protectionMessage = isProtected(nodeToRename, levelId, 'rename');
  if (protectionMessage) return { ok: false, error: 'Protected' };
  const collision = parent.children.find(
    (c) => c.id !== nodeId && c.name === newName && c.type === nodeToRename.type
  );
  if (collision) {
    if (force) {
      parent.children = parent.children.filter((c) => c.id !== collision.id);
    } else {
      return { ok: false, error: 'Collision' };
    }
  }
  nodeToRename.name = newName;
  nodeToRename.modifiedAt = Date.now();
  parent.children.sort((a, b) => {
    const typeScore = (t: string) => (t === 'dir' ? 0 : t === 'archive' ? 1 : 2);
    const scoreA = typeScore(a.type);
    const scoreB = typeScore(b.type);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.name.localeCompare(b.name);
  });
  return { ok: true, value: newRoot };
};

export const setNodeProtection = (
  root: FileNode,
  pathNames: string[], // e.g., ['home', 'guest', 'datastore']
  action: 'delete' | 'cut' | 'rename' | 'add',
  message: string | null,
  releaseLevel?: number
): FileNode => {
  const newRoot = cloneFS(root);
  let current: FileNode | undefined = newRoot;
  for (const name of pathNames) {
    if (!current?.children) return newRoot;
    current = current.children.find((child) => child.name === name);
    if (!current) return newRoot;
  }
  const newProtection: FileProtection = { ...(current.protection || {}) };
  if (message === null) {
    delete newProtection[action];
  } else {
    newProtection[action] = message;
  }
  if (releaseLevel !== undefined) {
    newProtection.releaseLevel = releaseLevel;
  }
  if (Object.keys(newProtection).filter((k) => k !== 'releaseLevel').length === 0) {
    current.protection = undefined;
  } else {
    current.protection = newProtection;
  }
  return newRoot;
};

const generateCollisionInfo = (
  existingNode: FileNode
): { collision: true; collisionNode: FileNode } => {
  return { collision: true, collisionNode: existingNode };
};

export const createPath = (
  root: FileNode,
  parentPathIds: string[],
  pathStr: string
): {
  fs: FileNode;
  error?: string;
  createdName?: string;
  collision?: boolean;
  collisionNode?: FileNode;
} => {
  const newRoot = cloneFS(root);
  let currentPath = [...parentPathIds];
  const segments = pathStr.split('/').filter((s) => s.trim().length > 0);
  const isDirTarget = pathStr.endsWith('/');
  for (let i = 0; i < segments.length; i++) {
    let name = segments[i];
    const isLast = i === segments.length - 1;
    const type: 'dir' | 'file' = !isLast ? 'dir' : isDirTarget ? 'dir' : 'file';
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: 'Path resolution failed' };
    if (parent.protected) return { fs: root, error: 'Permission denied: directory is read-only.' };
    const existingTyped = parent.children?.find((c) => c.name === name && c.type === type);
    if (existingTyped) {
      if (!isLast) {
        currentPath.push(existingTyped.id);
        continue;
      } else {
        return { fs: root, ...generateCollisionInfo(existingTyped) };
      }
    } else {
      if (!isLast) {
        const existingFile = parent.children?.find((c) => c.name === name && c.type !== 'dir');
        if (existingFile)
          return { fs: root, error: `Cannot create directory path through file: ${name}` };
      }
    }
    const newNode: FileNode = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      type: type,
      parentId: parent.id,
      children: type === 'dir' ? [] : undefined,
      content: type === 'file' ? '' : undefined,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);
    parent.children.sort((a, b) => {
      const typeScore = (t: string) => (t === 'dir' ? 0 : t === 'archive' ? 1 : 2);
      const scoreA = typeScore(a.type);
      const scoreB = typeScore(b.type);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.name.localeCompare(b.name);
    });
    if (isLast) {
      return { fs: newRoot, createdName: name };
    }
    currentPath.push(newNode.id);
  }
  return { fs: newRoot };
};

const getProtectionMessage = (
  node: FileNode,
  action: 'delete' | 'cut' | 'rename' | 'add',
  levelId: number
): string | null => {
  if (node.protected) {
    return '🔒 Permanently protected system file/directory.';
  }
  if (node.protection) {
    const message = node.protection[action];
    const releaseLevel = node.protection.releaseLevel;
    if (message) {
      if (releaseLevel === undefined) {
        return message;
      }
      if (releaseLevel === -1) {
        return message;
      }
      if (levelId < releaseLevel) {
        return message;
      }
    }
  }
  return null;
};

export const isProtected = (
  node: FileNode,
  levelId: number,
  action: 'delete' | 'cut' | 'rename'
): string | null => {
  return getProtectionMessage(node, action, levelId);
};

export const initializeTimestamps = (node: FileNode, baseTime: number = Date.now()): FileNode => {
  const updatedNode = {
    ...node,
    createdAt: node.createdAt || baseTime,
    modifiedAt: node.modifiedAt || baseTime,
  };
  if (updatedNode.children) {
    updatedNode.children = updatedNode.children.map((child, index) =>
      initializeTimestamps(child, baseTime - index * 1000)
    );
  }
  return updatedNode;
};
