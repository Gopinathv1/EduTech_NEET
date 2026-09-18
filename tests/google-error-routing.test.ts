import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  findUnique: vi.fn(),
  createSession: vi.fn(),
  syncLocale: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({ getToken: mocks.getToken }));
vi.mock('@/lib/prisma', () => ({ prisma: { student: { findUnique: mocks.findUnique } } }));
vi.mock('@/lib/auth/session', () => ({ createSession: mocks.createSession }));
vi.mock('@/lib/locale', () => ({ syncLocaleFromProfile: mocks.syncLocale }));

import { GET } from '@/app/api/auth/google/finish/route';
import { authOptions } from '@/lib/auth/nextauth';

beforeEach(() => vi.clearAllMocks());

describe('Google authentication routing', () => {
  it('uses the branded login page for sign-in and OAuth errors', () => {
    expect(authOptions.pages).toMatchObject({ signIn: '/login', error: '/login' });
  });

  it('sends an unknown Google email to a branded register-first state', async () => {
    mocks.getToken.mockResolvedValue({ email: 'unknown@example.com' });
    mocks.findUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest('http://localhost/api/auth/google/finish?callbackUrl=%2Fexam-preparation'),
    );
    const location = new URL(response.headers.get('location')!);

    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('GoogleAccountNotRegistered');
    expect(location.searchParams.get('callbackUrl')).toBe('/exam-preparation');
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it('creates the SIVORA session only for the matching registered account', async () => {
    mocks.getToken.mockResolvedValue({ email: 'known@example.com' });
    mocks.findUnique.mockResolvedValue({
      id: 'student-1',
      name: 'Existing Student',
      mobile: '+919876543210',
      preferredLanguage: 'en',
    });

    const response = await GET(
      new NextRequest('http://localhost/api/auth/google/finish?callbackUrl=%2Fexam-preparation'),
    );

    expect(response.headers.get('location')).toBe('http://localhost/exam-preparation');
    expect(mocks.createSession).toHaveBeenCalledWith({
      sub: 'student-1',
      kind: 'student',
      role: 'STUDENT',
      name: 'Existing Student',
    });
  });

  it('returns callback failures to branded login with the safe callback intact', async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await GET(
      new NextRequest('http://localhost/api/auth/google/finish?callbackUrl=%2Fexam-preparation'),
    );
    const location = new URL(response.headers.get('location')!);

    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('OAuthCallback');
    expect(location.searchParams.get('callbackUrl')).toBe('/exam-preparation');
  });
});
