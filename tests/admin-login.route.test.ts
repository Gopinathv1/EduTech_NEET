import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    admin: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
const rl = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(async () => null as number | null),
  clientIp: vi.fn(() => 'ip'),
}));
vi.mock('@/lib/auth/rate-limit', () => rl);

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { POST } from '@/app/api/auth/admin/login/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

function req(body: unknown) {
  return new Request('http://localhost/api/auth/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rl.enforceRateLimit.mockResolvedValue(null);
});

describe('POST /api/auth/admin/login', () => {
  it('logs in an active admin, records the audit trail, and sets the role', async () => {
    const passwordHash = await hashPassword('Admin@123');
    p.admin.findUnique.mockResolvedValue({
      id: 'a1',
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    const res = await POST(req({ email: 'admin@example.com', password: 'Admin@123' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.redirect).toBe('/admin');
    expect(p.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'admin.login', adminId: 'a1' }) }),
    );
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'a1', kind: 'admin', role: 'SUPER_ADMIN' }),
    );
  });

  it('rejects a wrong password with 401 and no session', async () => {
    const passwordHash = await hashPassword('Admin@123');
    p.admin.findUnique.mockResolvedValue({ id: 'a1', name: 'A', email: 'a@x.com', passwordHash, role: 'ADMIN', isActive: true });
    const res = await POST(req({ email: 'a@x.com', password: 'wrong' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('invalidCredentials');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('blocks an inactive admin with 403', async () => {
    const passwordHash = await hashPassword('Admin@123');
    p.admin.findUnique.mockResolvedValue({ id: 'a1', name: 'A', email: 'a@x.com', passwordHash, role: 'ADMIN', isActive: false });
    const res = await POST(req({ email: 'a@x.com', password: 'Admin@123' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('accountInactive');
  });

  it('returns 429 when rate limited', async () => {
    rl.enforceRateLimit.mockResolvedValueOnce(120);
    const res = await POST(req({ email: 'a@x.com', password: 'Admin@123' }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('rateLimited');
    expect(json.retryAfterSeconds).toBe(120);
  });
});
