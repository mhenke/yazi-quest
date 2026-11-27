import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ViewportGate } from './ViewportGate';

describe('ViewportGate', () => {
  it('renders children inside an inert-aware container when viewport meets floor', () => {
    const { rerender } = render(
      <ViewportGate atFloor={true} showEpisodeIntro={false} isGameOver={false} touchOnly={false}>
        <div>Game Content</div>
      </ViewportGate>
    );

    const content = screen.getByText('Game Content');
    expect(content).toBeInTheDocument();
    expect(content.parentElement).not.toHaveAttribute('inert');

    rerender(
      <ViewportGate atFloor={true} showEpisodeIntro={true} isGameOver={false} touchOnly={false}>
        <div>Game Content</div>
      </ViewportGate>
    );
    expect(screen.getByText('Game Content').parentElement).toHaveAttribute('inert');
  });

  it('suppresses notice during episode intro and shows keyboard or width notice otherwise', () => {
    const { rerender, container } = render(
      <ViewportGate atFloor={false} showEpisodeIntro={true} isGameOver={false} touchOnly={false}>
        <div>Game Content</div>
      </ViewportGate>
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <ViewportGate atFloor={false} showEpisodeIntro={false} isGameOver={false} touchOnly={true}>
        <div>Game Content</div>
      </ViewportGate>
    );
    expect(screen.getByText('Yazi Quest needs a keyboard with Ctrl and Alt')).toBeInTheDocument();

    rerender(
      <ViewportGate atFloor={false} showEpisodeIntro={false} isGameOver={false} touchOnly={false}>
        <div>Game Content</div>
      </ViewportGate>
    );
    expect(screen.getByText('The file manager needs 1024 px')).toBeInTheDocument();
  });
});
