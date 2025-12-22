import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  GameState,
  FileNode,
  Level,
  ZoxideEntry,
  calculateFrecency,
  Linemode,
  Result,
} from './types';
import { LEVELS, INITIAL_FS, EPISODE_LORE } from './constants';
import {
  getNodeByPath,
  getParentNode,
  cloneFS,
  resolvePath,
  getRecursiveContent,
  getAllDirectories,
} from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';
import { playSuccessSound, playTaskCompleteSound } from './utils/sounds';
import { useFilesystem } from './hooks/useFilesystem';
import { StatusBar } from './components/StatusBar';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { LevelProgress } from './components/LevelProgress';
import { EpisodeIntro } from './components/EpisodeIntro';
import { OutroSequence } from './components/OutroSequence';
import { GameOverModal } from './components/GameOverModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OverwriteModal } from './components/OverwriteModal';
import { SuccessToast } from './components/SuccessToast';
import { InfoPanel } from './components/InfoPanel';
import { GCommandDialog } from './components/GCommandDialog';
import { FuzzyFinder } from './components/FuzzyFinder';
import { MemoizedFileSystemPane } from './components/FileSystemPane';
import { MemoizedPreviewPane } from './components/PreviewPane';
import { DirectoryHeader } from './components/DirectoryHeader';
import { reportError } from './utils/error';
import { measure } from './utils/perf';

const FileSystemPane = MemoizedFileSystemPane;
const PreviewPane = MemoizedPreviewPane;

// Initial Zoxide Data - Pre-seeding for Episode II flow
const now = Date.now();
const DEFAULT_ZOXIDE: Record<string, ZoxideEntry> = {
  '/home/guest/datastore': { count: 42, lastAccess: now - 3600000 },
  '/home/guest/incoming': { count: 35, lastAccess: now - 1800000 },
  '/home/guest/workspace': { count: 28, lastAccess: now - 7200000 },
  '/home/guest/.config': { count: 30, lastAccess: now - 900000 },
  '/home/guest/.config/vault': { count: 25, lastAccess: now - 800000 },
  '/tmp': { count: 15, lastAccess: now - 1800000 },
  '/etc': { count: 8, lastAccess: now - 86400000 },
};

