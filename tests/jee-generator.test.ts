import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {
  test: { findUnique: vi.fn() }, question: { findMany: vi.fn(), groupBy: vi.fn() },
  testQuestion: { findMany: vi.fn() }, chapter: { findMany: vi.fn() }, subject: { findMany: vi.fn() },
} }));

import { prisma } from '@/lib/prisma';
import { generateForAttempt } from '@/lib/generator/plan';
import type { JeeHistoricalQuestion } from '@/lib/previous-year/jee-dataset';
import { buildJeePracticePlans, JEE_SUBJECTS, JEE_YEARS } from '@/lib/previous-year/jee-practice';
import { naturePoolWhere, supportsNature } from '@/lib/previous-year/nature-pool';
import neetManifest from '@/data/previous-year/neet/question-nature.json';

const canonical = JEE_YEARS.flatMap(year => JSON.parse(readFileSync(
  path.join(process.cwd(), 'data', 'previous-year', 'jee', String(year), 'questions.json'), 'utf8',
)) as JeeHistoricalQuestion[]);
const plans = buildJeePracticePlans(canonical);
const dbRows = canonical.map(row => ({ id: row.externalId, externalId: row.externalId, subjectId: row.subjectCode,
  chapterId: row.chapterSlug, difficulty: row.difficulty, examYear: row.year, exam: 'JEE', questionType: row.questionType,
  questionNature: row.questionNature, subject: { code: row.subjectCode },
  translations: [{ language: 'en', reviewed: true, correctOption: row.correctOption ?? null, numericAnswer: row.numericAnswer ?? null }],
}));
const toTest = (plan: typeof plans[number]) => ({ ...plan, contentClass: 'PRODUCTION', availableLanguages: ['en'] });
type Scope = { id?: { in: string[] }; externalId?: { in: string[] }; exam?: string; examYear?: { in: number[] };
  questionNature?: string; subjectId?: { in: string[] }; chapterId?: { in: string[] }; testQuestions?: { some: { testId: string } } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.question.findMany).mockImplementation(args => {
    const where = args?.where as Scope | undefined;
    let rows = dbRows;
    if (where?.id) rows = rows.filter(row => where.id!.in.includes(row.id));
    if (where?.externalId) rows = rows.filter(row => where.externalId!.in.includes(row.externalId));
    if (where?.exam) rows = rows.filter(row => row.exam === where.exam);
    if (where?.examYear) rows = rows.filter(row => where.examYear!.in.includes(row.examYear));
    if (where?.questionNature) rows = rows.filter(row => row.questionNature === where.questionNature);
    if (where?.subjectId) rows = rows.filter(row => where.subjectId!.in.includes(row.subjectId));
    if (where?.chapterId) rows = rows.filter(row => where.chapterId!.in.includes(row.chapterId));
    if (where?.testQuestions) {
      const members = plans.find(plan => plan.id === where.testQuestions!.some.testId)?.externalIds ?? [];
      rows = rows.filter(row => members.includes(row.externalId));
    }
    return Promise.resolve(rows) as never;
  });
});

