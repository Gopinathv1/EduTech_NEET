import { describe, it, expect, vi } from 'vitest';
import {
  generateQuestionSet,
  largestRemainder,
  GeneratorError,
  type GeneratorQuestion,
  type GeneratorRules,
  type GeneratorDifficulty,
} from '@/lib/generator';

// ---- helpers to build a synthetic bank -----------------------------------

let idCounter = 0;
function q(
  subjectId: string,
  chapterId: string,
  difficulty: GeneratorDifficulty,
  hasReviewedTa = false,
): GeneratorQuestion {
  idCounter += 1;
  return { id: `q${idCounter}`, subjectId, chapterId, difficulty, hasReviewedTa };
}

/** N questions per difficulty for one chapter. */
function chapterPool(
  subjectId: string,
  chapterId: string,
  perDifficulty: number,
  hasReviewedTa = false,
): GeneratorQuestion[] {
  const out: GeneratorQuestion[] = [];
  for (const d of ['EASY', 'MEDIUM', 'HARD'] as GeneratorDifficulty[]) {
    for (let i = 0; i < perDifficulty; i++) out.push(q(subjectId, chapterId, d, hasReviewedTa));
  }
  return out;
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) m[key(it)] = (m[key(it)] ?? 0) + 1;
  return m;
}

