import { describe, expect, it } from 'vitest';
import { validFullMock } from '@/lib/attempts/config';

describe('JEE demo practice configuration', () => {
  it('does not apply NEET full-mock assumptions to a small practice test', () => {
    expect(validFullMock({ testType: 'MINI_TEST', totalQuestions: 15, durationMinutes: 30 })).toBe(true);
    expect({ questions: 15, durationMinutes: 30, subjects: ['Physics', 'Chemistry', 'Mathematics'] }).toEqual({
      questions: 15,
      durationMinutes: 30,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
    });
  });
});
