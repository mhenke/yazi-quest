// Lightweight WebAudio ambient pad for teaser
let audioCtx: AudioContext | null = null;
let nodes: {
  oscA?: OscillatorNode | null;
  oscB?: OscillatorNode | null;
  gain?: GainNode | null;
  filter?: BiquadFilterNode | null;
  running?: boolean;
} = {};

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext || w.webkitAudioContext;
    if (!Ctor) throw new Error('No AudioContext available');
    audioCtx = new Ctor();
  }
  return audioCtx;
};

export const playTeaserMusic = (enabled: boolean = true) => {
  if (!enabled) return;
  if (nodes.running) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = 'sine';
    oscB.type = 'sine';
    oscA.frequency.setValueAtTime(110, now);
    oscB.frequency.setValueAtTime(138.59, now);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    gain.gain.linearRampToValueAtTime(0.08, now + 0.6);

    oscA.start(now);
    oscB.start(now);

    nodes = { oscA, oscB, gain, filter, running: true };
  } catch {
    console.warn('teaser music failed');
  }
};

export const stopTeaserMusic = () => {
  try {
    if (!nodes.running) return;
    const ctx = audioCtx;
    const n: typeof nodes = nodes;
    if (n.gain && ctx) {
      const now = ctx.currentTime;
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      setTimeout(() => {
        try {
          n.oscA?.stop();
          n.oscB?.stop();
          n.oscA?.disconnect();
          n.oscB?.disconnect();
          n.gain?.disconnect();
          n.filter?.disconnect();
        } catch {
          /* ignore */
        }
      }, 500);
    }
  } catch {
    console.warn('stop teaser music failed');
  } finally {
    nodes = {};
  }
};
