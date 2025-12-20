import { FileNode } from '../types';

// --- Query Helpers ---

export const ge = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (pathIds.length === 0) return null;
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

export const getNodeByPath = ge;

export const se = (root: FileNode, name: string): FileNode | undefined => {
  if (root.name === name) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = se(child, name);
      if (found) return found;
    }
  }
  return undefined;
};

export const Gd = (root: FileNode, pathIds: string[]): FileNode | null => {
    if (pathIds.length <= 1) return null;
    const parentPath = pathIds.slice(0, -1);
    return ge(root, parentPath);
};

export const getParentNode = Gd;

export const resolvePath = (root: FileNode, pathIds: string[]): string => {
    if (pathIds.length === 0 || pathIds[0] !== root.id || pathIds.length === 1) return '/';
    let pathString = "";
    let tempRoot = root;
    for (let i = 1; i < pathIds.length; i++) {
        const id = pathIds[i];
        const child = tempRoot.children?.find(c => c.id === id);
        if (!child) return pathString; 
        tempRoot = child;
        pathString += `/${child.name}`;
    }
    return pathString || '/';
};

export const getAllDirectories = (root: FileNode): { path: string[], display: string }[] => {
    const results: { path: string[], display: string }[] = [];
    const traverse = (node: FileNode, currentPathIds: string[], currentPathStr: string) => {
        results.push({ path: currentPathIds, display: currentPathStr });
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'dir') {
                    const childPathStr = currentPathStr === '/' ? `/${child.name}` : `${currentPathStr}/${child.name}`;
                    traverse(child, [...currentPathIds, child.id], childPathStr);
                }
            }
        }
    };
    traverse(root, [root.id], '/');
    return results;
};

