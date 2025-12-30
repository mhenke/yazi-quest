export const measure = <T>(label: string, fn: () => T, thresholdMs: number = 5): T => {
  try {
    if (process.env.NODE_ENV === 'production') return fn();
    const start = (globalThis.performance && performance.now && performance.now()) || Date.now();
    const res = fn();
    const end = (globalThis.performance && performance.now && performance.now()) || Date.now();
    const ms = end - start;
    if (ms > thresholdMs) {
      // eslint-disable-next-line no-console
      console.debug(`PERF: ${label} took ${ms.toFixed(2)}ms`);
    }
    return res;
  } catch (err) {
    // Don't break app for perf measurement failures
    // eslint-disable-next-line no-console
    console.warn('Perf measure failed', err);
    return fn();
  }
};