describe('DB-backed JEE previous-year generation', () => {
  it('uses only the exact canonical IDs and applies mixed typed quotas across all five years', async () => {
    const mixed = plans.find(plan => plan.id === 'jee-pyq-mixed-2021-2025')!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(mixed) as never);
    const result = await generateForAttempt(mixed.id, 'en', 'jee-mixed');
    expect(result.questionIds).toHaveLength(75);
    expect(new Set(result.questionIds).size).toBe(75);
    expect(prisma.question.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({
      exam: 'JEE', sourceType: 'HISTORICAL_VERIFIED', reviewState: 'APPROVED', status: 'PUBLISHED', contentClass: 'PRODUCTION',
      externalId: { in: canonical.map(row => row.externalId) }, examYear: { in: [...JEE_YEARS] },
    }) }));
    for (const subject of JEE_SUBJECTS) {
      const selected = result.questionIds.map(id => dbRows.find(row => row.id === id)!).filter(row => row.subjectId === subject);
      expect(selected.filter(row => row.questionType === 'SINGLE_CORRECT')).toHaveLength(20);
      expect(selected.filter(row => row.questionType === 'NUMERICAL_VALUE')).toHaveLength(5);
      expect([...new Set(selected.map(row => row.examYear))].sort()).toEqual([...JEE_YEARS]);
    }
    expect(prisma.chapter.findMany).not.toHaveBeenCalled();
    expect(prisma.testQuestion.findMany).not.toHaveBeenCalled();
  });

  it('keeps All Questions fixed-shift membership in stored source order', async () => {
    const shift = plans.find(plan => plan.rules.previousYearMode === 'HISTORICAL_SHIFT' && (plan.rules.paperIdentity as { year: number }).year === 2022)!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(shift) as never);
    vi.mocked(prisma.testQuestion.findMany).mockResolvedValue(shift.externalIds.map(questionId => ({ questionId })) as never);
    expect((await generateForAttempt(shift.id, 'en', 'fixed')).questionIds).toEqual(shift.externalIds);
    expect(prisma.testQuestion.findMany).toHaveBeenCalledWith({ where: { testId: shift.id }, orderBy: { order: 'asc' }, select: { questionId: true } });
    expect(prisma.question.findMany).toHaveBeenCalledTimes(1);
  });

  it('scopes a fixed-shift nature filter to exact membership and returns its actual eligible count', async () => {
    const shift = plans.find(plan => plan.rules.previousYearMode === 'HISTORICAL_SHIFT' && (plan.rules.paperIdentity as { year: number }).year === 2025)!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(shift) as never);
    const result = await generateForAttempt(shift.id, 'en', 'nature', 'CONCEPTUAL_THEORY');
    const expected = canonical.filter(row => shift.externalIds.includes(row.externalId) && row.questionNature === 'CONCEPTUAL_THEORY');
    expect(result.questionIds.sort()).toEqual(expected.map(row => row.externalId).sort());
    expect(result.questionIds).toHaveLength(10);
    expect(prisma.question.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({
      exam: 'JEE', questionNature: 'CONCEPTUAL_THEORY', externalId: { in: shift.externalIds },
      testQuestions: { some: { testId: shift.id } },
    }) }));
    expect(prisma.testQuestion.findMany).not.toHaveBeenCalled();
  });

  it('excludes unknown IDs from a stored JEE selection and preserves chapter scope', () => {
    const plan = plans.find(row => row.testType === 'CHAPTER_TEST')!;
    const test = { ...toTest(plan), rules: { ...plan.rules,
      historical: { years: [2021], externalIds: [...plan.externalIds, 'unrelated-historical-question', neetManifest.rows[0].externalId] },
      random: { scope: 'CHAPTERS', chapterIds: ['chapter-db-id'], subjectIds: ['subject-db-id'] } } };
    expect(naturePoolWhere(test)).toEqual(expect.objectContaining({ exam: 'JEE', sourceType: 'HISTORICAL_VERIFIED',
      externalId: { in: canonical.map(row => row.externalId).filter(id => plan.externalIds.includes(id)) },
      examYear: { in: [2021] }, chapterId: { in: ['chapter-db-id'] }, subjectId: { in: ['subject-db-id'] } }));
  });

  it('does not create an attempt from an empty nature pool', async () => {
    const math = plans.find(plan => plan.testType === 'SUBJECT_TEST' && plan.subjectCode === 'JEE_MATHEMATICS')!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(math) as never);
    await expect(generateForAttempt(math.id, 'en', 'empty', 'CONCEPTUAL_THEORY')).rejects.toThrow('No validated questions');
    expect(prisma.question.findMany).toHaveBeenCalledTimes(1);
  });

  it('fails when a published random selection loses a validated member', async () => {
    const subject = plans.find(plan => plan.testType === 'SUBJECT_TEST' && plan.subjectCode === 'JEE_PHYSICS')!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(subject) as never);
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce(dbRows.filter(row => subject.externalIds.slice(1).includes(row.externalId)) as never);
    await expect(generateForAttempt(subject.id, 'en', 'missing')).rejects.toThrow('no longer matches the published selection');
  });

  it('shuffles only the exact selected chapter membership for All Questions', async () => {
    const chapter = plans.find(plan => plan.testType === 'CHAPTER_TEST' && plan.subjectCode === 'JEE_CHEMISTRY')!;
    vi.mocked(prisma.test.findUnique).mockResolvedValue(toTest(chapter) as never);
    const result = await generateForAttempt(chapter.id, 'en', 'chapter');
    expect([...result.questionIds].sort()).toEqual([...chapter.externalIds].sort());
    expect(result.questionIds).toHaveLength(chapter.totalQuestions);
    expect(prisma.question.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({
      exam: 'JEE', externalId: { in: chapter.externalIds },
    }) }));
  });
});

