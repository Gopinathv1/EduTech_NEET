import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productionQuestionWhere } from '@/lib/content/eligibility';
import { previousYearExam, previousYearMode } from './modes';
import type { QuestionNature } from './question-nature';
import manifest from '@/data/previous-year/neet/question-nature.json';
import { GeneratorError, largestRemainder, type GeneratorQuestion } from '@/lib/generator';
import { generateBalancedHistoricalSet } from '@/lib/generator/historical';

export function supportsNature(test: { testType: string; rules: unknown }) {
  return previousYearExam(test.rules) === 'NEET' && previousYearMode(test) !== null;
}

/** Existing test scope remains authoritative; exact canonical IDs prevent
 * unrelated historical or quarantined content entering filtered practice. */
export function naturePoolWhere(test: { id: string; isRandom: boolean; rules: unknown }): Prisma.QuestionWhereInput {
  const stored = test.rules as { historical?: { years?: number[] }; random?: { subjectIds?: string[]; chapterIds?: string[] } } | null;
  return {
    ...productionQuestionWhere, exam: 'NEET', sourceType: 'HISTORICAL_VERIFIED',
    externalId: { in: manifest.rows.map(row => row.externalId) },
    ...(test.isRandom ? {
      examYear: { in: stored?.historical?.years ?? [] },
      ...(stored?.random?.subjectIds?.length ? { subjectId: { in: stored.random.subjectIds } } : {}),
      ...(stored?.random?.chapterIds?.length ? { chapterId: { in: stored.random.chapterIds } } : {}),
    } : { testQuestions: { some: { testId: test.id } } }),
  };
}

export async function natureCounts(test: { id: string; isRandom: boolean; rules: unknown }) {
  const rows = await prisma.question.groupBy({ by: ['questionNature'], where: naturePoolWhere(test), _count: { _all: true } });
  return Object.fromEntries(rows.map(row => [row.questionNature ?? 'UNCLASSIFIED', row._count._all]));
}

export function selectNaturePool(pool: GeneratorQuestion[], limit: number, seed: string) {
  if (!pool.length) throw new GeneratorError('No validated questions available for this filter.');
  const ids = [...new Set(pool.map(q => q.subjectId))].sort();
  const total = Math.min(limit, pool.length);
  const counts = largestRemainder(total, ids.map(id => pool.filter(q => q.subjectId === id).length));
  return generateBalancedHistoricalSet({ totalQuestions: total, language: 'en', difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 },
    pool, subjects: ids.map((subjectId, i) => ({ subjectId, count: counts[i], chapters: [] })) },
    [...new Set(pool.map(q => q.year).filter((year): year is number => year !== undefined && year !== null))].sort(), seed);
}

export async function generateNaturePractice(test: { id: string; isRandom: boolean; rules: unknown; totalQuestions: number },
  nature: QuestionNature, language: string, seed: string) {
  const questions = await prisma.question.findMany({ where: { ...naturePoolWhere(test), questionNature: nature,
    translations: { some: { language, ...(language === 'en' ? {} : { reviewed: true }) } } },
    select: { id: true, subjectId: true, chapterId: true, difficulty: true, examYear: true } });
  return selectNaturePool(questions.map(q => ({ ...q, year: q.examYear, hasReviewedTa: true })), test.totalQuestions, seed);
}
