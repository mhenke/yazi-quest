// Simple Web Audio API sound effects
// No external files needed - generates tones programmatically

let audioContext: AudioContext | null = null;
let awaitingGesture = false;

const createAudioContext = (): AudioContext => {
  const w = window as unknown as {
    AudioContext?: { new (): AudioContext };
    webkitAudioContext?: { new (): AudioContext };
  };
  const Ctor = w.AudioContext || w.webkitAudioContext;
  if (!Ctor) throw new Error('No AudioContext available');
  return new Ctor();
};

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = createAudioContext();
  }
  return audioContext;
};

// Ensure audio context is running or schedule resume on next user gesture
const ensureContextRunning = (cb: (ctx: AudioContext) => void) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'running') {
      cb(ctx);
      return;
    }

    // Try to resume immediately
    ctx
      .resume()
      .then(() => {
        if (ctx.state === 'running') cb(ctx);
      })
      .catch(() => {
        // If resume fails (autoplay policy), attach a one-time gesture listener
        if (awaitingGesture) return;
        awaitingGesture = true;
        const handler = () => {
          ctx
            .resume()
            .then(() => {
              try {
                cb(ctx);
              } catch {
                /* ignore */
              }
            })
            .catch(() => {
              // still failed; ignore
            })
            .finally(() => {
              awaitingGesture = false;
              window.removeEventListener('pointerdown', handler);
              window.removeEventListener('keydown', handler);
            });
        };
        window.addEventListener('pointerdown', handler, { once: true });
        window.addEventListener('keydown', handler, { once: true });
      });
  } catch {
    // Audio unavailable — silence in UX
  }
};

export const playSuccessSound = (enabled: boolean = true): void => {
  if (!enabled) return;

  try {
    ensureContextRunning((ctx) => {
      const now = ctx.currentTime;

      // Create a pleasant two-tone success chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Envelope: quick attack, gentle decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Two ascending tones for success feeling
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.1, 0.2); // E5
    });
  } catch {
    // Audio unavailable — silence in UX
  }
};

export const playTaskCompleteSound = (enabled: boolean = true): void => {
  if (!enabled) return;

  try {
    ensureContextRunning((ctx) => {
      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now); // A5 - quick blip

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      oscillator.start(now);
      oscillator.stop(now + 0.08);
    });
  } catch {
    // Audio unavailable — silence in UX
  }
};
