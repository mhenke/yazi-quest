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
    
    // Auto-rename logic for collisions (Shadow Copy support)
    let finalName = newNode.name;
    let counter = 1;
    
    const exists = (name: string) => parent.children!.some(c => c.name === name);

    if (exists(finalName)) {
        const nameParts = newNode.name.split('.');
        // Try to insert _copy before extension if it exists and isn't a directory
        if (nameParts.length > 1 && newNode.type !== 'dir') {
             const ext = nameParts.pop();
             const base = nameParts.join('.');
             while(exists(finalName)) {
                 finalName = `${base}_copy${counter > 1 ? `_${counter}` : ''}.${ext}`;
                 counter++;
             }
        } else {
             // Directories or files without extension
             while(exists(finalName)) {
                 finalName = `${newNode.name}_copy${counter > 1 ? `_${counter}` : ''}`;
                 counter++;
             }
        }
    }

    const nodeToAdd = { ...newNode, name: finalName };
    parent.children.push(nodeToAdd);
    
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

export const createPath = (root: FileNode, parentPathIds: string[], pathStr: string): { fs: FileNode, error?: string } => {
  const newRoot = cloneFS(root);
  let currentPath = [...parentPathIds];
  
  const isDirTarget = pathStr.endsWith('/');
  const segments = pathStr.split('/').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < segments.length; i++) {
    const name = segments[i];
    const isLast = i === segments.length - 1;
    // If it's the last segment, type depends on trailing slash. Otherwise intermediate must be dir.
    const type: 'dir' | 'file' = (isLast && !isDirTarget) ? 'file' : 'dir';
    
    // Find parent in the NEW root
    const parent = getNodeByPath(newRoot, currentPath);
    if (!parent) return { fs: root, error: "Path resolution failed" };
    
    const existing = parent.children?.find(c => c.name === name);
    
    if (existing) {
      if (existing.type !== 'dir' && !isLast) {
         // Trying to go through a file as a directory
         return { fs: root, error: `Cannot create directory inside file: ${name}` };
      }
      if (isLast && existing.type !== type) {
          return { fs: root, error: `Item '${name}' already exists as ${existing.type}` };
      }
      // It exists and is valid (dir), traverse into it
      currentPath.push(existing.id);
    } else {
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

      currentPath.push(newNode.id);
    }
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

export const isProtected = (node: FileNode, levelIndex: number, action: 'delete' | 'cut' | 'rename'): string | null => {
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
      // Allowed cut/rename in:
      // L6 (Index 5) - Secure Asset
      // L9 (Index 8) - Neural Construction
      // L11 (Index 10) - Live Migration
      if ((action === 'cut' || action === 'rename') && ![5, 8, 10].includes(levelIndex)) {
          return "Asset locked. Modification not authorized.";
      }
  }

  // mission_log.md
  if (name === 'mission_log.md') {
      // Allowed delete in L13 (Trace Removal) - index 12
      if (action === 'delete' && levelIndex !== 12) return "Mission log required for validation.";
      // Allowed cut/rename in L9 and L10
      if ((action === 'cut' || action === 'rename') && levelIndex !== 8 && levelIndex !== 9) return "Log file locked.";
  }

  // target_map.png
  if (name === 'target_map.png') {
      if (action === 'delete') return "Intel target. Do not destroy.";
      // Allowed cut in L3 (Asset Relocation) - index 2
      if ((action === 'cut' || action === 'rename') && levelIndex !== 2) return "Map file anchored until capture sequence.";
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