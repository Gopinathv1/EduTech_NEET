/**
 * Pure helpers for the Question Difficulty report: infer a question's *real*
 * difficulty from how students actually answered it, and flag when that
 * contradicts the difficulty an admin labelled it with.
 */

export type DifficultyBand = 'EASY' | 'MEDIUM' | 'HARD';

/** Minimum answered count before we trust the observed accuracy. */
export const MIN_ANSWERED_FOR_FLAG = 10;

/** Band the observed correct-percentage: easy questions are answered correctly
 *  often, hard ones rarely. */
export function realDifficultyFromAccuracy(correctPct: number): DifficultyBand {
  if (correctPct >= 70) return 'EASY';
  if (correctPct < 40) return 'HARD';
  return 'MEDIUM';
}

/**
 * True when the observed difficulty band contradicts the labelled one, given
 * enough answers to be meaningful.
 */
export function difficultyContradiction(
  label: string,
  correctPct: number,
  answered: number,
  minAnswered = MIN_ANSWERED_FOR_FLAG,
): boolean {
  if (answered < minAnswered) return false;
  return realDifficultyFromAccuracy(correctPct) !== label;
}
