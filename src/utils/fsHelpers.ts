
import { FileNode, FsError, Result } from '../../types';

export const getNodeByPath = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (!pathIds || pathIds.length === 0) return root;
  if (pathIds[0] !== root.id) return null;
  
  let current = root;
  for (let i = 1; i < pathIds.length; i++) {
    if (!current.children) return null;
    const next = current.children.find(c => c.id === pathIds[i]);
    if (!next) return null;
    current = next;
  }
  return current;
};

export const getParentNode = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (pathIds.length <= 1) return null;
  return getNodeByPath(root, pathIds.slice(0, -1));
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

export const cloneFS = (fs: FileNode): FileNode => {
  return JSON.parse(JSON.stringify(fs));
};

export const deleteNode = (root: FileNode, pathIds: string[], nodeId: string, _levelIndex: number): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, pathIds);
  
  if (!parent || !parent.children) {
    return { ok: false, error: 'NotFound' };
  }
  
  const index = parent.children.findIndex(c => c.id === nodeId);
  if (index === -1) {
    return { ok: false, error: 'NotFound' };
  }
  
  parent.children.splice(index, 1);
  return { ok: true, value: newRoot };
};

export const addNode = (root: FileNode, pathIds: string[], node: FileNode): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, pathIds);
  
  if (!parent) return { ok: false, error: 'NotFound' };
  if (parent.type !== 'dir') return { ok: false, error: 'InvalidPath' };
  if (!parent.children) parent.children = [];
  
  let newName = node.name;
  let counter = 1;
  while (parent.children.some(c => c.name === newName)) {
    const parts = node.name.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      newName = `${parts.join('.')}_${counter}.${ext}`;
    } else {
      newName = `${node.name}_${counter}`;
    }
    counter++;
  }
  
  const newNode = { ...node, name: newName, id: Math.random().toString(36).substr(2, 9), parentId: parent.id };
  // Recursively update IDs for children
  const updateIds = (n: FileNode, pId: string) => {
    n.id = Math.random().toString(36).substr(2, 9);
    n.parentId = pId;
    if (n.children) {
      n.children.forEach(c => updateIds(c, n.id));
    }
  };
  if (newNode.children) {
    newNode.children.forEach(c => updateIds(c, newNode.id));
  }

  parent.children.push(newNode);
  
  // Sort children
  parent.children.sort((a, b) => {
      const typeScore = (t: string) => t === 'dir' ? 0 : t === 'archive' ? 1 : 2;
      const scoreA = typeScore(a.type);
      const scoreB = typeScore(b.type);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.name.localeCompare(b.name);
  });

  return { ok: true, value: newRoot };
};

export const renameNode = (root: FileNode, pathIds: string[], nodeId: string, newName: string, _levelIndex: number): Result<FileNode, FsError> => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, pathIds);
  
  if (!parent || !parent.children) return { ok: false, error: 'NotFound' };
  
  const node = parent.children.find(c => c.id === nodeId);
  if (!node) return { ok: false, error: 'NotFound' };
  
  if (parent.children.some(c => c.name === newName && c.id !== nodeId)) {
    return { ok: false, error: 'Collision' };
  }
  
  node.name = newName;
  node.modifiedAt = Date.now();
  
  return { ok: true, value: newRoot };
};

export const createPath = (root: FileNode, currentPath: string[], input: string): { fs: FileNode; error?: string; collision?: boolean; collisionNode?: FileNode; createdName?: string } => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, currentPath);
  if (!parent) return { fs: root, error: 'Current path invalid' };
  
  // Clean input
  const parts = input.split('/').filter(p => p.trim().length > 0);
  const isDirEnding = input.endsWith('/');
  
  let current = parent;
  let createdName = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const type = isLast ? (isDirEnding ? 'dir' : 'file') : 'dir';
    
    if (!current.children) current.children = [];
    
    const existing = current.children.find(c => c.name === part);
    if (existing) {
      if (isLast) {
        // Collision on the final target
        return { fs: root, collision: true, collisionNode: existing };
      }
      if (existing.type !== 'dir') {
        return { fs: root, error: `Cannot create directory inside file: ${part}` };
      }
      current = existing;
    } else {
      const newNode: FileNode = {
        id: Math.random().toString(36).substr(2, 9),
        name: part,
        type: type,
        parentId: current.id,
        children: type === 'dir' ? [] : undefined,
        content: type === 'file' ? '' : undefined,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      current.children.push(newNode);
      
      // Sort
      current.children.sort((a, b) => {
          const typeScore = (t: string) => t === 'dir' ? 0 : t === 'archive' ? 1 : 2;
          const scoreA = typeScore(a.type);
          const scoreB = typeScore(b.type);
          if (scoreA !== scoreB) return scoreA - scoreB;
          return a.name.localeCompare(b.name);
      });

      current = newNode;
      if (isLast) createdName = part;
    }
  }
  
  return { fs: newRoot, createdName };
};

