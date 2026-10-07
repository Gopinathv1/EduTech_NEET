import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findAttempt: vi.fn(),
  findEvents: vi.fn(),
  count: vi.fn(),
  createMany: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    testAttempt: { findFirst: mocks.findAttempt },
    attemptMonitoringEvent: { findMany: mocks.findEvents, count: mocks.count, createMany: mocks.createMany },
  },
}));

import { ingestAttemptMonitoring, readAttemptMonitoringSummary } from '@/lib/attempts/monitoring';
import { MONITORING_EVENT_TYPES, type ClientMonitoringEvent } from '@/lib/attempts/monitoring-contract';

const NOW = new Date('2026-10-07T10:00:00.000Z');
const startedAt = new Date('2026-10-07T09:30:00.000Z');
const tx = {
  testAttempt: { findFirst: mocks.findAttempt },
  attemptMonitoringEvent: { findMany: mocks.findEvents, count: mocks.count, createMany: mocks.createMany },
};
function event(index = 1, eventType: ClientMonitoringEvent['eventType'] = 'TAB_HIDDEN'): ClientMonitoringEvent {
  return { clientEventId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, eventType };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mocks.findAttempt.mockResolvedValue({ status: 'IN_PROGRESS', startedAt, test: { durationMinutes: 60 } });
  mocks.findEvents.mockResolvedValue([]);
  mocks.count.mockResolvedValue(0);
  mocks.createMany.mockImplementation(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
  mocks.transaction.mockImplementation(async (callback: (value: typeof tx) => unknown) => callback(tx));
});
afterEach(() => vi.useRealTimers());

