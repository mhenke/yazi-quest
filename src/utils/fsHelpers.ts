import { FileNode, Result, FsError, Level } from '../types';

// Simple id generator used across the constants for seeding
export function id(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function cloneFS(fs: FileNode): FileNode {
  return JSON.parse(JSON.stringify(fs));
}

export function getNodeById(root: FileNode, id: string | undefined): FileNode | undefined {
  if (!id) return undefined;
  if (root.id === id) return root;
  const stack: FileNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (!n.children) continue;
    for (const c of n.children) {
      if (c.id === id) return c;
      if (c.children) stack.push(c);
    }
  }
  return undefined;
}

/**
 * Find the path (array of IDs) leading to a node with the given ID.
 * Returns undefined if the node is not found.
 */
export function findPathById(root: FileNode, targetId: string): string[] | undefined {
  if (root.id === targetId) return [root.id];

  const stack: { node: FileNode; path: string[] }[] = [{ node: root, path: [root.id] }];
  while (stack.length) {
    const { node, path } = stack.pop()!;
    if (!node.children) continue;
    for (const child of node.children) {
      const childPath = [...path, child.id];
      if (child.id === targetId) return childPath;
      if (child.children) stack.push({ node: child, path: childPath });
    }
  }
  return undefined;
}

export function getNodeByPath(root: FileNode, path: string[] | undefined): FileNode | undefined {
  if (!path || path.length === 0) return undefined;
  // Path is an array of node ids from root
  let node: FileNode | undefined = root;
  for (const id of path) {
    if (!node) return undefined;
    if (node.id === id) continue; // root match
    node = (node.children || []).find((c) => c.id === id);
  }
  return node;
}

export function getParentNode(root: FileNode, path: string[] | undefined): FileNode | null {
  if (!path || path.length <= 1) return null;
  return getNodeByPath(root, path.slice(0, -1)) || null;
}

/**
 * Find a node by its name starting from the root of a (sub)tree.
 * @deprecated Use getNodeById for system-critical nodes (workspace, incoming, etc.) to avoid ambiguity.
 */
export function findNodeByName(
  root: FileNode,
  name: string,
  type?: 'file' | 'dir' | 'archive'
): FileNode | undefined {
  const stack: FileNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.name === name) {
      if (!type) {
        return n;
      }
      switch (type) {
        case 'dir':
          if (n.type === 'dir' || n.type === 'archive') {
            return n;
          }
          break;
        case 'file':
          if (n.type === 'file') {
            return n;
          }
          break;
        case 'archive':
          if (n.type === 'archive') {
            return n;
          }
          break;
      }
    }
    if (n.children) {
      stack.push(...n.children);
    }
  }
  return undefined;
}

export function getAllDirectories(root: FileNode): FileNode[] {
  const result: FileNode[] = [];
  const stack: FileNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.type === 'dir' || n.type === 'archive') result.push(n);
    if (n.children) stack.push(...n.children);
  }
  return result;
}

export function getAllDirectoriesWithPaths(
  root: FileNode,
  level?: Level
): { node: FileNode; path: string[] }[] {
  const result: { node: FileNode; path: string[] }[] = [];
  const stack: { node: FileNode; path: string[] }[] = [{ node: root, path: [root.id] }];

  while (stack.length > 0) {
    const { node: n, path: p } = stack.pop()!;

    // We add the directory to the list
    if (n.type === 'dir' || n.type === 'archive') {
      result.push({ node: n, path: p });
    }

    // Protection check: if recursive gathering, we block descending into protected areas
    if (level && isProtected(root, undefined, n, level, 'enter')) {
      continue;
    }

    // We check for children and add them to the stack
    if (n.children) {
      // FIX: Do not recurse into archives.
      if (n.type === 'archive') continue;

      for (const child of n.children) {
        stack.push({ node: child, path: [...p, child.id] });
      }
    }
  }
  return result;
}

export function resolvePath(root: FileNode, path: string[] | undefined): string {
  if (!path || path.length === 0) return '/';
  const names: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const id = path[i];
    const n = getNodeById(root, id);
    if (!n) continue;
    // Skip the root node's name so paths render as '/bin' instead of '//bin'
    if (i === 0 && n.id === root.id) continue;
    names.push(n.name);
  }
  return '/' + names.filter(Boolean).join('/');
}

