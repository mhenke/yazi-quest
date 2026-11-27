import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LevelProgress } from './LevelProgress';
import { LEVELS } from '../constants/levels';

describe('LevelProgress', () => {
  const noop = () => {};

  it('renders episode progress strip with completed, active, available, and locked states plus thought', () => {
    render(
      <LevelProgress
        levels={LEVELS}
        currentLevelIndex={1}
        unlockedLevelIndex={3}
        thought={{ text: 'Signal trace active' }}
        onToggleHint={noop}
        onToggleHelp={noop}
        onToggleMap={noop}
      />
    );

    expect(screen.getByTestId('level-progress-bar')).toBeInTheDocument();
    expect(screen.getByText(LEVELS[1].title)).toBeInTheDocument();
    expect(screen.getAllByText('Signal trace active').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('returns focus to files on Escape only when Quest Map is closed', () => {
    const onReturnFocusToFiles = vi.fn();

    const { rerender } = render(
      <LevelProgress
        levels={LEVELS}
        currentLevelIndex={0}
        unlockedLevelIndex={0}
        thought={null}
        isMapOpen={false}
        onToggleHint={noop}
        onToggleHelp={noop}
        onToggleMap={noop}
        onReturnFocusToFiles={onReturnFocusToFiles}
      />
    );

    const header = screen.getByTestId('level-progress-bar');
    fireEvent.keyDown(header, { key: 'Escape' });
    expect(onReturnFocusToFiles).toHaveBeenCalledTimes(1);

    rerender(
      <LevelProgress
        levels={LEVELS}
        currentLevelIndex={0}
        unlockedLevelIndex={0}
        thought={null}
        isMapOpen={true}
        onToggleHint={noop}
        onToggleHelp={noop}
        onToggleMap={noop}
        onReturnFocusToFiles={onReturnFocusToFiles}
      />
    );

    fireEvent.keyDown(header, { key: 'Escape' });
    expect(onReturnFocusToFiles).toHaveBeenCalledTimes(1);
  });
});
