import {
  MONITORING_EVENT_TYPES,
  MONITORING_MAX_BATCH,
  type ClientMonitoringEvent,
  type MonitoringEventType,
} from '@/lib/attempts/monitoring-contract';

const MAX_PENDING = 100;
const TYPE_DEBOUNCE_MS = 1000;
const MIN_UPLOAD_INTERVAL_MS = 2000;
const UPLOAD_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [2000, 5000, 10000, 30000];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TERMINAL_STATUS = new Set([400, 401, 403, 404, 409, 410, 413, 422]);

type Timer = ReturnType<typeof setTimeout>;
type MonitoringDocument = EventTarget & {
  readonly visibilityState: string;
  readonly fullscreenElement?: unknown;
};
type MonitoringStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type UploadResponse = Pick<Response, 'ok' | 'status'> & { headers?: Pick<Headers, 'get'> };

/** Injectable browser boundary: no browser APIs are read during module import. */
export interface MonitoringEnvironment {
  document: MonitoringDocument;
  window: EventTarget;
  storage?: MonitoringStorage;
  fetch: (url: string, options: RequestInit) => Promise<UploadResponse>;
  now: () => number;
  createEventId: () => string;
  isOnline: () => boolean;
  setTimeout: (callback: () => void, delay: number) => Timer;
  clearTimeout: (timer: Timer) => void;
  createAbortController: () => AbortController;
}

export interface AttemptMonitoringController {
  start: () => void;
  /** Effect cleanup preserves pending events for refresh / Strict Mode remount. */
  dispose: () => void;
  /** Completion / expiry ends collection and removes the document's queue. */
  stop: () => void;
  flush: (keepalive?: boolean) => Promise<void>;
}

export function monitoringStorageKey(attemptId: string): string {
  return `sivora:attempt-monitoring:v1:${attemptId}`;
}

function restoreEvents(value: string | null): ClientMonitoringEvent[] {
  if (!value || value.length > 32_000) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.slice(-MAX_PENDING).flatMap((candidate): ClientMonitoringEvent[] => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return [];
      const event = candidate as Record<string, unknown>;
      if (Object.keys(event).some(key => !['clientEventId', 'eventType', 'clientTimestamp', 'sequence'].includes(key))) return [];
      if (typeof event.clientEventId !== 'string' || !UUID.test(event.clientEventId) || seen.has(event.clientEventId)) return [];
      if (!MONITORING_EVENT_TYPES.includes(event.eventType as MonitoringEventType)) return [];
      if (event.clientTimestamp !== undefined && (typeof event.clientTimestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.clientTimestamp) || !Number.isFinite(Date.parse(event.clientTimestamp)))) return [];
      if (event.sequence !== undefined && (typeof event.sequence !== 'number' || !Number.isSafeInteger(event.sequence) || event.sequence < 0 || event.sequence > 2147483647)) return [];
      seen.add(event.clientEventId);
      return [{
        clientEventId: event.clientEventId,
        eventType: event.eventType as MonitoringEventType,
        ...(typeof event.clientTimestamp === 'string' ? { clientTimestamp: event.clientTimestamp } : {}),
        ...(typeof event.sequence === 'number' ? { sequence: event.sequence } : {}),
      }];
    });
  } catch { return []; }
}

