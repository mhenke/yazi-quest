type Payload = Record<string, unknown> | undefined;

// Minimal telemetry system with batching, optional Sentry integration, and configurable endpoint.
const QUEUE: Array<{ name: string; payload?: Payload; ts: number }> = [];
let FLUSH_INTERVAL = 10000; // 10s
let MAX_QUEUE = 500;
const _env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
let telemetryEndpoint: string | undefined = _env.VITE_TELEMETRY_ENDPOINT || undefined;
let telemetryDisabled = !!_env.VITE_TELEMETRY_DISABLED;

let flushTimer: number | undefined;

async function tryInitSentry() {
  // Sentry disabled: no-op to avoid optional dependency
  return;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setInterval(
    () => flushQueue().catch(() => {}),
    FLUSH_INTERVAL,
  ) as unknown as number;
}

async function flushQueue() {
  if (telemetryDisabled) {
    QUEUE.length = 0;
    return;
  }
  if (QUEUE.length === 0) return;
  const endpoint = telemetryEndpoint;
  const payload = QUEUE.splice(0, MAX_QUEUE);
  if (!endpoint) {
    // No endpoint configured; drop silently
    return;
  }

  try {
    const body = JSON.stringify({ events: payload });
    // Use sendBeacon if available for reliability on unload
    if (
      typeof navigator !== 'undefined' &&
      'sendBeacon' in navigator &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      const resp = await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp && resp.type === 'opaque') {
        // opaque response — drop silently
        return;
      }
      if (!resp.ok) {
        throw new Error(`Telemetry post failed: ${resp.status} ${resp.statusText}`);
      }
    }
  } catch {
    // flush failed — requeue silently
    // On failure, reinsert payload at front (respect max size)
    const requeue = payload.concat(QUEUE).slice(0, MAX_QUEUE);
    QUEUE.length = 0;
    QUEUE.push(...requeue);
  }
}

export function initTelemetry(opts?: {
  endpoint?: string;
  flushIntervalMs?: number;
  maxQueue?: number;
  disable?: boolean;
}) {
  if (opts) {
    if (opts.endpoint) telemetryEndpoint = opts.endpoint;
    if (opts.flushIntervalMs) FLUSH_INTERVAL = opts.flushIntervalMs;
    if (opts.maxQueue) MAX_QUEUE = opts.maxQueue;
    if (typeof opts.disable === 'boolean') telemetryDisabled = opts.disable;
  }
  if (!telemetryDisabled) {
    scheduleFlush();
    tryInitSentry().catch(() => {});
  }
}

export function trackEvent(name: string, payload?: Payload) {
  if (telemetryDisabled) return;
  tryInitSentry().catch(() => {});
  // window.dataLayer integration
  try {
    const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
    if (Array.isArray(w['dataLayer'])) {
      (w['dataLayer'] as unknown[]).push({ event: name, ...(payload || {}) });
    }
  } catch {
    // Silently ignore errors
  }

  QUEUE.push({ name, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  // local dev visibility (silenced in UX)
}

export function trackError(name: string, payload?: Payload) {
  if (telemetryDisabled) return;
  tryInitSentry().catch(() => {});
  // forward to Sentry if available
  try {
    const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
    const maybeSentry = w['Sentry'] as unknown;
    if (
      maybeSentry &&
      typeof (maybeSentry as Record<string, unknown>)['captureMessage'] === 'function'
    ) {
      (
        maybeSentry as unknown as {
          captureMessage: (m: string, opts?: Record<string, unknown>) => void;
        }
      ).captureMessage(name, {
        level: 'error',
        extra: payload,
      });
    }
  } catch {
    // Silently ignore errors
  }

  QUEUE.push({ name: `[error] ${name}`, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  // telemetry errors are recorded in the queue; do not log to console in UX
}

// Auto-init from env if present
initTelemetry({ endpoint: telemetryEndpoint, disable: telemetryDisabled });

// Expose flush for manual flushing
export { flushQueue as flushTelemetryQueue };
