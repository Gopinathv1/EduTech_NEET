import type { Prisma } from '@prisma/client';

export type StudentFilterParams = {
  q?: string;
  district?: string;
  board?: string;
  klass?: string; // "class" is reserved-ish; map from ?class=
  from?: string;
  to?: string;
};

/** Build a Prisma where-clause for the admin student list (shared by page + CSV). */
export function buildStudentWhere(p: StudentFilterParams): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {};

  if (p.district) where.district = p.district;
  if (p.board) where.board = p.board;
  if (p.klass) where.class = p.klass;

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
    const or: Prisma.StudentWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { schoolName: { contains: q, mode: 'insensitive' } },
    ];
    if (digits.length >= 4) or.push({ mobile: { contains: digits } });
    where.OR = or;
  }

  return where;
}