export function getRecursiveContent(
  root: FileNode,
  path: string[] | undefined,
  level?: Level
): FileNode[] {
  const startNode = getNodeByPath(root, path) || root;
  const startPath = path && path.length ? [...path] : [root.id];
  const out: FileNode[] = [];
  // Stack items keep track of node and its id-path from root for display/path compatibility
  const stack: { node: FileNode; pathIds: string[] }[] = (startNode.children || []).map((c) => ({
    node: c,
    pathIds: [...startPath, c.id],
  }));
  while (stack.length) {
    const { node: n, pathIds } = stack.pop()!;

    // Augment node with runtime-only helpers expected elsewhere (cloning to avoid mutating the original FS state)
    const clonedNode: FileNode = {
      ...n,
      path: [...pathIds],
      display: resolvePath(root, [...pathIds]),
    };
    out.push(clonedNode);

    // Prune protected subtrees if level provided
    if (level && isProtected(root, undefined, n, level, 'enter')) {
      continue;
    }

    if (n.children) {
      // FIX: Do not recurse into archives. They are opaque to search/fzf.
      if (n.type === 'archive') continue;

      for (const c of n.children) {
        stack.push({ node: c, pathIds: [...pathIds, c.id] });
      }
    }
  }
  return out;
}

// Mutation helpers return a new root FileNode in Result.value on success
export function deleteNode(
  root: FileNode,
  parentPath: string[] | undefined,
  nodeId: string,
  _levelIndex?: number
): Result<FileNode, FsError> {
  try {
    const newRoot = cloneFS(root);
    const parent = parentPath && parentPath.length ? getNodeByPath(newRoot, parentPath) : newRoot;
    if (!parent) return { ok: false, error: 'NotFound' };
    if (!parent.children) return { ok: false, error: 'NotFound' };
    const idx = parent.children.findIndex((c) => c.id === nodeId);
    if (idx === -1) return { ok: false, error: 'NotFound' };
    parent.children.splice(idx, 1);
    return { ok: true, value: newRoot };
  } catch {
    return { ok: false, error: 'NotFound' };
  }
}

export function addNode(
  root: FileNode,
  parentPath: string[] | undefined,
  node: FileNode
): Result<FileNode, FsError> {
  try {
    const newRoot = cloneFS(root);
    const parent = parentPath && parentPath.length ? getNodeByPath(newRoot, parentPath) : newRoot;
    if (!parent) return { ok: false, error: 'NotFound' };
    parent.children = parent.children || [];
    parent.children.push(node);
    return { ok: true, value: newRoot };
  } catch {
    return { ok: false, error: 'NotFound' };
  }
}

export function renameNode(
  root: FileNode,
  parentPath: string[] | undefined,
  nodeId: string,
  newName: string,
  _levelIndex?: number
): Result<FileNode, FsError> {
  try {
    const newRoot = cloneFS(root);
    const node = getNodeById(newRoot, nodeId);
    if (!node) return { ok: false, error: 'NotFound' };
    node.name = newName;
    return { ok: true, value: newRoot };
  } catch {
    return { ok: false, error: 'NotFound' };
  }
}

// Simple createPath used by UI - attempts to create a file/dir name at the current path
export function createPath(
  root: FileNode,
  currentPath: string[] | undefined,
  input: string
): {
  fs: FileNode;
  error?: string | null;
  collision?: boolean;
  collisionNode?: FileNode | null;
  newNodeId?: string;
} {
  const newRoot = cloneFS(root);
  const parent = currentPath && currentPath.length ? getNodeByPath(newRoot, currentPath) : newRoot;
  if (!parent) return { fs: newRoot, error: 'NotFound', collision: false, collisionNode: null };
  parent.children = parent.children || [];

  // Normalize input: strip trailing slashes for the name (user may type 'protocols/')
  const isDir = input.endsWith('/');
  const normalizedName = input.replace(/\/+$/g, '');

  const exists = parent.children.find((c) => c.name === normalizedName);
  if (exists) {
    return { fs: newRoot, error: null, collision: true, collisionNode: exists };
  }
  // Allow a file and a directory to share the same name in the same parent.
  // Collision should only occur if an item with the same name AND same type exists.
  const sameTypeExists = parent.children.find(
    (c) => c.name === normalizedName && c.type === (isDir ? 'dir' : 'file')
  );
  if (sameTypeExists) {
    return { fs: newRoot, error: null, collision: true, collisionNode: sameTypeExists };
  }
  const newId = id();
  const node: FileNode = {
    id: newId,
    name: normalizedName,
    type: isDir ? 'dir' : 'file',
    parentId: parent.id,
  };
  if (node.type === 'dir') node.children = [];
  parent.children.push(node);
  return { fs: newRoot, error: null, collision: false, collisionNode: null, newNodeId: newId };
}

