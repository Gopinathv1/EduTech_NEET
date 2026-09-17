import { expect, it, vi } from 'vitest';
vi.mock('@/lib/prisma', () => ({ prisma: { testAttempt: { findMany: vi.fn() } } }));
vi.mock('@/lib/attempts/service', () => ({ finalizeAttempt: vi.fn() }));
import { prisma } from '@/lib/prisma';
import { finalizeAttempt } from '@/lib/attempts/service';
import { finalizeExpiredAttempts } from '@/lib/attempts/expiry';
it('finalizes expired sessions without a browser request and leaves live sessions alone', async () => {
  const now = new Date('2026-09-17T12:00:00Z');
  vi.mocked(prisma.testAttempt.findMany).mockResolvedValue([
    { id: 'expired', startedAt: new Date('2026-09-17T09:00:00Z'), test: { durationMinutes: 180 } },
    { id: 'live', startedAt: new Date('2026-09-17T11:00:00Z'), test: { durationMinutes: 180 } },
  ] as never);
  vi.mocked(finalizeAttempt).mockResolvedValue({ ok: true, alreadyDone: false });
  expect(await finalizeExpiredAttempts(now)).toBe(1);
  expect(finalizeAttempt).toHaveBeenCalledExactlyOnceWith('expired', { auto: true });
});
