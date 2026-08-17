import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    agencyUser: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (fn) =>
      fn({
        agency: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }),
    ),
  },
}));
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
vi.mock('@/lib/auth/admin', () => ({ getAdminSession: vi.fn() }));
const rl = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(async () => null as number | null),
  clientIp: vi.fn(() => 'ip'),
}));
vi.mock('@/lib/auth/rate-limit', () => rl);

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { getAdminSession } from '@/lib/auth/admin';
import { hashPassword } from '@/lib/auth/password';
import { POST as registerPartner } from '@/app/api/partner/register/route';
import { POST as loginPartner } from '@/app/api/partner/auth/login/route';
import { POST as updatePartnerStatus } from '@/app/api/admin/partners/[id]/status/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminSession = getAdminSession as any;

function req(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rl.enforceRateLimit.mockResolvedValue(null);
});

describe('partner onboarding and login routes', () => {
  it('creates a pending inactive agency application', async () => {
    p.agency.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    p.agency.create.mockResolvedValue({ partnerCode: 'VVP-000001', approvalStatus: 'PENDING' });

    const res = await registerPartner(req('/api/partner/register', validRegistration()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.partnerCode).toBe('VVP-000001');
    expect(p.agency.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          users: expect.objectContaining({
            create: expect.objectContaining({ role: 'OWNER', isActive: false }),
          }),
        }),
      }),
    );
  });

  it('prevents duplicate partner email applications', async () => {
    p.agency.findFirst.mockResolvedValue({ id: 'ag1' });
    const res = await registerPartner(req('/api/partner/register', validRegistration()));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('emailTaken');
  });

  it('blocks pending agencies from partner login', async () => {
    const passwordHash = await hashPassword('Partner@123');
    p.agencyUser.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Partner',
      email: 'partner@example.com',
      passwordHash,
      isActive: false,
      agencyId: 'ag1',
      agency: { id: 'ag1', approvalStatus: 'PENDING', isActive: false },
    });

    const res = await loginPartner(req('/api/partner/auth/login', { email: 'partner@example.com', password: 'Partner@123' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('partnerStatus:PENDING');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('logs in approved active partner users with agency scoped claims', async () => {
    const passwordHash = await hashPassword('Partner@123');
    p.agencyUser.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Partner',
      email: 'partner@example.com',
      passwordHash,
      isActive: true,
      agencyId: 'ag1',
      agency: { id: 'ag1', approvalStatus: 'APPROVED', isActive: true },
    });
    p.agencyUser.update.mockResolvedValue({});

    const res = await loginPartner(req('/api/partner/auth/login', { email: 'partner@example.com', password: 'Partner@123' }));
    expect(res.status).toBe(200);
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ kind: 'partner', role: 'PARTNER', agencyId: 'ag1' }));
  });
});

describe('admin partner status route', () => {
  it('requires admin session', async () => {
    adminSession.mockResolvedValue(null);
    const res = await updatePartnerStatus(req('/api/admin/partners/ag1/status', { status: 'APPROVED' }), {
      params: Promise.resolve({ id: 'ag1' }),
    });
    expect(res.status).toBe(401);
  });

  it('updates status through an audited transaction', async () => {
    adminSession.mockResolvedValue({ sub: 'a1', kind: 'admin', role: 'ADMIN', name: 'Admin' });
    p.agency.findUnique.mockResolvedValue({ id: 'ag1', name: 'Agency' });
    const res = await updatePartnerStatus(req('/api/admin/partners/ag1/status', { status: 'APPROVED', note: 'ok' }), {
      params: Promise.resolve({ id: 'ag1' }),
    });
    expect(res.status).toBe(200);
    expect(p.$transaction).toHaveBeenCalled();
  });
});

function validRegistration() {
  return {
    agencyName: 'Bright Future Consultants',
    contactPerson: 'Priya Kumar',
    mobile: '9876543210',
    email: 'partner@example.com',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    website: 'https://example.com',
    registrationNumber: 'TN-123',
    password: 'Partner@123',
    confirmPassword: 'Partner@123',
  };
}
