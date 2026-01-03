import { FileNode, Result, FsError, Level } from "../types";

// Simple id generator used across the constants for seeding
export function id(prefix = ""): string {
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
    node = (node.children || []).find(c => c.id === id);
  }
  return node;
}

export function getParentNode(root: FileNode, path: string[] | undefined): FileNode | null {
  if (!path || path.length <= 1) return null;
  return getNodeByPath(root, path.slice(0, -1)) || null;
}

export function findNodeByName(root: FileNode, name: string): FileNode | undefined {
  const stack: FileNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.name === name) return n;
    if (n.children) stack.push(...n.children);
  }
  return undefined;
}

export function getAllDirectories(root: FileNode): FileNode[] {
  const result: FileNode[] = [];
  const stack: FileNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.type === "dir" || n.type === "archive") result.push(n);
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
    if (n.type === "dir" || n.type === "archive") {
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
  if (!path || path.length === 0) return "/";
  const names: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const id = path[i];
    const n = getNodeById(root, id);
    if (!n) continue;
    // Skip the root node's name so paths render as '/bin' instead of '//bin'
    if (i === 0 && n.id === root.id) continue;
    names.push(n.name);
  }
  return "/" + names.filter(Boolean).join("/");
}

export function getRecursiveContent(root: FileNode, path: string[] | undefined): FileNode[] {
  const startNode = getNodeByPath(root, path) || root;
  const startPath = path && path.length ? [...path] : [root.id];
  const out: FileNode[] = [];
  // Stack items keep track of node and its id-path from root for display/path compatibility
  const stack: { node: FileNode; pathIds: string[] }[] = (startNode.children || []).map(c => ({
    node: c,
    pathIds: [...startPath, c.id],
  }));
  while (stack.length) {
    const { node: n, pathIds } = stack.pop()!;
    // Augment node with runtime-only helpers expected elsewhere
    (n as any).path = [...pathIds];
    (n as any).display = resolvePath(root, [...pathIds]);
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
  _levelIndex?: number
): Result<FileNode, FsError> {
  try {
    const newRoot = cloneFS(root);
    const parent = parentPath && parentPath.length ? getNodeByPath(newRoot, parentPath) : newRoot;
    if (!parent) return { ok: false, error: "NotFound" };
    if (!parent.children) return { ok: false, error: "NotFound" };
    const idx = parent.children.findIndex(c => c.id === nodeId);
    if (idx === -1) return { ok: false, error: "NotFound" };
    parent.children.splice(idx, 1);
    return { ok: true, value: newRoot };
  } catch (_e) {
    return { ok: false, error: "NotFound" };
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
    if (!parent) return { ok: false, error: "NotFound" };
    parent.children = parent.children || [];
    parent.children.push(node);
    return { ok: true, value: newRoot };
  } catch (_e) {
    return { ok: false, error: "NotFound" };
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
    if (!node) return { ok: false, error: "NotFound" };
    node.name = newName;
    return { ok: true, value: newRoot };
  } catch (_e) {
    return { ok: false, error: "NotFound" };
  }
}

// Simple createPath used by UI - attempts to create a file/dir name at the current path
export function createPath(
  root: FileNode,
  currentPath: string[] | undefined,
  input: string
): { fs: FileNode; error?: string | null; collision?: boolean; collisionNode?: FileNode | null } {
  const newRoot = cloneFS(root);
  const parent = currentPath && currentPath.length ? getNodeByPath(newRoot, currentPath) : newRoot;
  if (!parent) return { fs: newRoot, error: "NotFound", collision: false, collisionNode: null };
  parent.children = parent.children || [];

  // Normalize input: strip trailing slashes for the name (user may type 'protocols/')
  const isDir = input.endsWith("/");
  const normalizedName = input.replace(/\/+$/g, "");

  const exists = parent.children.find(c => c.name === normalizedName);
  if (exists) {
    return { fs: newRoot, error: null, collision: true, collisionNode: exists };
  }
  const node: FileNode = {
    id: id(),
    name: normalizedName,
    type: isDir ? "dir" : "file",
    parentId: parent.id,
  };
  if (node.type === "dir") node.children = [];
  parent.children.push(node);
  return { fs: newRoot, error: null, collision: false, collisionNode: null };
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
  let effectiveParentPath: string[] = []; // This will hold the IDs of the path to the current parent
  let pathSegmentsToCreate: string[] = [];

  if (inputPath.startsWith("~/")) {
    // Resolve "~" to //home/guest node IDs
    const rootNode = findNodeByName(newRoot, "root");
    const homeNode = rootNode?.children?.find(n => n.name === "home");
    const guestNode = homeNode?.children?.find(n => n.name === "guest");

    if (!rootNode || !homeNode || !guestNode) {
      return {
        fs: newRoot,
        error: "Home directory nodes (root, home, guest) not found",
        targetNode: undefined,
      };
    }
    effectiveParentPath = [rootNode.id, homeNode.id, guestNode.id];
    pathSegmentsToCreate = inputPath.substring(2).split("/").filter(Boolean);
  } else if (inputPath.startsWith("/")) {
    // Start from the actual root of the game's filesystem
    effectiveParentPath = [newRoot.id]; // The root FileNode itself
    pathSegmentsToCreate = inputPath.substring(1).split("/").filter(Boolean);
  } else {
    // Relative path from currentPath
    effectiveParentPath = [...currentPath];
    pathSegmentsToCreate = inputPath.split("/").filter(Boolean);
  }

  let currentWorkingNode: FileNode | undefined = getNodeByPath(newRoot, effectiveParentPath);

  if (!currentWorkingNode) {
    return { fs: newRoot, error: "Starting path not found or invalid", targetNode: undefined };
  }

  let finalTargetNode: FileNode | undefined = undefined;

  for (let i = 0; i < pathSegmentsToCreate.length; i++) {
    const segment = pathSegmentsToCreate[i];
    const isLastSegment = i === pathSegmentsToCreate.length - 1;
    const isDir = !isLastSegment || inputPath.endsWith("/");

    let childNode = currentWorkingNode?.children?.find(c => c.name === segment);

    if (!childNode) {
      // Node does not exist, create it
      const newNode: FileNode = {
        id: id(),
        name: segment,
        type: isDir ? "dir" : "file",
        parentId: currentWorkingNode.id,
      };
      if (newNode.type === "dir") newNode.children = [];

      const addResult = addNode(newRoot, effectiveParentPath, newNode);
      if (!addResult.ok) {
        return { fs: newRoot, error: addResult.error, targetNode: undefined };
      }
      newRoot = addResult.value;
      currentWorkingNode = getNodeByPath(newRoot, [...effectiveParentPath, newNode.id]);
      if (!currentWorkingNode) {
        return { fs: newRoot, error: "Failed to find newly created node", targetNode: undefined };
      }
      effectiveParentPath.push(currentWorkingNode.id);

      if (isLastSegment) {
        finalTargetNode = currentWorkingNode;
      }
    } else {
      // Node exists
      if (isLastSegment) {
        finalTargetNode = childNode;
        // If it's the last segment and it already exists, check for collision
        if ((!isDir && childNode.type === "file") || (isDir && childNode.type === "file")) {
          // Trying to create a file, and a file exists OR trying to create a dir and a file exists
          return {
            fs: newRoot,
            error: null,
            collision: true,
            collisionNode: childNode,
            targetNode: finalTargetNode,
          };
        } else if (!isDir && childNode.type === "dir") {
          // Trying to create a file, but a directory with that name exists. This is an error.
          return {
            fs: newRoot,
            error: "Cannot create file, directory with same name exists",
            targetNode: undefined,
          };
        } else if (isDir && childNode.type === "dir") {
          // Trying to create a directory, and it already exists. Not a collision, just return it.
        }
      }
      currentWorkingNode = childNode;
      effectiveParentPath.push(currentWorkingNode.id);
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
  node: FileNode
): Result<FileNode, FsError> {
  let newRoot = cloneFS(root);
  const parent = parentPath && parentPath.length ? getNodeByPath(newRoot, parentPath) : newRoot;
  if (!parent) return { ok: false, error: "NotFound" };
  parent.children = parent.children || [];

  let newName = node.name;
  let counter = 0;
  let exists = parent.children.find(c => c.name === newName);

  while (exists) {
    counter++;
    const parts = node.name.split(".");
    if (parts.length > 1 && node.type === "file") {
      newName = `${parts.slice(0, -1).join(".")}_${counter}.${parts[parts.length - 1]}`;
    } else {
      newName = `${node.name}_${counter}`;
    }
    exists = parent.children.find(c => c.name === newName);
  }

  const newNode: FileNode = { ...node, name: newName, id: id() };

  return addNode(newRoot, parentPath, newNode);
}

export function isProtected(
  root: FileNode,
  currentPath: string[] | undefined,
  node: FileNode,
  level: Level,
  action?: string
): string | null {
  // General node protection
  if (node.protected) {
    return `🔒 This is a protected system file: ${node.name}`;
  }

  // Level 2 specific protection for 'watcher_agent.sys'
  if (level.id === 2 && node.name === "watcher_agent.sys" && action === "delete") {
    const isDel1Complete = level.tasks.find(t => t.id === "del-1")?.completed;
    const isDel2Complete = level.tasks.find(t => t.id === "del-2")?.completed;
    const isVerifyMetaComplete = level.tasks.find(t => t.id === "verify-meta")?.completed;
    const isVerifyContentComplete = level.tasks.find(t => t.id === "verify-content")?.completed;

    if (!isDel1Complete) {
      return "Navigate to ~/incoming first. (Task: del-1)";
    }
    if (!isDel2Complete) {
      return "Jump to the bottom of the file list. (Task: del-2)";
    }
    if (!isVerifyMetaComplete) {
      return "Verify the metadata of 'watcher_agent.sys' using TAB. (Task: verify-meta)";
    }
    if (!isVerifyContentComplete) {
      return "Scan the content of 'watcher_agent.sys' by scrolling the preview. (Task: verify-content)";
    }
  }

  return null;
}
export default {};
