import { FileNode } from '../types';

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
  // Validate root
  if (pathIds.length === 0 || pathIds[0] !== root.id) return '/';

  // Root node usually doesn't contribute to path string except as '/'
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
  return {
    ...node,
    children: node.children ? node.children.map(cloneFS) : undefined,
  };
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
  levelIndex: number, // For isProtected check
  action: 'delete' | 'cut' = 'delete',
  force: boolean = false
): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (!parent || !parent.children) {
    return { ok: false, error: 'InvalidPath' };
  }

  const nodeToDelete = parent.children.find((c) => c.id === nodeId);
  if (!nodeToDelete) {
    return { ok: false, error: 'NotFound' };
  }

  const protectionMessage = force ? null : isProtected(root, parentPathIds, nodeToDelete, levelIndex, action);
  if (protectionMessage) {
    return { ok: false, error: 'Protected' };
  }

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
  if (!parent) {
    return { ok: false, error: 'InvalidPath' };
  }

  if (!parent.children) parent.children = [];

  // Check for collision with exact same name AND type
  const collision = parent.children.find(
    (c) => c.name === newNode.name && c.type === newNode.type
  );

  if (collision) {
    return { ok: false, error: 'Collision' };
  }

  // Ensure the new node has a fresh ID and deep-copied structure
  let nodeToInsert = regenerateIds(newNode, parent.id);

  // Update timestamps
  const now = Date.now();
  nodeToInsert.createdAt = newNode.createdAt || now;
  nodeToInsert.modifiedAt = now;

  parent.children.push(nodeToInsert);

  // Sort: Dirs > Archives > Files
  parent.children.sort((a, b) => {
    const typeScore = (t: string) => {
      if (t === 'dir') return 0;
      if (t === 'archive') return 1;
      return 2;
    };
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
  levelIndex: number // For isProtected check
): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (!parent || !parent.children) {
    return { ok: false, error: 'InvalidPath' };
  }

  const nodeToRename = parent.children.find((c) => c.id === nodeId);
  if (!nodeToRename) {
    return { ok: false, error: 'NotFound' };
  }

  const protectionMessage = isProtected(root, parentPathIds, nodeToRename, levelIndex, 'rename');
  if (protectionMessage) {
    return { ok: false, error: 'Protected' };
  }

  // Only block if another node with SAME name AND SAME type exists
  const collision = parent.children.find(
    (c) => c.id !== nodeId && c.name === newName && c.type === nodeToRename.type
  );
  if (collision) {
    return { ok: false, error: 'Collision' };
  }

  nodeToRename.name = newName;
  nodeToRename.modifiedAt = Date.now();
  
  // Re-sort after rename
  parent.children.sort((a, b) => {
    const typeScore = (t: string) => {
      if (t === 'dir') return 0;
      if (t === 'archive') return 1;
      return 2;
    };
    const scoreA = typeScore(a.type);
    const scoreB = typeScore(b.type);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.name.localeCompare(b.name);
  });

  return { ok: true, value: newRoot };
};

// Helper to generate collision info
const generateCollisionInfo = (
  existingNode: FileNode
): { collision: true; collisionNode: FileNode } => {
  return {
    collision: true,
    collisionNode: existingNode,
  };
};

