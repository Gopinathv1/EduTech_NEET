import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock only verifySession; keep SESSION_COOKIE and the rest of jwt real.
vi.mock('@/lib/auth/jwt', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/jwt')>();
  return { ...actual, verifySession: vi.fn() };
});

import { middleware } from '@/middleware';
import { verifySession } from '@/lib/auth/jwt';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vs = verifySession as any;

const student = { sub: 's1', kind: 'student', role: 'STUDENT', name: 'S' };
const admin = { sub: 'a1', kind: 'admin', role: 'ADMIN', name: 'A' };
const superAdmin = { sub: 'a2', kind: 'admin', role: 'SUPER_ADMIN', name: 'Su' };

function request(path: string, withCookie = true) {
  return new NextRequest(`http://localhost${path}`, {
    headers: withCookie ? { cookie: 'session=tok' } : {},
  });
}
const location = (res: Response) => res.headers.get('location');

beforeEach(() => vi.clearAllMocks());

describe('middleware role guards', () => {
  it('redirects an unauthenticated user away from /student with ?next', async () => {
    vs.mockResolvedValue(null);
    const res = await middleware(request('/student/dashboard', false));
    expect(location(res)).toContain('/login');
    expect(location(res)).toContain('next=%2Fstudent%2Fdashboard');
  });

  it('lets a student into /student', async () => {
    vs.mockResolvedValue(student);
    const res = await middleware(request('/student/dashboard'));
    expect(location(res)).toBeNull(); // NextResponse.next(), not a redirect
  });

  it('blocks a student from /admin (→ admin login)', async () => {
    vs.mockResolvedValue(student);
    const res = await middleware(request('/admin/students'));
    expect(location(res)).toContain('/admin/login');
  });

  it('sends a non-super admin from a super-admin area to /admin', async () => {
    vs.mockResolvedValue(admin);
    const res = await middleware(request('/admin/manage-admins'));
    expect(location(res)).toContain('/admin');
    expect(location(res)).not.toContain('/admin/login');
  });

  it('lets a super admin into a super-admin area', async () => {
    vs.mockResolvedValue(superAdmin);
    const res = await middleware(request('/admin/manage-admins'));
    expect(location(res)).toBeNull();
  });

  it('lets a regular admin into a normal admin area', async () => {
    vs.mockResolvedValue(admin);
    const res = await middleware(request('/admin/students'));
    expect(location(res)).toBeNull();
  });

  it('leaves /admin/login public', async () => {
    vs.mockResolvedValue(null);
    const res = await middleware(request('/admin/login', false));
    expect(location(res)).toBeNull();
  });
});
