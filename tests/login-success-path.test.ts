import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fixture = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  student: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = fixture.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => fixture.cookies.set(name, value),
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: fixture.student } },
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  enforceRateLimit: vi.fn(async () => null),
  clientIp: vi.fn(() => '127.0.0.1'),
}));

import { POST as login } from '@/app/api/auth/login/route';
import { GET as session } from '@/app/api/auth/me/route';
import { hashPassword } from '@/lib/auth/password';
import { SESSION_COOKIE } from '@/lib/auth/jwt';
import { middleware } from '@/middleware';

const testMobile = '+919876543210';
const testPassword = 'local-test-password';

function loginRequest(password: string) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mobile: testMobile, password, callbackUrl: '/exam-preparation' }),
  });
}

beforeEach(() => {
  fixture.cookies.clear();
  fixture.student.mockReset();
});

describe('student password-login success path', () => {
  it('rejects an invalid password without creating a session', async () => {
    fixture.student.mockResolvedValue({
      id: 'student-test-id',
      name: 'Test Student',
      mobile: testMobile,
      passwordHash: await hashPassword(testPassword),
      preferredLanguage: 'en',
    });

    const response = await login(loginRequest('incorrect-password'));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: 'invalidCredentials' });
    expect(fixture.cookies.has(SESSION_COOKIE)).toBe(false);
  });

  it('creates a verifiable session and authorizes the callback route', async () => {
    fixture.student.mockResolvedValue({
      id: 'student-test-id',
      name: 'Test Student',
      mobile: testMobile,
      passwordHash: await hashPassword(testPassword),
      preferredLanguage: 'en',
    });

    const loginResponse = await login(loginRequest(testPassword));
    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.json()).toMatchObject({ ok: true, redirect: '/exam-preparation' });

    const token = fixture.cookies.get(SESSION_COOKIE);
    expect(token).toBeTruthy();

    const sessionResponse = await session();
    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toMatchObject({
      ok: true,
      user: { sub: 'student-test-id', kind: 'student', role: 'STUDENT', name: 'Test Student' },
    });

    const protectedRequest = new NextRequest('http://localhost/exam-preparation', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
    const middlewareResponse = await middleware(protectedRequest);
    expect(middlewareResponse.status).toBe(200);
    expect(middlewareResponse.headers.get('location')).toBeNull();
  });
});
