import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the collaborators; keep validation + timer logic real so the route's
// time-authority behaviour is genuinely exercised.
vi.mock('@/lib/prisma', () => ({ prisma: { answer: { upsert: vi.fn() } } }));
vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/attempts/service', () => ({ loadAttemptContext: vi.fn(), finalizeAttempt: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { loadAttemptContext, finalizeAttempt } from '@/lib/attempts/service';
import { POST } from '@/app/api/attempts/[id]/answer/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const getSessionMock = vi.mocked(getSession);
const loadCtxMock = vi.mocked(loadAttemptContext);
const finalizeMock = vi.mocked(finalizeAttempt);

const params = Promise.resolve({ id: 'att1' });

function req(body: unknown) {
  return new Request('http://localhost/api/attempts/att1/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// A live attempt started "now" so the deadline is far away.
function liveAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'att1',
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    selectedLanguage: 'en',
    questionOrder: ['q1', 'q2', 'q3'],
    testId: 't1',
    test: { durationMinutes: 180 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ sub: 's1', kind: 'student', role: 'STUDENT', name: 'Ravi' });
});

describe('POST /api/attempts/[id]/answer', () => {
  it('rejects a non-student session', async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(req({ questionId: 'q1', action: 'answer', selectedOption: 'A' }), { params });
    expect(res.status).toBe(401);
    expect(p.answer.upsert).not.toHaveBeenCalled();
  });

  it('validates the body (answer without an option is rejected)', async () => {
    loadCtxMock.mockResolvedValue(liveAttempt() as never);
    const res = await POST(req({ questionId: 'q1', action: 'answer' }), { params });
    expect(res.status).toBe(400);
    expect(p.answer.upsert).not.toHaveBeenCalled();
  });

  it('404s when the attempt is missing or owned by someone else', async () => {
    loadCtxMock.mockResolvedValue(null);
    const res = await POST(req({ questionId: 'q1', action: 'visit' }), { params });
    expect(res.status).toBe(404);
  });

  it('refuses a question outside the frozen set', async () => {
    loadCtxMock.mockResolvedValue(liveAttempt() as never);
    const res = await POST(req({ questionId: 'ghost', action: 'answer', selectedOption: 'A' }), { params });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('questionNotInAttempt');
    expect(p.answer.upsert).not.toHaveBeenCalled();
  });

  it('rejects saves to an already-closed attempt', async () => {
    loadCtxMock.mockResolvedValue(liveAttempt({ status: 'SUBMITTED' }) as never);
    const res = await POST(req({ questionId: 'q1', action: 'answer', selectedOption: 'A' }), { params });
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toBe('attemptClosed');
    expect(json.redirect).toBe('/student/results/att1');
    expect(p.answer.upsert).not.toHaveBeenCalled();
  });

  it('refuses a late answer past the grace window and auto-submits', async () => {
    // Started 4 hours ago on a 180-minute test → well past deadline + grace.
    const startedAt = new Date(Date.now() - 4 * 3600 * 1000);
    loadCtxMock.mockResolvedValue(liveAttempt({ startedAt }) as never);
    finalizeMock.mockResolvedValue({ ok: true, alreadyDone: false, status: 'AUTO_SUBMITTED' });

    const res = await POST(req({ questionId: 'q1', action: 'answer', selectedOption: 'A' }), { params });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('timeUp');
    expect(json.redirect).toBe('/student/results/att1');
    expect(finalizeMock).toHaveBeenCalledWith('att1', { auto: true });
    expect(p.answer.upsert).not.toHaveBeenCalled();
  });

  it('saves a valid answer and returns the authoritative remaining time', async () => {
    loadCtxMock.mockResolvedValue(liveAttempt() as never);
    p.answer.upsert.mockResolvedValue({});

    const res = await POST(
      req({ questionId: 'q2', action: 'answer', selectedOption: 'C', timeSpentDelta: 12 }),
      { params },
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.saved).toBe(true);
    expect(typeof json.remainingSeconds).toBe('number');
    expect(json.remainingSeconds).toBeGreaterThan(0);
    expect(json.remainingSeconds).toBeLessThanOrEqual(180 * 60);

    expect(p.answer.upsert).toHaveBeenCalledTimes(1);
    const arg = p.answer.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ attemptId_questionId: { attemptId: 'att1', questionId: 'q2' } });
    expect(arg.create).toMatchObject({ selectedOption: 'C', visited: true, timeSpentSeconds: 12 });
    expect(arg.update).toMatchObject({ selectedOption: 'C', visited: true, timeSpentSeconds: { increment: 12 } });
    expect(finalizeMock).not.toHaveBeenCalled();
  });

  it('records time spent on a plain visit without changing the option', async () => {
    loadCtxMock.mockResolvedValue(liveAttempt() as never);
    p.answer.upsert.mockResolvedValue({});

    const res = await POST(req({ questionId: 'q1', action: 'visit', timeSpentDelta: 5 }), { params });
    expect(res.status).toBe(200);
    const arg = p.answer.upsert.mock.calls[0][0];
    expect(arg.update).not.toHaveProperty('selectedOption');
    expect(arg.update).toMatchObject({ visited: true, timeSpentSeconds: { increment: 5 } });
  });
});
