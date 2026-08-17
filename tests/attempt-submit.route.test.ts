import { describe, it, expect, vi, beforeEach } from 'vitest';

const session = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/session', () => session);
const svc = vi.hoisted(() => ({ loadAttemptContext: vi.fn(), finalizeAttempt: vi.fn() }));
vi.mock('@/lib/attempts/service', () => svc);
// isTimeUp (lib/attempts/timer) is kept real — that's the behaviour under test.

import { POST } from '@/app/api/attempts/[id]/submit/route';

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = () => new Request('http://localhost/api/attempts/att1/submit', { method: 'POST' });

beforeEach(() => {
  vi.clearAllMocks();
  session.getSession.mockResolvedValue({ sub: 's1', kind: 'student', role: 'STUDENT', name: 'S' });
});

describe('POST /api/attempts/[id]/submit', () => {
  it('401s when not a student', async () => {
    session.getSession.mockResolvedValue(null);
    const res = await POST(req(), ctx('att1'));
    expect(res.status).toBe(401);
    expect(svc.finalizeAttempt).not.toHaveBeenCalled();
  });

  it('404s when the attempt is not the student’s', async () => {
    svc.loadAttemptContext.mockResolvedValue(null); // scoped by studentId → not found
    const res = await POST(req(), ctx('att1'));
    expect(res.status).toBe(404);
  });

  it('is idempotent for an already-finalised attempt (no re-finalise)', async () => {
    svc.loadAttemptContext.mockResolvedValue({
      status: 'SUBMITTED',
      startedAt: new Date(),
      test: { durationMinutes: 60 },
    });
    const res = await POST(req(), ctx('att1'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('SUBMITTED');
    expect(json.redirect).toBe('/student/results/att1');
    expect(svc.finalizeAttempt).not.toHaveBeenCalled();
  });

  it('records a manual submit (not auto) when time remains', async () => {
    svc.loadAttemptContext.mockResolvedValue({
      status: 'IN_PROGRESS',
      startedAt: new Date(), // just started
      test: { durationMinutes: 60 },
    });
    svc.finalizeAttempt.mockResolvedValue({ ok: true, status: 'SUBMITTED' });
    const res = await POST(req(), ctx('att1'));
    expect(res.status).toBe(200);
    expect(svc.finalizeAttempt).toHaveBeenCalledWith('att1', { auto: false });
    expect((await res.json()).status).toBe('SUBMITTED');
  });

  it('auto-submits when the deadline has already passed', async () => {
    svc.loadAttemptContext.mockResolvedValue({
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      test: { durationMinutes: 30 },
    });
    svc.finalizeAttempt.mockResolvedValue({ ok: true, status: 'AUTO_SUBMITTED' });
    const res = await POST(req(), ctx('att1'));
    expect(res.status).toBe(200);
    expect(svc.finalizeAttempt).toHaveBeenCalledWith('att1', { auto: true });
    expect((await res.json()).status).toBe('AUTO_SUBMITTED');
  });
});
