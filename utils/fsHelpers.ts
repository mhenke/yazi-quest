import { FileNode } from '../types';

export const cloneFS = (node: FileNode): FileNode => {
  return {
    ...node,
    children: node.children ? node.children.map(cloneFS) : undefined
  };
};

export const getNodeByPath = (root: FileNode, pathIds: string[]): FileNode | null => {
  let current = root;
  if (pathIds[0] !== root.id) return null;
  
  for (let i = 1; i < pathIds.length; i++) {
    const nextId = pathIds[i];
    const child = current.children?.find(c => c.id === nextId);
    if (!child) return null;
    current = child;
  }
  return current;
};

export const getParentNode = (root: FileNode, pathIds: string[]): FileNode | null => {
  if (pathIds.length <= 1) return null; // Root has no parent
  return getNodeByPath(root, pathIds.slice(0, -1));
};

export const deleteNode = (root: FileNode, parentPathIds: string[], nodeId: string): FileNode => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (parent && parent.children) {
    parent.children = parent.children.filter(c => c.id !== nodeId);
  }
  return newRoot;
};

export const addNode = (root: FileNode, parentPathIds: string[], newNode: FileNode): FileNode => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (parent) {
    if (!parent.children) parent.children = [];
    // Check duplicates
    if (!parent.children.some(c => c.name === newNode.name)) {
        parent.children.push(newNode);
        // Sort alphabetically roughly
        parent.children.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
    }
  }
  return newRoot;
};

export const findNodeByName = (root: FileNode, name: string): FileNode | null => {
  if (root.name === name) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByName(child, name);
    if (found) return found;
  }
  return null;
};

export const isProtected = (node: FileNode, levelIndex: number, action: 'delete' | 'cut'): string | null => {
  const name = node.name;
  
  // 1. Core System Structure (Always Protected)
  if (['root', 'home', 'guest', 'etc', 'tmp', 'workspace'].includes(name)) {
      return `System integrity protection: ${name}`;
  }

  // 2. Episode Structural Directories (Deleted only in Ep 3 Finale - Level 15 / Index 14)
  if (['datastore', 'incoming', 'media'].includes(name)) {
      if (levelIndex < 14) return `Sector protected by admin policy: ${name}`;
  }

  // 3. Specific Critical Files

  // access_key.pem
  if (name === 'access_key.pem') {
      if (action === 'delete') return "Critical asset. Deletion prohibited.";
      // Allowed cut in L9 (Live Migration) and L10 (Rollback)
      // Level 9 is index 8. Level 10 is index 9.
      if (action === 'cut' && levelIndex !== 8 && levelIndex !== 9) return "Asset locked. Relocation not authorized.";
  }

  // mission_log.md
  if (name === 'mission_log.md') {
      // Allowed delete in L13 (Trace Removal) - index 12
      if (action === 'delete' && levelIndex !== 12) return "Mission log required for validation.";
      // Allowed cut in L9 and L10
      if (action === 'cut' && levelIndex !== 8 && levelIndex !== 9) return "Log file locked.";
  }

  // target_map.png
  if (name === 'target_map.png') {
      if (action === 'delete') return "Intel target. Do not destroy.";
      // Allowed cut in L3 (Asset Relocation) - index 2
      if (action === 'cut' && levelIndex !== 2) return "Map file anchored until capture sequence.";
  }

  return null;
};