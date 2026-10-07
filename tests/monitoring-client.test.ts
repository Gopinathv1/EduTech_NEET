import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAttemptMonitoring,
  monitoringStorageKey,
  type MonitoringEnvironment,
} from '@/lib/client/attempt-monitoring';
import { MONITORING_EVENT_TYPES, type ClientMonitoringEvent } from '@/lib/attempts/monitoring-contract';

class ExamDocument extends EventTarget {
  visibilityState = 'visible';
  fullscreenElement: unknown = null;
}

let nextId = 0;

function fixture(sharedStore = new Map<string, string>()) {
  const document = new ExamDocument();
  const window = new EventTarget();
  let online = true;
  const fetch = vi.fn<MonitoringEnvironment['fetch']>().mockResolvedValue({ ok: true, status: 200 });
  const storage = {
    getItem: vi.fn((key: string) => sharedStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { sharedStore.set(key, value); }),
    removeItem: vi.fn((key: string) => { sharedStore.delete(key); }),
  };
  const environment: MonitoringEnvironment = {
    document,
    window,
    storage,
    fetch,
    now: () => Date.now(),
    createEventId: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`,
    isOnline: () => online,
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: timer => clearTimeout(timer),
    createAbortController: () => new AbortController(),
  };
  const controller = createAttemptMonitoring('owned-attempt', environment);
  return { document, window, storage, store: sharedStore, fetch, environment, controller, setOnline: (value: boolean) => { online = value; } };
}

function sentEvents(options: RequestInit): ClientMonitoringEvent[] {
  return JSON.parse(options.body as string).events;
}

function savedEvents(store: Map<string, string>): ClientMonitoringEvent[] {
  return JSON.parse(store.get(monitoringStorageKey('owned-attempt')) ?? '[]');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T00:00:00.000Z'));
});
afterEach(() => { vi.useRealTimers(); });

describe('independent browser monitoring queue', () => {
  it('captures all nine native signals with only allowlisted metadata and never reads or blocks clipboard data', async () => {
    const f = fixture();
    f.setOnline(false);
    f.controller.start();
    f.document.visibilityState = 'hidden';
    f.document.dispatchEvent(new Event('visibilitychange'));
    f.document.visibilityState = 'visible';
    f.document.dispatchEvent(new Event('visibilitychange'));
    f.window.dispatchEvent(new Event('blur'));
    f.window.dispatchEvent(new Event('focus'));
    f.document.fullscreenElement = {};
    f.document.dispatchEvent(new Event('fullscreenchange'));
    f.document.fullscreenElement = null;
    f.document.dispatchEvent(new Event('fullscreenchange'));
    for (const type of ['copy', 'paste', 'contextmenu']) {
      const event = new Event(type, { cancelable: true });
      Object.defineProperty(event, 'clipboardData', { get() { throw new Error('Clipboard contents must not be read'); } });
      expect(f.document.dispatchEvent(event)).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    }
    f.setOnline(true);
    await f.controller.flush();
    expect(f.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = f.fetch.mock.calls[0];
    expect(url).toBe('/api/attempts/owned-attempt/monitoring');
    expect(options.credentials).toBe('same-origin');
    expect(Object.keys(JSON.parse(options.body as string))).toEqual(['events']);
    const events = sentEvents(options);
    expect(new Set(events.map(event => event.eventType))).toEqual(new Set(MONITORING_EVENT_TYPES));
    for (const event of events) {
      expect(Object.keys(event).sort()).toEqual(['clientEventId', 'clientTimestamp', 'eventType', 'sequence']);
      expect(event.clientTimestamp).toBe('2026-10-07T00:00:00.000Z');
    }
    expect(events.map(event => event.sequence)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(f.store.size).toBe(0);
    f.controller.stop();
  });

  it('debounces same-type noise while preserving separate native signals from one action', async () => {
    const f = fixture();
    f.setOnline(false);
    f.controller.start();
    for (let i = 0; i < 100; i++) f.window.dispatchEvent(new Event('blur'));
    f.document.visibilityState = 'hidden';
    f.document.dispatchEvent(new Event('visibilitychange'));
    vi.setSystemTime(Date.now() + 1000);
    f.window.dispatchEvent(new Event('blur'));
    f.setOnline(true);
    await f.controller.flush();
    expect(sentEvents(f.fetch.mock.calls[0][1]).map(event => event.eventType)).toEqual(['WINDOW_BLUR', 'TAB_HIDDEN', 'WINDOW_BLUR']);
    f.controller.stop();
  });

  it('retries network failure with immutable IDs and backoff without rejecting to the exam', async () => {
    const f = fixture();
    f.fetch.mockRejectedValueOnce(new Error('offline'));
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    await expect(f.controller.flush()).resolves.toBeUndefined();
    const first = sentEvents(f.fetch.mock.calls[0][1]);
    expect(savedEvents(f.store)).toEqual(first);
    await f.controller.flush();
    expect(f.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.fetch).toHaveBeenCalledTimes(2);
    expect(sentEvents(f.fetch.mock.calls[1][1])).toEqual(first);
    expect(f.store.size).toBe(0);
    f.controller.stop();
  });

  it('times out a stuck upload and later retries rather than keeping collection blocked', async () => {
    const f = fixture();
    f.fetch.mockImplementationOnce(() => new Promise(() => {}));
    f.controller.start();
    f.document.dispatchEvent(new Event('paste'));
    const upload = f.controller.flush();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(upload).resolves.toBeUndefined();
    expect((f.fetch.mock.calls[0][1].signal as AbortSignal).aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.fetch).toHaveBeenCalledTimes(2);
    expect(sentEvents(f.fetch.mock.calls[1][1])).toEqual(sentEvents(f.fetch.mock.calls[0][1]));
    f.controller.stop();
  });

  it('persists offline events across refresh and removes old listeners during Strict Mode cleanup', async () => {
    const f = fixture();
    f.setOnline(false);
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    const original = savedEvents(f.store)[0];
    f.controller.dispose();
    f.document.dispatchEvent(new Event('paste'));
    expect(savedEvents(f.store)).toHaveLength(1);
    const replacement = createAttemptMonitoring('owned-attempt', f.environment);
    replacement.start();
    f.document.dispatchEvent(new Event('contextmenu'));
    f.setOnline(true);
    f.window.dispatchEvent(new Event('online'));
    await Promise.resolve();
    await Promise.resolve();
    const events = sentEvents(f.fetch.mock.calls[0][1]);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(original);
    expect(events[1].eventType).toBe('CONTEXT_MENU_ATTEMPT');
    replacement.stop();
  });

  it('uses distinct event identities in concurrent documents and carries only original IDs when a tab copies pending storage', async () => {
    const first = fixture();
    first.setOnline(false);
    first.controller.start();
    first.document.dispatchEvent(new Event('copy'));
    const copiedStore = new Map(first.store);
    const second = fixture(copiedStore);
    second.controller.start();
    second.document.dispatchEvent(new Event('copy'));
    await second.controller.flush();
    const secondEvents = sentEvents(second.fetch.mock.calls[0][1]);
    expect(secondEvents[0]).toEqual(savedEvents(first.store)[0]);
    expect(secondEvents[1].clientEventId).not.toBe(secondEvents[0].clientEventId);
    expect(first.fetch).not.toHaveBeenCalled();
    first.controller.stop();
    second.controller.stop();
  });

  it('bounds the offline queue and upload batches during a long noisy attempt', async () => {
    const f = fixture();
    f.setOnline(false);
    f.controller.start();
    for (let i = 0; i < 105; i++) {
      vi.setSystemTime(Date.now() + 1000);
      f.document.dispatchEvent(new Event('copy'));
    }
    expect(savedEvents(f.store)).toHaveLength(100);
    f.setOnline(true);
    await f.controller.flush();
    expect(sentEvents(f.fetch.mock.calls[0][1])).toHaveLength(20);
    expect(savedEvents(f.store)).toHaveLength(80);
    f.controller.stop();
  });

  it.each([400, 401, 403, 404, 409, 410, 413, 422])('stops on terminal status %s without affecting native interactions', async status => {
    const f = fixture();
    f.fetch.mockResolvedValue({ ok: false, status });
    f.controller.start();
    f.document.dispatchEvent(new Event('paste'));
    await f.controller.flush();
    f.document.dispatchEvent(new Event('copy'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(f.fetch).toHaveBeenCalledTimes(1);
    expect(f.store.size).toBe(0);
  });

  it.each([429, 503])('silently keeps pending events on temporary status %s', async status => {
    const f = fixture();
    f.fetch.mockResolvedValueOnce({ ok: false, status });
    f.controller.start();
    f.document.dispatchEvent(new Event('contextmenu'));
    await f.controller.flush();
    expect(savedEvents(f.store)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(f.fetch).toHaveBeenCalledTimes(2);
    f.controller.stop();
  });

  it('honors the server rate-limit retry window without periodic upload spam', async () => {
    const f = fixture();
    f.fetch.mockResolvedValueOnce({ ok: false, status: 429, headers: { get: () => '60' } });
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    await f.controller.flush();
    await vi.advanceTimersByTimeAsync(59999);
    expect(f.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(f.fetch).toHaveBeenCalledTimes(2);
    f.controller.stop();
  });

  it('does not let a disposed in-flight acknowledgement erase a replacement effect queue', async () => {
    const f = fixture();
    let acknowledge: (value: { ok: boolean; status: number }) => void = () => {};
    f.fetch.mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; }));
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    const firstUpload = f.controller.flush();
    f.controller.dispose();
    const replacement = createAttemptMonitoring('owned-attempt', f.environment);
    replacement.start();
    f.document.dispatchEvent(new Event('paste'));
    acknowledge({ ok: true, status: 200 });
    await firstUpload;
    expect(savedEvents(f.store).map(event => event.eventType)).toEqual(['COPY_ATTEMPT', 'PASTE_ATTEMPT']);
    await replacement.flush();
    expect(sentEvents(f.fetch.mock.calls[1][1]).map(event => event.eventType)).toEqual(['COPY_ATTEMPT', 'PASTE_ATTEMPT']);
    expect(f.store.size).toBe(0);
    replacement.stop();
  });

  it('handles an in-flight abort rejection during cleanup while preserving the refresh queue', async () => {
    const f = fixture();
    f.fetch.mockImplementationOnce((_, options) => new Promise((_, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
    }));
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    const upload = f.controller.flush();
    f.controller.dispose();
    await expect(upload).resolves.toBeUndefined();
    expect(savedEvents(f.store)).toHaveLength(1);
    const replacement = createAttemptMonitoring('owned-attempt', f.environment);
    replacement.start();
    await replacement.flush();
    expect(f.store.size).toBe(0);
    replacement.stop();
    await vi.advanceTimersByTimeAsync(60000);
    expect(f.fetch).toHaveBeenCalledTimes(2);
  });

  it('flushes hidden / pagehide signals with keepalive while ignoring unsupported fullscreen transitions', async () => {
    const f = fixture();
    f.controller.start();
    f.document.dispatchEvent(new Event('fullscreenchange'));
    f.document.visibilityState = 'hidden';
    f.document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(f.fetch.mock.calls[0][1].keepalive).toBe(true);
    expect(sentEvents(f.fetch.mock.calls[0][1]).map(event => event.eventType)).toEqual(['TAB_HIDDEN']);
    vi.setSystemTime(Date.now() + 2000);
    f.document.dispatchEvent(new Event('copy'));
    f.window.dispatchEvent(new Event('pagehide'));
    await Promise.resolve();
    await Promise.resolve();
    expect(f.fetch.mock.calls[1][1].keepalive).toBe(true);
    f.controller.stop();
  });

  it('isolates storage, identity and network exceptions and discards malformed persisted payloads', async () => {
    const f = fixture();
    f.storage.getItem.mockImplementation(() => { throw new Error('denied'); });
    f.storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    f.storage.removeItem.mockImplementation(() => { throw new Error('denied'); });
    const controller = createAttemptMonitoring('owned-attempt', f.environment);
    controller.start();
    expect(() => f.document.dispatchEvent(new Event('copy'))).not.toThrow();
    f.fetch.mockRejectedValue(new Error('unavailable'));
    await expect(controller.flush()).resolves.toBeUndefined();
    expect(() => controller.stop()).not.toThrow();

    const malformed = fixture(new Map([[monitoringStorageKey('owned-attempt'), JSON.stringify([
      { clientEventId: 'no-id', eventType: 'COPY_ATTEMPT', clipboard: 'forbidden' },
    ])]]));
    malformed.controller.start();
    await malformed.controller.flush();
    expect(malformed.fetch).not.toHaveBeenCalled();
    malformed.environment.createEventId = () => { throw new Error('crypto unavailable'); };
    expect(() => malformed.document.dispatchEvent(new Event('paste'))).not.toThrow();
    await malformed.controller.flush();
    expect(malformed.fetch).not.toHaveBeenCalled();
    malformed.controller.stop();
  });

  it('stop for expiry / result redirect is synchronous and clears collection without waiting for an upload', async () => {
    const f = fixture();
    f.fetch.mockImplementationOnce(() => new Promise(() => {}));
    f.controller.start();
    f.document.dispatchEvent(new Event('copy'));
    void f.controller.flush();
    expect(f.controller.stop()).toBeUndefined();
    expect(f.store.size).toBe(0);
    const signal = f.fetch.mock.calls[0][1].signal as AbortSignal;
    expect(signal.aborted).toBe(true);
    f.document.dispatchEvent(new Event('paste'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(f.fetch).toHaveBeenCalledTimes(1);
  });
});
