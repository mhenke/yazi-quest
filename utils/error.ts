export const reportError = (err: unknown, context?: Record<string, unknown>) => {
  // Centralized error reporting — use console and provide a hook for telemetry
  try {
    // Format error
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    // Minimalist logging to avoid noise; can replace with Sentry/Telemetry integration
    // eslint-disable-next-line no-console
    console.error('REPORT_ERROR', { message, stack, context });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('REPORT_ERROR_FAILED', e);
  }
};

export const safeExec = async <T>(fn: () => Promise<T> | T, context?: Record<string, unknown>): Promise<{ ok: true; result: T } | { ok: false; error: unknown }> => {
  try {
    const result = await fn();
    return { ok: true, result };
  } catch (err) {
    reportError(err, context);
    return { ok: false, error: err };
  }
};
