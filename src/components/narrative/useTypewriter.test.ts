import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('types text character by character', () => {
    const text = 'Hello';
    const { result } = renderHook(() => useTypewriter(text, { speed: 50 }));

    expect(result.current.displayedText).toBe('');
    expect(result.current.isComplete).toBe(false);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.displayedText).toBe('H');
    expect(result.current.isComplete).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.displayedText).toBe('Hello');
    expect(result.current.isComplete).toBe(true);
  });

  it('allows skipping text typing', () => {
    const text = 'Cybersecurity Research Laboratories';
    const { result } = renderHook(() => useTypewriter(text, { speed: 50 }));

    expect(result.current.displayedText).toBe('');
    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.skip();
    });

    expect(result.current.displayedText).toBe(text);
    expect(result.current.isComplete).toBe(true);
  });

  it('types lines line by line', () => {
    const lines = ['Line 1', 'Line 2', 'Line 3'];
    const { result } = renderHook(() => useTypewriter(lines, { speed: 100 }));

    expect(result.current.displayedLines).toEqual([]);
    expect(result.current.isComplete).toBe(false);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.displayedLines).toEqual(['Line 1']);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.displayedLines).toEqual(['Line 1', 'Line 2']);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.displayedLines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    expect(result.current.isComplete).toBe(false);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isComplete).toBe(true);
    expect(result.current.showContinue).toBe(true);
  });

  it('allows skipping line typing', () => {
    const lines = ['BOOT 1', 'BOOT 2', 'BOOT 3'];
    const { result } = renderHook(() => useTypewriter(lines, { speed: 100 }));

    act(() => {
      result.current.skip();
    });

    expect(result.current.displayedLines).toEqual(lines);
    expect(result.current.isComplete).toBe(true);
  });

  it('resets when key changes', () => {
    let key = 1;
    const { result, rerender } = renderHook(
      ({ currentKey }) => useTypewriter('Dynamic', { speed: 50, key: currentKey }),
      { initialProps: { currentKey: key } }
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.displayedText).toBe('Dynamic'.slice(0, 4));

    key = 2;
    rerender({ currentKey: key });

    expect(result.current.displayedText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });
});
