import { FileNode, Result, FsError } from "../types";

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

export function resolvePath(root: FileNode, path: string[] | undefined): string {
  if (!path || path.length === 0) return "/";
  const names: string[] = [];
  for (const id of path) {
    const n = getNodeById(root, id);
    if (n) names.push(n.name);
    else names.push(id);
  }
  return "/" + names.filter(Boolean).join("/");
}

export function getRecursiveContent(root: FileNode, path: string[] | undefined): FileNode[] {
  const node = getNodeByPath(root, path) || root;
  const out: FileNode[] = [];
  const stack: FileNode[] = node.children ? [...node.children] : [];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    if (n.children) stack.push(...n.children);
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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
  const exists = parent.children.find(c => c.name === input);
  if (exists) {
    return { fs: newRoot, error: null, collision: true, collisionNode: exists };
  }
  const node: FileNode = {
    id: id(),
    name: input,
    type: input.endsWith("/") ? "dir" : "file",
    parentId: parent.id,
  };
  if (node.type === "dir") node.children = [];
  parent.children.push(node);
  return { fs: newRoot, error: null, collision: false, collisionNode: null };
}

export function isProtected(
  _root: FileNode,
  _currentPath: string[] | undefined,
  _node: FileNode,
  _levelIndex?: number,
  _action?: string
): string | null {
  // Minimal implementation: nothing is protected in this simplified helper
  return null;
}

export default {};
