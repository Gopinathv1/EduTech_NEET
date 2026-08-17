import { describe, it, expect } from 'vitest';
import {
  examReducer,
  paletteStatus,
  summarize,
  type ExamState,
} from '@/lib/attempts/examState';

// The central mid-test invariant: switching language is a pure rendering change.
// It must never reset the timer (owned elsewhere), lose saved answers, change the
// current question, or disturb the palette.

function build(): ExamState {
  // Start on question index 2 (q3), answer q1, mark q2.
  let s: ExamState = { lang: 'en', currentIndex: 0, answers: {} };
  s = examReducer(s, { type: 'VISIT', questionId: 'q1' });
  s = examReducer(s, { type: 'SELECT_OPTION', questionId: 'q1', option: 'B' });
  s = examReducer(s, { type: 'NAVIGATE', index: 1 });
  s = examReducer(s, { type: 'VISIT', questionId: 'q2' });
  s = examReducer(s, { type: 'TOGGLE_MARK', questionId: 'q2' });
  s = examReducer(s, { type: 'NAVIGATE', index: 2 });
  s = examReducer(s, { type: 'VISIT', questionId: 'q3' });
  return s;
}

describe('examReducer — SET_LANGUAGE preserves all other state', () => {
  it('changes only lang, leaving answers, current question and palette intact', () => {
    const before = build();
    const after = examReducer(before, { type: 'SET_LANGUAGE', lang: 'ta' });

    expect(after.lang).toBe('ta');
    expect(after.currentIndex).toBe(before.currentIndex);
    expect(after.answers).toEqual(before.answers);
    // The answered/ marked state survives the switch.
    expect(after.answers.q1.selectedOption).toBe('B');
    expect(after.answers.q2.markedForReview).toBe(true);
  });

  it('is a no-op when the language is unchanged (same reference)', () => {
    const s = build();
    expect(examReducer(s, { type: 'SET_LANGUAGE', lang: 'en' })).toBe(s);
  });

  it('switching back and forth is stable', () => {
    const s = build();
    const there = examReducer(s, { type: 'SET_LANGUAGE', lang: 'ta' });
    const back = examReducer(there, { type: 'SET_LANGUAGE', lang: 'en' });
    expect(back.answers).toEqual(s.answers);
    expect(back.currentIndex).toBe(s.currentIndex);
    expect(back.lang).toBe('en');
  });
});

describe('examReducer — answer actions', () => {
  it('SELECT_OPTION marks visited and records the option', () => {
    const s = examReducer({ lang: 'en', currentIndex: 0, answers: {} }, {
      type: 'SELECT_OPTION',
      questionId: 'q1',
      option: 'C',
    });
    expect(s.answers.q1).toEqual({ selectedOption: 'C', markedForReview: false, visited: true });
  });

  it('CLEAR removes the option but keeps visited', () => {
    let s = examReducer({ lang: 'en', currentIndex: 0, answers: {} }, {
      type: 'SELECT_OPTION',
      questionId: 'q1',
      option: 'C',
    });
    s = examReducer(s, { type: 'CLEAR', questionId: 'q1' });
    expect(s.answers.q1.selectedOption).toBeNull();
    expect(s.answers.q1.visited).toBe(true);
  });

  it('TOGGLE_MARK flips the review flag', () => {
    let s = examReducer({ lang: 'en', currentIndex: 0, answers: {} }, { type: 'TOGGLE_MARK', questionId: 'q1' });
    expect(s.answers.q1.markedForReview).toBe(true);
    s = examReducer(s, { type: 'TOGGLE_MARK', questionId: 'q1' });
    expect(s.answers.q1.markedForReview).toBe(false);
  });
});

describe('paletteStatus & summarize', () => {
  it('maps answer state to the four palette states', () => {
    expect(paletteStatus(undefined)).toBe('not_visited');
    expect(paletteStatus({ selectedOption: null, markedForReview: false, visited: false })).toBe('not_visited');
    expect(paletteStatus({ selectedOption: null, markedForReview: false, visited: true })).toBe('unanswered');
    expect(paletteStatus({ selectedOption: 'A', markedForReview: false, visited: true })).toBe('answered');
    // Marked takes precedence, even when answered.
    expect(paletteStatus({ selectedOption: 'A', markedForReview: true, visited: true })).toBe('marked');
  });

  it('summarize counts each state across the question set', () => {
    const s = build();
    const counts = summarize(['q1', 'q2', 'q3', 'q4'], s.answers);
    expect(counts).toEqual({ answered: 1, marked: 1, unanswered: 1, notVisited: 1 });
  });
});
