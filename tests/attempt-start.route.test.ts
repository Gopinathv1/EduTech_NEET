import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/attempts/service', () => ({ startOrResumeAttempt: vi.fn() }));
import { getSession } from '@/lib/auth/session';
import { startOrResumeAttempt } from '@/lib/attempts/service';
import { POST } from '@/app/api/attempts/route';
beforeEach(() => vi.clearAllMocks());
it('never starts for an unauthenticated visitor', async () => {
  vi.mocked(getSession).mockResolvedValue(null);
  expect((await POST(new Request('http://localhost/api/attempts', { method: 'POST' }))).status).toBe(401);
  expect(startOrResumeAttempt).not.toHaveBeenCalled();
});
