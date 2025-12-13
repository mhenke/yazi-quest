import { FileNode } from '../types';

export const cloneFS = (node: FileNode): FileNode => {
  return {
    ...node,
    children: node.children ? node.children.map(cloneFS) : undefined
  };
};

export const regenerateIds = (node: FileNode): FileNode => {
  return {
    ...node,
    id: Math.random().toString(36).substr(2, 9),
    children: node.children ? node.children.map(regenerateIds) : undefined
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
    
    // Check for collision with exact same name and type
    const collision = parent.children.find(c => c.name === newNode.name && c.type === newNode.type);
    
    // Create a shallow copy of newNode so we can modify name if needed without affecting the source
    let nodeToInsert = { ...newNode };

    // If collision exists, rename the new node (Copy/Paste behavior)
    // If overwrite is intended (e.g. from overwrite modal), the caller deletes the original first, so no collision here.
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

        let suffix = "-copy";
        let counter = 0;
        let candidateName = `${baseName}${suffix}${ext}`;

        // Find a unique name
        while (parent.children.find(c => c.name === candidateName && c.type === nodeToInsert.type)) {
            counter++;
            candidateName = `${baseName}${suffix}-${counter}${ext}`;
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

// Updated createPath: Returns collision info instead of auto-renaming
export const createPath = (root: FileNode, parentPathIds: string[], pathStr: string): { fs: FileNode, error?: string, createdName?: string, collision?: boolean, collisionNode?: FileNode } => {
  const newRoot = cloneFS(root);
  let currentPath = [...parentPathIds];
  
  const isDirTarget = pathStr.endsWith('/');
  const segments = pathStr.split('/').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < segments.length; i++) {
    let name = segments[i];
    const isLast = i === segments.length - 1;
    // If it's the last segment, type depends on trailing slash. Otherwise intermediate must be dir.
    const type: 'dir' | 'file' = (isLast && !isDirTarget) ? 'file' : 'dir';
    
    // Find parent in the NEW root
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: "Path resolution failed" };
    
    // Traversal priority: look for directory first to traverse into
    const existingDir = parent.children?.find(c => c.name === name && c.type === 'dir');
    const existingFile = parent.children?.find(c => c.name === name && c.type !== 'dir');
    const existing = existingDir || existingFile;
    
    if (existing) {
      if (!isLast) {
         if (existing.type !== 'dir') {
            // Trying to go through a file as a directory
            return { fs: root, error: `Cannot create directory inside file: ${name}` };
         }
         // It exists and is valid (dir), traverse into it
         currentPath.push(existing.id);
         continue;
      } else {
         // Last segment
         
         // Conflict check: Only conflict if Same Name AND Same Type
         const strictConflict = parent.children?.find(c => c.name === name && c.type === type);
         
         if (strictConflict) {
             // Return collision info so UI can prompt overwrite
             return { 
                 fs: root, // Return original FS (no changes yet)
                 collision: true,
                 collisionNode: {
                    id: Math.random().toString(36).substr(2, 9),
                    name: name,
                    type: type,
                    children: type === 'dir' ? [] : undefined,
                    content: type === 'file' ? '' : undefined
                 }
             };
         }
         
         // If no strict conflict (e.g. existing is File but new is Dir), we proceed to create
         // This satisfies the "we can have a file active and a folder active" requirement
      }
    }
    
    // Create new
    const newNode: FileNode = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      type: type,
      children: type === 'dir' ? [] : undefined,
      content: type === 'file' ? '' : undefined
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

export const findNodeByName = (root: FileNode, name: string): FileNode | null => {
  if (root.name === name) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByName(child, name);
    if (found) return found;
  }
  return null;
};

// Returns list of all directories with their full path ids and display string
export const getAllDirectories = (root: FileNode): { path: string[], display: string }[] => {
    const results: { path: string[], display: string }[] = [];
    
    const traverse = (node: FileNode, pathIds: string[], pathNames: string[]) => {
        if (node.type !== 'dir') return;
        
        const currentIds = [...pathIds, node.id];
        const currentNames = [...pathNames, node.name];
        
        // Exclude root ID 'root' to keep it clean, but include it implicitly if needed.
        if (node.id !== 'root') {
             results.push({
                 path: currentIds,
                 display: '/' + currentNames.slice(1).join('/')
             });
        }

        if (node.children) {
            node.children.forEach(child => traverse(child, currentIds, currentNames));
        }
    };
    
    traverse(root, [], []);
    return results;
};

// Recursive recursive search from a specific root node (for 'z' command)
export const getRecursiveContent = (root: FileNode, startPathIds: string[]): { path: string[], display: string, node: FileNode }[] => {
  const results: { path: string[], display: string, node: FileNode }[] = [];
  const startNode = getNodeByPath(root, startPathIds);
  if (!startNode || !startNode.children) return [];

  const traverse = (node: FileNode, currentPath: string[], relativeName: string) => {
    // Add current node (file or dir)
    results.push({
      path: currentPath,
      display: relativeName,
      node: node
    });

    if (node.children) {
      node.children.forEach(child => {
        traverse(child, [...currentPath, child.id], relativeName ? `${relativeName}/${child.name}` : child.name);
      });
    }
  };

  startNode.children.forEach(child => {
     traverse(child, [...startPathIds, child.id], child.name);
  });

  return results;
};

export const isProtected = (node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
  const name = node.name;

  // ===========================================
  // 1. Core System Structure (Always Protected)
  // ===========================================
  if (['root', 'home', 'guest', 'etc', 'tmp', 'workspace'].includes(name)) {
      return `System integrity protection: ${name}`;
  }

  // ===========================================
  // 2. Episode Structural Directories
  // ===========================================
  // datastore, incoming, media - Deleted only in L17 (index 16)
  if (['datastore', 'incoming', 'media'].includes(name)) {
      if (levelIndex < 16) return `Sector protected by admin policy: ${name}`;
  }

  // ===========================================
  // 3. Level-Specific Asset Protection
  // ===========================================

  // --- access_key.pem ---
  // Pre-exists, found in L6, copied in L8, moved in L11
  if (name === 'access_key.pem') {
      if (action === 'delete') return "Critical asset. Deletion prohibited.";
      // Allowed cut in: L8 (index 7) copy to vault, L11 (index 10) migration
      if (action === 'cut' && ![7, 10].includes(levelIndex)) {
          return "Asset locked. Modification not authorized.";
      }
  }

  // --- mission_log.md ---
  // Pre-exists, moved in L11, deleted in L15
  if (name === 'mission_log.md') {
      // Allowed delete only in L15 (index 14)
      if (action === 'delete' && levelIndex !== 14) return "Mission log required for validation.";
      // Allowed cut in L11 (index 10) for migration
      if (action === 'cut' && levelIndex !== 10) return "Log file locked.";
  }

  // --- target_map.png ---
  // Pre-exists, moved in L3
  if (name === 'target_map.png') {
      if (action === 'delete') return "Intel target. Do not destroy.";
      // Allowed cut only in L3 (index 2)
      if (action === 'cut' && levelIndex !== 2) return "Map file anchored until capture sequence.";
  }

  // --- protocols directory ---
  // Created in L4 (index 3), used in L5 (index 4)
  if (name === 'protocols') {
      if (action === 'delete' && levelIndex < 5) return "Protocol directory required for uplink deployment.";
      if (action === 'cut' && levelIndex < 5) return "Protocol directory anchored.";
  }

  // --- uplink config files ---
  // Created in L4 (index 3), moved in L5 (index 4), uplink_v1 copied in L8 (index 7)
  if (name === 'uplink_v1.conf') {
      if (action === 'delete' && levelIndex < 8) return "Uplink configuration required for neural network.";
      // Allowed cut in L5 (index 4) batch move, copy (yank) in L8 (index 7)
      if (action === 'cut' && levelIndex !== 4) return "Uplink config locked.";
  }
  if (name === 'uplink_v2.conf') {
      if (action === 'delete' && levelIndex < 5) return "Uplink configuration required for deployment.";
      // Allowed cut only in L5 (index 4)
      if (action === 'cut' && levelIndex !== 4) return "Uplink config locked.";
  }

  // --- active directory ---
  // Created in L5 (index 4), used in L8 (index 7)
  if (name === 'active') {
      if (action === 'delete' && levelIndex < 8) return "Active deployment zone required.";
      if (action === 'cut' && levelIndex < 8) return "Deployment zone anchored.";
  }

  // --- neural_net directory ---
  // Created in L8 (index 7), renamed in L12 (index 11)
  if (name === 'neural_net') {
      if (action === 'delete' && levelIndex < 12) return "Neural network architecture required.";
      if (action === 'cut' && levelIndex < 12) return "Neural network anchored.";
      // Allowed rename only in L12 (index 11)
      if (action === 'rename' && levelIndex !== 11) return "Neural network identity locked.";
  }

  // --- weights directory ---
  // Created in L8 (index 7), used in L12 (index 11)
  if (name === 'weights') {
      if (action === 'delete' && levelIndex < 12) return "Weights directory required for camouflage.";
      if (action === 'cut' && levelIndex < 12) return "Weights anchored.";
  }

  // --- model.rs file ---
  // Created in L8 (index 7), renamed in L12 (index 11)
  if (name === 'model.rs') {
      if (action === 'delete' && levelIndex < 12) return "Model file required for camouflage.";
      if (action === 'cut' && levelIndex < 12) return "Model file anchored.";
      // Allowed rename only in L12 (index 11)
      if (action === 'rename' && levelIndex !== 11) return "Model identity locked.";
  }

  // --- vault directory ---
  // Created in L8 (index 7), moved in L13 (index 12)
  if (name === 'vault') {
      if (action === 'delete' && levelIndex < 13) return "Vault required for privilege escalation.";
      // Allowed cut only in L13 (index 12)
      if (action === 'cut' && levelIndex !== 12) return "Vault anchored until escalation.";
  }

  // --- backup_logs.zip archive ---
  // Pre-exists, used in L10 (index 9)
  if (name === 'backup_logs.zip') {
      if (action === 'delete' && levelIndex < 10) return "Archive required for intelligence extraction.";
      if (action === 'cut' && levelIndex < 10) return "Archive anchored.";
  }

  // --- daemon directory ---
  // Created in L13 (index 12), copied in L14 (index 13)
  if (name === 'daemon') {
      // Allowed delete/cut after L14 (index 13) since it's cloned
      if (action === 'delete' && levelIndex < 14) return "Daemon controller required for redundancy.";
      // Allowed cut (for copy operation via yank) only in L14 (index 13)
      if (action === 'cut' && levelIndex < 14) return "Daemon anchored until cloning.";
  }

  // --- sector_1 and grid_alpha ---
  // Created in L16 (index 15), deleted in L17 (index 16)
  if (name === 'sector_1' || name === 'grid_alpha') {
      // Only deletable in L17 (index 16)
      if (action === 'delete' && levelIndex !== 16) return "Relay infrastructure required for final phase.";
  }

  return null;
};

// Converts a list of IDs to a readable path string (e.g., /home/user/docs)
export const resolvePath = (root: FileNode, pathIds: string[]): string => {
  if (!pathIds.length || pathIds[0] !== root.id) return '/';
  if (pathIds.length === 1) return '/';

  const names: string[] = [];
  let current = root;

  for (let i = 1; i < pathIds.length; i++) {
    const nextId = pathIds[i];
    const child = current.children?.find(c => c.id === nextId);
    if (child) {
      names.push(child.name);
      current = child;
    } else {
      names.push('?');
      break;
    }
  }

  return '/' + names.join('/');
};