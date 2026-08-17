import type { Prisma } from '@prisma/client';
import type { TestInput } from '@/lib/validation/test';

/** The difficulty label stored on Test (dominant bucket of the mix). */
export function dominantDifficulty(mix: { EASY: number; MEDIUM: number; HARD: number }): 'EASY' | 'MEDIUM' | 'HARD' {
  const entries: ['EASY' | 'MEDIUM' | 'HARD', number][] = [
    ['EASY', mix.EASY],
    ['MEDIUM', mix.MEDIUM],
    ['HARD', mix.HARD],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Normalise builder input into a persistable Test record + the ordered fixed
 * question ids. Applies the NEET full-test structure: a FULL_TEST is always a
 * random, full-syllabus, 180-question test (Physics/Chemistry/Botany/Zoology
 * split 45 each by chapter weightage — handled by the generator/planner).
 */
export function buildTestPersistence(input: TestInput): {
  data: Prisma.TestUncheckedCreateInput;
  isRandom: boolean;
  isFull: boolean;
  fixedQuestionIds: string[];
} {
  const isFull = input.testType === 'FULL_TEST';
  const mode = isFull ? 'RANDOM' : input.mode;
  const isRandom = mode === 'RANDOM';
  const scope = isFull ? 'FULL_SYLLABUS' : input.scope ?? 'FULL_SYLLABUS';
  const totalQuestions = isRandom
    ? isFull
      ? 180
      : input.totalQuestions ?? 0
    : input.questionIds.length;

  const rules: Prisma.InputJsonValue = {
    difficultyMix: input.difficultyMix,
    ...(isRandom
      ? {
          random: {
            scope,
            subjectIds: isFull ? [] : input.subjectIds,
            chapterIds: isFull ? [] : input.chapterIds,
          },
        }
      : {}),
  };

  const data: Prisma.TestUncheckedCreateInput = {
    title: { en: input.titleEn, ta: input.titleTa || '' },
    description: { en: input.descEn ?? '', ta: input.descTa ?? '' },
    testType: input.testType,
    year: input.year ?? null,
    subjectId: input.subjectId ?? null,
    chapterId: input.chapterId ?? null,
    totalQuestions,
    durationMinutes: input.durationMinutes,
    price: input.price,
    difficulty: dominantDifficulty(input.difficultyMix),
    isRandom,
    availableLanguages: input.availableLanguages,
    rules,
  };

  return { data, isRandom, isFull, fixedQuestionIds: isRandom ? [] : input.questionIds };
}
