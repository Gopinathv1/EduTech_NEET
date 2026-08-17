import { describe, it, expect, vi, beforeEach } from 'vitest';

const session = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/session', () => session);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyUser: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { assertPartnerOwnsAgency, getPartnerContext, getPartnerSession, isApprovedPartner } from '@/lib/auth/partner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

const partnerSession = { sub: 'u1', kind: 'partner', role: 'PARTNER', name: 'Partner', agencyId: 'ag1' } as const;

beforeEach(() => vi.clearAllMocks());

describe('partner auth helpers', () => {
  it('returns null for non-partner sessions', async () => {
    session.getSession.mockResolvedValue({ sub: 's1', kind: 'student', role: 'STUDENT', name: 'Student' });
    expect(await getPartnerSession()).toBeNull();
  });

  it('returns partner sessions with agency membership', async () => {
    session.getSession.mockResolvedValue(partnerSession);
    expect(await getPartnerSession()).toEqual(partnerSession);
  });

  it('rejects context when the user agency differs from the session agency', async () => {
    p.agencyUser.findUnique.mockResolvedValue({ id: 'u1', agencyId: 'other', agency: { id: 'other' } });
    expect(await getPartnerContext(partnerSession)).toBeNull();
  });

  it('recognizes approved and active partners only', () => {
    const context = {
      session: partnerSession,
      user: { id: 'u1', name: 'P', email: 'p@example.com', mobile: '9876543210', role: 'OWNER', isActive: true },
      agency: {
        id: 'ag1',
        partnerCode: 'VVP-000001',
        name: 'Agency',
        contactPerson: 'P',
        email: 'p@example.com',
        mobile: '9876543210',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        website: null,
        registrationNumber: null,
        approvalStatus: 'APPROVED',
        isActive: true,
        createdAt: new Date(),
      },
    };
    expect(isApprovedPartner(context)).toBe(true);
    expect(isApprovedPartner({ ...context, agency: { ...context.agency, approvalStatus: 'SUSPENDED' } })).toBe(false);
  });

  it('checks agency ownership from server-side session claims', () => {
    expect(assertPartnerOwnsAgency(partnerSession, 'ag1')).toBe(true);
    expect(assertPartnerOwnsAgency(partnerSession, 'ag2')).toBe(false);
  });
});
