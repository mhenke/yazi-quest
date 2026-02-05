import React, { useMemo } from 'react';
import { GameState, FileNode, Level, Episode } from '../../../types';
import { Action } from '../../../hooks/gameReducer';
import { EpisodeIntro } from '../../../components/EpisodeIntro';
import { OutroSequence } from '../../../components/OutroSequence';
import { BiosBoot } from '../../../components/BiosBoot';
import { LevelProgress } from '../../../components/LevelProgress';
import { MemoizedFileSystemPane as FileSystemPane } from '../../../components/FileSystemPane';
import { MemoizedPreviewPane as PreviewPane } from '../../../components/PreviewPane';
import { FuzzyFinder } from '../../../components/FuzzyFinder';
import StatusBar from '../../../components/StatusBar';
import { InputModal } from '../../../components/InputModal';
import { GCommandDialog } from '../../../components/GCommandDialog';
import { GameModals } from './GameModals';
import { getParentNode, resolvePath, getNodeByPath } from '../../../utils/fsHelpers';
import { sortNodes } from '../../../utils/sortHelpers';
import { checkAllTasksComplete } from '../../../utils/gameUtils';
import { EPISODE_LORE, ECHO_EPISODE_1_LORE } from '../../../data/lore';
import { LEVELS } from '../../../data/levels';

