import { useCallback } from "react";
import { GameState, FileNode, Level, FsError, Result } from "../types";
import {
  getNodeByPath,
  deleteNode,
  addNode,
  addNodeWithConflictResolution,
  isProtected,
  resolvePath,
  resolveAndCreatePath,
} from "../utils/fsHelpers";
import { getVisibleItems } from "../utils/viewHelpers";
import { reportError } from "../utils/error";
import { KEYBINDINGS } from "../constants/keybindings";

// Helper to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// Find the narrative description for a given key
const getNarrativeAction = (key: string): string | null => {
  const binding = KEYBINDINGS.find(b => b.keys.includes(key));
  if (binding && binding.narrativeDescription) {
    if (Array.isArray(binding.narrativeDescription)) {
      return getRandomElement(binding.narrativeDescription);
    }
    return binding.narrativeDescription as string;
  }
  return null;
};

export const useKeyboardHandlers = (
  showNotification: (message: string, duration?: number) => void
) => {
  const handleSortModeKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      const key = e.key;
      const shift = e.shiftKey;

      if (key === "n" || key === "N") {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          sortBy: "natural",
          sortDirection: shift ? "desc" : "asc",
          notification: `Sort: Natural ${shift ? "(rev)" : ""}`,
        }));
      } else if (key === "a" || key === "A") {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          sortBy: "alphabetical",
          sortDirection: shift ? "desc" : "asc",
          notification: `Sort: A-Z ${shift ? "(rev)" : ""}`,
        }));
      } else if (key === "m" || key === "M") {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          sortBy: "modified",
          sortDirection: shift ? "asc" : "desc",
          linemode: "mtime",
          notification: `Sort: Modified ${shift ? "(old)" : "(new)"}`,
        }));
      } else if (key === "s" || key === "S") {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          sortBy: "size",
          sortDirection: shift ? "asc" : "desc",
          linemode: "size",
          notification: `Sort: Size ${shift ? "(small)" : "(large)"}`,
        }));
      } else if (key === "e" || key === "E") {
        setGameState(prev => ({
          ...prev,
          mode: "normal",
          sortBy: "extension",
          sortDirection: shift ? "desc" : "asc",
          notification: `Sort: Extension ${shift ? "(rev)" : ""}`,
        }));
      } else if (key === "l") {
        setGameState(prev => {
          const modes: ("none" | "size" | "mtime" | "permissions")[] = [
            "none",
            "size",
            "mtime",
            "permissions",
          ];
          const nextIndex = (modes.indexOf(prev.linemode) + 1) % modes.length;
          return { ...prev, mode: "normal", linemode: modes[nextIndex] };
        });
      } else if (key === "-") {
        setGameState(prev => ({ ...prev, mode: "normal", linemode: "none" }));
      } else if (key === "Escape") {
        setGameState(prev => ({ ...prev, mode: "normal" }));
      }
    },
    []
  );

  const handleConfirmDeleteModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      visibleItems: FileNode[],
      currentLevelParam: Level
    ) => {
      if (e.key === "y" || e.key === "Enter") {
        setGameState(prev => {
          let newFs = prev.fs;
          let errorMsg: string | null | undefined = null;

          for (const id of prev.pendingDeleteIds) {
            const node = visibleItems.find(n => n.id === id);
            if (node) {
              const protection = isProtected(
                prev.fs,
                prev.currentPath,
                node,
                currentLevelParam,
                "delete"
              );
              if (protection) {
                errorMsg = protection;
                break;
              }
              const res = deleteNode(newFs, prev.currentPath, id, prev.levelIndex);
              if (!res.ok) {
                errorMsg = (res as { ok: false; error: FsError }).error;
                break;
              }
              newFs = res.value;
            }
          }

          if (errorMsg) {
            return {
              ...prev,
              mode: "normal",
              pendingDeleteIds: [],
              notification: `🔒 PROTECTED: ${errorMsg}`,
            };
          }
          return {
            ...prev,
            fs: newFs,
            mode: "normal",
            pendingDeleteIds: [],
            selectedIds: [],
            notification: getNarrativeAction("d") || "Items deleted",
          };
        });
      } else if (e.key === "n" || e.key === "Escape") {
        setGameState(prev => ({ ...prev, mode: "normal", pendingDeleteIds: [] }));
      }
    },
    []
  );

  const handleOverwriteConfirmKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      if (e.key === "y" || e.key === "Enter") {
        setGameState(prev => {
          if (!prev.pendingOverwriteNode) return { ...prev, mode: "normal" };

          let newFs = prev.fs;
          const deleteRes = deleteNode(
            newFs,
            prev.currentPath,
            prev.pendingOverwriteNode.id,
            prev.levelIndex
          );
          if (!deleteRes.ok)
            return {
              ...prev,
              mode: "normal",
              notification: `Overwrite failed: ${(deleteRes as { ok: false; error: FsError }).error}`,
            };
          newFs = deleteRes.value;

          const createRes = resolveAndCreatePath(newFs, prev.currentPath, prev.inputBuffer);
          if (createRes.error) {
            return {
              ...prev,
              fs: newFs,
              mode: "normal",
              inputBuffer: "",
              notification: createRes.error,
              pendingOverwriteNode: null,
            };
          }

          if (createRes.collision && createRes.collisionNode) {
            return {
              ...prev,
              fs: newFs,
              mode: "overwrite-confirm",
              inputBuffer: prev.inputBuffer,
              pendingOverwriteNode: createRes.collisionNode,
              notification: "Collision still detected after overwrite attempt.",
            };
          }

          return {
            ...prev,
            fs: createRes.fs,
            mode: "normal",
            inputBuffer: "",
            pendingOverwriteNode: null,
            notification: "Overwritten successfully.",
          };
        });
      } else if (e.key === "n" || e.key === "Escape") {
        setGameState(prev => ({ ...prev, mode: "normal", pendingOverwriteNode: null }));
      }
    },
    []
  );

  const handleGCommandKeyDown = useCallback(
    (e: KeyboardEvent, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
      switch (e.key) {
        case "Escape":
          setGameState(prev => ({ ...prev, mode: "normal" }));
          break;
        case "g":
          setGameState(prev => ({
            ...prev,
            cursorIndex: 0,
            mode: "normal",
            usedGG: true,
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        case "h": {
          const homePath = ["root", "home", "guest"];
          setGameState(prev => ({
            ...prev,
            currentPath: homePath,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to home",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        }
        case "c": {
          const path = ["root", "home", "guest", ".config"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to config",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
            usedGC: true,
          }));
          break;
        }
        case "w": {
          const path = ["root", "home", "guest", "workspace"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to workspace",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        }
        case "t": {
          const path = ["root", "tmp"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to tmp",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        }
        case "r": {
          const path = ["root"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to root",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        }
        case "i": {
          const path = ["root", "home", "guest", "incoming"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to incoming",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
            usedGI: true,
          }));
          break;
        }
        case "d": {
          const path = ["root", "home", "guest", "datastore"];
          setGameState(prev => ({
            ...prev,
            currentPath: path,
            cursorIndex: 0,
            mode: "normal",
            notification: "Jumped to datastore",
            future: [],
            previewScroll: 0,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        }
        default:
          setGameState(prev => ({ ...prev, mode: "normal" }));
          break;
      }
    },
    []
  );

  const handleNormalModeKeyDown = useCallback(
    (
      e: KeyboardEvent,
      gameState: GameState,
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      items: FileNode[],
      parent: FileNode | null,
      currentItem: FileNode | null,
      currentLevel: Level,
      advanceLevel: () => void
    ) => {
      switch (e.key) {
        case "j":
        case "ArrowDown":
          setGameState(prev => ({
            ...prev,
            cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1),
            previewScroll: 0,
            usedDown: true,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        case "k":
        case "ArrowUp":
          setGameState(prev => ({
            ...prev,
            cursorIndex: Math.max(0, prev.cursorIndex - 1),
            previewScroll: 0,
            usedUp: true,
            usedPreviewDown: false,
            usedPreviewUp: false,
          }));
          break;
        case "J":
          if (e.shiftKey) {
            setGameState(prev => ({
              ...prev,
              previewScroll: prev.previewScroll + 5,
              usedPreviewDown: true,
            }));
          }
          break;
        case "K":
          if (e.shiftKey) {
            setGameState(prev => ({
              ...prev,
              previewScroll: Math.max(0, prev.previewScroll - 5),
              usedPreviewUp: true,
            }));
          }
          break;
        case "g":
          e.preventDefault();
          setGameState(prev => ({ ...prev, mode: "g-command" }));
          break;
        case "h":
          if (parent) {
            setGameState(prev => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
            }));
          }
          break;
        case "H":
          if (e.shiftKey && gameState.history.length > 0) {
            setGameState(prev => {
              const newHistory = [...prev.history];
              const previousPath = newHistory.pop();
              if (!previousPath) return prev;

              const newFuture = [...prev.future, prev.currentPath];

              return {
                ...prev,
                history: newHistory,
                future: newFuture,
                currentPath: previousPath,
                cursorIndex: 0,
                previewScroll: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
                notification: "Navigated back",
                usedHistoryBack: true,
              };
            });
          }
          break;
        case "L":
          if (e.shiftKey && gameState.future.length > 0) {
            setGameState(prev => {
              const newFuture = [...prev.future];
              const nextPath = newFuture.pop();
              if (!nextPath) return prev;

              const newHistory = [...prev.history, prev.currentPath];

              return {
                ...prev,
                history: newHistory,
                future: newFuture,
                currentPath: nextPath,
                cursorIndex: 0,
                previewScroll: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
                notification: "Navigated forward",
                usedHistoryForward: true,
              };
            });
          }
          break;
        case "d":
          if (gameState.selectedIds.length > 0 || currentItem) {
            setGameState(prev => ({
              ...prev,
              mode: "confirm-delete",
              pendingDeleteIds: prev.selectedIds.length > 0 ? prev.selectedIds : [currentItem!.id],
            }));
          }
          break;
        case "G":
          setGameState(prev => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const inRequiredDir =
              currentDir?.name === "datastore" || currentDir?.name === "incoming";
            return {
              ...prev,
              cursorIndex: items.length - 1,
              usedG: inRequiredDir ? true : prev.usedG,
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
            };
          });
          break;
        case "ArrowLeft":
          if (parent) {
            setGameState(prev => ({
              ...prev,
              currentPath: prev.currentPath.slice(0, -1),
              cursorIndex: 0,
              previewScroll: 0,
              usedPreviewDown: false,
              usedPreviewUp: false,
            }));
          }
          break;
        case "l":
        case "Enter":
        case "ArrowRight": {
          const allComplete = currentLevel.tasks.every(t => t.completed);
          if (allComplete && !gameState.showHidden && e.key === "Enter" && e.shiftKey) {
            advanceLevel();
            return;
          }
          if (currentItem && (currentItem.type === "dir" || currentItem.type === "archive")) {
            setGameState(prev => {
              const nextPath = [...prev.currentPath, currentItem.id];
              const pathStr = resolvePath(prev.fs, nextPath);
              const now = Date.now();
              return {
                ...prev,
                currentPath: nextPath,
                cursorIndex: 0,
                usedG: false,
                usedGG: false,
                usedPreviewDown: false,
                usedPreviewUp: false,
                history: [...prev.history, prev.currentPath],
                future: [],
                previewScroll: 0,
                zoxideData: {
                  ...prev.zoxideData,
                  [pathStr]: {
                    count: (prev.zoxideData[pathStr]?.count || 0) + 1,
                    lastAccess: now,
                  },
                },
              };
            });
          }
          break;
        }
        case " ":
          if (currentItem) {
            setGameState(prev => {
              const newSelected = prev.selectedIds.includes(currentItem.id)
                ? prev.selectedIds.filter(id => id !== currentItem.id)
                : [...prev.selectedIds, currentItem.id];
              return {
                ...prev,
                selectedIds: newSelected,
                cursorIndex: Math.min(items.length - 1, prev.cursorIndex + 1),
                previewScroll: 0,
              };
            });
          }
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map(item => item.id);
            setGameState(prev => ({ ...prev, selectedIds: allIds, usedCtrlA: true }));
            showNotification(
              getNarrativeAction("Ctrl+A") || `Selected all (${allIds.length} items)`,
              2000
            );
          } else {
            e.preventDefault();
            setGameState(prev => ({ ...prev, mode: "input-file", inputBuffer: "" }));
          }
          break;
        case "r":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = items.map(item => item.id);
            const inverted = allIds.filter(id => !gameState.selectedIds.includes(id));
            setGameState(prev => ({ ...prev, selectedIds: inverted }));
            showNotification(
              getNarrativeAction("Ctrl+R") || `Inverted selection (${inverted.length} items)`,
              2000
            );
          } else if (gameState.selectedIds.length > 1) {
            setGameState(prev => ({
              ...prev,
              notification: "Batch rename not available in this version",
            }));
          } else if (currentItem) {
            e.preventDefault();
            setGameState(prev => ({ ...prev, mode: "rename", inputBuffer: currentItem.name }));
          }
          break;
        case "x":
        case "y":
          if (gameState.selectedIds.length > 0) {
            const nodes = getVisibleItems(gameState).filter(n =>
              gameState.selectedIds.includes(n.id)
            );
            if (e.key === "x") {
              const protectedItem = nodes
                .map(node =>
                  isProtected(gameState.fs, gameState.currentPath, node, currentLevel, "cut")
                )
                .find(res => res !== null);
              if (protectedItem) {
                showNotification(`🔒 PROTECTED: ${protectedItem}`, 4000);
                return;
              }
            }
            setGameState(prev => ({
              ...prev,
              clipboard: {
                nodes,
                action: e.key === "x" ? "cut" : "yank",
                originalPath: prev.currentPath,
              },
              selectedIds: [],
              notification:
                getNarrativeAction(e.key) ||
                `${nodes.length} item(s) ${e.key === "x" ? "cut" : "yanked"}`,
            }));
          } else if (currentItem) {
            if (e.key === "x") {
              const protection = isProtected(
                gameState.fs,
                gameState.currentPath,
                currentItem,
                currentLevel,
                "cut"
              );
              if (protection) {
                showNotification(`🔒 PROTECTED: ${protection}`, 4000);
                return;
              }
            }
            setGameState(prev => ({
              ...prev,
              clipboard: {
                nodes: [currentItem],
                action: e.key === "x" ? "cut" : "yank",
                originalPath: prev.currentPath,
              },
              notification:
                getNarrativeAction(e.key) ||
                `"${currentItem.name}" ${e.key === "x" ? "cut" : "yanked"}`,
            }));
          }
          break;
        case "p":
          if (gameState.clipboard) {
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  if (gameState.clipboard.action === "cut") {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.clipboard.originalPath,
                      node.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      if ((deleteResult as { ok: false; error: FsError }).error !== "NotFound") {
                        error = (deleteResult as { ok: false; error: FsError }).error;
                        errorNodeName = node.name;
                        break;
                      }
                    } else {
                      newFs = deleteResult.value;
                    }
                  }

                  const addResult: Result<FileNode, FsError> = addNodeWithConflictResolution(
                    newFs,
                    gameState.currentPath,
                    node
                  );
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;
                }

                if (error) {
                  showNotification(`Paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                  setGameState(prev => ({
                    ...prev,
                    fs: newFs,
                    clipboard: prev.clipboard?.action === "cut" ? null : prev.clipboard,
                    notification:
                      getNarrativeAction("p") || `Deployed ${prev.clipboard?.nodes.length} assets`,
                  }));
                }
              } catch (err) {
                try {
                  reportError(err, { phase: "paste", action: "p" });
                } catch {
                  console.error(err);
                }
                showNotification("Paste failed", 4000);
              }
            }
          }
          break;
        case "P":
          if (e.shiftKey && gameState.clipboard) {
            const currentDir = getNodeByPath(gameState.fs, gameState.currentPath);
            if (currentDir) {
              try {
                let newFs = gameState.fs;
                let error: string | undefined | null = null;
                let errorNodeName: string | null = null;

                for (const node of gameState.clipboard.nodes) {
                  const existingNode = currentDir.children?.find(
                    c => c.name === node.name && c.type === node.type
                  );

                  if (existingNode) {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.currentPath,
                      existingNode.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      error = (deleteResult as { ok: false; error: FsError }).error;
                      errorNodeName = existingNode.name;
                      break;
                    }
                    newFs = deleteResult.value;
                  }

                  const addResult: Result<FileNode, FsError> = addNode(
                    newFs,
                    gameState.currentPath,
                    node
                  );
                  if (!addResult.ok) {
                    error = (addResult as { ok: false; error: FsError }).error;
                    errorNodeName = node.name;
                    break;
                  }
                  newFs = addResult.value;

                  if (gameState.clipboard?.action === "cut") {
                    const deleteResult: Result<FileNode, FsError> = deleteNode(
                      newFs,
                      gameState.clipboard.originalPath,
                      node.id,
                      gameState.levelIndex
                    );
                    if (!deleteResult.ok) {
                      error = (deleteResult as { ok: false; error: FsError }).error;
                      errorNodeName = node.name;
                      break;
                    }
                    newFs = deleteResult.value;
                  }
                }

                if (error) {
                  showNotification(`Force paste failed for "${errorNodeName}": ${error}`, 4000);
                } else {
                  setGameState(prev => ({
                    ...prev,
                    fs: newFs,
                    clipboard: prev.clipboard?.action === "cut" ? null : prev.clipboard,
                    notification: `(FORCED) ${getNarrativeAction("p") || `Deployed ${prev.clipboard?.nodes.length} assets`}`,
                  }));
                }
              } catch (err) {
                try {
                  reportError(err, { phase: "paste", action: "P" });
                } catch {
                  console.error(err);
                }
                showNotification("Force paste failed", 4000);
              }
            }
          }
          break;
        case "f":
          e.preventDefault();
          setGameState(prev => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const existingFilter = currentDir ? prev.filters[currentDir.id] || "" : "";
            showNotification(getNarrativeAction("f") || "Filter activated");
            return { ...prev, mode: "filter", inputBuffer: existingFilter };
          });
          break;
        case "\t":
        case "Tab":
          e.preventDefault();
          setGameState(prev => ({ ...prev, showInfoPanel: !prev.showInfoPanel }));
          break;
        case ".":
          setGameState(prev => {
            const narrative = getNarrativeAction(".");
            const message = prev.showHidden ? `Cloaking Engaged` : `Revealing Hidden Traces`;
            showNotification(narrative || message);
            return { ...prev, showHidden: !prev.showHidden };
          });
          break;
        case ",":
          setGameState(prev => ({ ...prev, mode: "sort" }));
          break;
        case "Z":
          if (e.shiftKey) {
            setGameState(prev => {
              showNotification(getNarrativeAction("Z") || "Zoxide jump");
              return {
                ...prev,
                mode: "zoxide-jump",
                inputBuffer: "",
                fuzzySelectedIndex: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
              };
            });
          }
          break;
        case "z":
          if (!e.shiftKey) {
            setGameState(prev => {
              showNotification(getNarrativeAction("z") || "Zoxide Query");
              return {
                ...prev,
                mode: "z-prompt",
                inputBuffer: "",
                fuzzySelectedIndex: 0,
                usedPreviewDown: false,
                usedPreviewUp: false,
              };
            });
          }
          break;
        case "Escape":
          setGameState(prev => {
            const currentDir = getNodeByPath(prev.fs, prev.currentPath);
            const hasFilter = currentDir && prev.filters[currentDir.id];
            if (hasFilter) {
              const newFilters = { ...prev.filters };
              delete newFilters[currentDir.id];
              showNotification(getNarrativeAction("Escape") || "Scan filter deactivated");
              return { ...prev, filters: newFilters };
            }
            if (prev.selectedIds.length > 0) {
              showNotification(getNarrativeAction("Escape") || "Selection cleared");
              return { ...prev, selectedIds: [] };
            }
            return prev;
          });
          break;
        default:
          break;
      }
      if (e.key === "Y" || e.key === "X") {
        e.preventDefault();
        setGameState(prev => ({ ...prev, clipboard: null }));
        showNotification(getNarrativeAction("Y") || "CLIPBOARD CLEARED", 2000);
      }
    },
    [showNotification]
  );

  return {
    handleSortModeKeyDown,
    handleConfirmDeleteModeKeyDown,
    handleOverwriteConfirmKeyDown,
    handleGCommandKeyDown,
    handleNormalModeKeyDown,
  };
};
