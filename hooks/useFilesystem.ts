import { useState, useCallback, useMemo } from 'react';
import { FileNode, GameState, FsError, Result, ZoxideEntry } from '../types';
import { 
  getNodeByPath, 
  getParentNode, 
  deleteNode, 
  addNode, 
  renameNode, 
  cloneFS, 
  createPath, 
  resolvePath,
  isProtected
} from '../utils/fsHelpers';

interface UseFilesystemProps {
  initialFS: FileNode;
  initialPath: string[];
  initialZoxide: Record<string, ZoxideEntry>;
}

export function useFilesystem({ initialFS, initialPath, initialZoxide }: UseFilesystemProps) {
  const [fs, setFs] = useState<FileNode>(initialFS);
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath);
  const [levelStartFS, setLevelStartFS] = useState<FileNode>(initialFS);
  const [pathHistory, setPathHistory] = useState<string[][]>([initialPath]);
  const [pathHistoryIndex, setPathHistoryIndex] = useState(0);
  const [zoxideData, setZoxideData] = useState<Record<string, ZoxideEntry>>(initialZoxide);

  const navigateTo = useCallback((path: string[]) => {
    const now = Date.now();
    const pathStr = resolvePath(fs, path);
    
    setPathHistory(prev => {
      const newHistory = prev.slice(0, pathHistoryIndex + 1);
      newHistory.push(path);
      return newHistory;
    });
    setPathHistoryIndex(prev => prev + 1);
    setCurrentPath(path);
    
    setZoxideData(prev => ({
      ...prev,
      [pathStr]: {
        count: (prev[pathStr]?.count || 0) + 1,
        lastAccess: now,
      },
    }));
  }, [fs, pathHistoryIndex]);

  const historyBack = useCallback(() => {
    if (pathHistoryIndex > 0) {
      const newIndex = pathHistoryIndex - 1;
      setCurrentPath(pathHistory[newIndex]);
      setPathHistoryIndex(newIndex);
    }
  }, [pathHistory, pathHistoryIndex]);

  const historyForward = useCallback(() => {
    if (pathHistoryIndex < pathHistory.length - 1) {
      const newIndex = pathHistoryIndex + 1;
      setCurrentPath(pathHistory[newIndex]);
      setPathHistoryIndex(newIndex);
    }
  }, [pathHistory, pathHistoryIndex]);

  const performDelete = useCallback((ids: string[], levelIndex: number): Result<number, string> => {
    let currentFs = fs;
    let errorMsg: string | null = null;

    for (const id of ids) {
      const parent = getNodeByPath(currentFs, currentPath);
      const node = parent?.children?.find(c => c.id === id);
      
      if (!node) continue;

      const protection = isProtected(currentFs, currentPath, node, levelIndex, 'delete');
      if (protection) {
        errorMsg = protection;
        break;
      }

      const result = deleteNode(currentFs, currentPath, id, levelIndex);
      // Fix: Use explicit check result.ok === false to narrow type for 'error' access
      if (result.ok === false) {
        errorMsg = result.error;
        break;
      } else {
        currentFs = result.value;
      }
    }

    if (errorMsg) return { ok: false, error: errorMsg };
    setFs(currentFs);
    return { ok: true, value: ids.length };
  }, [fs, currentPath]);

  const performPaste = useCallback((clipboard: GameState['clipboard'], levelIndex: number): Result<number, string> => {
    if (!clipboard) return { ok: false, error: 'Clipboard empty' };

    let currentFs = fs;
    let errorMsg: string | null = null;

    for (const node of clipboard.nodes) {
      if (clipboard.action === 'cut') {
        const protection = isProtected(currentFs, clipboard.originalPath, node, levelIndex, 'cut');
        if (protection) {
          errorMsg = protection;
          break;
        }
      }

      const addResult = addNode(currentFs, currentPath, node);
      // Fix: Use explicit check addResult.ok === false to narrow type for 'error' access
      if (addResult.ok === false) {
        errorMsg = `Failed to add "${node.name}": ${addResult.error}`;
        break;
      }
      
      currentFs = addResult.value;
      
      if (clipboard.action === 'cut') {
        const delResult = deleteNode(currentFs, clipboard.originalPath, node.id, levelIndex);
        // Fix: Use explicit check delResult.ok === false to narrow type for 'error' access
        if (delResult.ok === false) {
          errorMsg = `Failed to remove source "${node.name}": ${delResult.error}`;
          break;
        } else {
          currentFs = delResult.value;
        }
      }
    }

    if (errorMsg) return { ok: false, error: errorMsg };
    setFs(currentFs);
    return { ok: true, value: clipboard.nodes.length };
  }, [fs, currentPath]);

  const performRename = useCallback((nodeId: string, newName: string, levelIndex: number): Result<string, string> => {
    const result = renameNode(fs, currentPath, nodeId, newName, levelIndex);
    // Fix: Use explicit check result.ok === false to correctly narrow 'error' and 'value' properties
    if (result.ok === false) {
      return { ok: false, error: result.error };
    }
    setFs(result.value);
    return { ok: true, value: newName };
  }, [fs, currentPath]);

  const performCreate = useCallback((pathStr: string): { fs: FileNode; error?: string; createdName?: string; collision?: boolean; collisionNode?: FileNode } => {
    const result = createPath(fs, currentPath, pathStr);
    if (!result.error && !result.collision) {
      setFs(result.fs);
    }
    return result;
  }, [fs, currentPath]);

  const resetToLevel = useCallback((newFs: FileNode, newPath: string[]) => {
    setFs(newFs);
    setLevelStartFS(cloneFS(newFs));
    setCurrentPath(newPath);
    setPathHistory([newPath]);
    setPathHistoryIndex(0);
  }, []);

  return {
    fs,
    currentPath,
    levelStartFS,
    pathHistoryIndex,
    pathHistoryLength: pathHistory.length,
    zoxideData,
    setZoxideData,
    navigateTo,
    historyBack,
    historyForward,
    performDelete,
    performPaste,
    performRename,
    performCreate,
    resetToLevel,
    setFs
  };
}
