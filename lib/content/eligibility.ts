import type { Prisma } from '@prisma/client';

/** Shared production gate. SAMPLE content remains usable to admin/dev tooling. */
export const productionQuestionWhere = {
  contentClass: 'PRODUCTION',
  status: 'PUBLISHED',
  reviewState: 'APPROVED',
  isActive: true,
  sourceType: { not: null },
  sourceName: { not: null },
  reviewer: { not: null },
  reviewedAt: { not: null },
} satisfies Prisma.QuestionWhereInput;

export const productionTestWhere = {
  contentClass: 'PRODUCTION',
  isPublished: true,
} satisfies Prisma.TestWhereInput;

/** Controlled student-facing SIVORA practice fixtures. These never enter the
 * production/reviewed catalogue gate. */
export const sampleTestWhere = {
  contentClass: 'SAMPLE',
  isPublished: true,
  id: { in: ['sivora-neet-sample-practice', 'sivora-jee-sample-practice'] },
} satisfies Prisma.TestWhereInput;

export const studentTestWhere = { OR: [productionTestWhere, sampleTestWhere] } satisfies Prisma.TestWhereInput;

export function isFreeSampleTest(test: { id: string; contentClass?: string | null }) {
  return test.contentClass === 'SAMPLE' && sampleTestWhere.id.in.includes(test.id);
}
