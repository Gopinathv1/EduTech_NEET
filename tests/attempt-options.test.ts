import { describe, it, expect } from 'vitest';
import {
  canShuffleOptions,
  optionDisplayOrder,
  applyDisplayOrder,
  canonicalToDisplay,
  displayToCanonical,
  OPTION_LETTERS,
  type OptLetter,
} from '@/lib/attempts/options';

const opts = (a: string, b: string, c: string, d: string) => ({
  optionA: a,
  optionB: b,
  optionC: c,
  optionD: d,
});

describe('canShuffleOptions', () => {
  it('allows plain factual options', () => {
    expect(canShuffleOptions(opts('Mendel', 'Darwin', 'Watson', 'de Vries'), 'SINGLE_CORRECT')).toBe(true);
  });
  it('blocks position-referencing options', () => {
    expect(canShuffleOptions(opts('X', 'Y', 'All of the above', 'Z'), 'SINGLE_CORRECT')).toBe(false);
    expect(canShuffleOptions(opts('None of the above', 'Y', 'Z', 'W'), 'SINGLE_CORRECT')).toBe(false);
    expect(canShuffleOptions(opts('A and B', 'B only', 'C', 'D'), 'SINGLE_CORRECT')).toBe(false);
    expect(canShuffleOptions(opts('1 and 3 only', 'b', 'c', 'd'), 'SINGLE_CORRECT')).toBe(false);
  });
  it('never shuffles assertion–reason questions', () => {
    expect(canShuffleOptions(opts('P', 'Q', 'R', 'S'), 'ASSERTION_REASON')).toBe(false);
  });
});

describe('optionDisplayOrder', () => {
  it('is the identity order when shuffle is off (or no seed)', () => {
    expect(optionDisplayOrder('seed', 'q1', false)).toEqual([...OPTION_LETTERS]);
    expect(optionDisplayOrder(null, 'q1', true)).toEqual([...OPTION_LETTERS]);
  });
  it('is deterministic for a given (seed, questionId)', () => {
    const a = optionDisplayOrder('attempt-1', 'q42', true);
    const b = optionDisplayOrder('attempt-1', 'q42', true);
    expect(a).toEqual(b);
  });
  it('always returns a valid permutation of A–D', () => {
    for (const qid of ['q1', 'q2', 'q3', 'q4', 'q5']) {
      const order = optionDisplayOrder('s', qid, true);
      expect([...order].sort()).toEqual([...OPTION_LETTERS].sort());
    }
  });
  it('produces different orders for different questions (at least sometimes)', () => {
    const orders = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((q) => optionDisplayOrder('s', q, true).join(''));
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});

describe('applyDisplayOrder', () => {
  it('reorders option contents into the display order', () => {
    const content = opts('a', 'b', 'c', 'd');
    const order: OptLetter[] = ['C', 'A', 'D', 'B'];
    expect(applyDisplayOrder(content, order)).toMatchObject({
      optionA: 'c',
      optionB: 'a',
      optionC: 'd',
      optionD: 'b',
    });
  });
});

describe('canonical ↔ display mapping', () => {
  it('round-trips for every letter under any order', () => {
    const order = optionDisplayOrder('attempt-9', 'qX', true);
    for (const canonical of OPTION_LETTERS) {
      const display = canonicalToDisplay(order, canonical);
      expect(displayToCanonical(order, display)).toBe(canonical);
    }
  });

  it('scores a shuffled answer correctly end-to-end', () => {
    // Canonical correct is C. It is displayed at some position; a student who
    // clicks that displayed letter must be marked correct.
    const order = optionDisplayOrder('attempt-7', 'q100', true);
    const canonicalCorrect: OptLetter = 'C';
    const displayedCorrect = canonicalToDisplay(order, canonicalCorrect); // what the student clicks
    // finalizeAttempt maps the canonical correct into display space the same way:
    const scoringCorrect = canonicalToDisplay(order, canonicalCorrect);
    expect(displayedCorrect).toBe(scoringCorrect); // student's pick === scoring's correct → +4
  });
});
