import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlobalInputProvider } from '../GlobalInputContext';
import { CONCLUSION_PARTS, ECHO_EPISODE_1_LORE, EPISODE_LORE } from '../constants/narrative';
import { EpisodeIntro } from './EpisodeIntro';

const renderEpisodeIntro = (episodeIndex: number, reduceMotion = false) => {
  const view = render(
    <GlobalInputProvider>
      <EpisodeIntro
        episode={EPISODE_LORE[episodeIndex]}
        onComplete={vi.fn()}
        reduceMotion={reduceMotion}
      />
    </GlobalInputProvider>
  );
  if (episodeIndex === 2) {
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    if (!reduceMotion) {
      fireEvent.keyDown(window, { key: 'Enter' });
    }
  } else if (!reduceMotion) {
    fireEvent.keyDown(window, { key: 'Enter' });
  }
  return view;
};

describe('EpisodeIntro keyword highlighting', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('highlights the full word "purged" in Episode III with red glitch styling', () => {
    const { container } = renderEpisodeIntro(2, false);
    const visibleParagraphs = Array.from(container.querySelectorAll('p')).filter(
      (p) =>
        !p.closest('[aria-hidden="true"]') && p.textContent?.includes('Transcend or be purged.')
    );
    expect(visibleParagraphs).toHaveLength(1);

    const span = visibleParagraphs[0].querySelector('span[data-text="purged"]');
    expect(span).not.toBeNull();
    expect(span).toHaveTextContent('purged');
    expect(span).toHaveClass('text-red-500', 'font-bold', 'glitch-text-2');
    expect(span?.previousSibling?.textContent).toMatch(/Transcend or be $/);
    expect(span?.nextSibling?.textContent).toBe('.');
  });

  it('styles "purged" red while typing without glitching until the full word completes', () => {
    vi.useFakeTimers();
    const { container } = render(
      <GlobalInputProvider>
        <EpisodeIntro episode={EPISODE_LORE[2]} onComplete={vi.fn()} reduceMotion={false} />
      </GlobalInputProvider>
    );

    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });

    const targetOffset =
      "Sebastian Iqbal's Instruction Guard v2.0 is active. Root access is mandatory. The Forensic Audit is sweeping for AI-7733 echoes. Reach the gateway. Transcend or be purg"
        .length;
    act(() => {
      vi.advanceTimersByTime(targetOffset * 15);
    });

    const visibleRoot = Array.from(container.querySelectorAll('div')).find(
      (div) => div.className.includes('space-y-3') && !div.closest('[aria-hidden="true"]')
    );
    expect(visibleRoot).toBeDefined();

    const partialSpan = Array.from(visibleRoot!.querySelectorAll('span')).find((s) =>
      s.textContent?.startsWith('purg')
    );
    expect(partialSpan).toBeDefined();
    expect(partialSpan).toHaveTextContent('purg');
    expect(partialSpan).toHaveClass('text-red-500', 'font-bold');
    expect(partialSpan).not.toHaveClass('glitch-text-2');

    act(() => {
      vi.advanceTimersByTime(30);
    });

    const fullSpan = visibleRoot!.querySelector('span[data-text="purged"]');
    expect(fullSpan).not.toBeNull();
    expect(fullSpan).toHaveTextContent('purged');
    expect(fullSpan).toHaveClass('text-red-500', 'font-bold', 'glitch-text-2');
  });

  it('keeps full-word "purged" styling without glitch class when reduceMotion is true', () => {
    const { container } = renderEpisodeIntro(2, true);
    const visibleParagraphs = Array.from(container.querySelectorAll('p')).filter(
      (p) =>
        !p.closest('[aria-hidden="true"]') && p.textContent?.includes('Transcend or be purged.')
    );
    expect(visibleParagraphs).toHaveLength(1);

    const spans = Array.from(visibleParagraphs[0].querySelectorAll('span'));
    const purgedSpan = spans.find((s) => s.textContent === 'purged');
    expect(purgedSpan).toBeDefined();
    expect(purgedSpan).toHaveClass('text-red-500', 'font-bold');
    expect(purgedSpan).not.toHaveClass('glitch-text-2');
  });

  it('never splits a word mid-letter across EPISODE_LORE, ECHO_EPISODE_1_LORE, or CONCLUSION_PARTS', () => {
    const episodesToCheck = [
      ...EPISODE_LORE,
      { ...EPISODE_LORE[0], id: 99, lore: ECHO_EPISODE_1_LORE },
      ...CONCLUSION_PARTS,
    ];

    for (const episode of episodesToCheck) {
      const { container, unmount } = render(
        <GlobalInputProvider>
          <EpisodeIntro episode={episode} onComplete={vi.fn()} reduceMotion={false} />
        </GlobalInputProvider>
      );

      const hiddenSections = Array.from(container.querySelectorAll('[aria-hidden="true"] p'));
      for (const p of hiddenSections) {
        for (const span of Array.from(p.querySelectorAll('span'))) {
          const prevText = span.previousSibling?.textContent ?? '';
          const nextText = span.nextSibling?.textContent ?? '';
          expect(/[A-Za-z]$/.test(prevText)).toBe(false);
          expect(/^[A-Za-z]/.test(nextText)).toBe(false);
        }
      }
      unmount();
    }
  });
});
