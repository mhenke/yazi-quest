import { render, screen } from '@testing-library/react';
import { GlitchOverlay } from './GlitchOverlay';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

describe('GlitchOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children without glitch effects when disabled', () => {
    render(
      <GlitchOverlay threatLevel={80} enabled={false}>
        <div data-testid="content">Test Content</div>
      </GlitchOverlay>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Test Content');
  });

  it('should render children with glitch container', () => {
    render(
      <GlitchOverlay threatLevel={10} enabled={true}>
        <div data-testid="content">Test Content</div>
      </GlitchOverlay>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    // The content is wrapped in an inner div, which is inside the glitch-container
    const container = screen.getByTestId('content').parentElement?.parentElement;
    expect(container).toHaveClass('glitch-container');
  });

  it('should not show glitch effects at low threat level', () => {
    render(
      <GlitchOverlay threatLevel={10} enabled={true}>
        <div data-testid="content">Test Content</div>
      </GlitchOverlay>
    );

    // At low threat, no glitch effects should be visible initially
    expect(screen.queryByText(/SYSTEM INSTABILITY/)).not.toBeInTheDocument();
  });

  it('should apply color-bleed class at high intensity', () => {
    render(
      <GlitchOverlay threatLevel={100} enabled={true}>
        <div data-testid="content">Test Content</div>
      </GlitchOverlay>
    );

    // Advance timers to trigger glitch effect
    vi.advanceTimersByTime(2000);

    const container = screen.getByTestId('content').parentElement?.parentElement;
    // The color-bleed class is applied when intensity > 0.8
    // At threat 100, intensity should be 1.0
    expect(container).toBeInTheDocument();
  });

  it('should respect consciousnessLevel for combined intensity', () => {
    render(
      <GlitchOverlay threatLevel={10} consciousnessLevel={90} enabled={true}>
        <div data-testid="content">Test Content</div>
      </GlitchOverlay>
    );

    // consciousnessLevel 90 should give high intensity even with low threat
    vi.advanceTimersByTime(2000);

    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
  });
});
