export function applyDynamicGlitch(el: HTMLElement) {
  if (!el) return;
  // If already applied, skip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((el as any).__dynamicGlitchApplied) return;

  const uid = Math.random().toString(36).slice(2, 9);
  const beforeName = `glitch_before_${uid}`;
  const afterName = `glitch_after_${uid}`;

  const makeSteps = (steps: number) => {
    const arr: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const pct = Math.round((i / steps) * 100);
      const top = Math.floor(Math.random() * 80);
      // thinner slices for sleek look
      const height = Math.floor(2 + Math.random() * 18); // 2..20px
      const bottom = top + height;
      const tx = Math.floor(Math.random() * 3) - 1; // -1..1 px
      const ty = Math.floor(Math.random() * 3) - 1; // -1..1 px
      const skew = (Math.random() * 2 - 1).toFixed(2); // -1..1 deg
      arr.push(
        `${pct}% { clip: rect(${top}px, 9999px, ${bottom}px, 0); transform: translate(${tx}px, ${ty}px) skew(${skew}deg); }`
      );
    }
    return arr.join('\n');
  };

  // more steps = finer slices
  const beforeFrames = `@keyframes ${beforeName} {\n${makeSteps(12)}\n}`;
  const afterFrames = `@keyframes ${afterName} {\n${makeSteps(12)}\n}`;

  const style = document.createElement('style');
  style.setAttribute('data-glitch', uid);
  style.textContent = `${beforeFrames}\n${afterFrames}`;
  document.head.appendChild(style);

  // assign variables on the element so pseudo-elements use these keyframes
  el.style.setProperty('--glitch-before', beforeName);
  el.style.setProperty('--glitch-after', afterName);
  // subtler, faster durations for sleek feel
  el.style.setProperty('--glitch-dur-before', `${(1.2 + Math.random() * 1.2).toFixed(2)}s`);
  el.style.setProperty('--glitch-dur-after', `${(0.9 + Math.random() * 0.9).toFixed(2)}s`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (el as any).__dynamicGlitchApplied = true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const triggerScreenShake = (element: any) => {
  if (!element) return;
  // Reset animation
  element.style.animation = 'none';
  void element.offsetWidth; // trigger reflow
  element.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
};
