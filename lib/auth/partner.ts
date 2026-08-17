import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import type { SessionClaims } from '@/lib/auth/jwt';

export type PartnerContext = {
  session: SessionClaims;
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    isActive: boolean;
  };
  agency: {
    id: string;
    partnerCode: string;
    name: string;
    contactPerson: string;
    email: string;
    mobile: string;
    city: string;
    state: string;
    country: string;
    website: string | null;
    registrationNumber: string | null;
    approvalStatus: string;
    isActive: boolean;
    createdAt: Date;
  };
};

export async function getPartnerSession(): Promise<SessionClaims | null> {
  const session = await getSession();
  if (!session || session.kind !== 'partner' || session.role !== 'PARTNER' || !session.agencyId) {
    return null;
  }
  return session;
}

export async function requirePartnerPage(): Promise<PartnerContext> {
  const session = await getPartnerSession();
  if (!session) redirect('/partner/login');
  const context = await getPartnerContext(session);
  if (!context) redirect('/partner/login');
  if (!isApprovedPartner(context)) redirect('/partner/login?status=not-approved');
  return context;
}

export async function getPartnerContext(session: SessionClaims): Promise<PartnerContext | null> {
  if (!session.agencyId) return null;
  const user = await prisma.agencyUser.findUnique({
    where: { id: session.sub },
    include: { agency: true },
  });
  if (!user || user.agencyId !== session.agencyId) return null;
  return { session, user, agency: user.agency };
}

export function isApprovedPartner(context: PartnerContext): boolean {
  return context.user.isActive && context.agency.isActive && context.agency.approvalStatus === 'APPROVED';
}

export function assertPartnerOwnsAgency(session: SessionClaims, agencyId: string): boolean {
  return session.kind === 'partner' && session.role === 'PARTNER' && session.agencyId === agencyId;
}
