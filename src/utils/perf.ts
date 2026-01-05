export const measure = <T>(label: string, fn: () => T, thresholdMs: number = 5): T => {
  try {
    if (process.env.NODE_ENV === 'production') return fn();
    const start = (globalThis.performance && performance.now && performance.now()) || Date.now();
    const res = fn();
    const end = (globalThis.performance && performance.now && performance.now()) || Date.now();
    const ms = end - start;
    if (ms > thresholdMs) {
      // perf timings intentionally silent in UX builds
    }
    return res;
  } catch {
    // Don't break app for perf measurement failures — swallow silently
    return fn();
  }
};
