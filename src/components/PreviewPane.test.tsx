import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoizedPreviewPane } from './PreviewPane';
import { LEVELS } from '../constants/levels';
import { createInitialState } from '../hooks/initialState';
import type { FileNode, GameState } from '../types';

describe('MemoizedPreviewPane', () => {
  const baseState = createInitialState();
  const baseLevel = LEVELS[0];
  const textNode: FileNode = {
    id: 'readme',
    name: 'readme.txt',
    type: 'file',
    content: 'Initial file preview content',
  };

  it('skips re-render when untracked gameState fields change and updates for tracked props', () => {
    const toggleDrawer = vi.fn();
    const dispatch = vi.fn();

    const { rerender } = render(
      <MemoizedPreviewPane
        node={textNode}
        level={baseLevel}
        gameState={baseState}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );

    expect(screen.getByText('Initial file preview content')).toBeInTheDocument();

    // Changing only an untracked GameState field (cursorIndex) returns true from arePreviewPanePropsEqual
    rerender(
      <MemoizedPreviewPane
        node={textNode}
        level={baseLevel}
        gameState={{ ...baseState, cursorIndex: 3 }}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );
    expect(screen.getByText('Initial file preview content')).toBeInTheDocument();

    // Changing node to a directory with hidden and visible entries triggers re-render
    const dirNode: FileNode = {
      id: 'dir-preview',
      name: 'sector',
      type: 'dir',
      children: [
        { id: 'f1', name: 'visible.log', type: 'file', content: 'ok' },
        { id: 'f2', name: '.secret', type: 'file', content: 'hidden' },
      ],
    };

    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={baseLevel}
        gameState={baseState}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );
    expect(screen.getByText('visible.log')).toBeInTheDocument();
    expect(screen.queryByText('.secret')).not.toBeInTheDocument();

    // Changing gameState.showHidden reveals dotfiles
    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={baseLevel}
        gameState={{ ...baseState, showHidden: true }}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );
    expect(screen.getByText('.secret')).toBeInTheDocument();

    // Changing gameState.completedTaskIds updates mission progress
    const completedIds = baseLevel.tasks.map((t) => t.id);
    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={baseLevel}
        gameState={{
          ...baseState,
          showHidden: true,
          completedTaskIds: { ...baseState.completedTaskIds, [baseLevel.id]: completedIds },
        }}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );
    expect(screen.queryByText('NEXT')).not.toBeInTheDocument();

    // Changing gameState.currentPath triggers comparator diff
    const nextStatePath: GameState = {
      ...baseState,
      showHidden: true,
      currentPath: ['root', 'home'],
    };
    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={baseLevel}
        gameState={nextStatePath}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );

    // Changing gameState.fs triggers comparator diff
    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={baseLevel}
        gameState={{ ...nextStatePath, fs: { ...baseState.fs } }}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );

    // Changing level updates mission header
    rerender(
      <MemoizedPreviewPane
        node={dirNode}
        level={LEVELS[1]}
        gameState={{ ...nextStatePath, fs: { ...baseState.fs } }}
        previewScroll={0}
        dispatch={dispatch}
        isMissionDrawerOpen={true}
        onToggleMissionDrawer={toggleDrawer}
      />
    );
    expect(screen.getByText(`LVL ${LEVELS[1].id}`)).toBeInTheDocument();

    // Changing previewScroll, dispatch, onToggleMissionDrawer, and isMissionDrawerOpen
    const nextToggle = vi.fn();
    const nextDispatch = vi.fn();
    rerender(
      <MemoizedPreviewPane
        node={textNode}
        level={LEVELS[1]}
        gameState={nextStatePath}
        previewScroll={2}
        dispatch={nextDispatch}
        isMissionDrawerOpen={false}
        onToggleMissionDrawer={nextToggle}
      />
    );

    const expandButton = screen.getByRole('button', { name: /Expand mission drawer/i });
    fireEvent.click(expandButton);
    expect(nextToggle).toHaveBeenCalledTimes(1);
  });
});
