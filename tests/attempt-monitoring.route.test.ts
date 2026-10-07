import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ session: vi.fn(), ingest: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.session }));
vi.mock('@/lib/attempts/monitoring', () => ({ ingestAttemptMonitoring: mocks.ingest }));

import { POST } from '@/app/api/attempts/[id]/monitoring/route';
import { monitoringBatchSchema } from '@/lib/validation/monitoring';
import { MONITORING_EVENT_TYPES } from '@/lib/attempts/monitoring-contract';

const event = { clientEventId: '00000000-0000-4000-8000-000000000001', eventType: 'TAB_HIDDEN' };
const crossSiteHeaders: Array<Record<string, string>> = [
  { origin: 'https://other.test' }, { 'sec-fetch-site': 'cross-site' },
];
function request(body: unknown = { events: [event] }, headers: Record<string, string> = {}) {
  return new Request('https://sivora.test/api/attempts/attempt/monitoring', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}
async function post(req = request(), id = 'attempt') {
  return POST(req, { params: Promise.resolve({ id }) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ kind: 'student', sub: 'owner' });
  mocks.ingest.mockResolvedValue({ status: 'stored', saved: 1, ignored: 0 });
});

describe('strict monitoring payload', () => {
  it('accepts only supported events with optional ISO clock and bounded sequence', () => {
    for (const eventType of MONITORING_EVENT_TYPES) {
      expect(monitoringBatchSchema.safeParse({ events: [{ ...event, eventType, clientTimestamp: '2026-10-07T10:00:00+05:30', sequence: 0 }] }).success).toBe(true);
    }
  });

  it.each([
    { events: [] },
    { events: Array.from({ length: 21 }, () => event) },
    { events: [{ ...event, eventType: 'CHEATING' }] },
    { events: [{ ...event, clientEventId: 'invented' }] },
    { events: [{ ...event, sequence: -1 }] },
    { events: [{ ...event, sequence: 2_147_483_648 }] },
    { events: [{ ...event, sequence: 1.5 }] },
    { events: [{ ...event, clientTimestamp: 'yesterday' }] },
    { events: [{ ...event, clipboardContents: 'private' }] },
    { events: [{ ...event, deviceFingerprint: 'private' }] },
    { events: [{ ...event, attemptId: 'other' }] },
    { events: [{ ...event, studentId: 'other' }] },
    { events: [{ ...event, recordedAt: '2026-10-07T10:00:00Z' }] },
    { events: [event], cheatingScore: 1 },
    { events: [event], attemptId: 'other' },
    { events: [event], studentId: 'other' },
  ])('rejects invalid or extraneous fields: %j', body => {
    expect(monitoringBatchSchema.safeParse(body).success).toBe(false);
  });
});

describe('monitoring endpoint', () => {
  it.each([null, { kind: 'admin', sub: 'admin' }])('requires a student session (%j)', async session => {
    mocks.session.mockResolvedValue(session);
    expect((await post()).status).toBe(401);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('uses the authenticated identity and route attempt id', async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, saved: 1, ignored: 0 });
    expect(mocks.ingest).toHaveBeenCalledWith('attempt', 'owner', { events: [event] });
  });

  it('rejects metadata before reaching persistence', async () => {
    expect((await post(request({ events: [{ ...event, clipboardContents: 'private' }] }))).status).toBe(400);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it.each(crossSiteHeaders)('rejects a cross-site request (%j)', async headers => {
    expect((await post(request(undefined, headers))).status).toBe(403);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('accepts the same-origin JSON client upload', async () => {
    expect((await post(request(undefined, { origin: 'https://sivora.test', 'sec-fetch-site': 'same-origin' }))).status).toBe(200);
  });

  it('rejects non-JSON content types', async () => {
    expect((await post(request(undefined, { 'content-type': 'text/plain' }))).status).toBe(400);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const req = new Request('https://sivora.test/api/attempts/attempt/monitoring', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken',
    });
    expect((await post(req)).status).toBe(400);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('bounds actual streamed payload size even without content-length', async () => {
    expect((await post(request({ events: [event], excess: 'x'.repeat(16_384) }))).status).toBe(413);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('cancels a multi-chunk upload at the byte bound despite a misleading small content-length', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new TextEncoder().encode('x'.repeat(9000));
        controller.enqueue(chunk);
        controller.enqueue(chunk);
      },
      cancel,
    });
    const options: RequestInit & { duplex: 'half' } = {
      method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1' },
      body: stream, duplex: 'half',
    };
    const req = new Request('https://sivora.test/api/attempts/attempt/monitoring', options);
    expect((await post(req)).status).toBe(413);
    expect(cancel).toHaveBeenCalled();
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it('rejects a declared oversize body before parsing', async () => {
    expect((await post(request(undefined, { 'content-length': '20000' }))).status).toBe(413);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it.each([
    ['notFound', 404, 'attemptNotFound'], ['closed', 409, 'attemptClosed'],
    ['expired', 409, 'timeUp'], ['unavailable', 503, 'monitoringUnavailable'],
  ])('maps %s without raw internal data', async (status, code, error) => {
    mocks.ingest.mockResolvedValue({ status });
    const res = await post();
    expect(res.status).toBe(code);
    expect(await res.json()).toEqual({ ok: false, error });
  });

  it('returns retryable rate limits without affecting the attempt engine', async () => {
    mocks.ingest.mockResolvedValue({ status: 'rateLimited', retryAfterSeconds: 60 });
    const res = await post();
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(await res.json()).toEqual({ ok: false, error: 'monitoringRateLimited', retryAfterSeconds: 60 });
  });

  it('contains unexpected monitoring failures', async () => {
    mocks.ingest.mockRejectedValue(new Error('secret database detail'));
    const res = await post();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'monitoringUnavailable' });
  });
});
