import { describe, it, expect } from 'vitest';
import {
  accuracyPct,
  marksFor,
  strengthOf,
  attemptedOf,
  maxScoreFor,
  avgSecondsPerQuestion,
  round1,
  formatDuration,
} from '@/lib/attempts/analysis';

describe('analysis helpers', () => {
  it('accuracyPct is correct/attempted, ignoring skipped', () => {
    expect(accuracyPct(3, 1)).toBe(75); // 3 of 4 attempted
    expect(accuracyPct(0, 0)).toBe(0); // nothing attempted → 0, no divide-by-zero
    expect(accuracyPct(5, 0)).toBe(100);
  });

  it('marksFor applies +4 / -1', () => {
    expect(marksFor({ correct: 10, wrong: 5 })).toBe(35); // 40 - 5
    expect(marksFor({ correct: 0, wrong: 3 })).toBe(-3);
  });

  it('strengthOf bands at 70 and 40', () => {
    expect(strengthOf(70)).toBe('strong');
    expect(strengthOf(85)).toBe('strong');
    expect(strengthOf(69.9)).toBe('average');
    expect(strengthOf(40)).toBe('average');
    expect(strengthOf(39.9)).toBe('weak');
    expect(strengthOf(0)).toBe('weak');
  });

  it('attemptedOf excludes skipped', () => {
    expect(attemptedOf({ correct: 2, wrong: 1, skipped: 5, total: 8 })).toBe(3);
  });

  it('maxScoreFor and avgSecondsPerQuestion guard edges', () => {
    expect(maxScoreFor(45)).toBe(180);
    expect(avgSecondsPerQuestion(120, 4)).toBe(30);
    expect(avgSecondsPerQuestion(120, 0)).toBe(0);
  });

  it('round1 and formatDuration format for display', () => {
    expect(round1(66.666)).toBe(66.7);
    expect(round1(50)).toBe(50);
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(0)).toBe('0s');
  });
});
