import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn() } },
}));
vi.mock('@/lib/auth/password', () => ({ verifyPassword: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
vi.mock('@/lib/locale', () => ({ syncLocaleFromProfile: vi.fn() }));
vi.mock('@/lib/auth/rate-limit', () => ({
  enforceRateLimit: vi.fn(async () => null),
  clientIp: vi.fn(() => '127.0.0.1'),
}));

import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/auth/rate-limit';
import { POST } from '@/app/api/auth/login/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const verifyPasswordMock = vi.mocked(verifyPassword);
const createSessionMock = vi.mocked(createSession);
const enforceRateLimitMock = vi.mocked(enforceRateLimit);

function req(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('signs in a student with mobile and password', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      mobile: '+919876543210',
      passwordHash: 'hash',
      preferredLanguage: 'ta',
    });
    verifyPasswordMock.mockResolvedValue(true);

    const res = await POST(req({ mobile: '+91 98765-43210', password: 'correct-password' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.redirect).toBe('/student');
    expect(p.student.findUnique).toHaveBeenCalledWith({ where: { mobile: '+919876543210' } });
    expect(verifyPasswordMock).toHaveBeenCalledWith('correct-password', 'hash');
    expect(createSessionMock).toHaveBeenCalledWith({ sub: 's1', kind: 'student', role: 'STUDENT', name: 'Ravi' });
  });

  it('returns generic invalidCredentials when no matching password account exists', async () => {
    p.student.findUnique.mockResolvedValue(null);

    const res = await POST(req({ mobile: '9876543210', password: 'anything' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('invalidCredentials');
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });

  it('returns generic invalidCredentials for a wrong password', async () => {
    p.student.findUnique.mockResolvedValue({ id: 's1', passwordHash: 'hash' });
    verifyPasswordMock.mockResolvedValue(false);

    const res = await POST(req({ mobile: '9876543210', password: 'wrong-password' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('invalidCredentials');
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('returns a validation error for invalid mobile input', async () => {
    const res = await POST(req({ mobile: 'not-a-mobile', password: 'password123' }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
    expect(p.student.findUnique).not.toHaveBeenCalled();
  });

  it('returns rateLimited before checking credentials', async () => {
    enforceRateLimitMock.mockResolvedValueOnce(60);

    const res = await POST(req({ mobile: '9876543210', password: 'password123' }));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toBe('rateLimited');
    expect(p.student.findUnique).not.toHaveBeenCalled();
  });
});
