import { z } from 'zod';

/**
 * Admin-side validation schemas (question bank). Shared by the admin client
 * forms and the /api/admin/* routes. The admin portal is English-only, so error
 * messages here are plain English strings (unlike the auth schemas, which emit
 * i18n keys for the bilingual student flows).
 */

export const answerOptionEnum = z.enum(['A', 'B', 'C', 'D']);
export const difficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);
// The API accepts all three types (so an existing ASSERTION_REASON question can
// still be edited), but the create form only offers SINGLE_CORRECT / IMAGE_BASED
// — ASSERTION_REASON is a disabled "coming soon" option in the UI.
export const questionTypeEnum = z.enum(['SINGLE_CORRECT', 'IMAGE_BASED', 'ASSERTION_REASON']);
export const questionStatusEnum = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED']);
export const contentClassificationEnum = z.enum(['SAMPLE', 'PRODUCTION']);
export const questionSourceTypeEnum = z.enum(['INTERNALLY_AUTHORED', 'LICENSED', 'OFFICIAL_PREVIOUS_YEAR', 'OTHER']);

export const contactStatusEnum = z.enum(['NEW', 'RESPONDED', 'CLOSED']);
export const contactStatusUpdateSchema = z.object({ status: contactStatusEnum });

// ---- Chapters -------------------------------------------------------------

export const chapterCreateSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  nameEn: z.string().trim().min(2, 'English name is required').max(140),
  nameTa: z.string().trim().max(200).optional().default(''),
  class: z.coerce.number().int().refine((v) => v === 11 || v === 12, 'Class must be 11 or 12'),
  weightage: z.coerce.number().min(0, 'Weightage cannot be negative').max(100, 'Weightage cannot exceed 100'),
});
export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>;

export const chapterUpdateSchema = chapterCreateSchema.omit({ subjectId: true });
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>;

// ---- Questions ------------------------------------------------------------

const contentEn = z.object({
  questionText: z.string().trim().min(1, 'Question text is required').max(4000),
  optionA: z.string().trim().min(1, 'Option A is required').max(1000),
  optionB: z.string().trim().min(1, 'Option B is required').max(1000),
  optionC: z.string().trim().min(1, 'Option C is required').max(1000),
  optionD: z.string().trim().min(1, 'Option D is required').max(1000),
  explanation: z.string().trim().max(4000).optional().default(''),
});

const contentTa = z.object({
  questionText: z.string().trim().max(4000).default(''),
  optionA: z.string().trim().max(1000).default(''),
  optionB: z.string().trim().max(1000).default(''),
  optionC: z.string().trim().max(1000).default(''),
  optionD: z.string().trim().max(1000).default(''),
  explanation: z.string().trim().max(4000).optional().default(''),
  reviewed: z.boolean().default(false),
});

/** True when a Tamil translation block has all required fields filled. */
export function isTaComplete(ta: z.infer<typeof contentTa> | undefined): boolean {
  if (!ta) return false;
  return [ta.questionText, ta.optionA, ta.optionB, ta.optionC, ta.optionD].every(
    (s) => s.trim().length > 0,
  );
}

export const questionSchema = z
  .object({
    subjectId: z.string().min(1, 'Subject is required'),
    chapterId: z.string().min(1, 'Chapter is required'),
    externalId: z.string().trim().max(160).optional().default(''),
    topic: z.string().trim().max(120).optional().default(''),
    difficulty: difficultyEnum,
    questionType: questionTypeEnum,
    status: questionStatusEnum.default('DRAFT'),
    contentClass: contentClassificationEnum.default('SAMPLE'),
    sourceType: questionSourceTypeEnum.nullable().optional(),
    sourceName: z.string().trim().max(200).optional().default(''),
    exam: z.string().trim().max(80).optional().default(''),
    examYear: z.number().int().min(1990).max(2100).nullable().optional(),
    paperSession: z.string().trim().max(120).optional().default(''),
    licenseReference: z.string().trim().max(240).optional().default(''),
    reviewer: z.string().trim().max(160).optional().default(''),
    reviewedAt: z.string().datetime().nullable().optional(),
    year: z.number().int().min(1990).max(2100).nullable().optional(),
    tags: z.array(z.string().trim().min(1)).max(20).default([]),
    imageUrl: z.string().trim().max(1000).optional().default(''),
    isActive: z.boolean().default(true),
    correctOption: answerOptionEnum,
    en: contentEn,
    ta: contentTa.optional(),
  })
  .superRefine((d, ctx) => {
    if (d.contentClass === 'PRODUCTION') {
      if (!d.sourceType) ctx.addIssue({ code: 'custom', path: ['sourceType'], message: 'Production questions require a source type' });
      if (!d.sourceName) ctx.addIssue({ code: 'custom', path: ['sourceName'], message: 'Production questions require a source name' });
      if (d.status === 'PUBLISHED' && !d.reviewer) ctx.addIssue({ code: 'custom', path: ['reviewer'], message: 'Published production questions require a reviewer' });
      if (d.status === 'PUBLISHED' && !d.reviewedAt) ctx.addIssue({ code: 'custom', path: ['reviewedAt'], message: 'Published production questions require a review date' });
    }
    if (d.sourceType === 'OFFICIAL_PREVIOUS_YEAR' && (!d.exam || !d.examYear)) {
      ctx.addIssue({ code: 'custom', path: ['sourceType'], message: 'Official previous-year questions require exam and exam year provenance' });
    }
    if (d.questionType === 'IMAGE_BASED' && !d.imageUrl) {
      ctx.addIssue({ code: 'custom', path: ['imageUrl'], message: 'An image is required for image-based questions' });
    }
    if (d.ta) {
      const filled = [d.ta.questionText, d.ta.optionA, d.ta.optionB, d.ta.optionC, d.ta.optionD];
      const anyFilled = filled.some((s) => s.trim().length > 0);
      const allFilled = filled.every((s) => s.trim().length > 0);
      if (anyFilled && !allFilled) {
        ctx.addIssue({ code: 'custom', path: ['ta'], message: 'Complete all Tamil fields or leave them all blank' });
      }
      if (d.ta.reviewed && !allFilled) {
        ctx.addIssue({ code: 'custom', path: ['ta', 'reviewed'], message: 'Only a complete translation can be marked reviewed' });
      }
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;

// Partial update for the row-level active toggle.
export const questionActiveSchema = z.object({ isActive: z.boolean() });
