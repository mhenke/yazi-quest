import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSkipIntroRequested, setSkipIntroRequested } from '../../utils/skipIntroFlag';
import { useSkipIntro } from './useSkipIntro';

describe('useSkipIntro', () => {
  beforeEach(() => {
    resetSkipIntroRequested();
  });

  it('triggers onComplete when yazi-quest-skip-intro event is dispatched', () => {
    const onComplete = vi.fn();
    renderHook(() => useSkipIntro(onComplete));

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
    });

    expect(onComplete).toHaveBeenCalledWith({ isSkip: true });
  });

  it('immediately triggers onComplete if skipIntro was already requested', () => {
    setSkipIntroRequested();
    const onComplete = vi.fn();

    renderHook(() => useSkipIntro(onComplete));

    expect(onComplete).toHaveBeenCalledWith({ isSkip: true });
  });
});