describe('largestRemainder', () => {
  it('allocates proportionally and sums exactly', () => {
    expect(largestRemainder(100, [50, 30, 20])).toEqual([50, 30, 20]);
    expect(largestRemainder(10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(10);
    expect(largestRemainder(7, [1, 1, 1])).toEqual([3, 2, 2]);
  });
});

describe('generateQuestionSet — weightage distribution', () => {
  it('distributes a subject count across chapters proportional to weightage', () => {
    const pool = [
      ...chapterPool('S1', 'C1', 40), // plenty
      ...chapterPool('S1', 'C2', 40),
      ...chapterPool('S1', 'C3', 40),
    ];
    const rules: GeneratorRules = {
      totalQuestions: 100,
      language: 'en',
      difficultyMix: { EASY: 34, MEDIUM: 33, HARD: 33 },
      subjects: [
        {
          subjectId: 'S1',
          count: 100,
          chapters: [
            { chapterId: 'C1', weightage: 50 },
            { chapterId: 'C2', weightage: 30 },
            { chapterId: 'C3', weightage: 20 },
          ],
        },
      ],
      pool,
    };
    const { questionIds } = generateQuestionSet(rules, 'seed-1');
    const byId = new Map(pool.map((p) => [p.id, p]));
    const perChapter = countBy(questionIds, (id) => byId.get(id)!.chapterId);
    expect(questionIds.length).toBe(100);
    expect(perChapter).toEqual({ C1: 50, C2: 30, C3: 20 });
  });

  it('splits across subjects (NEET-style 45×4)', () => {
    const pool = ['P', 'C', 'B', 'Z'].flatMap((s) => chapterPool(s, `${s}c1`, 40));
    const rules: GeneratorRules = {
      totalQuestions: 180,
      language: 'en',
      difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 },
      subjects: ['P', 'C', 'B', 'Z'].map((s) => ({
        subjectId: s,
        count: 45,
        chapters: [{ chapterId: `${s}c1`, weightage: 100 }],
      })),
      pool,
    };
    const { questionIds } = generateQuestionSet(rules, 'seed-x');
    const byId = new Map(pool.map((p) => [p.id, p]));
    const perSubject = countBy(questionIds, (id) => byId.get(id)!.subjectId);
    expect(questionIds.length).toBe(180);
    expect(perSubject).toEqual({ P: 45, C: 45, B: 45, Z: 45 });
  });
});

describe('generateQuestionSet — difficulty mix', () => {
  it('approximately matches the requested mix when the bank is rich', () => {
    const pool = chapterPool('S1', 'C1', 200); // 200 of each difficulty
    const rules: GeneratorRules = {
      totalQuestions: 100,
      language: 'en',
      difficultyMix: { EASY: 60, MEDIUM: 30, HARD: 10 },
      subjects: [{ subjectId: 'S1', count: 100, chapters: [{ chapterId: 'C1', weightage: 100 }] }],
      pool,
    };
    const { questionIds } = generateQuestionSet(rules, 'seed-mix');
    const byId = new Map(pool.map((p) => [p.id, p]));
    const perDiff = countBy(questionIds, (id) => byId.get(id)!.difficulty);
    expect(perDiff.EASY).toBe(60);
    expect(perDiff.MEDIUM).toBe(30);
    expect(perDiff.HARD).toBe(10);
  });
});

describe('generateQuestionSet — reproducibility & uniqueness', () => {
  const pool = chapterPool('S1', 'C1', 60);
  const rules: GeneratorRules = {
    totalQuestions: 30,
    language: 'en',
    difficultyMix: { EASY: 34, MEDIUM: 33, HARD: 33 },
    subjects: [{ subjectId: 'S1', count: 30, chapters: [{ chapterId: 'C1', weightage: 100 }] }],
    pool,
  };

  it('is reproducible for the same seed', () => {
    const a = generateQuestionSet(rules, 'same-seed');
    const b = generateQuestionSet(rules, 'same-seed');
    expect(a.questionIds).toEqual(b.questionIds);
  });

  it('differs between seeds', () => {
    const a = generateQuestionSet(rules, 'seed-A').questionIds;
    const b = generateQuestionSet(rules, 'seed-B').questionIds;
    expect(a.length).toBe(30);
    expect(b.length).toBe(30);
    expect(a.join(',')).not.toEqual(b.join(','));
  });
});

describe('generateQuestionSet — Tamil preference & fallback', () => {
  it('prefers reviewed-Tamil questions and warns on fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 5 with reviewed TA, 5 without (all EASY for simplicity).
    const withTa = Array.from({ length: 5 }, () => q('S1', 'C1', 'EASY', true));
    const withoutTa = Array.from({ length: 5 }, () => q('S1', 'C1', 'EASY', false));
    const pool = [...withTa, ...withoutTa];
    const base: GeneratorRules = {
      totalQuestions: 5,
      language: 'ta',
      difficultyMix: { EASY: 100, MEDIUM: 0, HARD: 0 },
      subjects: [{ subjectId: 'S1', count: 5, chapters: [{ chapterId: 'C1', weightage: 100 }] }],
      pool,
    };

    // Enough Tamil → no fallback, all chosen are reviewed-TA.
    const exact = generateQuestionSet(base, 's1');
    const byId = new Map(pool.map((p) => [p.id, p]));
    expect(exact.warnings).toHaveLength(0);
    expect(exact.questionIds.every((id) => byId.get(id)!.hasReviewedTa)).toBe(true);

    // Need more than available Tamil → fallback + warning.
    const over = generateQuestionSet({ ...base, totalQuestions: 8, subjects: [{ subjectId: 'S1', count: 8, chapters: [{ chapterId: 'C1', weightage: 100 }] }] }, 's2');
    expect(over.warnings).toHaveLength(1);
    expect(over.warnings[0]).toMatch(/fell back to English-only/);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('generateQuestionSet — insufficient bank', () => {
  it('throws GeneratorError when a subject cannot be satisfied', () => {
    const pool = chapterPool('S1', 'C1', 1); // only 3 questions total
    const rules: GeneratorRules = {
      totalQuestions: 10,
      language: 'en',
      difficultyMix: { EASY: 34, MEDIUM: 33, HARD: 33 },
      subjects: [{ subjectId: 'S1', count: 10, chapters: [{ chapterId: 'C1', weightage: 100 }] }],
      pool,
    };
    expect(() => generateQuestionSet(rules, 'seed')).toThrow(GeneratorError);
  });
});
