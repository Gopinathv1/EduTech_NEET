import type { ChapterPerf, Recommendation } from './types';

/**
 * Pure, rule-based recommendation engine. Given each chapter's aggregated
 * performance it returns a prioritised list of "what to practise next":
 *
 *   1. Weak chapters (low accuracy) — highest NEET weightage first.
 *   2. Chapters whose accuracy is trending down.
 *   3. Chapters answered accurately but slowly (time to speed up).
 *
 * Only chapters with a minimum sample size qualify, so a single unlucky question
 * can't dominate. The engine is intentionally simple and deterministic; its inputs
 * and outputs are stable so a smarter (e.g. ML) engine can replace it behind the
 * same interface later.
 */

export * from './types';
export * from './aggregate';

export type RecommendOptions = {
  /** Minimum questions attempted in a chapter before it can be recommended. */
  minAttempted?: number;
  /** Accuracy (<) that makes a chapter "weak". */
  weakMax?: number;
  /** Accuracy (<) below which a declining chapter still warrants practice. */
  needsWorkMax?: number;
  /** Accuracy (>=) required for a chapter to count as "accurate" (slow-accurate). */
  accurateMin?: number;
  /** How much slower than the student's overall pace counts as "slow". */
  slowFactor?: number;
  /** Overall average seconds/question across all attempts (for slow-accurate). */
  overallAvgSecondsPerQuestion?: number | null;
  /** Cap the number of recommendations returned. */
  limit?: number;
};

const DEFAULTS = {
  minAttempted: 10,
  weakMax: 40,
  needsWorkMax: 70,
  accurateMin: 70,
  slowFactor: 1.25,
};

function toRecommendation(c: ChapterPerf, group: number, kind: Recommendation['kind']): Recommendation {
  return {
    chapterId: c.chapterId,
    subjectCode: c.subjectCode,
    name: c.name,
    kind,
    group,
    accuracy: c.accuracy,
    attempted: c.attempted,
    testsCount: c.testsCount,
    weightage: c.weightage,
    avgSecondsPerQuestion: c.avgSecondsPerQuestion,
    reason: { code: kind, accuracy: Math.round(c.accuracy), tests: c.testsCount },
  };
}

export function recommend(chapters: ChapterPerf[], options: RecommendOptions = {}): Recommendation[] {
  const opts = { ...DEFAULTS, ...options };
  const overallAvg = options.overallAvgSecondsPerQuestion ?? null;

  const eligible = chapters.filter((c) => c.attempted >= opts.minAttempted);

  // Group 1 — weak chapters, highest weightage first.
  const weak = eligible
    .filter((c) => c.accuracy < opts.weakMax)
    .sort(
      (a, b) =>
        b.weightage - a.weightage ||
        a.accuracy - b.accuracy ||
        a.chapterId.localeCompare(b.chapterId),
    )
    .map((c) => toRecommendation(c, 1, 'weakChapter'));

  const usedIds = new Set(weak.map((r) => r.chapterId));

  // Group 2 — declining chapters that still need work (not already weak-listed).
  const declining = eligible
    .filter((c) => !usedIds.has(c.chapterId) && c.trend === 'declining' && c.accuracy < opts.needsWorkMax)
    .sort(
      (a, b) =>
        b.weightage - a.weightage ||
        a.accuracy - b.accuracy ||
        a.chapterId.localeCompare(b.chapterId),
    )
    .map((c) => toRecommendation(c, 2, 'decliningChapter'));

  declining.forEach((r) => usedIds.add(r.chapterId));

  // Group 3 — accurate but slow (only when we know the overall pace).
  const slowAccurate =
    overallAvg && overallAvg > 0
      ? eligible
          .filter(
            (c) =>
              !usedIds.has(c.chapterId) &&
              c.accuracy >= opts.accurateMin &&
              c.avgSecondsPerQuestion !== null &&
              c.avgSecondsPerQuestion > overallAvg * opts.slowFactor,
          )
          .sort(
            (a, b) =>
              (b.avgSecondsPerQuestion ?? 0) - (a.avgSecondsPerQuestion ?? 0) ||
              a.chapterId.localeCompare(b.chapterId),
          )
          .map((c) => toRecommendation(c, 3, 'slowAccurate'))
      : [];

  const all = [...weak, ...declining, ...slowAccurate];
  return typeof opts.limit === 'number' ? all.slice(0, opts.limit) : all;
}
