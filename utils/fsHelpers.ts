import { FileNode } from '../types';

// --- Query Helpers ---

export const getNodeByPath = (root: FileNode, pathIds: string[]): FileNode | null => {
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

    let pathString = "";
    
    let tempRoot = root;
    for (let i = 1; i < pathIds.length; i++) {
        const id = pathIds[i];
        const child = tempRoot.children?.find(c => c.id === id);
        if (!child) return pathString; // broken path
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

export const getRecursiveContent = (root: FileNode, startPathIds: string[]): { path: string[], display: string, type: string, id: string }[] => {
    const startNode = getNodeByPath(root, startPathIds);
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

// --- Basic Helpers ---

export const cloneFS = (node: FileNode): FileNode => {
  return {
    ...node,
    children: node.children ? node.children.map(cloneFS) : undefined
  };
};

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
    
    // Check for collision with exact same name and type
    const collision = parent.children.find(c => c.name === newNode.name && c.type === newNode.type);
    
    // Ensure the new node has a fresh ID and deep-copied structure
    let nodeToInsert = regenerateIds(newNode, parent.id);
    
    // Update timestamps
    const now = Date.now();
    nodeToInsert.createdAt = newNode.createdAt || now;
    nodeToInsert.modifiedAt = now;

    // If collision exists, rename the new node (Real Yazi behavior: auto-rename with "_1", "_2", etc.)
    if (collision) {
        let baseName = nodeToInsert.name;
        let ext = "";

        if (nodeToInsert.type === 'file') {
            const lastDotIndex = baseName.lastIndexOf('.');
            // Handle cases like ".config" (no extension, just name) vs "image.png"
            if (lastDotIndex > 0) {
                ext = baseName.substring(lastDotIndex);
                baseName = baseName.substring(0, lastDotIndex);
            }
        }

        let counter = 1;
        let candidateName = `${baseName}_${counter}${ext}`;

        // Find a unique name
        while (parent.children.find(c => c.name === candidateName && c.type === nodeToInsert.type)) {
            counter++;
            candidateName = `${baseName}_${counter}${ext}`;
        }

        nodeToInsert.name = candidateName;
    }

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
  }
  return newRoot;
};

export const renameNode = (root: FileNode, parentPathIds: string[], nodeId: string, newName: string): FileNode => {
  const newRoot = cloneFS(root);
  const parent = getNodeByPath(newRoot, parentPathIds);
  if (parent && parent.children) {
      const node = parent.children.find(c => c.id === nodeId);
      if (node) {
          node.name = newName;
          node.modifiedAt = Date.now(); // Update modified time on rename
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
      }
  }
  return newRoot;
};

// Helper to find an existing child by name and type
const findExistingChild = (parent: FileNode, name: string, type?: 'dir' | 'file'): FileNode | null => {
    if (!parent.children) return null;
    return parent.children.find(c => c.name === name && (type ? c.type === type : true)) || null;
};

// Helper to generate collision info
const generateCollisionInfo = (name: string, type: 'dir' | 'file'): { collision: true, collisionNode: FileNode } => {
    return {
        collision: true,
        collisionNode: {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            type: type,
            parentId: null,
            children: type === 'dir' ? [] : undefined,
            content: type === 'file' ? '' : undefined
        }
    };
};

// Updated createPath: Returns collision info instead of auto-renaming
export const createPath = (root: FileNode, parentPathIds: string[], pathStr: string): { fs: FileNode, error?: string, createdName?: string, collision?: boolean, collisionNode?: FileNode } => {
  const newRoot = cloneFS(root);
  let currentPath = [...parentPathIds];
  
  const segments = pathStr.split('/').filter(s => s.trim().length > 0);
  const isDirTarget = pathStr.endsWith('/');
  
  for (let i = 0; i < segments.length; i++) {
    let name = segments[i];
    const isLast = i === segments.length - 1;
    // CRITICAL: If not last, it MUST be a dir. If last, it depends on isDirTarget.
    const type: 'dir' | 'file' = !isLast ? 'dir' : (isDirTarget ? 'dir' : 'file');
    
    // Find parent in the NEW root
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: "Path resolution failed" };
    
    // Check for existing node with SAME name
    // We don't check type yet, because if a file exists with the same name where we need a dir, that's an error.
    const existingAny = parent.children?.find(c => c.name === name);

    if (existingAny) {
      if (!isLast) { // Intermediate segment (must be dir)
         if (existingAny.type !== 'dir') {
            return { fs: root, error: `Cannot create directory inside file: ${name}` };
         }
         // It exists and is valid (dir), traverse into it
         currentPath.push(existingAny.id);
         continue;
      } else { // Last segment
         // Collision check: Only strict collision if same type
         if (existingAny.type === type) {
             return { fs: root, ...generateCollisionInfo(name, type) };
         } else {
             // Name exists but different type (e.g. dir 'foo' vs file 'foo'). 
             // In many FS this is an error. Let's return error for safety.
             return { fs: root, error: `Name conflict: ${name} already exists as a ${existingAny.type}` };
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
      modifiedAt: Date.now()
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

const checkCoreSystemProtection = (name: string): string | null => {
  if (['root', 'home', 'guest', 'etc', 'tmp', 'workspace'].includes(name)) {
      return `System integrity protection: ${name}`;
  }
  return null;
};

const checkEpisodeStructuralProtection = (name: string, levelIndex: number): string | null => {
  if (['datastore', 'incoming', 'media'].includes(name)) {
      if (levelIndex < 16) return `Sector protected by admin policy: ${name}`;
  }
  return null;
};

const checkLevelSpecificAssetProtection = (node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
  const name = node.name;

  if (name === 'access_key.pem') {
      if (action === 'delete') return "Critical asset. Deletion prohibited.";
      if (action === 'cut' && ![7, 10].includes(levelIndex)) {
          return "Asset locked. Modification not authorized.";
      }
  }

  if (name === 'mission_log.md') {
      if (action === 'delete' && levelIndex !== 14) return "Mission log required for validation.";
      if (action === 'cut' && levelIndex !== 10) return "Log file locked.";
  }

  if (name === 'target_map.png') {
      if (action === 'delete') return "Intel target. Do not destroy.";
      if (action === 'cut' && levelIndex !== 2) return "Map file anchored until capture sequence.";
  }

  if (name === 'protocols') {
      if (action === 'delete' && levelIndex < 5) return "Protocol directory required for uplink deployment.";
      if (action === 'cut' && levelIndex < 5) return "Protocol directory anchored.";
  }

  if (name === 'uplink_v1.conf') {
      if (action === 'delete' && levelIndex < 8) return "Uplink configuration required for neural network.";
      if (action === 'cut' && levelIndex !== 4) return "Uplink config locked.";
  }
  if (name === 'uplink_v2.conf') {
      if (action === 'delete' && levelIndex < 5) return "Uplink configuration required for deployment.";
      if (action === 'cut' && levelIndex !== 4) return "Uplink config locked.";
  }

  if (name === 'active') {
      if (action === 'delete' && levelIndex < 8) return "Active deployment zone required.";
      if (action === 'cut' && levelIndex < 8) return "Deployment zone anchored.";
  }

  if (name === 'neural_net') {
      if (action === 'delete' && levelIndex < 12) return "Neural network architecture required.";
      if (action === 'cut' && levelIndex < 12) return "Neural network anchored.";
      if (action === 'rename' && levelIndex !== 11) return "Neural network identity locked.";
  }

  if (name === 'weights') {
      if (action === 'delete' && levelIndex < 12) return "Weights directory required for camouflage.";
      if (action === 'cut' && levelIndex < 12) return "Weights anchored.";
  }

  if (name === 'model.rs') {
      if (action === 'delete' && levelIndex < 12) return "Model file required for camouflage.";
      if (action === 'cut' && levelIndex < 12) return "Model file anchored.";
      if (action === 'rename' && levelIndex !== 11) return "Model identity locked.";
  }

  if (name === 'vault') {
      if (action === 'delete' && levelIndex < 13) return "Vault required for privilege escalation.";
      if (action === 'cut' && levelIndex !== 12) return "Vault anchored until escalation.";
  }

  if (name === 'backup_logs.zip') {
      if (action === 'delete' && levelIndex < 10) return "Archive required for intelligence extraction.";
      if (action === 'cut' && levelIndex < 10) return "Archive anchored.";
  }

  if (name === 'daemon') {
      if (action === 'delete' && levelIndex < 14) return "Daemon controller required for redundancy.";
      if (action === 'cut' && levelIndex < 14) return "Daemon anchored until cloning.";
  }

  if (name === 'sector_1' || name === 'grid_alpha') {
      if (action === 'delete' && levelIndex !== 16) return "Relay infrastructure required for final phase.";
  }

  return null;
};

export const isProtected = (node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
  const name = node.name;
  let protectionMessage: string | null;

  protectionMessage = checkCoreSystemProtection(name);
  if (protectionMessage) return protectionMessage;

  protectionMessage = checkEpisodeStructuralProtection(name, levelIndex);
  if (protectionMessage) return protectionMessage;

  protectionMessage = checkLevelSpecificAssetProtection(node, levelIndex, action);
  if (protectionMessage) return protectionMessage;

  return null;
};