export const getAllDirectories = (root: FileNode): { path: string[], display: string }[] => {
  const results: { path: string[], display: string }[] = [];
  const traverse = (node: FileNode, path: string[], display: string) => {
    if (node.type === 'dir') {
      results.push({ path, display });
      if (node.children) {
        node.children.forEach(c => {
          traverse(c, [...path, c.id], display === '/' ? `/${c.name}` : `${display}/${c.name}`);
        });
      }
    }
  };
  traverse(root, [root.id], '/');
  return results;
};

export const resolvePath = (root: FileNode, pathIds: string[]): string => {
  if (!pathIds || pathIds.length === 0) return '/';
  if (pathIds[0] !== root.id) return '/';
  
  let current = root;
  let path = '';
  
  for (let i = 1; i < pathIds.length; i++) {
    const next = current.children?.find(c => c.id === pathIds[i]);
    if (!next) break;
    path += `/${next.name}`;
    current = next;
  }
  return path || '/';
};

export const getRecursiveContent = (root: FileNode, pathIds: string[]): { display: string, path: string[], type: 'file' | 'dir' | 'archive', id: string }[] => {
  const node = getNodeByPath(root, pathIds);
  if (!node) return [];
  
  const results: { display: string, path: string[], type: 'file' | 'dir' | 'archive', id: string }[] = [];
  
  const traverse = (n: FileNode, relativeIds: string[], relativePath: string) => {
    if (!n.children) return;
    for (const c of n.children) {
      const nextIds = [...relativeIds, c.id];
      const nextPath = relativePath ? `${relativePath}/${c.name}` : c.name;
      
      results.push({ display: nextPath, path: nextIds, type: c.type, id: c.id });
      
      if (c.type === 'dir' || c.type === 'archive') {
        traverse(c, nextIds, nextPath);
      }
    }
  };
  
  traverse(node, [], '');
  return results;
};

export const isProtected = (fs: FileNode, currentPath: string[], node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
  const { name, type } = node;
  const isFile = type === 'file';
  // Check global protections based on level and file names
  
  if (name === 'access_key.pem' && isFile) {
    if (action === 'delete') return 'Critical asset. Deletion prohibited.';
    if (action === 'cut' && ![7, 9].includes(levelIndex)) { // Level 8=index 7, Level 10=index 9
      return 'Asset locked. Modification not authorized.';
    }
    if (action === 'rename' && levelIndex !== 9) {
      return 'Asset identity sealed. Rename not authorized.';
    }
  }

  if (name === 'mission_log.md' && isFile) {
    if (action === 'delete' && levelIndex !== 13) return 'Mission log required for validation.';
    if (action === 'rename' && levelIndex < 13) return 'Mission log identity locked.';
  }

  if (name === 'target_map.png' && isFile) {
    if (action === 'delete' && levelIndex < 14) return 'Intel target. Do not destroy.';
    if (action === 'cut' && levelIndex !== 2) return 'Map file anchored until capture sequence.';
    if (action === 'rename' && levelIndex < 2) return 'Target signature locked.';
  }

  // System directories protection
  if (type === 'dir' && ['root', 'home', 'guest', 'etc', 'tmp', 'bin', 'usr', 'var'].includes(name) && currentPath.length <= 3) {
      if (action === 'delete' || action === 'rename' || action === 'cut') {
          return `System integrity protection: ${name}`;
      }
  }

  return null;
};
