import { z } from 'zod';

/** Admin test-builder validation (English-only admin portal → plain messages). */

export const testTypeEnum = z.enum([
  'FULL_TEST',
  'MINI_TEST',
  'CHAPTER_TEST',
  'SUBJECT_TEST',
  'YEAR_PATTERN',
]);

const langEnum = z.enum(['en', 'ta']);

export const difficultyMixSchema = z
  .object({
    EASY: z.coerce.number().int().min(0).max(100),
    MEDIUM: z.coerce.number().int().min(0).max(100),
    HARD: z.coerce.number().int().min(0).max(100),
  })
  .refine((m) => m.EASY + m.MEDIUM + m.HARD === 100, {
    message: 'Difficulty mix must total 100%',
  });

export const testSchema = z
  .object({
    titleEn: z.string().trim().min(2, 'English title is required').max(200),
    titleTa: z.string().trim().max(300).optional().default(''),
    descEn: z.string().trim().max(3000).optional().default(''),
    descTa: z.string().trim().max(3000).optional().default(''),
    testType: testTypeEnum,
    year: z.number().int().min(1990).max(2100).nullable().optional(),
    durationMinutes: z.coerce.number().int().min(1).max(600),
    price: z.coerce.number().int().min(0).max(100000).default(30),
    difficultyMix: difficultyMixSchema,
    availableLanguages: z
      .array(langEnum)
      .min(1)
      .refine((a) => a.includes('en'), 'English must be available'),
    mode: z.enum(['FIXED', 'RANDOM']),
    // FIXED
    questionIds: z.array(z.string()).default([]),
    // RANDOM
    totalQuestions: z.coerce.number().int().min(1).max(500).optional(),
    scope: z.enum(['FULL_SYLLABUS', 'SUBJECTS', 'CHAPTERS']).optional(),
    subjectIds: z.array(z.string()).default([]),
    chapterIds: z.array(z.string()).default([]),
    // catalogue tagging (optional)
    subjectId: z.string().nullable().optional(),
    chapterId: z.string().nullable().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.mode === 'FIXED') {
      if (d.questionIds.length < 1) {
        ctx.addIssue({ code: 'custom', path: ['questionIds'], message: 'Pick at least one question' });
      }
    } else {
      if (!d.totalQuestions) {
        ctx.addIssue({ code: 'custom', path: ['totalQuestions'], message: 'Set the number of questions' });
      }
      if (!d.scope) {
        ctx.addIssue({ code: 'custom', path: ['scope'], message: 'Choose a scope' });
      }
      if (d.scope === 'SUBJECTS' && d.subjectIds.length < 1) {
        ctx.addIssue({ code: 'custom', path: ['subjectIds'], message: 'Choose at least one subject' });
      }
      if (d.scope === 'CHAPTERS' && d.chapterIds.length < 1) {
        ctx.addIssue({ code: 'custom', path: ['chapterIds'], message: 'Choose at least one chapter' });
      }
    }
  });

export type TestInput = z.infer<typeof testSchema>;

export const publishSchema = z.object({ publish: z.boolean() });