export function createHoneypot(
  parentId: string,
  name: string,
  content: string = '# HONEYPOT - DO NOT TOUCH',
  extraProps: Partial<FileNode> = {}
): FileNode {
  return {
    id: id('honeypot-'),
    name,
    type: 'file',
    content,
    parentId,
    isHoneypot: true,
    ...extraProps,
  };
}

export function resolveAndCreatePath(
  root: FileNode,
  currentPath: string[],
  inputPath: string
): {
  fs: FileNode;
  targetNode: FileNode | undefined;
  error?: string | null;
  collision?: boolean;
  collisionNode?: FileNode | null;
} {
  let newRoot = cloneFS(root);
  let effectiveParentPath: string[] = [];
  let pathSegmentsToCreate: string[] = [];

  if (inputPath.startsWith('~/')) {
    // Correctly resolve "~/" to /home/guest
    // We expect the standard "root -> home -> guest" structure
    const guestNode = getNodeByPath(newRoot, ['root', 'home', 'guest']);
    if (!guestNode) {
      return { fs: newRoot, error: 'Home directory (~/) not found', targetNode: undefined };
    }
    effectiveParentPath = ['root', 'home', 'guest'];
    pathSegmentsToCreate = inputPath.substring(2).split('/').filter(Boolean);
  } else if (inputPath.startsWith('/')) {
    effectiveParentPath = ['root'];
    pathSegmentsToCreate = inputPath.substring(1).split('/').filter(Boolean);
  } else {
    effectiveParentPath = [...currentPath];
    pathSegmentsToCreate = inputPath.split('/').filter(Boolean);
  }

  let currentWorkingNode: FileNode | undefined = getNodeByPath(newRoot, effectiveParentPath);
  if (!currentWorkingNode) {
    return { fs: newRoot, error: 'Starting path not found or invalid', targetNode: undefined };
  }

  let finalTargetNode: FileNode | undefined = undefined;

  for (let i = 0; i < pathSegmentsToCreate.length; i++) {
    const segment = pathSegmentsToCreate[i];
    const isLastSegment = i === pathSegmentsToCreate.length - 1;

    // Determine if this segment needs to be a directory
    // Intermediate segments MUST be directories to contain the next segment.
    // The last segment is a directory ONLY if the input path ended with '/'.
    const needDir = !isLastSegment || inputPath.endsWith('/');

    const existingNode = currentWorkingNode.children?.find((c) => c.name === segment);

    if (existingNode) {
      // COLLISION CHECK

      // Case 1: We need a directory, but found a file.
      // E.g. trying to create `a/b` but `a` is a file.
      // Or trying to create `a/` but `a` is a file.
      if (needDir && existingNode.type === 'file') {
        return {
          fs: newRoot,
          error: `Cannot create directory in file path: ${segment}`,
          targetNode: undefined,
        };
      }

      // Case 2: We need a file, but found a directory.
      // E.g. trying to create `a` (file) but `a` (dir) exists.
      // Yazi likely treats this as just "item exists".
      // We will flag it as collision.

      // Case 3: We need a dir, found a dir. (Descend)
      // Case 4: We need a file, found a file. (Collision)

      if (isLastSegment) {
        return {
          fs: newRoot,
          targetNode: existingNode,
          error: null,
          collision: true,
          collisionNode: existingNode,
        };
      }

      // If strict dir needed and we have a dir (or archive which acts as dir), descend.
      if (existingNode.type === 'dir' || existingNode.type === 'archive') {
        currentWorkingNode = existingNode;
        effectiveParentPath.push(currentWorkingNode.id);
        continue;
      }
    }

    // NO EXISTING NODE - CREATE ONE
    const newType = needDir ? 'dir' : 'file';

    const newNode: FileNode = {
      id: id(),
      name: segment,
      type: newType,
      parentId: currentWorkingNode.id,
    } as FileNode;

    if (newType === 'dir') newNode.children = [];

    currentWorkingNode.children = currentWorkingNode.children || [];
    currentWorkingNode.children.push(newNode);

    if (isLastSegment) finalTargetNode = newNode;
    currentWorkingNode = newNode;
    effectiveParentPath.push(currentWorkingNode.id);
  }

  return {
    fs: newRoot,
    targetNode: finalTargetNode,
    error: null,
    collision: false,
    collisionNode: null,
  };
}

