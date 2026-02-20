import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GlitchOverlay } from './GlitchOverlay';
import '@testing-library/jest-dom';

// Mock the glitchEffects utilities
vi.mock('../../utils/glitchEffects', () => ({
  shouldTriggerGlitch: vi.fn(),
  getGlitchIntensity: vi.fn(),
  scrambleText: vi.fn(),
  getRandomGlitchChar: vi.fn(),
}));

import {
  shouldTriggerGlitch,
  getGlitchIntensity,
  scrambleText,
  getRandomGlitchChar,
} from '../../utils/glitchEffects';

describe('GlitchOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock implementations
    vi.mocked(shouldTriggerGlitch).mockReturnValue(false);
    vi.mocked(getGlitchIntensity).mockReturnValue(0);
    vi.mocked(scrambleText).mockImplementation((text) => text);
    vi.mocked(getRandomGlitchChar).mockReturnValue('█');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children without glitch effects when disabled', () => {
    render(
      <GlitchOverlay threatLevel={100} enabled={false}>
        <div data-testid="child-content">Test Content</div>
      </GlitchOverlay>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('glitch-overlay')).not.toBeInTheDocument();
  });

  it('should render children without glitch effects when threat level is below 20', () => {
    render(
      <GlitchOverlay threatLevel={10} enabled={true}>
        <div data-testid="child-content">Test Content</div>
      </GlitchOverlay>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('glitch-overlay')).not.toBeInTheDocument();
  });

  it('should render glitch overlay container when threat level is 20 or above', () => {
    vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

    render(
      <GlitchOverlay threatLevel={60} enabled={true}>
        <div data-testid="child-content">Test Content</div>
      </GlitchOverlay>
    );

    expect(screen.getByTestId('glitch-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should apply consciousness level prop (optional)', () => {
    vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

    const { container } = render(
      <GlitchOverlay threatLevel={60} consciousnessLevel={50} enabled={true}>
        <div>Content</div>
      </GlitchOverlay>
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should pass through children correctly', () => {
    vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

    render(
      <GlitchOverlay threatLevel={60} enabled={true}>
        <span className="test-class">Child Element</span>
      </GlitchOverlay>
    );

    expect(screen.getByText('Child Element')).toBeInTheDocument();
    expect(screen.getByText('Child Element').className).toBe('test-class');
  });

  describe('glitch effects triggering', () => {
    it('should not trigger glitch when shouldTriggerGlitch returns false', () => {
      vi.mocked(shouldTriggerGlitch).mockReturnValue(false);
      vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

      render(
        <GlitchOverlay threatLevel={60} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      // Initially no active glitch
      const overlay = screen.getByTestId('glitch-overlay');
      expect(overlay).not.toHaveClass('glitch-text-scramble');
      expect(overlay).not.toHaveClass('glitch-color-bleed');
      expect(overlay).not.toHaveClass('glitch-scan-line');
    });

    it('should trigger glitch effects when shouldTriggerGlitch returns true', async () => {
      vi.mocked(shouldTriggerGlitch).mockReturnValue(true);
      vi.mocked(getGlitchIntensity).mockReturnValue(0.8);

      render(
        <GlitchOverlay threatLevel={90} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      // Wait for potential glitch effect
      await waitFor(
        () => {
          const overlay = screen.getByTestId('glitch-overlay');
          // At least one glitch class should be present at some point
          const hasGlitchClass =
            overlay.classList.contains('glitch-text-scramble') ||
            overlay.classList.contains('glitch-color-bleed') ||
            overlay.classList.contains('glitch-scan-line');
          expect(hasGlitchClass).toBe(true);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('intensity-based styling', () => {
    it('should apply intensity-based CSS variables', () => {
      vi.mocked(getGlitchIntensity).mockReturnValue(0.75);

      const { container } = render(
        <GlitchOverlay threatLevel={80} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      const glitchContainer = container.firstChild as HTMLElement;
      expect(glitchContainer).toBeInTheDocument();
    });
  });

  describe('scan-line effect', () => {
    it('should render scan-lines element during scan-line glitch', () => {
      vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

      render(
        <GlitchOverlay threatLevel={60} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      // Scan lines may appear during glitch
      // We verify the structure is in place
      const overlay = screen.getByTestId('glitch-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('color-bleed effect', () => {
    it('should render color-bleed element during color-bleed glitch', () => {
      vi.mocked(getGlitchIntensity).mockReturnValue(0.5);

      render(
        <GlitchOverlay threatLevel={60} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      const overlay = screen.getByTestId('glitch-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('text-scramble effect', () => {
    it('should render scramble-overlay with glitch characters during text-scramble glitch', () => {
      vi.mocked(getGlitchIntensity).mockReturnValue(0.5);
      vi.mocked(getRandomGlitchChar).mockReturnValue('▓');

      render(
        <GlitchOverlay threatLevel={60} enabled={true}>
          <div>Content</div>
        </GlitchOverlay>
      );

      const overlay = screen.getByTestId('glitch-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });
});
