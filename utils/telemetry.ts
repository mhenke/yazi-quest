type Payload = Record<string, unknown> | undefined;

// Minimal telemetry system with batching and configurable endpoint.
const QUEUE: Array<{ name: string; payload?: Payload; ts: number }> = [];
let FLUSH_INTERVAL = 10000; // 10s
let MAX_QUEUE = 500;
const _env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
let telemetryEndpoint: string | undefined = _env.VITE_TELEMETRY_ENDPOINT || undefined;
let telemetryDisabled = !!_env.VITE_TELEMETRY_DISABLED;

let flushTimer: number | undefined;

async function tryInitSentry() {
  // Sentry disabled: no-op
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
    console.warn('[telemetry] flush (no endpoint): dropping events');
    return;
  }

  try {
    const body = JSON.stringify({ events: payload });
    // Use sendBeacon if available for reliability on unload
    if (
      typeof navigator !== 'undefined' &&
      'sendBeacon' in navigator &&
      typeof (navigator as unknown as { sendBeacon?: (...args: unknown[]) => unknown })
        .sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' });

      (navigator as unknown as { sendBeacon?: (...args: unknown[]) => unknown }).sendBeacon!(
        endpoint,
        blob,
      );
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
    console.warn('[telemetry] flush failed, re-queueing');
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
    const dl =
      typeof window !== 'undefined'
        ? (window as unknown as { dataLayer?: unknown }).dataLayer
        : undefined;
    if (Array.isArray(dl)) {
      (dl as unknown[]).push({ event: name, ...(payload || {}) });
    }
  } catch {
    // Silently ignore
  }

  QUEUE.push({ name, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  // local dev visibility
  console.warn('[telemetry] event', name);
}

export function trackError(name: string, payload?: Payload) {
  if (telemetryDisabled) return;
  tryInitSentry().catch(() => {});

  QUEUE.push({ name: `[error] ${name}`, payload, ts: Date.now() });
  if (QUEUE.length >= MAX_QUEUE) {
    flushQueue().catch(() => {});
  }
  console.warn('[telemetry][error]', name);
}

// Auto-init from env if present
initTelemetry({ endpoint: telemetryEndpoint, disable: telemetryDisabled });

// Expose flush for manual flushing
export { flushQueue as flushTelemetryQueue };
