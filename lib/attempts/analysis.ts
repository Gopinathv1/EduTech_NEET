/**
 * Pure display helpers derived from a stored Result. Used by the result page, the
 * PDF report and the performance dashboard so accuracy, marks and the strong /
 * average / weak banding are computed identically everywhere.
 */

import { MARKS_CORRECT, MARKS_WRONG, type Breakdown } from './result';

/** Accuracy over *attempted* questions (correct + wrong), as a 0–100 percentage. */
export function accuracyPct(correct: number, wrong: number): number {
  const attempted = correct + wrong;
  if (attempted <= 0) return 0;
  return (correct / attempted) * 100;
}

/** Round to one decimal for display (12.3), trimming a trailing .0 → 12. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** NEET marks for a breakdown: +4 per correct, -1 per wrong. */
export function marksFor(b: { correct: number; wrong: number }): number {
  return b.correct * MARKS_CORRECT + b.wrong * MARKS_WRONG;
}

export type Strength = 'strong' | 'average' | 'weak';

/** Strong ≥ 70%, weak < 40%, average in between — the chapter colour banding. */
export const STRONG_MIN = 70;
export const WEAK_MAX = 40;

export function strengthOf(accuracy: number): Strength {
  if (accuracy >= STRONG_MIN) return 'strong';
  if (accuracy < WEAK_MAX) return 'weak';
  return 'average';
}

/** attempted = correct + wrong (skipped excluded). */
export function attemptedOf(b: Breakdown): number {
  return b.correct + b.wrong;
}

/** Best-possible score for N questions (all correct). */
export function maxScoreFor(totalQuestions: number): number {
  return totalQuestions * MARKS_CORRECT;
}

/** Average seconds per question, guarding divide-by-zero. */
export function avgSecondsPerQuestion(totalSeconds: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return totalSeconds / totalQuestions;
}

/** Human "Xm Ys" (or "Ys" under a minute) from a second count. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}
