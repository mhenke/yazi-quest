import React from 'react';
import { HelpModal } from '../../../components/HelpModal';
import { HintModal } from '../../../components/HintModal';
import { InfoPanel } from '../../../components/InfoPanel';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { OverwriteModal } from '../../../components/OverwriteModal';
import { SuccessToast } from '../../../components/SuccessToast';
import { ThreatAlert } from '../../../components/ThreatAlert';
import { HiddenFilesWarningModal } from '../../../components/HiddenFilesWarningModal';
import { SortWarningModal } from '../../../components/SortWarningModal';
import { FilterWarningModal } from '../../../components/FilterWarningModal';
import { SearchWarningModal } from '../../../components/SearchWarningModal';
import { GameOverModal } from '../../../components/GameOverModal';
import { GameState, FileNode, Level } from '../../../types';
import { Action } from '../../../hooks/gameReducer'; // Adjust imports
import { getVisibleItems } from '../../../utils/viewHelpers';
import { resolvePath } from '../../../utils/fsHelpers';
import { checkAllTasksComplete } from '../../../utils/gameUtils';

interface GameModalsProps {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
  currentLevel: Level;
  currentItem: FileNode | null;
  confirmDelete: (visibleItems: FileNode[], level: Level, state: GameState) => void;
  cancelDelete: () => void;
  advanceLevel: () => void;
  handleRestartLevel: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  gameState,
  dispatch,
  currentLevel,
  currentItem,
  confirmDelete,
  cancelDelete,
  advanceLevel,
  handleRestartLevel,
}) => {
  return (
    <>
      {gameState.isGameOver && (
        <GameOverModal
          reason={gameState.gameOverReason!}
          onRestart={handleRestartLevel}
          efficiencyTip={currentLevel.efficiencyTip}
          level={currentLevel}
        />
      )}

      {gameState.showHelp && (
        <HelpModal
          onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showHelp: false } })}
          scrollPosition={gameState.helpScrollPosition || 0}
        />
      )}

      {gameState.showHint && (
        <HintModal
          hint={currentLevel.hint}
          stage={gameState.hintStage}
          onClose={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHint: false, hintStage: 0 } })
          }
        />
      )}

      {gameState.showInfoPanel && (
        <InfoPanel
          file={currentItem}
          onClose={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { showInfoPanel: false } })}
        />
      )}

      {gameState.mode === 'confirm-delete' && (
        <ConfirmationModal
          deleteType={gameState.deleteType}
          itemsToDelete={gameState.pendingDeleteIds.map((id) => {
            const node = getVisibleItems(gameState).find((item) => item.id === id);
            const currentDir = resolvePath(gameState.fs, gameState.currentPath);
            const displayPath = node ? `${currentDir === '/' ? '' : currentDir}/${node.name}` : id;
            return displayPath;
          })}
          onConfirm={() => confirmDelete(getVisibleItems(gameState), currentLevel, gameState)}
          onCancel={() => cancelDelete()}
        />
      )}

      {gameState.showSuccessToast && (
        <SuccessToast
          message={currentLevel.successMessage || 'Sector Cleared'}
          levelTitle={currentLevel.title}
          onDismiss={advanceLevel}
        />
      )}

      {gameState.showHiddenWarning && (
        <HiddenFilesWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showHiddenWarning: false } })
          }
        />
      )}
      {gameState.showSortWarning && (
        <SortWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showSortWarning: false } })
          }
        />
      )}
      {gameState.mode === 'filter-warning' && (
        <FilterWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
        />
      )}
      {gameState.mode === 'search-warning' && (
        <SearchWarningModal
          allowAutoFix={checkAllTasksComplete(gameState, currentLevel)}
          onDismiss={() => dispatch({ type: 'UPDATE_UI_STATE', updates: { mode: 'normal' } })}
        />
      )}

      {gameState.mode === 'overwrite-confirm' && gameState.pendingOverwriteNode && (
        <OverwriteModal fileName={gameState.pendingOverwriteNode.name} />
      )}

      {gameState.showThreatAlert && (
        <ThreatAlert
          message={gameState.alertMessage || ''}
          onDismiss={() =>
            dispatch({ type: 'UPDATE_UI_STATE', updates: { showThreatAlert: false } })
          }
        />
      )}
    </>
  );
};