export default function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  
  const [levelIndex, setLevelIndex] = useState(() => {
    const lvlParam = params.get('lvl') || params.get('level') || params.get('mission');
    const epParam = params.get('ep') || params.get('episode');
    if (lvlParam) {
      const idx = LEVELS.findIndex(l => l.id === parseInt(lvlParam, 10));
      return idx !== -1 ? idx : 0;
    }
    if (epParam) {
      const idx = LEVELS.findIndex(l => l.episodeId === parseInt(epParam, 10));
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  const currentLevel = useMemo(() => LEVELS[levelIndex] || LEVELS[0], [levelIndex]);

  const {
    fs,
    currentPath,
    levelStartFS,
    pathHistoryIndex,
    pathHistoryLength,
    zoxideData,
    navigateTo,
    historyBack,
    historyForward,
    performDelete,
    performPaste,
    performRename,
    performCreate,
    resetToLevel,
    setFs
  } = useFilesystem({
    initialFS: cloneFS(INITIAL_FS),
    initialPath: currentLevel.initialPath || ['root', 'home', 'guest'],
    initialZoxide: DEFAULT_ZOXIDE
  });

  const [uiState, setUiState] = useState({
    cursorIndex: 0,
    clipboard: null as GameState['clipboard'],
    mode: 'normal' as GameState['mode'],
    inputBuffer: '',
    filters: {} as Record<string, string>,
    sortBy: 'natural' as GameState['sortBy'],
    sortDirection: 'asc' as GameState['sortDirection'],
    linemode: 'size' as GameState['linemode'],
    notification: null as string | null,
    selectedIds: [] as string[],
    pendingDeleteIds: [] as string[],
    pendingOverwriteNode: null as FileNode | null,
    showHelp: false,
    showHint: false,
    hintStage: 0,
    showHidden: true,
    showInfoPanel: false,
    showEpisodeIntro: !params.get('intro') && (levelIndex === 0 || (levelIndex > 0 && LEVELS[levelIndex].episodeId !== LEVELS[levelIndex - 1].episodeId)),
    timeLeft: currentLevel.timeLimit || null,
    keystrokes: 0,
    isGameOver: false,
    gameOverReason: undefined as 'time' | 'keystrokes' | undefined,
    stats: { fuzzyJumps: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
    settings: { soundEnabled: true },
    fuzzySelectedIndex: 0,
    usedG: false,
    usedGG: false,
    usedSeek: false,
    findQuery: '',
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const prevAllTasksCompleteRef = useRef(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastLevel = levelIndex >= LEVELS.length;

  // Re-sync gameState object for utilities that expect the full monolithic object
  const gameState: GameState = useMemo(() => ({
    ...uiState,
    fs,
    currentPath,
    levelStartFS,
    levelIndex,
    zoxideData,
    pathHistory: [], // Not fully synced but ok for view helpers
    pathHistoryIndex: 0,
    history: []
  }), [uiState, fs, currentPath, levelStartFS, levelIndex, zoxideData]);

  const visibleItems = useMemo(() => measure('visibleItems', () => getVisibleItems(gameState)), [gameState]);
  const currentItem = visibleItems[uiState.cursorIndex] || null;

  const showNotification = useCallback((message: string, duration: number = 3000) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setUiState(prev => ({ ...prev, notification: message }));
    notificationTimerRef.current = setTimeout(() => {
      setUiState(prev => ({ ...prev, notification: null }));
    }, duration);
  }, []);

  // --- Level Transition Side Effects ---
  useEffect(() => {
    if (isLastLevel || uiState.isGameOver) return;

    let changed = false;
    currentLevel.tasks.forEach((task) => {
      if (!task.completed && task.check(gameState, currentLevel)) {
        task.completed = true;
        changed = true;
        playTaskCompleteSound(uiState.settings.soundEnabled);
      }
    });

    const allComplete = currentLevel.tasks.every((t) => t.completed);
    if (allComplete && !prevAllTasksCompleteRef.current) {
      playSuccessSound(uiState.settings.soundEnabled);
      setShowSuccessToast(true);
    }
    prevAllTasksCompleteRef.current = allComplete;
  }, [gameState, currentLevel, isLastLevel, uiState.isGameOver, uiState.settings.soundEnabled]);

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    if (!currentLevel.timeLimit || isLastLevel || uiState.showEpisodeIntro || uiState.isGameOver) return;
    const timer = setInterval(() => {
      setUiState(prev => {
        if (currentLevel.tasks.every(t => t.completed)) {
          clearInterval(timer);
          return prev;
        }
        if (prev.timeLeft === null || prev.timeLeft <= 0) {
          clearInterval(timer);
          return { ...prev, isGameOver: true, gameOverReason: 'time' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLevel, isLastLevel, uiState.showEpisodeIntro, uiState.isGameOver]);

  const advanceLevel = useCallback(() => {
    const nextIdx = levelIndex + 1;
    if (nextIdx >= LEVELS.length) {
      setLevelIndex(nextIdx);
      return;
    }

    const nextLevel = LEVELS[nextIdx];
    const isNewEp = nextLevel.episodeId !== currentLevel.episodeId;

    let nextFs = cloneFS(fs);

    if (nextLevel.onEnter) {
      try {
        nextFs = nextLevel.onEnter(nextFs);
      } catch (err) {
        reportError(err, { phase: 'nextLevel.onEnter', level: nextLevel.id });
      }
    }

    const targetPath = isNewEp ? nextLevel.initialPath || currentPath : currentPath;
    resetToLevel(nextFs, targetPath);
    
    setLevelIndex(nextIdx);
    setUiState(prev => ({
      ...prev,
      cursorIndex: 0,
      filters: {},
      clipboard: null,
      selectedIds: [],
      showHint: false,
      hintStage: 0,
      showEpisodeIntro: isNewEp,
      timeLeft: nextLevel.timeLimit || null,
      keystrokes: 0,
      usedG: false,
      usedGG: false,
      findQuery: '',
      notification: null
    }));
    setShowSuccessToast(false);
  }, [levelIndex, currentLevel, fs, currentPath, resetToLevel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (uiState.showEpisodeIntro || isLastLevel || uiState.isGameOver) return;

    if (['input-file', 'filter', 'rename'].includes(uiState.mode)) return;
    
    // Keystroke Tracking
    setUiState(prev => {
      const isCosmetic = ['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm'].includes(e.key);
      const nextKeys = isCosmetic ? prev.keystrokes : prev.keystrokes + 1;
      if (currentLevel.maxKeystrokes && nextKeys > currentLevel.maxKeystrokes) {
        return { ...prev, keystrokes: nextKeys, isGameOver: true, gameOverReason: 'keystrokes' };
      }
      return { ...prev, keystrokes: nextKeys };
    });

    if (uiState.showHelp || uiState.showHint || uiState.showInfoPanel) {
      if (e.key === 'Escape' || e.key === 'Tab') {
        setUiState(prev => ({ ...prev, showHelp: false, showHint: false, showInfoPanel: false }));
      }
      return;
    }

    if (uiState.mode === 'normal') {
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          setUiState(prev => ({ ...prev, cursorIndex: Math.min(visibleItems.length - 1, prev.cursorIndex + 1) }));
          break;
        case 'k':
        case 'ArrowUp':
          setUiState(prev => ({ ...prev, cursorIndex: Math.max(0, prev.cursorIndex - 1) }));
          break;
        case 'H': historyBack(); break;
        case 'L': historyForward(); break;
        case 'h': 
          const parent = getParentNode(fs, currentPath);
          if (parent) navigateTo(currentPath.slice(0, -1));
          break;
        case 'l':
        case 'Enter':
          if (currentItem?.type === 'dir' || currentItem?.type === 'archive') {
            navigateTo([...currentPath, currentItem.id]);
          }
          break;
        case 'g': setUiState(prev => ({ ...prev, mode: 'g-command' })); break;
        case 'G': setUiState(prev => ({ ...prev, cursorIndex: visibleItems.length - 1, usedG: true })); break;
        case 'd':
          if (uiState.selectedIds.length > 0 || currentItem) {
            setUiState(prev => ({
              ...prev,
              mode: 'confirm-delete',
              pendingDeleteIds: prev.selectedIds.length > 0 ? prev.selectedIds : [currentItem!.id],
            }));
          }
          break;
        case 'x':
        case 'y':
          const targets = uiState.selectedIds.length > 0 
            ? visibleItems.filter(i => uiState.selectedIds.includes(i.id))
            : [currentItem].filter(Boolean) as FileNode[];
          if (targets.length) {
            setUiState(prev => ({
              ...prev,
              clipboard: { nodes: targets, action: e.key === 'x' ? 'cut' : 'yank', originalPath: currentPath },
              selectedIds: [],
              notification: `${targets.length} asset(s) ${e.key === 'x' ? 'cut' : 'yanked'}`
            }));
          }
          break;
        case 'p': {
          const pasteResult = performPaste(uiState.clipboard, levelIndex);
          // Fix: Explicit narrowing for Result type to resolve Property 'error' access
          if (pasteResult.ok === false) {
            showNotification(pasteResult.error, 4000);
          } else {
            const count = pasteResult.value;
            setUiState(prev => ({ 
              ...prev, 
              clipboard: prev.clipboard?.action === 'cut' ? null : prev.clipboard,
              notification: `Deployed ${count} assets` 
            }));
          }
          break;
        }
        case 'f':
          setUiState(prev => ({ ...prev, mode: 'filter', inputBuffer: uiState.filters[getNodeByPath(fs, currentPath)?.id || ''] || '' }));
          break;
        case 'r':
          if (currentItem) setUiState(prev => ({ ...prev, mode: 'rename', inputBuffer: currentItem.name }));
          break;
        case 'Space':
          if (currentItem) {
            setUiState(prev => ({
              ...prev,
              selectedIds: prev.selectedIds.includes(currentItem.id) 
                ? prev.selectedIds.filter(id => id !== currentItem.id)
                : [...prev.selectedIds, currentItem.id],
              cursorIndex: Math.min(visibleItems.length - 1, prev.cursorIndex + 1)
            }));
          }
          break;
        case 'Escape':
          setUiState(prev => {
            const dirId = getNodeByPath(fs, currentPath)?.id;
            if (dirId && prev.filters[dirId]) {
              const nextFilters = { ...prev.filters };
              delete nextFilters[dirId];
              return { ...prev, filters: nextFilters };
            }
            return { ...prev, selectedIds: [] };
          });
          break;
        case 'Tab': setUiState(prev => ({ ...prev, showInfoPanel: true })); break;
        case '.': setUiState(prev => ({ ...prev, showHidden: !prev.showHidden })); break;
        case ',': setUiState(prev => ({ ...prev, mode: 'sort' })); break;
        case '?': setUiState(prev => ({ ...prev, showHelp: true })); break;
      }
    } else if (uiState.mode === 'confirm-delete') {
      if (e.key === 'y' || e.key === 'Enter') {
        const delResult = performDelete(uiState.pendingDeleteIds, levelIndex);
        // Fix: Use explicit narrowing to avoid Property 'error' does not exist error
        if (delResult.ok === false) {
          showNotification(delResult.error, 4000);
          setUiState(prev => ({ ...prev, mode: 'normal' }));
        } else {
          setUiState(prev => ({ ...prev, mode: 'normal', selectedIds: [], pendingDeleteIds: [], notification: 'TARGETS ELIMINATED' }));
        }
      } else if (e.key === 'n' || e.key === 'Escape') {
        setUiState(prev => ({ ...prev, mode: 'normal' }));
      }
    } else if (uiState.mode === 'g-command') {
      if (e.key === 'g') {
        setUiState(prev => ({ ...prev, cursorIndex: 0, mode: 'normal', usedGG: true }));
      } else if (e.key === 'h') {
        navigateTo(['root', 'home', 'guest']);
        setUiState(prev => ({ ...prev, mode: 'normal' }));
      } else {
        setUiState(prev => ({ ...prev, mode: 'normal' }));
      }
    }
  }, [uiState, visibleItems, currentItem, fs, currentPath, levelIndex, navigateTo, historyBack, historyForward, performDelete, performPaste, showNotification]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLastLevel) return <OutroSequence />;

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {uiState.showEpisodeIntro && (
        <EpisodeIntro
          episode={EPISODE_LORE.find((e) => e.id === currentLevel.episodeId)!}
          onComplete={() => setUiState((prev) => ({ ...prev, showEpisodeIntro: false }))}
        />
      )}

      {uiState.isGameOver && (
        <GameOverModal
          reason={uiState.gameOverReason!}
          onRestart={() => window.location.reload()}
          efficiencyTip={currentLevel.efficiencyTip}
        />
      )}

      {uiState.showHelp && (
        <HelpModal onClose={() => setUiState((prev) => ({ ...prev, showHelp: false }))} />
      )}
      {uiState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={uiState.hintStage}
          onClose={() => setUiState((prev) => ({ ...prev, showHint: false, hintStage: 0 }))}
        />
      )}
      {uiState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => setUiState((prev) => ({ ...prev, showInfoPanel: false }))}
        />
      )}
      {uiState.mode === 'confirm-delete' && (
        <ConfirmationModal
          title="Confirm Delete"
          detail={`Permanently delete ${uiState.selectedIds.length > 0 ? uiState.selectedIds.length + ' items' : currentItem?.name}?`}
        />
      )}
      {showSuccessToast && (
        <SuccessToast
          message={currentLevel.successMessage || 'Sector Cleared'}
          levelTitle={currentLevel.title}
          onDismiss={advanceLevel}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      {uiState.mode === 'overwrite-confirm' && uiState.pendingOverwriteNode && (
        <OverwriteModal fileName={uiState.pendingOverwriteNode.name} />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        <LevelProgress
          levels={LEVELS}
          currentLevelIndex={levelIndex}
          onToggleHint={() => setUiState((prev) => ({ ...prev, showHint: !prev.showHint }))}
          onToggleHelp={() => setUiState((prev) => ({ ...prev, showHelp: !prev.showHelp }))}
          onJumpToLevel={(idx) => {
            const target = LEVELS[idx];
            let nextFs = cloneFS(fs);
            if (target.onEnter) {
              try {
                nextFs = target.onEnter(nextFs);
              } catch (err) {
                reportError(err, { phase: 'jump.onEnter', level: target.id });
              }
            }
            resetToLevel(nextFs, target.initialPath || ['root', 'home', 'guest']);
            setLevelIndex(idx);
            setUiState(prev => ({ 
              ...prev, 
              showEpisodeIntro: false,
              notification: null
            }));
          }}
        />

        <DirectoryHeader state={gameState} />

        <div className="flex-1 flex min-h-0 relative">
          <MemoizedFileSystemPane
            items={getParentNode(fs, currentPath)?.children || []}
            isActive={false}
            isParent={true}
            selectedIds={[]}
            clipboard={null}
            linemode={uiState.linemode}
            className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
          />

          <div className="flex-1 flex flex-col relative min-w-0">
            {uiState.mode === 'filter' && (
              <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Filter:</span>
                  <input
                    type="text"
                    value={uiState.inputBuffer}
                    onChange={(e) => {
                      const val = e.target.value;
                      const dirId = getNodeByPath(fs, currentPath)?.id;
                      if (dirId) {
                        setUiState(prev => ({
                          ...prev,
                          inputBuffer: val,
                          filters: { ...prev.filters, [dirId]: val },
                          cursorIndex: 0
                        }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setUiState(prev => ({ ...prev, mode: 'normal' }));
                      e.stopPropagation();
                    }}
                    className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {uiState.mode === 'rename' && (
              <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Rename:</span>
                  <input
                    type="text"
                    value={uiState.inputBuffer}
                    onChange={(e) => setUiState(prev => ({ ...prev, inputBuffer: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const result = performRename(currentItem!.id, uiState.inputBuffer, levelIndex);
                        // Fix: Explicitly narrow result to handle Property 'error' access error
                        if (result.ok === false) {
                          showNotification(result.error, 4000);
                        } else {
                          setUiState(prev => ({ ...prev, mode: 'normal' }));
                        }
                      }
                      if (e.key === 'Escape') setUiState(prev => ({ ...prev, mode: 'normal' }));
                      e.stopPropagation();
                    }}
                    className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-green-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {uiState.mode === 'input-file' && (
              <div className="absolute bottom-6 left-4 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Create:</span>
                  <input
                    type="text"
                    value={uiState.inputBuffer}
                    onChange={(e) => setUiState(prev => ({ ...prev, inputBuffer: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const res = performCreate(uiState.inputBuffer);
                        if (res.collision) setUiState(prev => ({ ...prev, mode: 'overwrite-confirm', pendingOverwriteNode: res.collisionNode! }));
                        else if (res.error) showNotification(res.error, 4000);
                        else setUiState(prev => ({ ...prev, mode: 'normal', inputBuffer: '' }));
                      }
                      if (e.key === 'Escape') setUiState(prev => ({ ...prev, mode: 'normal' }));
                      e.stopPropagation();
                    }}
                    className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <FileSystemPane
              items={visibleItems}
              isActive={true}
              cursorIndex={uiState.cursorIndex}
              selectedIds={uiState.selectedIds}
              clipboard={uiState.clipboard}
              linemode={uiState.linemode}
            />
          </div>

          <PreviewPane
            node={visibleItems[uiState.cursorIndex]}
            level={{ ...currentLevel, tasks: [...currentLevel.tasks] }}
          />
        </div>

        <StatusBar
          state={gameState}
          level={currentLevel}
          allTasksComplete={currentLevel.tasks.every((t) => t.completed)}
          onNextLevel={advanceLevel}
          currentItem={currentItem}
        />
      </div>

      {uiState.mode === 'g-command' && <GCommandDialog onClose={() => setUiState(p => ({ ...p, mode: 'normal' }))} />}
    </div>
  );
}