/** A small best-effort queue, completely independent of answer persistence. */
export function createAttemptMonitoring(
  attemptId: string,
  environment: MonitoringEnvironment,
): AttemptMonitoringController {
  const key = monitoringStorageKey(attemptId);
  let pending: ClientMonitoringEvent[] = [];
  try { pending = restoreEvents(environment.storage?.getItem(key) ?? null); } catch { /* Storage is optional. */ }

  let running = false;
  let ended = false;
  let sequence = 0;
  let failures = 0;
  let lastUploadAt = -Infinity;
  let retryAt = 0;
  let uploadTimer: Timer | undefined;
  let periodicTimer: Timer | undefined;
  let requestTimer: Timer | undefined;
  let requestAbort: AbortController | undefined;
  let inFlight = false;
  let wasFullscreen = false;
  const lastTypeAt = new Map<MonitoringEventType, number>();
  const listeners: Array<{ target: EventTarget; name: string; listener: EventListener }> = [];

  function persist() {
    try {
      if (pending.length) environment.storage?.setItem(key, JSON.stringify(pending));
      else environment.storage?.removeItem(key);
    } catch { /* A private / full browser store must not interrupt the exam. */ }
  }

  function clearTimer(timer: Timer | undefined) {
    if (timer !== undefined) {
      try { environment.clearTimeout(timer); } catch { /* Best effort only. */ }
    }
  }

  function detach() {
    for (const { target, name, listener } of listeners.splice(0)) {
      try { target.removeEventListener(name, listener); } catch { /* Best effort only. */ }
    }
    clearTimer(uploadTimer);
    clearTimer(periodicTimer);
    clearTimer(requestTimer);
    uploadTimer = periodicTimer = requestTimer = undefined;
    try { requestAbort?.abort(); } catch { /* No dependency on cancellation. */ }
  }

  function schedule(delay: number) {
    if (!running || ended || uploadTimer !== undefined || !pending.length) return;
    try {
      uploadTimer = environment.setTimeout(() => {
        uploadTimer = undefined;
        void flush();
      }, Math.max(delay, 0));
    } catch { /* Timer failures only disable monitoring retries. */ }
  }

  function record(eventType: MonitoringEventType) {
    if (!running || ended) return;
    try {
      const now = environment.now();
      const last = lastTypeAt.get(eventType);
      if (last !== undefined && now - last < TYPE_DEBOUNCE_MS) return;
      const clientEventId = environment.createEventId();
      if (!UUID.test(clientEventId)) return;
      const event: ClientMonitoringEvent = {
        clientEventId,
        eventType,
        clientTimestamp: new Date(now).toISOString(),
        sequence: sequence++,
      };
      lastTypeAt.set(eventType, now);
      pending.push(event);
      if (pending.length > MAX_PENDING) pending.splice(0, pending.length - MAX_PENDING);
      persist();
      schedule(1000);
    } catch { /* Recording must never throw into a native event handler. */ }
  }

  function listen(target: EventTarget, name: string, callback: () => void) {
    const listener: EventListener = () => {
      try { callback(); } catch { /* Ignore unsupported browser features. */ }
    };
    try {
      target.addEventListener(name, listener);
      listeners.push({ target, name, listener });
    } catch { /* One unsupported signal does not disable the others. */ }
  }

  function periodic() {
    if (!running || ended) return;
    try {
      periodicTimer = environment.setTimeout(() => {
        periodicTimer = undefined;
        void flush();
        periodic();
      }, 10000);
    } catch { /* Collection and exam still continue without the periodic timer. */ }
  }

  async function flush(keepalive = false): Promise<void> {
    if (!running || ended || inFlight || !pending.length) return;
    let timeout: Timer | undefined;
    try {
      if (!environment.isOnline()) { schedule(10000); return; }
      const now = environment.now();
      const wait = Math.max(retryAt - now, lastUploadAt + MIN_UPLOAD_INTERVAL_MS - now);
      if (wait > 0) { schedule(wait); return; }
      clearTimer(uploadTimer);
      uploadTimer = undefined;
      const batch = pending.slice(0, MONITORING_MAX_BATCH);
      const batchIds = new Set(batch.map(event => event.clientEventId));
      inFlight = true;
      lastUploadAt = now;
      requestAbort = environment.createAbortController();
      const expired = new Promise<never>((_, reject) => {
        timeout = environment.setTimeout(() => {
          try { requestAbort?.abort(); } catch { /* Best effort only. */ }
          reject(new Error('Monitoring upload timed out'));
        }, UPLOAD_TIMEOUT_MS);
        requestTimer = timeout;
      });
      const response = await Promise.race([
        environment.fetch(`/api/attempts/${encodeURIComponent(attemptId)}/monitoring`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch }),
          keepalive,
          signal: requestAbort.signal,
        }),
        expired,
      ]);
      // A disposed Strict Mode instance must not overwrite a replacement queue.
      if (!running || ended) return;
      if (response.ok) {
        pending = pending.filter(event => !batchIds.has(event.clientEventId));
        failures = 0;
        retryAt = 0;
        persist();
      } else if (TERMINAL_STATUS.has(response.status)) {
        stop();
      } else {
        failures++;
        let delay = RETRY_DELAYS_MS[Math.min(failures - 1, RETRY_DELAYS_MS.length - 1)];
        if (response.status === 429) {
          const retryAfterSeconds = Number(response.headers?.get('Retry-After'));
          if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) delay = Math.max(delay, Math.min(retryAfterSeconds * 1000, 300000));
        }
        retryAt = environment.now() + delay;
      }
    } catch {
      if (running && !ended) {
        failures++;
        try { retryAt = environment.now() + RETRY_DELAYS_MS[Math.min(failures - 1, RETRY_DELAYS_MS.length - 1)]; } catch { /* Best effort only. */ }
      }
    } finally {
      clearTimer(timeout);
      if (requestTimer === timeout) requestTimer = undefined;
      requestAbort = undefined;
      inFlight = false;
      try { schedule(Math.max(1000, retryAt - environment.now())); } catch { /* Best effort only. */ }
    }
  }

  function start() {
    if (running || ended) return;
    running = true;
    try { wasFullscreen = Boolean(environment.document.fullscreenElement); } catch { /* Unsupported. */ }
    listen(environment.document, 'visibilitychange', () => {
      if (environment.document.visibilityState === 'hidden') {
        record('TAB_HIDDEN');
        void flush(true);
      } else if (environment.document.visibilityState === 'visible') record('TAB_VISIBLE');
    });
    listen(environment.window, 'blur', () => record('WINDOW_BLUR'));
    listen(environment.window, 'focus', () => record('WINDOW_FOCUS'));
    listen(environment.document, 'fullscreenchange', () => {
      const fullscreen = Boolean(environment.document.fullscreenElement);
      if (fullscreen !== wasFullscreen) {
        wasFullscreen = fullscreen;
        record(fullscreen ? 'FULLSCREEN_ENTER' : 'FULLSCREEN_EXIT');
      }
    });
    listen(environment.document, 'copy', () => record('COPY_ATTEMPT'));
    listen(environment.document, 'paste', () => record('PASTE_ATTEMPT'));
    listen(environment.document, 'contextmenu', () => record('CONTEXT_MENU_ATTEMPT'));
    listen(environment.window, 'pagehide', () => { void flush(true); });
    listen(environment.window, 'online', () => { void flush(); });
    schedule(1000);
    periodic();
  }

  function dispose() {
    running = false;
    detach();
  }

  function stop() {
    ended = true;
    running = false;
    pending = [];
    detach();
    persist();
  }

  return { start, dispose, stop, flush };
}

/** Called only inside the client effect after hydration. */
export function browserMonitoringEnvironment(): MonitoringEnvironment {
  let storage: MonitoringStorage | undefined;
  try { storage = window.sessionStorage; } catch { /* Private browsing may deny it. */ }
  return {
    document,
    window,
    storage,
    fetch: (url, options) => window.fetch(url, options),
    now: () => Date.now(),
    createEventId: () => {
      if (typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      const bytes = window.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
    isOnline: () => window.navigator.onLine !== false,
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: timer => clearTimeout(timer),
    createAbortController: () => new AbortController(),
  };
}
