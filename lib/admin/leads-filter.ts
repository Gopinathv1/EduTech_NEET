import type { Prisma } from '@prisma/client';
import { LEAD_STATUSES, BUDGET_RANGES } from '@/lib/admission/config';

export type LeadFilterParams = {
  status?: string;
  countryId?: string;
  budget?: string;
  scoreMin?: string;
  scoreMax?: string;
  from?: string;
  to?: string;
  q?: string;
};

/**
 * Build a Prisma where-clause for admin lead filtering (shared by the list page
 * and the CSV export). A country filter matches either the primary country or any
 * of the multi-select countries.
 */
export function buildLeadWhere(p: LeadFilterParams): Prisma.AdmissionLeadWhereInput {
  const where: Prisma.AdmissionLeadWhereInput = {};

  if (p.status && (LEAD_STATUSES as readonly string[]).includes(p.status)) {
    where.status = p.status as Prisma.AdmissionLeadWhereInput['status'];
  }

  if (p.countryId) {
    where.OR = [{ interestedCountryId: p.countryId }, { interestedCountryIds: { has: p.countryId } }];
  }

  if (p.budget && (BUDGET_RANGES as readonly string[]).includes(p.budget)) {
    where.budget = p.budget;
  }

  const neetScore: Prisma.IntNullableFilter = {};
  const min = Number(p.scoreMin);
  const max = Number(p.scoreMax);
  if (p.scoreMin !== undefined && p.scoreMin !== '' && Number.isFinite(min)) neetScore.gte = min;
  if (p.scoreMax !== undefined && p.scoreMax !== '' && Number.isFinite(max)) neetScore.lte = max;
  if (neetScore.gte !== undefined || neetScore.lte !== undefined) where.neetScore = neetScore;

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
    const or: Prisma.AdmissionLeadWhereInput[] = [
      { student: { name: { contains: q, mode: 'insensitive' } } },
      { student: { email: { contains: q, mode: 'insensitive' } } },
    ];
    if (digits.length >= 4) {
      or.push({ student: { mobile: { contains: digits } } });
      or.push({ parentContact: { contains: digits } });
    }
    // Combine with an existing OR (country) via AND so both constraints hold.
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: or }];
      delete where.OR;
    } else {
      where.OR = or;
    }
  }

  return where;
}
