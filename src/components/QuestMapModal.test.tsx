import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QuestMapModal } from './QuestMapModal';
import { LEVELS } from '../constants/levels';
import { buildEpisodes } from '../utils/episodes';

describe('QuestMapModal', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('supports jumping to unlocked levels, resetting cycle, closing on backdrop, and navigating episode tabs', () => {
    const episodes = buildEpisodes(LEVELS);
    const onJumpToLevel = vi.fn();
    const onResetCycle = vi.fn();
    const onSelectEpisode = vi.fn();
    const onClose = vi.fn();

    render(
      <QuestMapModal
        levels={LEVELS}
        episodes={episodes}
        activeTab={0}
        selectedMissionIdx={1}
        currentLevelIndex={1}
        unlockedLevelIndex={3}
        onClose={onClose}
        onSelectEpisode={onSelectEpisode}
        onJumpToLevel={onJumpToLevel}
        onResetCycle={onResetCycle}
      />
    );

    const activeRow = screen.getByText(LEVELS[1].title).closest('button')!;
    expect(activeRow).toHaveAttribute('aria-current', 'step');

    const lockedRow = screen.getByText(LEVELS[4].title).closest('button')!;
    expect(lockedRow).toBeDisabled();

    const availableRow = screen.getByText(LEVELS[3].title).closest('button')!;
    expect(availableRow).toBeEnabled();
    fireEvent.click(availableRow);
    expect(onJumpToLevel).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Restart current cycle' }));
    expect(onResetCycle).toHaveBeenCalledTimes(1);

    const tabs = screen.getAllByTestId('episode-tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(onSelectEpisode).toHaveBeenCalledWith(1);

    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(onSelectEpisode).toHaveBeenCalledWith(tabs.length - 1);

    fireEvent.keyDown(tabs[1], { key: 'Home' });
    expect(onSelectEpisode).toHaveBeenCalledWith(0);

    fireEvent.keyDown(tabs[0], { key: 'End' });
    expect(onSelectEpisode).toHaveBeenCalledWith(tabs.length - 1);

    fireEvent.click(screen.getByTestId('quest-map-modal'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
