import { prisma } from '@/lib/prisma';
import { isTimeUp } from '@/lib/attempts/timer';
import {
  MONITORING_MAX_EVENTS_PER_ATTEMPT,
  MONITORING_MAX_EVENTS_PER_MINUTE,
  type MonitoringEventType,
} from '@/lib/attempts/monitoring-contract';
import type { MonitoringBatch } from '@/lib/validation/monitoring';

export type MonitoringIngestResult =
  | { status: 'stored'; saved: number; ignored: number }
  | { status: 'notFound' | 'closed' | 'expired' | 'unavailable' }
  | { status: 'rateLimited'; retryAfterSeconds: number };

export interface AttemptMonitoringSummary {
  count: number;
  events: Array<{ id: string; eventType: MonitoringEventType; recordedAt: Date }>;
}

const DEBOUNCE_MS = 1000;

function plausibleClientTime(value: string | undefined, startedAt: Date, now: Date): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= startedAt.getTime() && time <= now.getTime() + 5000
    ? time : null;
}

/**
 * Best-effort monitoring has no writes to the attempt/answer/result tables and
 * never finalizes an expired attempt. Serializable reads bound concurrent tabs
 * and instances without taking the answer engine's parent-row write lock.
 */
export async function ingestAttemptMonitoring(
  attemptId: string,
  studentId: string,
  batch: MonitoringBatch,
): Promise<MonitoringIngestResult> {
  try {
    return await prisma.$transaction(async tx => {
      const attempt = await tx.testAttempt.findFirst({
        where: { id: attemptId, studentId },
        select: { status: true, startedAt: true, test: { select: { durationMinutes: true } } },
      });
      if (!attempt) return { status: 'notFound' };
      if (attempt.status !== 'IN_PROGRESS') return { status: 'closed' };
      const now = new Date();
      if (isTimeUp(attempt.startedAt, attempt.test.durationMinutes, now)) return { status: 'expired' };

      const recent = await tx.attemptMonitoringEvent.findMany({
        where: {
          attemptId,
          OR: [
            { clientEventId: { in: batch.events.map(event => event.clientEventId) } },
            { recordedAt: { gte: new Date(now.getTime() - DEBOUNCE_MS) } },
          ],
        },
        select: { clientEventId: true, eventType: true, recordedAt: true },
      });
      const seenIds = new Set(recent.map(event => event.clientEventId));
      // A null marker denotes an event already received less than a second ago.
      const seenTypes = new Map<MonitoringEventType, number | null>();
      for (const event of recent) {
        if (event.recordedAt.getTime() >= now.getTime() - DEBOUNCE_MS) seenTypes.set(event.eventType, null);
      }
      const retained: MonitoringBatch['events'] = [];
      for (const event of batch.events) {
        if (seenIds.has(event.clientEventId)) continue;
        seenIds.add(event.clientEventId);
        const clientTime = plausibleClientTime(event.clientTimestamp, attempt.startedAt, now);
        if (seenTypes.has(event.eventType)) {
          const previousClientTime = seenTypes.get(event.eventType);
          // Buffered, distinct occurrences in one batch retain their own rows.
          // Optional client clocks inform noise suppression only, never expiry,
          // rate limiting, history order, or the recordedAt database default.
          if (previousClientTime == null || clientTime == null || clientTime - previousClientTime < DEBOUNCE_MS) continue;
        }
        seenTypes.set(event.eventType, clientTime);
        retained.push(event);
      }
      if (retained.length === 0) return { status: 'stored', saved: 0, ignored: batch.events.length };

      const [total, inMinute] = await Promise.all([
        tx.attemptMonitoringEvent.count({ where: { attemptId } }),
        tx.attemptMonitoringEvent.count({
          where: { attemptId, recordedAt: { gte: new Date(now.getTime() - 60_000) } },
        }),
      ]);
      // A full attempt acknowledges and drops further monitoring signals. The
      // cap cannot leave an exam waiting on an endlessly retried queue.
      if (total >= MONITORING_MAX_EVENTS_PER_ATTEMPT) {
        return { status: 'stored', saved: 0, ignored: batch.events.length };
      }
      const toSave = retained.slice(0, MONITORING_MAX_EVENTS_PER_ATTEMPT - total);
      if (inMinute + toSave.length > MONITORING_MAX_EVENTS_PER_MINUTE) {
        return { status: 'rateLimited', retryAfterSeconds: 60 };
      }
      // Recheck the deadline after reads, without touching the existing timer.
      if (isTimeUp(attempt.startedAt, attempt.test.durationMinutes)) return { status: 'expired' };
      const inserted = await tx.attemptMonitoringEvent.createMany({
        data: toSave.map(event => ({
          attemptId,
          clientEventId: event.clientEventId,
          eventType: event.eventType,
          ...(event.clientTimestamp ? { clientTimestamp: new Date(event.clientTimestamp) } : {}),
          ...(event.sequence !== undefined ? { sequence: event.sequence } : {}),
        })),
        skipDuplicates: true,
      });
      return { status: 'stored', saved: inserted.count, ignored: batch.events.length - inserted.count };
    }, { isolationLevel: 'Serializable', maxWait: 1000, timeout: 3000 });
  } catch (error) {
    // Retrying immutable IDs is safe after a serialization conflict. No raw
    // database errors or student data are returned to the browser.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
      return { status: 'rateLimited', retryAfterSeconds: 1 };
    }
    return { status: 'unavailable' };
  }
}

/** Read-only, owned result history. Missing/unavailable storage never breaks results. */
export async function readAttemptMonitoringSummary(
  attemptId: string,
  studentId: string,
): Promise<AttemptMonitoringSummary | null> {
  try {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, studentId }, select: { id: true },
    });
    if (!attempt) return null;
    const [count, events] = await Promise.all([
      prisma.attemptMonitoringEvent.count({ where: { attemptId } }),
      prisma.attemptMonitoringEvent.findMany({
        where: { attemptId },
        orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: { id: true, eventType: true, recordedAt: true },
      }),
    ]);
    return { count, events };
  } catch {
    return null;
  }
}
