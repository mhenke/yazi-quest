import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sounds', () => {
  const originalAudioContext = window.AudioContext;
  const originalUserActivation = Object.getOwnPropertyDescriptor(navigator, 'userActivation');

  function setUserActivation(hasBeenActive: boolean) {
    Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive, isActive: hasBeenActive },
    });
  }

  function createMockAudioContext(state: AudioContextState = 'running') {
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const setValueAtTime = vi.fn();
    const linearRampToValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();

    const ctx = {
      state,
      currentTime: 10,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime },
        connect,
        start,
        stop,
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime,
          linearRampToValueAtTime,
          exponentialRampToValueAtTime,
        },
        connect,
      })),
    };

    return { ctx, start, stop };
  }

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
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

    const { playSuccessSound, playTaskCompleteSound } = await import('./sounds');
    playSuccessSound(true);
    playTaskCompleteSound(true);

    expect(ctor).not.toHaveBeenCalled();
  });

  it('skips playback when disabled', async () => {
    setUserActivation(true);
    const ctor = vi.fn();
    window.AudioContext = ctor as unknown as typeof AudioContext;

    const { playSuccessSound, playTaskCompleteSound } = await import('./sounds');
    playSuccessSound(false);
    playTaskCompleteSound(false);

    expect(ctor).not.toHaveBeenCalled();
  });

  it('plays tones immediately when context is running after user activation', async () => {
    setUserActivation(true);
    const { ctx, start } = createMockAudioContext('running');
    window.AudioContext = vi.fn(function AudioContextMock() {
      return ctx;
    }) as unknown as typeof AudioContext;

    const { playSuccessSound, playTaskCompleteSound } = await import('./sounds');
    playSuccessSound(true);
    playTaskCompleteSound(true);

    expect(start).toHaveBeenCalledTimes(3);
  });

  it('resumes suspended context and retries on user gesture when resume rejects', async () => {
    setUserActivation(true);
    const { ctx, start } = createMockAudioContext('suspended');

    // First resume resolves and flips state to running
    ctx.resume.mockImplementationOnce(async () => {
      ctx.state = 'running';
    });

    window.AudioContext = vi.fn(function AudioContextMock() {
      return ctx;
    }) as unknown as typeof AudioContext;

    const { playTaskCompleteSound } = await import('./sounds');
    playTaskCompleteSound(true);

    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));

    // Now test rejection path -> gesture listener recovery
    vi.resetModules();
    const second = createMockAudioContext('suspended');
    second.ctx.resume
      .mockRejectedValueOnce(new Error('Autoplay blocked'))
      .mockResolvedValueOnce(undefined);

    window.AudioContext = vi.fn(function AudioContextMock() {
      return second.ctx;
    }) as unknown as typeof AudioContext;

    const addSpy = vi.spyOn(window, 'addEventListener');
    const mod = await import('./sounds');
    mod.playTaskCompleteSound(true);

    await vi.waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { once: true })
    );
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));

    await vi.waitFor(() => expect(second.start).toHaveBeenCalledTimes(1));
  });

  it('silently ignores missing AudioContext', async () => {
    setUserActivation(true);
    window.AudioContext = undefined as unknown as typeof AudioContext;

    const { playSuccessSound } = await import('./sounds');
    expect(() => playSuccessSound(true)).not.toThrow();
  });
});
