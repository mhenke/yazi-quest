type Payload = Record<string, any> | undefined;

// Minimal telemetry system with batching, optional Sentry integration, and configurable endpoint.
const QUEUE: Array<{ name: string; payload?: Payload; ts: number }> = [];
let FLUSH_INTERVAL = 10000; // 10s
let MAX_QUEUE = 500;
let telemetryEndpoint: string | undefined =
  (import.meta as any).env?.VITE_TELEMETRY_ENDPOINT || undefined;
let telemetryDisabled = !!(import.meta as any).env?.VITE_TELEMETRY_DISABLED;
let sentinelInitialized = false;
let flushTimer: number | undefined;

async function tryInitSentry() {
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (sentinelInitialized) return;
  try {
    // Attempt dynamic import; suppress TS error if package not installed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const Sentry = await import('@sentry/browser');
    if (Sentry && (Sentry as any).init) {
      (Sentry as any).init({ dsn });
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
    if (navigator && (navigator as any).sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      (navigator as any).sendBeacon(endpoint, blob);
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
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event: name, ...(payload || {}) });
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
    if (
      typeof window !== 'undefined' &&
      (window as any).Sentry &&
      (window as any).Sentry.captureMessage
    ) {
      (window as any).Sentry.captureMessage(name, { level: 'error', extra: payload });
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
