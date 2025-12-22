import { FileNode, Result, FsError } from '../types';

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

// Fix for Error in file utils/fsHelpers.ts on line 56 & 65: Complete the function and fix variable name from currentPath to currentPathStr
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

// --- Modification Helpers ---

// Fix for Error in file App.tsx and hooks/useFilesystem.ts: Add cloneFS export
export const cloneFS = (node: FileNode): FileNode => {
  return JSON.parse(JSON.stringify(node));
};

// Fix for Error in file constants.tsx: Add initializeTimestamps export
export const initializeTimestamps = (node: FileNode, now: number = Date.now()): FileNode => {
  const newNode = {
    ...node,
    createdAt: node.createdAt || now,
    modifiedAt: node.modifiedAt || now,
  };
  if (newNode.children) {
    newNode.children = newNode.children.map((child, i) => initializeTimestamps(child, now - (i * 1000)));
  }
  return newNode;
};

// Fix for Error in file App.tsx and FuzzyFinder.tsx: Add getRecursiveContent export
export const getRecursiveContent = (root: FileNode, pathIds: string[]): { path: string[]; display: string; type: 'file' | 'dir' | 'archive'; id: string }[] => {
  const node = getNodeByPath(root, pathIds);
  if (!node) return [];

  const results: any[] = [];
  const traverse = (n: FileNode, currentIds: string[], currentStr: string) => {
    if (n.children) {
      for (const child of n.children) {
        const nextIds = [...currentIds, child.id];
        const nextStr = currentStr ? `${currentStr}/${child.name}` : child.name;
        results.push({ path: nextIds, display: nextStr, type: child.type, id: child.id });
        if (child.type === 'dir' || child.type === 'archive') {
          traverse(child, nextIds, nextStr);
        }
      }
    }
  };
  
  traverse(node, [], "");
  return results;
};

// Fix for Error in file hooks/useFilesystem.ts: Add deleteNode export
export const deleteNode = (root: FileNode, pathIds: string[], nodeId: string, levelIndex: number): Result<FileNode, string> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, pathIds);
  
  if (!parent || !parent.children) {
    return { ok: false, error: 'Target directory not found' };
  }
  
  const originalLength = parent.children.length;
  parent.children = parent.children.filter(c => c.id !== nodeId);
  
  if (parent.children.length === originalLength) {
    return { ok: false, error: 'Target node not found' };
  }
  
  return { ok: true, value: newRoot };
};

// Fix for Error in file hooks/useFilesystem.ts: Add addNode export
export const addNode = (root: FileNode, pathIds: string[], node: FileNode): Result<FileNode, string> => {
  const newRoot = cloneFS(root);
  const target = getNodeByPath(newRoot, pathIds);
  
  if (!target) return { ok: false, error: 'Target directory not found' };
  if (target.type === 'file') return { ok: false, error: 'Cannot add items to a file' };
  
  if (!target.children) target.children = [];
  
  const newNode = cloneFS(node);
  newNode.parentId = target.id;
  
  // Check for conflicts
  const conflict = target.children.find(c => c.name === newNode.name && c.type === newNode.type);
  
  if (conflict) {
    // Basic conflict handling: rename with a numerical suffix
    let counter = 1;
    const lastDotIndex = newNode.name.lastIndexOf('.');
    const hasExt = lastDotIndex !== -1;
    const ext = hasExt ? newNode.name.split('.').pop() : '';
    const base = hasExt ? newNode.name.slice(0, lastDotIndex) : newNode.name;
    
    while (target.children.find(c => c.name === `${base}_${counter}${hasExt ? '.' + ext : ''}`)) {
      counter++;
    }
    newNode.name = `${base}_${counter}${hasExt ? '.' + ext : ''}`;
  }
  
  target.children.push(newNode);
  
  // Sort children by type (dir -> archive -> file) then name
  target.children.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === 'dir') return -1;
      if (b.type === 'dir') return 1;
      if (a.type === 'archive') return -1;
      if (b.type === 'archive') return 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return { ok: true, value: newRoot };
};

