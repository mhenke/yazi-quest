import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBar } from '../../components/StatusBar';

const makeState = (overrides = {}) =>
  ({
    currentPath: ['root', 'home', 'guest'],
    cursorIndex: 0,
    clipboard: null,
    mode: 'normal',
    inputBuffer: '',
    filters: {},
    sortBy: 'natural',
    sortDirection: 'asc',
    linemode: 'size',
    history: [],
    historyIndex: -1,
    zoxideData: {},
    levelIndex: 0,
    fs: {} as any,
    levelStartFS: {} as any,
    notification: null,
    selectedIds: [],
    pendingDeleteIds: [],
    pendingOverwriteNode: null,
    showHelp: false,
    showHint: false,
    hintStage: 0,
    showHidden: false,
    showInfoPanel: false,
    showEpisodeIntro: false,
    timeLeft: null,
    keystrokes: 0,
    isGameOver: false,
    gameOverReason: undefined,
    stats: { fuzzyJumps: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
    settings: { soundEnabled: true },
    fuzzySelectedIndex: 0,
    usedG: false,
    usedGG: false,
    usedPreviewScroll: false,
    usedHistory: false,
    ...overrides,
  }) as any;

const makeLevel = (overrides = {}) =>
  ({
    id: 1,
    title: 'Test Level',
    episodeId: 1,
    tasks: [{ id: 't1', completed: true }],
    ...overrides,
  }) as any;

describe('StatusBar showHidden gating', () => {
  it('prevents onNextLevel when showHidden is true', () => {
    const state = makeState({ showHidden: true });
    const level = makeLevel();
    const onNext = vi.fn();
    const { getAllByText } = render(
      <StatusBar
        state={state}
        level={level}
        allTasksComplete={true}
        onNextLevel={onNext}
        currentItem={null}
      />
    );
    const btnSpan = getAllByText('NEXT')[0];
    const btn = btnSpan.closest('button')!;
    fireEvent.click(btn);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('calls onNextLevel when showHidden is false', () => {
    const state = makeState({ showHidden: false });
    const level = makeLevel();
    const onNext = vi.fn();
    const { getAllByText } = render(
      <StatusBar
        state={state}
        level={level}
        allTasksComplete={true}
        onNextLevel={onNext}
        currentItem={null}
      />
    );
    const btnSpan = getAllByText('NEXT')[0];
    const btn = btnSpan.closest('button')!;
    fireEvent.click(btn);
    expect(onNext).toHaveBeenCalled();
  });
});