interface GameLayoutProps {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
  currentLevel: Level;
  visibleItems: FileNode[];
  currentItem: FileNode | null;
  parent: FileNode | null;
  isLastLevel: boolean;
  handlers: {
    handleInputConfirm: () => void;
    handleSearchConfirm: () => void;
    handleRenameConfirm: () => void;
    handleFuzzySelect: (path: string, isZoxide: boolean, pathIds?: string[]) => void;
    handleRestartLevel: () => void;
    handleRestartCycle: () => void;
    handleBootComplete: () => void;
    advanceLevel: () => void;
    confirmDelete: (visibleItems: FileNode[], level: Level, state: GameState) => void;
    cancelDelete: () => void;
    handleJumpToLevel: (levelIndex: number) => void;
  };
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  gameState,
  dispatch,
  currentLevel,
  visibleItems,
  currentItem,
  isLastLevel,
  handlers,
}) => {
  const {
    handleInputConfirm,
    handleSearchConfirm,
    handleRenameConfirm,
    handleFuzzySelect,
    handleRestartLevel,
    handleRestartCycle,
    handleBootComplete,
    advanceLevel,
    confirmDelete,
    cancelDelete,
    handleJumpToLevel,
  } = handlers;

  if (gameState.isBooting) {
    return <BiosBoot onComplete={handleBootComplete} cycleCount={gameState.cycleCount || 1} />;
  }

  if (isLastLevel) {
    return <OutroSequence onRestartCycle={handleRestartCycle} />;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {gameState.showEpisodeIntro && !gameState.ignoreEpisodeIntro && (
        <EpisodeIntro
          episode={(() => {
            const baseEpisode = EPISODE_LORE.find((e) => e.id === currentLevel.episodeId)!;
            if ((gameState.cycleCount || 1) > 1 && baseEpisode.id === 1) {
              return { ...baseEpisode, lore: ECHO_EPISODE_1_LORE };
            }
            return baseEpisode;
          })()}
          onComplete={() => {
            if (currentLevel.episodeId === 1) {
              dispatch({ type: 'UPDATE_UI_STATE', updates: { isBooting: true } });
            }
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                showEpisodeIntro: false,
                currentPath: [...currentLevel.initialPath],
                cursorIndex: 0,
              },
            });
          }}
        />
      )}

      <GameModals
        gameState={gameState}
        dispatch={dispatch}
        currentLevel={currentLevel}
        currentItem={currentItem}
        confirmDelete={confirmDelete}
        cancelDelete={cancelDelete}
        advanceLevel={advanceLevel}
        handleRestartLevel={handleRestartLevel}
      />

      <div className="flex flex-col flex-1 h-full min-w-0">
        {!gameState.showEpisodeIntro && (
          <LevelProgress
            levels={LEVELS}
            currentLevelIndex={gameState.levelIndex}
            notification={null}
            thought={gameState.thought}
            onToggleHint={() =>
              dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: !gameState.showHint } })
            }
            onToggleHelp={() =>
              dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: !gameState.showHelp } })
            }
            isOpen={gameState.showMap}
            onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: false } })}
            onToggleMap={() =>
              dispatch({ type: 'UPDATE_UI_STATE', updates: { showMap: !gameState.showMap } })
            }
            onJumpToLevel={handleJumpToLevel}
            activeTab={gameState.questMapTab}
            selectedMissionIdx={gameState.questMapMissionIdx}
          />
        )}

        {!gameState.showEpisodeIntro && (
          <header
            className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 transition-opacity duration-200 breadcrumb"
            style={{
              opacity:
                gameState.mode === 'zoxide-jump' ||
                gameState.mode === 'fzf-current' ||
                gameState.mode === 'z-prompt'
                  ? 0.3
                  : 1,
            }}
          >
            <div className="font-mono text-sm text-zinc-400" data-testid="breadcrumbs">
              {resolvePath(gameState.fs, gameState.currentPath).replace('/home/guest', '~')}
              {(() => {
                if (gameState.searchQuery) {
                  return <span className="text-green-400"> (search: {gameState.searchQuery})</span>;
                }
                const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                const filter = dir ? gameState.filters[dir.id] : null;
                return filter ? <span className="text-cyan-400"> (filter: {filter})</span> : null;
              })()}
            </div>
          </header>
        )}

        <div className="flex flex-1 min-h-0 relative">
          {gameState.mode === 'search' && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-4 pointer-events-none">
              <div className="pointer-events-auto bg-zinc-900/95 border border-blue-500/50 shadow-2xl shadow-blue-500/20 p-4 min-w-[400px] backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-mono mb-2">Search via fd:</div>
                <input
                  type="text"
                  value={gameState.inputBuffer}
                  onChange={(e) => {
                    const val = e.target.value;
                    dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchConfirm();
                      e.stopPropagation();
                    } else if (e.key === 'Escape') {
                      dispatch({
                        type: 'UPDATE_UI_STATE',
                        updates: { mode: 'normal', inputBuffer: '' },
                      });
                      e.stopPropagation();
                    }
                  }}
                  className="w-full bg-zinc-800 text-white font-mono text-sm px-3 py-2 border border-zinc-600 outline-none focus:border-blue-400"
                  autoFocus
                  onBlur={(e) => e.target.focus()}
                  data-testid="search-input"
                />
              </div>
            </div>
          )}

          <FileSystemPane
            items={(() => {
              const parent = getParentNode(gameState.fs, gameState.currentPath);
              let items =
                parent && parent.children ? sortNodes(parent.children, 'natural', 'asc') : [];
              if (!gameState.showHidden) {
                items = items.filter((c) => !c.name.startsWith('.'));
              }
              return items;
            })()}
            isActive={false}
            isParent={true}
            selectedIds={[]}
            clipboard={null}
            linemode={gameState.linemode}
            className="hidden lg:flex w-64 border-r border-zinc-800 bg-zinc-950/50"
          />

          <div className="flex-1 flex flex-col relative min-w-0">
            <FileSystemPane
              key={`fs-pane-main-${gameState.currentPath.join('/')}`}
              items={visibleItems}
              isActive={
                !['search', 'zoxide-jump', 'fzf-current', 'z-prompt'].includes(gameState.mode)
              }
              cursorIndex={gameState.cursorIndex}
              isParent={false}
              selectedIds={gameState.selectedIds}
              clipboard={gameState.clipboard}
              linemode={gameState.linemode}
              className="flex-1"
            />

            {gameState.mode === 'sort' && (
              <div className="absolute bottom-6 right-0 m-2 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Sort Options
                  </span>
                  <span className="text-xs font-mono text-zinc-600">Which-Key</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">n</span>{' '}
                    <span className="text-zinc-400">Natural</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">N</span>{' '}
                    <span className="text-zinc-400">Natural (rev)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">a</span>{' '}
                    <span className="text-zinc-400">A-Z</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">A</span>{' '}
                    <span className="text-zinc-400">Z-A</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">m</span>{' '}
                    <span className="text-zinc-400">Modified (new)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">M</span>{' '}
                    <span className="text-zinc-400">Modified (old)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">s</span>{' '}
                    <span className="text-zinc-400">Size (large)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">S</span>{' '}
                    <span className="text-zinc-400">Size (small)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">e</span>{' '}
                    <span className="text-zinc-400">Extension</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">E</span>{' '}
                    <span className="text-zinc-400">Extension (rev)</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-800 my-1"></div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">l</span>{' '}
                    <span className="text-zinc-400">Cycle Linemode</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold">-</span>{' '}
                    <span className="text-zinc-400">Clear Linemode</span>
                  </div>
                </div>
              </div>
            )}

            {gameState.mode === 'g-command' && (
              <GCommandDialog
                onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
              />
            )}

            {gameState.mode === 'input-file' && (
              <InputModal
                label="Create"
                value={gameState.inputBuffer}
                onChange={(val) =>
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } })
                }
                onConfirm={handleInputConfirm}
                onCancel={() =>
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', inputBuffer: '' },
                  })
                }
                borderColorClass="border-green-500"
                testid="create-input"
              />
            )}

            {gameState.mode === 'filter' && (
              <InputModal
                label="Filter"
                value={gameState.inputBuffer}
                onChange={(val) => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  if (dir) {
                    dispatch({ type: 'SET_FILTER', dirId: dir.id, filter: val });
                  }
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } });
                }}
                onConfirm={() => {
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                      mode: 'normal',
                      inputBuffer: '',
                      stats: { ...gameState.stats, filterUsage: gameState.stats.filterUsage + 1 },
                    },
                  });
                }}
                onCancel={() => {
                  const dir = getNodeByPath(gameState.fs, gameState.currentPath);
                  if (dir) {
                    dispatch({ type: 'CLEAR_FILTER', dirId: dir.id });
                  }
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: {
                      mode: 'normal',
                      inputBuffer: '',
                      stats: {
                        ...gameState.stats,
                        filterUsage: gameState.stats.filterUsage + 1,
                      },
                    },
                  });
                }}
                borderColorClass="border-orange-500"
                testid="filter-input"
              />
            )}

            {gameState.mode === 'rename' && (
              <InputModal
                label="Rename"
                value={gameState.inputBuffer}
                onChange={(val) =>
                  dispatch({ type: 'UPDATE_UI_STATE', updates: { inputBuffer: val } })
                }
                onConfirm={handleRenameConfirm}
                onCancel={() =>
                  dispatch({
                    type: 'UPDATE_UI_STATE',
                    updates: { mode: 'normal', inputBuffer: '' },
                  })
                }
                borderColorClass="border-cyan-500"
                testid="rename-input"
              />
            )}

            {(gameState.mode === 'zoxide-jump' || gameState.mode === 'fzf-current') && (
              <FuzzyFinder
                gameState={gameState}
                onSelect={handleFuzzySelect}
                onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
              />
            )}
          </div>

          <PreviewPane
            node={currentItem}
            level={currentLevel}
            gameState={gameState}
            previewScroll={gameState.previewScroll}
            dispatch={dispatch}
          />
        </div>

        {!gameState.showEpisodeIntro && (
          <StatusBar
            state={gameState}
            level={currentLevel}
            allTasksComplete={
              checkAllTasksComplete(gameState, currentLevel) && !gameState.showHidden
            }
            onNextLevel={advanceLevel}
            currentItem={currentItem}
          />
        )}
      </div>
    </div>
  );
};
