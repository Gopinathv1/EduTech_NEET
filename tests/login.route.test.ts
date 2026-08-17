import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn() } },
}));
// Mock session so the route doesn't touch next/headers cookies().
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
// Bypass the DB-backed rate limiter (its own behaviour is tested separately).
vi.mock('@/lib/auth/rate-limit', () => ({
  enforceRateLimit: vi.fn(async () => null),
  clientIp: vi.fn(() => '127.0.0.1'),
}));
// Locale sync writes a cookie via next/headers — stub it out.
vi.mock('@/lib/locale', () => ({ syncLocaleFromProfile: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { POST } from '@/app/api/auth/login/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

function req(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('signs in a verified student with the correct password', async () => {
    const passwordHash = await hashPassword('secret12');
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      mobile: '9876543210',
      email: 'ravi@example.com',
      passwordHash,
      isMobileVerified: true,
      preferredLanguage: 'ta',
    });

    const res = await POST(req({ identifier: '+91 98765-43210', password: 'secret12' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.redirect).toBe('/student');
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 's1', kind: 'student', role: 'STUDENT', name: 'Ravi' }),
    );
    expect(p.student.findUnique).toHaveBeenCalledWith({ where: { mobile: '9876543210' } });
  });

  it('signs in a verified student using email case-insensitively', async () => {
    const passwordHash = await hashPassword('secret12');
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      mobile: '9876543210',
      email: 'ravi@example.com',
      passwordHash,
      isMobileVerified: true,
      preferredLanguage: 'en',
    });

    const res = await POST(req({ identifier: ' Ravi@Example.COM ', password: 'secret12' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.redirect).toBe('/student');
    expect(p.student.findUnique).toHaveBeenCalledWith({ where: { email: 'ravi@example.com' } });
    expect(createSession).toHaveBeenCalled();
  });

  it('rejects a wrong password with a generic error', async () => {
    const passwordHash = await hashPassword('secret12');
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      email: 'ravi@example.com',
      passwordHash,
      isMobileVerified: true,
      preferredLanguage: 'en',
    });

    const res = await POST(req({ identifier: 'ravi@example.com', password: 'wrongpass' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('invalidCredentials');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('blocks an unverified account', async () => {
    const passwordHash = await hashPassword('secret12');
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      mobile: '9876543210',
      passwordHash,
      isMobileVerified: false,
      preferredLanguage: 'en',
    });

    const res = await POST(req({ identifier: '9876543210', password: 'secret12' }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('notVerified');
  });

  it('returns a validation error for empty input', async () => {
    const res = await POST(req({ identifier: '', password: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
  });

  it('returns a validation error for an invalid identifier', async () => {
    const res = await POST(req({ identifier: 'not-a-mobile-or-email', password: 'secret12' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
    expect(p.student.findUnique).not.toHaveBeenCalled();
  });
});
