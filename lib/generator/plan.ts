import { prisma } from '@/lib/prisma';
import {
  generateQuestionSet,
  largestRemainder,
  GeneratorError,
  type GeneratorRules,
  type SubjectQuota,
  type GeneratorQuestion,
} from './index';

/**
 * DB-backed bridge between a stored `Test` and the pure generator:
 *  - `buildRandomRules` turns a random test + language into `GeneratorRules`
 *    (with the eligible question pool fetched from the DB),
 *  - `checkFeasibility` validates that a test can actually be produced in every
 *    language it offers (used to gate publishing),
 *  - `generateForAttempt` produces the per-attempt set (fallback allowed).
 */

export type StoredTestRules = {
  difficultyMix?: { EASY?: number; MEDIUM?: number; HARD?: number };
  random?: {
    scope: 'FULL_SYLLABUS' | 'SUBJECTS' | 'CHAPTERS';
    subjectIds?: string[];
    chapterIds?: string[];
  };
};

export const DEFAULT_MIX = { EASY: 30, MEDIUM: 50, HARD: 20 };

export function parseTestRules(json: unknown): StoredTestRules {
  if (json && typeof json === 'object') return json as StoredTestRules;
  return {};
}

type TestLike = {
  testType: string;
  totalQuestions: number;
  isRandom: boolean;
  availableLanguages: string[];
  rules: unknown;
};

/** Build generator rules for a random test in a given language. */
export async function buildRandomRules(
  test: TestLike,
  opts: { language: 'en' | 'ta'; taOnly: boolean },
): Promise<GeneratorRules> {
  const stored = parseTestRules(test.rules);
  const scope = stored.random?.scope ?? 'FULL_SYLLABUS';

  const chapterWhere =
    scope === 'SUBJECTS'
      ? { subjectId: { in: stored.random?.subjectIds ?? [] } }
      : scope === 'CHAPTERS'
        ? { id: { in: stored.random?.chapterIds ?? [] } }
        : {}; // FULL_SYLLABUS

  const chaptersInScope = await prisma.chapter.findMany({
    where: chapterWhere,
    select: { id: true, subjectId: true, weightage: true },
  });
  if (chaptersInScope.length === 0) {
    throw new GeneratorError('No chapters are in scope for this test');
  }

  // Group chapters by subject.
  const bySubject = new Map<string, { chapterId: string; weightage: number }[]>();
  for (const c of chaptersInScope) {
    const arr = bySubject.get(c.subjectId);
    const entry = { chapterId: c.id, weightage: c.weightage };
    if (arr) arr.push(entry);
    else bySubject.set(c.subjectId, [entry]);
  }
  const subjectIds = [...bySubject.keys()];

  // Per-subject counts: equal for FULL_TEST (NEET 45×4), else by weightage sum.
  const counts =
    test.testType === 'FULL_TEST'
      ? largestRemainder(test.totalQuestions, subjectIds.map(() => 1))
      : largestRemainder(
          test.totalQuestions,
          subjectIds.map((sid) => bySubject.get(sid)!.reduce((s, c) => s + c.weightage, 0)),
        );

  const subjects: SubjectQuota[] = subjectIds.map((sid, i) => ({
    subjectId: sid,
    count: counts[i],
    chapters: bySubject.get(sid)!,
  }));

  // Eligible pool: active questions in scope; flag reviewed-Tamil availability.
  const chapterIds = chaptersInScope.map((c) => c.id);
  const questions = await prisma.question.findMany({
    where: { isActive: true, chapterId: { in: chapterIds } },
    select: {
      id: true,
      subjectId: true,
      chapterId: true,
      difficulty: true,
      translations: { where: { language: 'ta', reviewed: true }, select: { id: true } },
    },
  });
  let pool: GeneratorQuestion[] = questions.map((q) => ({
    id: q.id,
    subjectId: q.subjectId,
    chapterId: q.chapterId,
    difficulty: q.difficulty,
    hasReviewedTa: q.translations.length > 0,
  }));
  if (opts.taOnly) pool = pool.filter((q) => q.hasReviewedTa);

  const mix = stored.difficultyMix ?? DEFAULT_MIX;

  return {
    totalQuestions: test.totalQuestions,
    language: opts.language,
    difficultyMix: {
      EASY: mix.EASY ?? DEFAULT_MIX.EASY,
      MEDIUM: mix.MEDIUM ?? DEFAULT_MIX.MEDIUM,
      HARD: mix.HARD ?? DEFAULT_MIX.HARD,
    },
    subjects,
    pool,
  };
}

export type FeasibilityResult = { ok: boolean; errors: string[]; warnings: string[] };

/**
 * Can this test be built in every language it offers? For random tests we dry-run
 * the generator per language (Tamil strictly, i.e. reviewed-Tamil only). For
 * fixed tests we check count, active status and per-language coverage.
 */
export async function checkFeasibility(testId: string): Promise<FeasibilityResult> {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) return { ok: false, errors: ['Test not found'], warnings: [] };

  const errors: string[] = [];
  const warnings: string[] = [];
  const languages = (test.availableLanguages.length ? test.availableLanguages : ['en']) as ('en' | 'ta')[];

  if (test.isRandom) {
    for (const language of languages) {
      try {
        const rules = await buildRandomRules(test, { language, taOnly: language === 'ta' });
        generateQuestionSet(rules, `feasibility:${testId}:${language}`);
      } catch (err) {
        const msg = err instanceof GeneratorError ? err.message : 'unknown error';
        errors.push(`Cannot build a ${language.toUpperCase()} set: ${msg}`);
      }
    }
  } else {
    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId },
      select: {
        question: {
          select: {
            isActive: true,
            translations: { where: { language: 'ta', reviewed: true }, select: { id: true } },
          },
        },
      },
    });
    if (testQuestions.length !== test.totalQuestions) {
      errors.push(`Selected ${testQuestions.length} questions but totalQuestions is ${test.totalQuestions}.`);
    }
    const inactive = testQuestions.filter((tq) => !tq.question.isActive).length;
    if (inactive > 0) errors.push(`${inactive} selected question(s) are inactive.`);
    if (languages.includes('ta')) {
      const missingTa = testQuestions.filter((tq) => tq.question.translations.length === 0).length;
      if (missingTa > 0) errors.push(`${missingTa} selected question(s) lack a reviewed Tamil translation.`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Produce the question set for a specific attempt (Tamil fallback allowed). */
export async function generateForAttempt(
  testId: string,
  language: 'en' | 'ta',
  attemptSeed: string,
): Promise<{ questionIds: string[]; warnings: string[] }> {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new GeneratorError('Test not found');
  if (!test.isRandom) {
    const rows = await prisma.testQuestion.findMany({
      where: { testId },
      orderBy: { order: 'asc' },
      select: { questionId: true },
    });
    return { questionIds: rows.map((r) => r.questionId), warnings: [] };
  }
  const rules = await buildRandomRules(test, { language, taOnly: false });
  return generateQuestionSet(rules, attemptSeed);
}
