import { describe, expect, it } from 'vitest';
import { EXAM_PRACTICE_LOOP_LABEL } from '@/lib/exams/product-status';
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import ta from '@/messages/ta.json';

describe('JEE product status', () => {
  it('uses a live practice-loop status rather than a global Coming Soon claim', () => {
    expect(EXAM_PRACTICE_LOOP_LABEL).toBe('PRACTICE LOOP');
    expect(EXAM_PRACTICE_LOOP_LABEL.toLowerCase()).not.toContain('coming soon');
  });

  it('keeps English, Hindi, and Tamil JEE navigation marked live', () => {
    expect(en.publicNav.examJeeSoon).toBe('JEE');
    expect(hi.publicNav.examJeeSoon).toBe('JEE');
    expect(ta.publicNav.examJeeSoon).toBe('JEE');
    expect(en.home.examChips.find((item) => item.label === 'JEE')?.available).toBe(true);
    expect(hi.home.examChips.find((item) => item.label === 'JEE')?.available).toBe(true);
    expect(ta.home.examChips.find((item) => item.label === 'JEE')?.available).toBe(true);
  });
});
