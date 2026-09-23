import { describe, expect, it } from 'vitest';
import { validFullMock } from '@/lib/attempts/config';
import { JEE_DEMO, JEE_DEMO_QUESTIONS } from '@/lib/exams/jee-demo';
import { catalogueAttemptAction } from '@/lib/student/catalogue';

describe('JEE demo practice configuration', () => {
  it('does not apply NEET full-mock assumptions to a small practice test', () => {
    expect(validFullMock({ testType: 'MINI_TEST', totalQuestions: JEE_DEMO.totalQuestions, durationMinutes: JEE_DEMO.durationMinutes })).toBe(true);
    expect(JEE_DEMO.mode).toBe('DEMO_PRACTICE');
    expect(JEE_DEMO.name).not.toMatch(/official|full mock/i);
  });

  it('contains exactly five original questions for each JEE subject with unique stable positions', () => {
    expect(JEE_DEMO_QUESTIONS).toHaveLength(15);
    for (const subject of ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS']) {
      expect(JEE_DEMO_QUESTIONS.filter(([code]) => code === subject)).toHaveLength(5);
    }
    expect(new Set(JEE_DEMO_QUESTIONS.map(([, , prompt]) => prompt)).size).toBe(15);
    for (const [, , , options, correct] of JEE_DEMO_QUESTIONS) {
      expect(options).toHaveLength(4);
      expect(['A', 'B', 'C', 'D']).toContain(correct);
    }
  });
});

describe('student catalogue attempt actions', () => {
  it('uses the test id start route for new and repeat attempts, and attempt route only for resume', () => {
    expect(catalogueAttemptAction()).toEqual({ label: 'Take Test', route: 'start' });
    expect(catalogueAttemptAction('IN_PROGRESS')).toEqual({ label: 'Resume Test', route: 'attempt' });
    expect(catalogueAttemptAction('SUBMITTED')).toEqual({ label: 'Take Another Attempt', route: 'start' });
    expect(catalogueAttemptAction('COMPLETED')).toEqual({ label: 'Take Another Attempt', route: 'start' });
  });
});
