import type { Prisma } from '@prisma/client';
export function buildAdmissionsEnquiryWhere(status?: string, query?: string): Prisma.ContactEnquiryWhereInput {
  const where: Prisma.ContactEnquiryWhereInput = {};
  if (status === 'NEW' || status === 'RESPONDED' || status === 'CLOSED') where.status = status;
  const q = query?.trim().slice(0, 120);
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } },
    { mobile: { contains: q } }, { message: { contains: q, mode: 'insensitive' } },
    { id: { endsWith: q.replace(/^SIV-/i, ''), mode: 'insensitive' } },
  ];
  return where;
}
