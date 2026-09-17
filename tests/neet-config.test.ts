import { describe, expect, it } from 'vitest';
import { NEET_CONFIG, validFullMock } from '@/lib/attempts/config';
import { computeResult } from '@/lib/attempts/result';

describe('verified NEET 2026 configuration', () => {
  it('requires the full pattern only for full mocks', () => {
    expect(validFullMock({ testType: 'FULL_TEST', totalQuestions: 180, durationMinutes: 180 })).toBe(true);
    expect(validFullMock({ testType: 'FULL_TEST', totalQuestions: 200, durationMinutes: 200 })).toBe(false);
    expect(validFullMock({ testType: 'CHAPTER_TEST', totalQuestions: 10, durationMinutes: 15 })).toBe(true);
  });
  it('scores 180 correct answers as 720, and all incorrect as -180', () => {
    const questions = Array.from({ length: 180 }, (_, i) => ({ id: String(i), subjectId: NEET_CONFIG.subjects[Math.floor(i / 45)], chapterId: 'c', correctOption: 'A' as const }));
    const answers = Object.fromEntries(questions.map(q => [q.id, { selectedOption: 'A' as const, timeSpentSeconds: 0 }]));
    expect(computeResult(questions, answers).score).toBe(720);
    expect(computeResult(questions, Object.fromEntries(questions.map(q => [q.id, { selectedOption: 'B', timeSpentSeconds: 0 }]))).score).toBe(-180);
    const unanswered = computeResult(questions, {});
    expect(unanswered.score).toBe(0);
    expect(unanswered.skipped).toBe(180);
    expect(Object.values(unanswered.subjectAnalysis).map(s => s.total)).toEqual([45, 45, 45, 45]);
  });
});
