type Payload = Record<string, unknown> | undefined;

// Minimal telemetry system with batching, optional Sentry integration, and configurable endpoint.
const QUEUE: Array<{ name: string; payload?: Payload; ts: number }> = [];
let FLUSH_INTERVAL = 10000; // 10s
let MAX_QUEUE = 500;
const _env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
let telemetryEndpoint: string | undefined = _env.VITE_TELEMETRY_ENDPOINT || undefined;
let telemetryDisabled = !!_env.VITE_TELEMETRY_DISABLED;
let sentinelInitialized = false;
let flushTimer: number | undefined;

async function tryInitSentry() {
  const dsn = _env.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (sentinelInitialized) return;
  try {
    // Attempt dynamic import; suppress TS error if package not installed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import('@sentry/browser');
    const Sentry = mod as unknown as { init?: (opts?: Record<string, unknown>) => void };
    if (Sentry && typeof Sentry.init === 'function') {
      Sentry.init({ dsn });
      sentinelInitialized = true;
      console.info('[telemetry] Sentry initialized');
    }
  } catch (e) {
    // package not installed or init failed; ignore
    console.warn('[telemetry] Sentry init failed or not installed', e);
  }
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
    // No endpoint configured; log and drop
    console.info('[telemetry] flush (no endpoint):', payload);
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
        console.warn(
          '[telemetry] flush received opaque response (possibly blocked by policy). Dropping payload.',
        );
        return;
      }
      if (!resp.ok) {
        throw new Error(`Telemetry post failed: ${resp.status} ${resp.statusText}`);
      }
    }
  } catch (e) {
    console.warn('[telemetry] flush failed, re-queueing', e);
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
  } catch (e) {
    // Silently ignore errors
  }

  QUEUE.push({ name, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  // local dev visibility
  console.info('[telemetry] event', name, payload || {});
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
  } catch (e) {
    // Silently ignore errors
  }

  QUEUE.push({ name: `[error] ${name}`, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  console.warn('[telemetry][error]', name, payload || {});
}

// Auto-init from env if present
initTelemetry({ endpoint: telemetryEndpoint, disable: telemetryDisabled });

// Expose flush for manual flushing
export { flushQueue as flushTelemetryQueue };
