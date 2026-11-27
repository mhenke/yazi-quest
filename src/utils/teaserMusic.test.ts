// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('teaserMusic', () => {
  const originalAudioContext = window.AudioContext;
  const originalUserActivation = Object.getOwnPropertyDescriptor(navigator, 'userActivation');

  function setUserActivation(hasBeenActive: boolean) {
    Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive, isActive: hasBeenActive },
    });
  }

  function createMockAudioContext() {
    const oscStart = vi.fn();
    const oscStop = vi.fn();
    const oscDisconnect = vi.fn();
    const gainDisconnect = vi.fn();
    const filterDisconnect = vi.fn();
    const cancelScheduledValues = vi.fn();
    const linearRampToValueAtTime = vi.fn();

    const ctx = {
      currentTime: 5,
      destination: {},
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: oscStart,
        stop: oscStop,
        disconnect: oscDisconnect,
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime,
          cancelScheduledValues,
        },
        connect: vi.fn(),
        disconnect: gainDisconnect,
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: filterDisconnect,
      })),
    };

    return {
      ctx,
      oscStart,
      oscStop,
      oscDisconnect,
      gainDisconnect,
      filterDisconnect,
      cancelScheduledValues,
    };
  }

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.AudioContext = originalAudioContext;
    if (originalUserActivation) {
      Object.defineProperty(navigator, 'userActivation', originalUserActivation);
    } else {
      Reflect.deleteProperty(navigator, 'userActivation');
    }
    vi.restoreAllMocks();
  });

  it('does not construct AudioContext before user activation', async () => {
    setUserActivation(false);
    const ctor = vi.fn();
    window.AudioContext = ctor as unknown as typeof AudioContext;

    const { playTeaserMusic } = await import('./teaserMusic');
    playTeaserMusic(true);

    expect(ctor).not.toHaveBeenCalled();
  });

  it('skips playback when disabled', async () => {
    setUserActivation(true);
    const ctor = vi.fn();
    window.AudioContext = ctor as unknown as typeof AudioContext;

    const { playTeaserMusic } = await import('./teaserMusic');
    playTeaserMusic(false);

    expect(ctor).not.toHaveBeenCalled();
  });

  it('starts ambient oscillators once when active and cleans up on stop', async () => {
    vi.useFakeTimers();
    setUserActivation(true);
    const mocks = createMockAudioContext();
    window.AudioContext = vi.fn(function AudioContextMock() {
      return mocks.ctx;
    }) as unknown as typeof AudioContext;

    const { playTeaserMusic, stopTeaserMusic } = await import('./teaserMusic');

    // Stopping before starting is a no-op
    stopTeaserMusic();
    expect(mocks.cancelScheduledValues).not.toHaveBeenCalled();

    playTeaserMusic(true);
    playTeaserMusic(true); // second call while running should be a no-op
    expect(mocks.oscStart).toHaveBeenCalledTimes(2);

    stopTeaserMusic();
    expect(mocks.cancelScheduledValues).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(mocks.oscStop).toHaveBeenCalledTimes(2);
    expect(mocks.oscDisconnect).toHaveBeenCalledTimes(2);
    expect(mocks.gainDisconnect).toHaveBeenCalledTimes(1);
    expect(mocks.filterDisconnect).toHaveBeenCalledTimes(1);
  });

  it('warns without throwing when AudioContext is unavailable', async () => {
    setUserActivation(true);
    window.AudioContext = undefined as unknown as typeof AudioContext;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { playTeaserMusic } = await import('./teaserMusic');
    expect(() => playTeaserMusic(true)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('teaser music failed');
  });
});