describe('NEET and real Full Mock preservation', () => {
  it('keeps the NEET canonical nature manifest and membership scope unchanged', () => {
    const neet = { id: 'neet-year', testType: 'YEAR_PATTERN', isRandom: false, rules: { exam: 'NEET', sourceType: 'HISTORICAL_VERIFIED' } };
    expect(supportsNature(neet)).toBe(true);
    expect(naturePoolWhere(neet)).toEqual(expect.objectContaining({ exam: 'NEET', sourceType: 'HISTORICAL_VERIFIED',
      externalId: { in: neetManifest.rows.map(row => row.externalId) }, testQuestions: { some: { testId: neet.id } } }));
    expect(neetManifest.rows).toHaveLength(780);
  });

  it('preserves NEET filtered practice with its actual eligible count', async () => {
    const neet = { id: 'neet-mixed', testType: 'FULL_TEST', totalQuestions: 180, durationMinutes: 180, isRandom: true,
      availableLanguages: ['en'], rules: { exam: 'NEET', previousYearMode: 'MIXED_FIVE_YEARS', historical: { years: [...JEE_YEARS] } } };
    vi.mocked(prisma.test.findUnique).mockResolvedValue(neet as never);
    vi.mocked(prisma.question.findMany)
      .mockResolvedValueOnce([{ id: 'neet-q', subjectId: 'PHYSICS', chapterId: 'current', difficulty: 'MEDIUM', examYear: 2024 }] as never)
      .mockResolvedValueOnce([{ questionType: 'SINGLE_CORRECT', subject: { code: 'PHYSICS' },
        translations: [{ language: 'en', reviewed: true, correctOption: 'A', numericAnswer: null }] }] as never);
    expect(await generateForAttempt(neet.id, 'en', 'neet-filter', 'NUMERICAL_PROBLEM_SOLVING')).toEqual({ questionIds: ['neet-q'], warnings: [] });
    expect(prisma.question.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({
      exam: 'NEET', externalId: { in: neetManifest.rows.map(row => row.externalId) }, questionNature: 'NUMERICAL_PROBLEM_SOLVING',
    }) }));
  });

  it.each(['NEET', 'JEE'])('rejects a nature filter on the existing %s Full Mock path', async exam => {
    const mock = { id: `${exam}-full-mock-1`, testType: 'FULL_TEST', totalQuestions: exam === 'JEE' ? 75 : 180,
      durationMinutes: 180, isRandom: false, availableLanguages: ['en'], rules: { exam } };
    expect(supportsNature(mock)).toBe(false);
    vi.mocked(prisma.test.findUnique).mockResolvedValue(mock as never);
    await expect(generateForAttempt(mock.id, 'en', 'mock', 'CONCEPTUAL_THEORY')).rejects.toThrow('Question Nature is only available');
    expect(prisma.question.findMany).not.toHaveBeenCalled();
    expect(prisma.testQuestion.findMany).not.toHaveBeenCalled();
  });

  it.each(['NEET', 'JEE'])('preserves the fixed All Questions path and existing quotas for a %s Full Mock', async exam => {
    const rows = exam === 'NEET'
      ? ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].flatMap(code => Array.from({ length: 45 }, (_, index) => ({
        id: `${code}-${index}`, questionType: 'SINGLE_CORRECT', subject: { code },
        translations: [{ language: 'en', reviewed: true, correctOption: 'A', numericAnswer: null }],
      })))
      : JEE_SUBJECTS.flatMap(subject => JEE_YEARS.flatMap(year => [
        ...dbRows.filter(row => row.subjectId === subject && row.examYear === year && row.questionType === 'SINGLE_CORRECT').slice(0, 4),
        ...dbRows.filter(row => row.subjectId === subject && row.examYear === year && row.questionType === 'NUMERICAL_VALUE').slice(0, 1),
      ]));
    const mock = { id: `${exam}-full-mock-1`, testType: 'FULL_TEST', totalQuestions: rows.length,
      durationMinutes: 180, isRandom: false, availableLanguages: ['en'], rules: { exam } };
    vi.mocked(prisma.test.findUnique).mockResolvedValue(mock as never);
    vi.mocked(prisma.testQuestion.findMany).mockResolvedValue(rows.map(row => ({ questionId: row.id })) as never);
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce(rows as never);
    expect((await generateForAttempt(mock.id, 'en', 'original-mock')).questionIds).toEqual(rows.map(row => row.id));
    expect(rows).toHaveLength(exam === 'NEET' ? 180 : 75);
    expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: rows.map(row => row.id) }, isActive: true } }));
  });
});
