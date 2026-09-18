import type { Prisma } from '@prisma/client';

/** Shared production gate. SAMPLE content remains usable to admin/dev tooling. */
export const productionQuestionWhere = {
  contentClass: 'PRODUCTION',
  status: 'PUBLISHED',
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
