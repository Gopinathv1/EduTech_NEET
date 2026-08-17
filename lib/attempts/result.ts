/**
 * Pure NEET result scoring for a submitted attempt.
 *
 * Marking scheme: +4 for a correct answer, -1 for a wrong answer, 0 for a skipped
 * (unanswered) question. The correct option is taken from the authoritative
 * English translation. The function is pure so it can be unit-tested and reused by
 * both the manual-submit and the expiry auto-submit paths.
 */

export type ScoredOption = 'A' | 'B' | 'C' | 'D';

export const MARKS_CORRECT = 4;
export const MARKS_WRONG = -1;

export type ResultQuestion = {
  id: string;
  subjectId: string;
  chapterId: string;
  correctOption: ScoredOption;
};

export type ResultAnswer = {
  selectedOption: ScoredOption | null;
  timeSpentSeconds: number;
};

export type Breakdown = { correct: number; wrong: number; skipped: number; total: number };

export type ComputedResult = {
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  /** Per-question correctness, so callers can persist `Answer.isCorrect`. */
  perQuestion: { questionId: string; isCorrect: boolean | null }[];
  chapterAnalysis: Record<string, Breakdown>;
  subjectAnalysis: Record<string, Breakdown>;
  timeAnalysis: {
    totalSeconds: number;
    bySubject: Record<string, number>;
    byQuestion: Record<string, number>;
  };
};

function bump(map: Record<string, Breakdown>, key: string, field: keyof Breakdown) {
  const b = (map[key] ??= { correct: 0, wrong: 0, skipped: 0, total: 0 });
  b[field]++;
  b.total++;
}

/**
 * Compute the result from the frozen question set and the student's answers.
 * `answers` is keyed by questionId; a missing entry (or null option) counts as
 * skipped.
 */
export function computeResult(
  questions: ResultQuestion[],
  answers: Record<string, ResultAnswer | undefined>,
): ComputedResult {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const perQuestion: { questionId: string; isCorrect: boolean | null }[] = [];
  const chapterAnalysis: Record<string, Breakdown> = {};
  const subjectAnalysis: Record<string, Breakdown> = {};
  const bySubject: Record<string, number> = {};
  const byQuestion: Record<string, number> = {};
  let totalSeconds = 0;

  for (const q of questions) {
    const a = answers[q.id];
    const selected = a?.selectedOption ?? null;
    const time = a?.timeSpentSeconds ?? 0;
    byQuestion[q.id] = time;
    bySubject[q.subjectId] = (bySubject[q.subjectId] ?? 0) + time;
    totalSeconds += time;

    let field: keyof Breakdown;
    let isCorrect: boolean | null;
    if (selected === null) {
      skipped++;
      isCorrect = null;
      field = 'skipped';
    } else if (selected === q.correctOption) {
      correct++;
      isCorrect = true;
      field = 'correct';
    } else {
      wrong++;
      isCorrect = false;
      field = 'wrong';
    }

    perQuestion.push({ questionId: q.id, isCorrect });
    bump(chapterAnalysis, q.chapterId, field);
    bump(subjectAnalysis, q.subjectId, field);
  }

  const score = correct * MARKS_CORRECT + wrong * MARKS_WRONG;

  return {
    totalQuestions: questions.length,
    correct,
    wrong,
    skipped,
    score,
    perQuestion,
    chapterAnalysis,
    subjectAnalysis,
    timeAnalysis: { totalSeconds, bySubject, byQuestion },
  };
}
