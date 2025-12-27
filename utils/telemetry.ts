type Payload = Record<string, unknown> | undefined;

// Minimal telemetry system with batching, optional Sentry integration, and configurable endpoint.
const QUEUE: Array<{ name: string; payload?: Payload; ts: number }> = [];
let FLUSH_INTERVAL = 10000; // 10s
let MAX_QUEUE = 500;

// Safely read env from import.meta without using `any`
const metaEnv = import.meta as unknown as { env?: Record<string, string> };
let telemetryEndpoint: string | undefined = metaEnv.env?.VITE_TELEMETRY_ENDPOINT || undefined;
let telemetryDisabled = !!metaEnv.env?.VITE_TELEMETRY_DISABLED;
let sentinelInitialized = false;
let flushTimer: number | undefined;

type SentryModule = { init?: (opts: { dsn?: string }) => void };

async function tryInitSentry() {
  // Sentry removed - no-op
  return;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setInterval(
    () => flushQueue().catch(() => {}),
    FLUSH_INTERVAL
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
    type NavigatorWithBeacon = Navigator & {
      sendBeacon?: (url: string, data: BodyInit) => boolean;
    };
    const nav = navigator as unknown as NavigatorWithBeacon;
    if (nav && typeof nav.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      nav.sendBeacon(endpoint, blob);
    } else {
      await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      });
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
    const win = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
    if (typeof window !== 'undefined' && Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: name, ...(payload || {}) });
    }
  } catch (e) {
    /* ignore */
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
    const win = window as unknown as {
      Sentry?: { captureMessage?: (msg: string, opts?: object) => void };
    };
    if (
      typeof window !== 'undefined' &&
      win.Sentry &&
      typeof win.Sentry.captureMessage === 'function'
    ) {
      win.Sentry.captureMessage(name, { level: 'error', extra: payload });
    }
  } catch (e) {
    /* ignore */
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