// Updated createPath: Allows coexistence if types are different
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
    // CRITICAL: If not last, it MUST be a dir. If last, it depends on isDirTarget.
    const type: 'dir' | 'file' = !isLast ? 'dir' : isDirTarget ? 'dir' : 'file';

    // Find parent in the NEW root
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: 'Path resolution failed' };

    // Check for existing node with SAME name AND SAME type
    const existingTyped = parent.children?.find((c) => c.name === name && c.type === type);

    if (existingTyped) {
      if (!isLast) {
        // Intermediate segment (matched an existing dir)
        currentPath.push(existingTyped.id);
        continue;
      } else {
        // Last segment (collision with identical type)
        return { fs: root, ...generateCollisionInfo(existingTyped) };
      }
    } else {
      // If it's an intermediate segment and we didn't find a DIRECTORY with that name
      // (but might have found a FILE), we need to block it
      if (!isLast) {
        const existingFile = parent.children?.find((c) => c.name === name && c.type !== 'dir');
        if (existingFile) {
          return { fs: root, error: `Cannot create directory path through file: ${name}` };
        }
      }
    }

    // Create new node
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

    // Sort: Dirs > Archives > Files
    parent.children.sort((a, b) => {
      const typeScore = (t: string) => {
        if (t === 'dir') return 0;
        if (t === 'archive') return 1;
        return 2;
      };
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

// --- Protection Helpers ---

const checkCoreSystemProtection = (path: string, node: FileNode): string | null => {
  // Only protect directories if they are the intended system ones
  if (node.type === 'dir' && ['/', '/home', '/home/guest', '/etc', '/tmp', '/bin'].includes(path)) {
    return `System integrity protection: ${path}`;
  }
  return null;
};

const checkEpisodeStructuralProtection = (
  path: string,
  node: FileNode,
  levelIndex: number
): string | null => {
  if (
    node.type === 'dir' &&
    [
      '/home/guest/datastore',
      '/home/guest/incoming',
      '/home/guest/media',
      '/home/guest/workspace',
    ].includes(path)
  ) {
    if (levelIndex < 15) return `Sector protected by admin policy: ${node.name}`;
  }
  return null;
};

const checkLevelSpecificAssetProtection = (
  path: string,
  node: FileNode,
  levelIndex: number,
  action: 'delete' | 'cut' | 'rename'
): string | null => {
  const name = node.name;
  const isDir = node.type === 'dir';
  const isFile = node.type === 'file';

  if (name === 'access_key.pem' && isFile) {
    if (action === 'delete') return 'Critical asset. Deletion prohibited.';
    // Allow cut on Level 8 (index 7) and Level 10 (index 9)
    if (action === 'cut' && ![7, 9].includes(levelIndex)) {
      return 'Asset locked. Modification not authorized.';
    }
    // Allow rename only on Level 10 (index 9) after it's been moved to vault
    if (action === 'rename' && levelIndex !== 9) {
      return 'Asset identity sealed. Rename not authorized.';
    }
  }

  if (name === 'mission_log.md' && isFile) {
    // Allow deletion on Level 14 (index 13)
    if (action === 'delete' && levelIndex !== 13) return 'Mission log required for validation.';
    // Prevent rename to avoid hiding the log
    if (action === 'rename' && levelIndex < 13) return 'Mission log identity locked.';
  }

  if (name === 'target_map.png' && isFile) {
    if (action === 'delete') return 'Intel target. Do not destroy.';
    if (action === 'cut' && levelIndex !== 2) return 'Map file anchored until capture sequence.';
    if (action === 'rename' && levelIndex < 2) return 'Target signature locked.';
  }

  // Specifically protect the protocols directory if it's the intended one
  if (path === '/home/guest/datastore/protocols' && isDir) {
    if (action === 'delete' && levelIndex < 4)
      return 'Protocol directory required for uplink deployment.';
    if (action === 'cut' && levelIndex < 4) return 'Protocol directory anchored.';
  }

  if (name === 'uplink_v1.conf' && isFile) {
    if (action === 'delete' && levelIndex < 7)
      return 'Uplink configuration required for neural network.';
  }
  if (name === 'uplink_v2.conf' && isFile) {
    if (action === 'delete' && levelIndex < 4)
      return 'Uplink configuration required for deployment.';
  }

  // Path-aware check for active zone
  if (path === '/home/guest/.config/vault/active' && isDir) {
    if (action === 'delete' && levelIndex < 7) return 'Active deployment zone required.';
    if (action === 'cut' && levelIndex < 7) return 'Deployment zone anchored.';
  }

  if (path === '/home/guest/.config/vault' && isDir) {
    if (action === 'delete' && levelIndex < 12) return 'Vault required for privilege escalation.';
    if (action === 'cut' && levelIndex < 9) return 'Vault anchored until escalation.';
  }

  if (name === 'backup_logs.zip' && node.type === 'archive') {
    if (action === 'delete' && levelIndex < 9)
      return 'Archive required for intelligence extraction.';
    if (action === 'cut' && levelIndex < 9) return 'Archive anchored.';
  }

  if (name === 'daemon' && isDir && path.includes('/etc/')) {
    if (action === 'delete' && levelIndex < 13) return 'Daemon controller required for redundancy.';
    if (action === 'cut' && levelIndex < 13) return 'Daemon anchored until cloning.';
  }

  return null;
};

export const isProtected = (
  root: FileNode,
  parentPathIds: string[],
  node: FileNode,
  levelIndex: number,
  action: 'delete' | 'cut' | 'rename'
): string | null => {
  const fullPath = resolvePath(root, [...parentPathIds, node.id]);
  let protectionMessage: string | null;

  protectionMessage = checkCoreSystemProtection(fullPath, node);
  if (protectionMessage) return protectionMessage;

  protectionMessage = checkEpisodeStructuralProtection(fullPath, node, levelIndex);
  if (protectionMessage) return protectionMessage;

  protectionMessage = checkLevelSpecificAssetProtection(fullPath, node, levelIndex, action);
  if (protectionMessage) return protectionMessage;

  return null;
};

// --- Timestamp Initialization ---

/**
 * Recursively adds default timestamps to all nodes that don't have them.
 * Used to initialize INITIAL_FS files with timestamps.
 */
export const initializeTimestamps = (node: FileNode, baseTime: number = Date.now()): FileNode => {
  const updatedNode = {
    ...node,
    createdAt: node.createdAt || baseTime,
    modifiedAt: node.modifiedAt || baseTime,
  };

  if (updatedNode.children) {
    updatedNode.children = updatedNode.children.map(
      (child, index) => initializeTimestamps(child, baseTime - index * 1000) // Stagger times slightly for variety
    );
  }

  return updatedNode;
};
