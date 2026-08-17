import { describe, it, expect, vi, beforeEach } from 'vitest';

const session = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/session', () => session);

import { getAdminSession, getSuperAdminSession } from '@/lib/auth/admin';

const student = { sub: 's1', kind: 'student', role: 'STUDENT', name: 'S' } as const;
const admin = { sub: 'a1', kind: 'admin', role: 'ADMIN', name: 'A' } as const;
const superAdmin = { sub: 'a2', kind: 'admin', role: 'SUPER_ADMIN', name: 'Su' } as const;

beforeEach(() => vi.clearAllMocks());

describe('getAdminSession', () => {
  it('returns null for no session', async () => {
    session.getSession.mockResolvedValue(null);
    expect(await getAdminSession()).toBeNull();
  });
  it('returns null for a student session (blocked from admin API)', async () => {
    session.getSession.mockResolvedValue(student);
    expect(await getAdminSession()).toBeNull();
  });
  it('returns the session for an admin', async () => {
    session.getSession.mockResolvedValue(admin);
    expect(await getAdminSession()).toEqual(admin);
  });
});

describe('getSuperAdminSession', () => {
  it('returns null for a regular admin (blocked from super-admin API)', async () => {
    session.getSession.mockResolvedValue(admin);
    expect(await getSuperAdminSession()).toBeNull();
  });
  it('returns null for a student', async () => {
    session.getSession.mockResolvedValue(student);
    expect(await getSuperAdminSession()).toBeNull();
  });
  it('returns the session for a super admin', async () => {
    session.getSession.mockResolvedValue(superAdmin);
    expect(await getSuperAdminSession()).toEqual(superAdmin);
  });
});
