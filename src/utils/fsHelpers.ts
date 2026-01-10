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

export function findNodeByName(
  root: FileNode,
  name: string,
  type?: 'file' | 'dir' | 'archive',
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

export function getAllDirectoriesWithPaths(root: FileNode): { node: FileNode; path: string[] }[] {
  const result: { node: FileNode; path: string[] }[] = [];
  const stack: { node: FileNode; path: string[] }[] = [{ node: root, path: [root.id] }];

  while (stack.length > 0) {
    const { node: n, path: p } = stack.pop()!;

    // We add the directory to the list
    if (n.type === 'dir' || n.type === 'archive') {
      result.push({ node: n, path: p });
    }

    // We check for children and add them to the stack
    if (n.children) {
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

export function getRecursiveContent(root: FileNode, path: string[] | undefined): FileNode[] {
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
    // Augment node with runtime-only helpers expected elsewhere
    n.path = [...pathIds];
    n.display = resolvePath(root, [...pathIds]);
    out.push(n as FileNode);
    if (n.children) {
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
  _levelIndex?: number,
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
  node: FileNode,
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
  _levelIndex?: number,
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
  input: string,
): { fs: FileNode; error?: string | null; collision?: boolean; collisionNode?: FileNode | null } {
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
    (c) => c.name === normalizedName && c.type === (isDir ? 'dir' : 'file'),
  );
  if (sameTypeExists) {
    return { fs: newRoot, error: null, collision: true, collisionNode: sameTypeExists };
  }
  const node: FileNode = {
    id: id(),
    name: normalizedName,
    type: isDir ? 'dir' : 'file',
    parentId: parent.id,
  };
  if (node.type === 'dir') node.children = [];
  parent.children.push(node);
  return { fs: newRoot, error: null, collision: false, collisionNode: null };
}

export function resolveAndCreatePath(
  root: FileNode,
  currentPath: string[],
  inputPath: string,
): {
  fs: FileNode;
  targetNode: FileNode | undefined;
  error?: string | null;
  collision?: boolean;
  collisionNode?: FileNode | null;
} {
  let newRoot = cloneFS(root);
  let effectiveParentPath: string[] = []; // This will hold the IDs of the path to the current parent
  let pathSegmentsToCreate: string[] = [];

  if (inputPath.startsWith('~/')) {
    // Resolve "~" to //home/guest node IDs
    const rootNode = findNodeByName(newRoot, 'root', 'dir');
    const homeNode = rootNode?.children?.find((n) => n.name === 'home');
    const guestNode = homeNode?.children?.find((n) => n.name === 'guest');

    if (!rootNode || !homeNode || !guestNode) {
      return {
        fs: newRoot,
        error: 'Home directory nodes (root, home, guest) not found',
        targetNode: undefined,
      };
    }
    effectiveParentPath = [rootNode.id, homeNode.id, guestNode.id];
    pathSegmentsToCreate = inputPath.substring(2).split('/').filter(Boolean);
  } else if (inputPath.startsWith('/')) {
    // Start from the actual root of the game's filesystem
    effectiveParentPath = [newRoot.id]; // The root FileNode itself
    pathSegmentsToCreate = inputPath.substring(1).split('/').filter(Boolean);
  } else {
    // Relative path from currentPath
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
    const wantDir = !isLastSegment || inputPath.endsWith('/');

    // Find an existing child that matches both name and expected type
    let sameTypeChild: FileNode | undefined = undefined;
    let anySameName: FileNode | undefined = undefined;

    if (currentWorkingNode.children) {
      if (wantDir) {
        sameTypeChild = currentWorkingNode.children.find(
          (c) => c.name === segment && (c.type === 'dir' || c.type === 'archive'),
        );
      } else {
        sameTypeChild = currentWorkingNode.children.find(
          (c) => c.name === segment && c.type === 'file',
        );
      }
      anySameName = currentWorkingNode.children.find((c) => c.name === segment);
    }

    // If a same-type child exists, use it (and treat as collision on last segment)
    if (sameTypeChild) {
      if (isLastSegment) {
        return {
          fs: newRoot,
          targetNode: sameTypeChild,
          error: null,
          collision: true,
          collisionNode: sameTypeChild,
        };
      }
      currentWorkingNode = sameTypeChild;
      effectiveParentPath.push(currentWorkingNode.id);
      continue;
    }

    // No same-type child. If any node with same name exists but different type, we allow coexistence.
    // For non-last segments we need a directory to traverse into; create one if necessary.
    if (!sameTypeChild) {
      if (!anySameName) {
        // Nothing with that name exists — create the desired node
        const newNode: FileNode = {
          id: id(),
          name: segment,
          type: wantDir ? 'dir' : 'file',
          parentId: currentWorkingNode.id,
        } as FileNode;
        if (wantDir) newNode.children = [];
        currentWorkingNode.children = currentWorkingNode.children || [];
        currentWorkingNode.children.push(newNode);
        if (isLastSegment) finalTargetNode = newNode;
        currentWorkingNode = newNode;
        effectiveParentPath.push(currentWorkingNode.id);
        continue;
      } else {
        // A node with the same name but different type exists. We allow coexistence by creating the desired node.
        const newNode: FileNode = {
          id: id(),
          name: segment,
          type: wantDir ? 'dir' : 'file',
          parentId: currentWorkingNode.id,
        } as FileNode;
        if (wantDir) newNode.children = [];
        currentWorkingNode.children = currentWorkingNode.children || [];
        currentWorkingNode.children.push(newNode);
        if (isLastSegment) finalTargetNode = newNode;
        currentWorkingNode = newNode;
        effectiveParentPath.push(currentWorkingNode.id);
        continue;
      }
    }
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
  node: FileNode,
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
          (c) => c.name === n && (c.type === 'dir' || c.type === 'archive'),
        );
        if (!current) return undefined;
      }
      return current;
    };

    if (allowed && action === 'delete') {
      for (const entry of allowed) {
        const namePath = entry.path;
        const requiredTask = entry.requiresTaskId;

        // If the rule requires a task to be completed on the Level definition,
        // check that the task's static `completed` flag is true. This mirrors
        // existing level-based checks in this file which inspect `level.tasks`.
        if (requiredTask) {
          const task = level.tasks?.find((t) => t.id === requiredTask);
          if (!task?.completed) continue;
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

  // General node protection
  if (node.protected) {
    if (action === 'rename') {
      return `This is a protected system file: ${node.name}. Re-labeling prohibited.`;
    }
    return `This is a protected system file: ${node.name}. Corruption/Deletion blocked.`;
  }

  // Level 2 specific protection for 'watcher_agent.sys'
  if (level.id === 2 && node.name === 'watcher_agent.sys' && action === 'delete') {
    const isIdentity1Complete = level.tasks.find((t) => t.id === 'identify-threat-1')?.completed;
    const isIdentity2Complete = level.tasks.find((t) => t.id === 'identify-threat-2')?.completed;

    if (!isIdentity1Complete) {
      return 'Locate and inspect metadata first. (Task: 1)';
    }
    if (!isIdentity2Complete) {
      return 'Scan file content first. (Task: 2)';
    }
  }

  return null;
}
export default {};