describe('attempt monitoring ingestion', () => {
  it('stores all nine neutral types with DB receipt time and no existing-table mutation API', async () => {
    const events = MONITORING_EVENT_TYPES.map((type, index) => ({
      ...event(index + 1, type), clientTimestamp: NOW.toISOString(), sequence: index,
    }));
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events })).toEqual({ status: 'stored', saved: 9, ignored: 0 });
    expect(mocks.findAttempt).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'attempt', studentId: 'owner' } }));
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable', maxWait: 1000, timeout: 3000,
    });
    const data = mocks.createMany.mock.calls[0][0].data;
    expect(data[0]).toEqual({
      attemptId: 'attempt', clientEventId: events[0].clientEventId, eventType: 'TAB_HIDDEN',
      clientTimestamp: NOW, sequence: 0,
    });
    expect(data.every((row: Record<string, unknown>) => !('recordedAt' in row))).toBe(true);
    expect(mocks.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
    // The transaction fixture deliberately provides no attempt update,
    // answer/result, scoring, notification, or finalization collaborator.
  });

  it('rejects non-owned or missing attempts before any event read/write', async () => {
    mocks.findAttempt.mockResolvedValue(null);
    expect(await ingestAttemptMonitoring('attempt', 'other-student', { events: [event()] })).toEqual({ status: 'notFound' });
    expect(mocks.findEvents).not.toHaveBeenCalled();
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it.each(['SUBMITTED', 'AUTO_SUBMITTED'])('rejects %s without changing anything', async status => {
    mocks.findAttempt.mockResolvedValue({ status, startedAt, test: { durationMinutes: 60 } });
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] })).toEqual({ status: 'closed' });
    expect(mocks.findEvents).not.toHaveBeenCalled();
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it('rejects at the exact server deadline without finalizing or trusting a client timestamp', async () => {
    mocks.findAttempt.mockResolvedValue({ status: 'IN_PROGRESS', startedAt, test: { durationMinutes: 30 } });
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [{ ...event(), clientTimestamp: startedAt.toISOString() }] }))
      .toEqual({ status: 'expired' });
    expect(mocks.findEvents).not.toHaveBeenCalled();
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it('rechecks expiry after storage reads', async () => {
    mocks.findAttempt.mockResolvedValue({ status: 'IN_PROGRESS', startedAt, test: { durationMinutes: 31 } });
    mocks.count.mockImplementation(async () => { vi.setSystemTime(new Date(NOW.getTime() + 60_000)); return 0; });
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] })).toEqual({ status: 'expired' });
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it('acknowledges duplicate immutable IDs from retries and within a batch', async () => {
    mocks.findEvents.mockResolvedValue([{ ...event(), recordedAt: startedAt }]);
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event(), event(), event(2, 'WINDOW_BLUR')] }))
      .toEqual({ status: 'stored', saved: 1, ignored: 2 });
    expect(mocks.createMany.mock.calls[0][0].data).toEqual([{ attemptId: 'attempt', ...event(2, 'WINDOW_BLUR') }]);
  });

  it('does not deduplicate an event ID across different attempts', async () => {
    await ingestAttemptMonitoring('another-attempt', 'owner', { events: [event()] });
    expect(mocks.findEvents.mock.calls[0][0].where.attemptId).toBe('another-attempt');
    expect(mocks.createMany.mock.calls[0][0].data[0].attemptId).toBe('another-attempt');
  });

  it('collapses rapid repeated types but preserves multiple distinct native types', async () => {
    mocks.findEvents.mockResolvedValue([{ ...event(99), recordedAt: new Date(NOW.getTime() - 100) }]);
    const events = [event(1), event(2, 'WINDOW_BLUR'), event(3, 'WINDOW_BLUR'), event(4, 'COPY_ATTEMPT')];
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events })).toEqual({ status: 'stored', saved: 2, ignored: 2 });
    expect(mocks.createMany.mock.calls[0][0].data.map((row: ClientMonitoringEvent) => row.eventType))
      .toEqual(['WINDOW_BLUR', 'COPY_ATTEMPT']);
  });

  it('preserves buffered same-type occurrences with plausible client times one second apart', async () => {
    const events = [0, 500, 1500].map((milliseconds, index) => ({
      ...event(index + 1), clientTimestamp: new Date(startedAt.getTime() + milliseconds).toISOString(),
    }));
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events })).toEqual({ status: 'stored', saved: 2, ignored: 1 });
  });

  it.each(['2026-10-07T09:00:00Z', '2026-10-07T11:00:00Z'])('does not let implausible client time %s bypass noise suppression', async clientTimestamp => {
    const events = [{ ...event(), clientTimestamp }, { ...event(2), clientTimestamp: NOW.toISOString() }];
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events })).toEqual({ status: 'stored', saved: 1, ignored: 1 });
  });

  it('limits receipt rate from all tabs using stored server timestamps', async () => {
    mocks.count.mockResolvedValueOnce(200).mockResolvedValueOnce(60);
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] }))
      .toEqual({ status: 'rateLimited', retryAfterSeconds: 60 });
    expect(mocks.count.mock.calls[1][0].where.recordedAt.gte).toEqual(new Date(NOW.getTime() - 60_000));
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it('caps total storage and acknowledges later signals without endless retries', async () => {
    mocks.count.mockResolvedValueOnce(1000).mockResolvedValueOnce(0);
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] }))
      .toEqual({ status: 'stored', saved: 0, ignored: 1 });
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it('cannot overshoot the total cap with a last partial batch', async () => {
    mocks.count.mockResolvedValueOnce(999).mockResolvedValueOnce(0);
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event(), event(2, 'WINDOW_BLUR')] }))
      .toEqual({ status: 'stored', saved: 1, ignored: 1 });
    expect(mocks.createMany.mock.calls[0][0].data).toHaveLength(1);
  });

  it('makes a serialization conflict safely retryable with unchanged IDs', async () => {
    mocks.transaction.mockRejectedValue({ code: 'P2034' });
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] }))
      .toEqual({ status: 'rateLimited', retryAfterSeconds: 1 });
  });

  it('isolates missing-table and network failures as monitoring unavailable', async () => {
    mocks.transaction.mockRejectedValue(new Error('database unavailable'));
    expect(await ingestAttemptMonitoring('attempt', 'owner', { events: [event()] })).toEqual({ status: 'unavailable' });
  });
});

describe('owned monitoring summary', () => {
  it('returns only count, neutral type, event id and DB receipt time with bounded deterministic history', async () => {
    const events = [{ id: 'row', eventType: 'TAB_HIDDEN', recordedAt: NOW }];
    mocks.count.mockResolvedValue(82);
    mocks.findEvents.mockResolvedValue(events);
    expect(await readAttemptMonitoringSummary('attempt', 'owner')).toEqual({ count: 82, events });
    expect(mocks.findAttempt).toHaveBeenCalledWith({ where: { id: 'attempt', studentId: 'owner' }, select: { id: true } });
    expect(mocks.findEvents).toHaveBeenCalledWith({
      where: { attemptId: 'attempt' }, orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }], take: 50,
      select: { id: true, eventType: true, recordedAt: true },
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('returns null for a non-owner without exposing monitoring counts', async () => {
    mocks.findAttempt.mockResolvedValue(null);
    expect(await readAttemptMonitoringSummary('attempt', 'other')).toBeNull();
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.findEvents).not.toHaveBeenCalled();
  });

  it('keeps results usable if the additive table has not been migrated yet', async () => {
    mocks.count.mockRejectedValue({ code: 'P2021' });
    expect(await readAttemptMonitoringSummary('attempt', 'owner')).toBeNull();
  });
});