// Fix for Error in file hooks/useFilesystem.ts: Add renameNode export
export const renameNode = (root: FileNode, pathIds: string[], nodeId: string, newName: string, levelIndex: number): Result<FileNode, string> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, pathIds);
  
  if (!parent || !parent.children) return { ok: false, error: 'Target directory not found' };
  
  const node = parent.children.find(c => c.id === nodeId);
  if (!node) return { ok: false, error: 'Target node not found' };
  
  if (parent.children.find(c => c.id !== nodeId && c.name === newName && c.type === node.type)) {
    return { ok: false, error: `A ${node.type} named "${newName}" already exists` };
  }

  // Reservation Check
  const protection = isProtected(newRoot, pathIds, { ...node, name: newName }, levelIndex, 'create');
  if (protection) return { ok: false, error: protection };
  
  node.name = newName;
  node.modifiedAt = Date.now();
  
  // Resort parent children after rename
  parent.children.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === 'dir') return -1;
      if (b.type === 'dir') return 1;
      if (a.type === 'archive') return -1;
      if (b.type === 'archive') return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return { ok: true, value: newRoot };
};

// Fix for Error in file hooks/useFilesystem.ts: Add createPath export
export const createPath = (root: FileNode, currentPathIds: string[], pathStr: string, levelIndex: number = 0): { fs: FileNode; error?: string; createdName?: string; collision?: boolean; collisionNode?: FileNode } => {
  const newRoot = cloneFS(root);
  let currentPath = [...currentPathIds];
  const parts = pathStr.split('/').filter(p => p.length > 0);
  const isDir = pathStr.endsWith('/');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const type = isLast ? (isDir ? 'dir' : 'file') : 'dir';
    
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: 'Path resolution error' };
    
    if (!parent.children) parent.children = [];
    
    const existing = parent.children.find(c => c.name === part);
    if (existing) {
      if (isLast) {
        return { fs: root, collision: true, collisionNode: existing };
      }
      if (existing.type === 'file') return { fs: root, error: `Cannot create path through file: ${part}` };
      currentPath.push(existing.id);
      continue;
    }

    // Reservation Check
    const protection = isProtected(newRoot, currentPath, { name: part, type, id: 'temp' } as any, levelIndex, 'create');
    if (protection) return { fs: root, error: protection };
    
    const newNode: FileNode = {
      id: Math.random().toString(36).substr(2, 9),
      name: part,
      type,
      parentId: parent.id,
      children: type !== 'file' ? [] : undefined,
      content: type === 'file' ? '' : undefined,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    
    parent.children.push(newNode);
    parent.children.sort((a, b) => {
      if (a.type !== b.type) {
        if (a.type === 'dir') return -1;
        if (b.type === 'dir') return 1;
        if (a.type === 'archive') return -1;
        if (b.type === 'archive') return 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    if (isLast) return { fs: newRoot, createdName: part };
    currentPath.push(newNode.id);
  }
  
  return { fs: newRoot };
};

// Fix for Error in file hooks/useFilesystem.ts: Add isProtected export with correct signature
export const isProtected = (root: FileNode, pathIds: string[], node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename' | 'create'): string | null => {
  const pathStr = resolvePath(root, [...pathIds, node.id === 'temp' ? [] : node.id].flat() as string[]);
  const name = node.name;
  const level = levelIndex + 1; // Levels are 1-indexed in simulation logic

  // Proactive Reservation Block: Don't let users create or rename files into mission-critical names
  if (action === 'create' || action === 'rename') {
    if (name.startsWith('neural_') && pathStr.includes('/workspace')) {
      return `🔒 ACCESS DENIED: Identifier reserved for neural process.`;
    }
    if (name === 'systemd-core' && pathStr.includes('/workspace')) {
      return `🔒 ACCESS DENIED: Signature conflict with kernel namespace.`;
    }
  }

  // Base system directory protection
  if (node.type === 'dir' && ['/', '/root', '/home', '/home/guest', '/etc', '/tmp', '/bin'].includes(pathStr)) {
    return `System integrity protection: ${pathStr}`;
  }

  // Early-stage sector protection
  if (level <= 6) {
     if (node.type === 'dir' && ['/home/guest/datastore', '/home/guest/incoming', '/home/guest/media', '/home/guest/workspace'].includes(pathStr)) {
       return `Sector protected by admin policy: ${name}`;
     }
  }

  // Specific asset protection rules
  if (name === 'access_key.pem') return 'Critical asset. Deletion prohibited.';
  if (name === 'mission_log.md' && level < 14) return 'Mission log required for validation.';
  if (name === 'target_map.png') return 'Intel target. Do not destroy.';
  
  if (pathStr === '/home/guest/datastore/protocols' && level < 5) return 'Protocol directory required for uplink deployment.';
  if (name === 'uplink_v1.conf' && level < 8 && action === 'delete') return 'Uplink configuration required for neural network.';
  
  if (pathStr === '/home/guest/workspace' && action === 'delete') return 'CRITICAL: Workspace contains your core process. Cannot be deleted.';

  return null;
};
