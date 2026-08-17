import type { Prisma } from '@prisma/client';

export type PaymentFilterParams = { status?: string; from?: string; to?: string; q?: string };

const STATUSES = ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'];

/** Build a Prisma where-clause for admin payment filtering (shared by page + CSV). */
export function buildPaymentWhere(p: PaymentFilterParams): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};

  if (p.status && STATUSES.includes(p.status)) {
    where.status = p.status as Prisma.PaymentWhereInput['status'];
  }

  const createdAt: Prisma.DateTimeFilter = {};
  if (p.from) {
    const d = new Date(p.from);
    if (!Number.isNaN(d.getTime())) createdAt.gte = d;
  }
  if (p.to) {
    const d = new Date(p.to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      createdAt.lte = d;
    }
  }
  if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;

  const q = p.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    const or: Prisma.PaymentWhereInput[] = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { razorpayOrderId: { contains: q, mode: 'insensitive' } },
      { student: { name: { contains: q, mode: 'insensitive' } } },
      { student: { email: { contains: q, mode: 'insensitive' } } },
    ];
    if (digits.length >= 4) or.push({ student: { mobile: { contains: digits } } });
    where.OR = or;
  }

  return where;
}
