export type GlitchElement = HTMLElement & { __dynamicGlitchApplied?: boolean };

const POOL_SIZE = 4;
const STYLE_ID = 'yazi-dynamic-glitch-pool';

const makeInsetSteps = (steps: number, seedOffset: number): string => {
  const frames: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const pct = Math.round((i / steps) * 100);
    const top = (i * 37 + seedOffset * 19) % 70;
    const height = 8 + ((i * 13 + seedOffset * 7) % 24);
    const bottom = Math.max(0, 100 - (top + height));
    const tx = ((i + seedOffset) % 3) - 1;
    const ty = ((i * 2 + seedOffset) % 3) - 1;
    const skew = ((((i * 7 + seedOffset) % 11) - 5) * 0.18).toFixed(2);
    frames.push(
      `${pct}% { clip-path: inset(${top}% 0 ${bottom}% 0); transform: translate(${tx}px, ${ty}px) skew(${skew}deg); }`
    );
  }
  return frames.join('\n');
};

const ensurePool = () => {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

  const rules: string[] = [];
  for (let idx = 0; idx < POOL_SIZE; idx++) {
    rules.push(`@keyframes glitch_before_${idx} {\n${makeInsetSteps(12, idx * 2)}\n}`);
    rules.push(`@keyframes glitch_after_${idx} {\n${makeInsetSteps(12, idx * 2 + 1)}\n}`);
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
};

export function applyDynamicGlitch(el: GlitchElement) {
  if (!el || el.__dynamicGlitchApplied) return;

  ensurePool();

  const text = el.dataset.text || el.textContent || '';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  const slot = Math.abs(hash) % POOL_SIZE;

  el.style.setProperty('--glitch-before', `glitch_before_${slot}`);
  el.style.setProperty('--glitch-after', `glitch_after_${slot}`);
  el.style.setProperty('--glitch-dur-before', `${(1.2 + slot * 0.25).toFixed(2)}s`);
  el.style.setProperty('--glitch-dur-after', `${(0.9 + slot * 0.2).toFixed(2)}s`);

  el.__dynamicGlitchApplied = true;
}
