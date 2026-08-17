import { describe, it, expect } from 'vitest';
import { computeResult, MARKS_CORRECT, MARKS_WRONG, type ResultQuestion } from '@/lib/attempts/result';

// NEET scoring: +4 correct, -1 wrong, 0 skipped — with per-chapter/subject/time
// breakdowns. Verifies the marks and the analysis buckets used by the Result row.

const questions: ResultQuestion[] = [
  { id: 'q1', subjectId: 'phy', chapterId: 'c1', correctOption: 'A' },
  { id: 'q2', subjectId: 'phy', chapterId: 'c1', correctOption: 'B' },
  { id: 'q3', subjectId: 'chem', chapterId: 'c2', correctOption: 'C' },
  { id: 'q4', subjectId: 'chem', chapterId: 'c2', correctOption: 'D' },
];

describe('computeResult', () => {
  it('scores correct/wrong/skipped with the NEET marking scheme', () => {
    const r = computeResult(questions, {
      q1: { selectedOption: 'A', timeSpentSeconds: 30 }, // correct
      q2: { selectedOption: 'C', timeSpentSeconds: 20 }, // wrong
      q3: { selectedOption: null, timeSpentSeconds: 10 }, // skipped (explicit null)
      // q4 has no answer row at all → also skipped
    });

    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(1);
    expect(r.skipped).toBe(2);
    expect(r.totalQuestions).toBe(4);
    expect(r.score).toBe(1 * MARKS_CORRECT + 1 * MARKS_WRONG); // 4 - 1 = 3
  });

  it('marks per-question correctness (null for skipped)', () => {
    const r = computeResult(questions, {
      q1: { selectedOption: 'A', timeSpentSeconds: 0 },
      q2: { selectedOption: 'A', timeSpentSeconds: 0 },
    });
    const byId = Object.fromEntries(r.perQuestion.map((p) => [p.questionId, p.isCorrect]));
    expect(byId.q1).toBe(true);
    expect(byId.q2).toBe(false);
    expect(byId.q3).toBeNull();
    expect(byId.q4).toBeNull();
  });

  it('aggregates chapter, subject and time analysis', () => {
    const r = computeResult(questions, {
      q1: { selectedOption: 'A', timeSpentSeconds: 30 },
      q2: { selectedOption: 'C', timeSpentSeconds: 20 },
      q3: { selectedOption: 'C', timeSpentSeconds: 15 },
      q4: { selectedOption: null, timeSpentSeconds: 5 },
    });

    expect(r.chapterAnalysis.c1).toEqual({ correct: 1, wrong: 1, skipped: 0, total: 2 });
    expect(r.subjectAnalysis.chem).toEqual({ correct: 1, wrong: 0, skipped: 1, total: 2 });
    expect(r.timeAnalysis.totalSeconds).toBe(70);
    expect(r.timeAnalysis.bySubject.phy).toBe(50);
    expect(r.timeAnalysis.byQuestion.q3).toBe(15);
  });
});