export const Zd = (root: FileNode, startPathIds: string[]): { path: string[], display: string, type: string, id: string }[] => {
    const startNode = ge(root, startPathIds);
    if (!startNode) return [];
    const results: { path: string[], display: string, type: string, id: string }[] = [];
    const traverse = (node: FileNode, prefixIds: string[], prefixStr: string) => {
        if (node.children) {
            for (const child of node.children) {
                const childRelativePathIds = [...prefixIds, child.id];
                const childDisplay = prefixStr ? `${prefixStr}/${child.name}` : child.name;
                results.push({
                    path: childRelativePathIds,
                    display: childDisplay,
                    type: child.type,
                    id: child.id
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

export const getRecursiveContent = Zd;

// --- Basic Helpers ---

export const Lt = (node: FileNode): FileNode => {
  return {
    ...node,
    children: node.children ? node.children.map(Lt) : undefined
  };
};

export const cloneFS = Lt;

export const regenerateIds = (node: FileNode, newParentId: string | null = null): FileNode => {
  const newId = Math.random().toString(36).substr(2, 9);
  return {
    ...node,
    id: newId,
    parentId: newParentId,
    children: node.children ? node.children.map(child => regenerateIds(child, newId)) : undefined
  };
};

// --- Modification Helpers ---

export const Ji = (root: FileNode, parentPathIds: string[], nodeId: string): FileNode => {
  const newRoot = Lt(root);
  const parent = ge(newRoot, parentPathIds);
  if (parent && parent.children) {
    parent.children = parent.children.filter(c => c.id !== nodeId);
  }
  return newRoot;
};

export const deleteNode = Ji;

export const Qd = (root: FileNode, parentPathIds: string[], newNode: FileNode): FileNode => {
  const newRoot = Lt(root);
  const parent = ge(newRoot, parentPathIds);
  if (parent) {
    if (!parent.children) parent.children = [];
    const collision = parent.children.find(c => c.name === newNode.name && c.type === newNode.type);
    let nodeToInsert = regenerateIds(newNode, parent.id);
    const now = Date.now();
    nodeToInsert.createdAt = newNode.createdAt || now;
    nodeToInsert.modifiedAt = now;
    if (collision) {
        let baseName = nodeToInsert.name;
        let ext = "";
        if (nodeToInsert.type === 'file') {
            const lastDotIndex = baseName.lastIndexOf('.');
            if (lastDotIndex > 0) {
                ext = baseName.substring(lastDotIndex);
                baseName = baseName.substring(0, lastDotIndex);
            }
        }
        let counter = 1;
        let candidateName = `${baseName}_${counter}${ext}`;
        while (parent.children.find(c => c.name === candidateName && c.type === nodeToInsert.type)) {
            counter++;
            candidateName = `${baseName}_${counter}${ext}`;
        }
        nodeToInsert.name = candidateName;
    }
    parent.children.push(nodeToInsert);
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
  }
  return newRoot;
};

export const addNode = Qd;

export const Wh = (root: FileNode, parentPathIds: string[], nodeId: string, newName: string): FileNode => {
  const newRoot = Lt(root);
  const parent = ge(newRoot, parentPathIds);
  if (parent && parent.children) {
      const node = parent.children.find(c => c.id === nodeId);
      if (node) {
          const collision = parent.children.find(c => c.id !== nodeId && c.name === newName && c.type === node.type);
          if (collision) return root; 
          node.name = newName;
          node.modifiedAt = Date.now(); 
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
      }
  }
  return newRoot;
};

export const renameNode = Wh;

const generateCollisionInfo = (existingNode: FileNode): { collision: true, collisionNode: FileNode } => {
    return { collision: true, collisionNode: existingNode };
};

export const ep = (root: FileNode, parentPathIds: string[], pathStr: string): { fs: FileNode, error?: string, createdName?: string, collision?: boolean, collisionNode?: FileNode } => {
  const newRoot = Lt(root);
  let currentPath = [...parentPathIds];
  const segments = pathStr.split('/').filter(s => s.trim().length > 0);
  const isDirTarget = pathStr.endsWith('/');
  for (let i = 0; i < segments.length; i++) {
    let name = segments[i];
    const isLast = i === segments.length - 1;
    const type: 'dir' | 'file' = !isLast ? 'dir' : (isDirTarget ? 'dir' : 'file');
    const parent = ge(newRoot, currentPath);
    if (!parent) return { fs: root, error: "Path resolution failed" };
    const existingTyped = parent.children?.find(c => c.name === name && c.type === type);
    if (existingTyped) {
      if (!isLast) { 
         currentPath.push(existingTyped.id);
         continue;
      } else { 
         return { fs: root, ...generateCollisionInfo(existingTyped) };
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
      modifiedAt: Date.now()
    };
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);
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
    if (isLast) return { fs: newRoot, createdName: name };
    currentPath.push(newNode.id);
  }
  return { fs: newRoot };
};

export const createPath = ep;

// --- Protection Helpers ---

const checkCoreSystemProtection = (path: string, node: FileNode): string | null => {
  if (node.type === 'dir' && ['/', '/home', '/home/guest', '/etc', '/tmp', '/bin'].includes(path)) {
      return `System integrity protection: ${path}`;
  }
  return null;
};

const checkEpisodeStructuralProtection = (path: string, node: FileNode, levelIndex: number): string | null => {
  if (node.type === 'dir' && ['/home/guest/datastore', '/home/guest/incoming', '/home/guest/media', '/home/guest/workspace'].includes(path)) {
      if (levelIndex < 15) return `Sector protected by admin policy: ${node.name}`;
  }
  return null;
};

const checkLevelSpecificAssetProtection = (path: string, node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
  const name = node.name;
  const isFile = node.type === 'file';

  if (name === 'access_key.pem' && isFile) {
      if (action === 'delete') return "Critical asset. Deletion prohibited.";
      if (action === 'cut' && ![7, 9].includes(levelIndex)) return "Asset locked. Modification not authorized.";
      if (action === 'rename' && levelIndex !== 9) return "Asset identity sealed. Rename not authorized.";
  }

  if (name === 'mission_log.md' && isFile) {
      if (action === 'delete' && levelIndex !== 13) return "Mission log required for validation.";
      if (action === 'rename' && levelIndex < 13) return "Mission log identity locked.";
  }

  if (name === 'target_map.png' && isFile) {
      if (action === 'delete') return "Intel target. Do not destroy.";
      if (action === 'cut' && levelIndex !== 2) return "Map file anchored until capture sequence.";
      if (action === 'rename' && levelIndex < 2) return "Target signature locked.";
  }

  if (name === 'uplink_v1.conf' && isFile) {
      if (action === 'delete' && levelIndex < 7) return "Uplink configuration required for neural network.";
  }
  if (name === 'uplink_v2.conf' && isFile) {
      if (action === 'delete' && levelIndex < 4) return "Uplink configuration required for deployment.";
  }

  return null;
};

export const ap = (root: FileNode, parentPathIds: string[], node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
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

export const isProtected = ap;

export const Pd = (node: FileNode, baseTime: number = Date.now()): FileNode => {
  const updatedNode = {
    ...node,
    createdAt: node.createdAt || baseTime,
    modifiedAt: node.modifiedAt || baseTime
  };
  if (updatedNode.children) {
    updatedNode.children = updatedNode.children.map((child, index) => 
      Pd(child, baseTime - (index * 1000))
    );
  }
  return updatedNode;
};

export const prepareFS = Pd;