export function addNodeWithConflictResolution(
  root: FileNode,
  parentPath: string[] | undefined,
  node: FileNode
): Result<FileNode, FsError> {
  let newRoot = cloneFS(root);
  const parent = parentPath && parentPath.length ? getNodeByPath(newRoot, parentPath) : newRoot;
  if (!parent) return { ok: false, error: 'NotFound' };
  parent.children = parent.children || [];

  let newName = node.name;
  let counter = 0;
  let exists = parent.children.find((c) => c.name === newName && c.type === node.type);

  while (exists) {
    counter++;
    const parts = node.name.split('.');
    if (parts.length > 1 && node.type === 'file') {
      newName = `${parts.slice(0, -1).join('.')}_${counter}.${parts[parts.length - 1]}`;
    } else {
      newName = `${node.name}_${counter}`;
    }
    exists = parent.children.find((c) => c.name === newName && c.type === node.type);
  }

  const newNode: FileNode = { ...node, name: newName, id: id() };

  return addNode(newRoot, parentPath, newNode);
}

export function isProtected(
  root: FileNode,
  currentPath: string[] | undefined,
  node: FileNode,
  level: Level,
  action?: string,
  completedTaskIds?: Record<number, string[]>
): string | null {
  // Allow Level 14 to delete content under /home/guest (game objective)
  if (level.id === 14 && action === 'delete') {
    // Use the policy attached to the Level definition, if provided.
    const allowed = level.allowedDeletePaths;

    const getNodeByNamePath = (rootNode: FileNode, names: string[]): FileNode | undefined => {
      let current: FileNode | undefined = rootNode;
      for (const n of names) {
        if (!current || !current.children) return undefined;
        current = current.children.find(
          (c) => c.name === n && (c.type === 'dir' || c.type === 'archive')
        );
        if (!current) return undefined;
      }
      return current;
    };

    if (allowed && action === 'delete') {
      for (const entry of allowed) {
        const namePath = entry.path;
        const requiredTask = entry.requiresTaskId;

        // If the rule requires a task to be completed, check runtime state
        if (requiredTask) {
          const levelTaskIds = completedTaskIds?.[level.id] || [];
          if (!levelTaskIds.includes(requiredTask)) continue;
        }

        const targetRoot = getNodeByNamePath(root, namePath);
        if (!targetRoot) continue;
        if (targetRoot.id === node.id) return null;
        const stack: FileNode[] = [targetRoot];
        while (stack.length) {
          const n = stack.pop()!;
          if (n.id === node.id) return null;
          if (n.children) stack.push(...n.children);
        }
      }
    }
  }

  // Allow Level 12 to cut systemd-core from workspace (game objective)
  if (level.id === 12 && action === 'cut' && node.name === 'systemd-core') {
    return null;
  }

  // Allow Level 14 to cut vault from .config (game objective)
  if (level.id === 14 && action === 'cut' && node.name === 'vault') {
    return null;
  }

  // Allow Level 15 to rename and move exfil_04.log (renamed payload.py)
  if (level.id === 15 && (node.name === 'exfil_04.log' || node.name === 'payload.py')) {
    if (action === 'rename' || action === 'cut' || action === 'delete') {
      return null;
    }
  }

  // General node protection
  if (node.protected) {
    if (action === 'rename') {
      return `PROTECTED: ${node.name} is immutable.`;
    }
    if (action === 'enter' || action === 'jump' || action === 'info') {
      // workspace is quarantined until Episode II (Level 7+)
      if (node.name === 'workspace' && level.id < 6) {
        return `ACCESS DENIED: ${node.name} is quarantined.`;
      }
      // daemons is quarantined until Episode III (Level 11+)
      if (node.name === 'daemons' && level.id < 11) {
        return `ACCESS DENIED: ${node.name} is a restricted system area.`;
      }
      // Other protected directories (incoming, datastore, .config, tmp, etc.)
      // are navigable - the protected flag only blocks destructive operations
      return null;
    }
    // For delete/cut and other destructive operations, block the action
    return `PROTECTED: ${node.name} cannot be purged.`;
  }

  // Level 2 specific protection for 'watcher_agent.sys'
  if (level.id === 2 && node.name === 'watcher_agent.sys' && action === 'delete') {
    const isLocateWatcherComplete = level.tasks.find((t) => t.id === 'locate-watcher')?.completed;

    if (!isLocateWatcherComplete) {
      return 'Complete threat analysis first (inspect metadata with Tab).';
    }
  }

  return null;
}
export default {};
