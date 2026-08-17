import type { ChapterPerf, ChapterTrend, LocalizedText } from './types';

/**
 * Pure aggregation of a student's per-attempt chapter breakdowns into one
 * `ChapterPerf` per chapter. Kept separate from the recommendation rules so both
 * can be unit-tested in isolation and an AI-driven engine can later consume the
 * same aggregate.
 */

export type ChapterMeta = { subjectCode: string; name: LocalizedText; weightage: number };

/** One chapter's slice of a single attempt. */
export type AttemptChapterEntry = {
  correct: number;
  wrong: number;
  /** Questions from this chapter in the attempt (correct + wrong + skipped). */
  total: number;
  /** Seconds spent on this chapter in the attempt, if known. */
  timeSeconds?: number;
};

export type AttemptChapters = {
  /** Attempt time in epoch ms — used only for chronological ordering (trend). */
  date: number;
  chapters: Record<string, AttemptChapterEntry>;
};

const TREND_DELTA = 5; // percentage-point change needed to call a trend

/** Compare the later half of a chronological accuracy series to the earlier half. */
export function trendOf(accuraciesChrono: number[]): ChapterTrend {
  if (accuraciesChrono.length < 2) return 'flat';
  const mid = Math.floor(accuraciesChrono.length / 2);
  const earlier = accuraciesChrono.slice(0, mid);
  const later = accuraciesChrono.slice(mid);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = avg(later) - avg(earlier);
  if (delta > TREND_DELTA) return 'improving';
  if (delta < -TREND_DELTA) return 'declining';
  return 'flat';
}

export function aggregateChapterPerformance(
  meta: Record<string, ChapterMeta>,
  attempts: AttemptChapters[],
): ChapterPerf[] {
  // Oldest → newest so per-chapter accuracy series read chronologically.
  const ordered = [...attempts].sort((a, b) => a.date - b.date);

  type Acc = {
    correct: number;
    wrong: number;
    testsCount: number;
    timeSeconds: number;
    timedQuestions: number;
    hasTime: boolean;
    series: number[]; // per-attempt accuracy where the chapter was attempted
  };
  const acc = new Map<string, Acc>();

  for (const attempt of ordered) {
    for (const [chapterId, entry] of Object.entries(attempt.chapters)) {
      if (!meta[chapterId]) continue; // ignore chapters we have no metadata for
      const a =
        acc.get(chapterId) ??
        { correct: 0, wrong: 0, testsCount: 0, timeSeconds: 0, timedQuestions: 0, hasTime: false, series: [] };
      a.correct += entry.correct;
      a.wrong += entry.wrong;
      const attempted = entry.correct + entry.wrong;
      if (attempted > 0) {
        a.testsCount += 1;
        a.series.push((entry.correct / attempted) * 100);
      }
      if (typeof entry.timeSeconds === 'number' && entry.total > 0) {
        a.timeSeconds += entry.timeSeconds;
        a.timedQuestions += entry.total;
        a.hasTime = true;
      }
      acc.set(chapterId, a);
    }
  }

  const result: ChapterPerf[] = [];
  for (const [chapterId, a] of acc) {
    const m = meta[chapterId];
    const attempted = a.correct + a.wrong;
    const accuracy = attempted > 0 ? (a.correct / attempted) * 100 : 0;
    result.push({
      chapterId,
      subjectCode: m.subjectCode,
      name: m.name,
      weightage: m.weightage,
      attempted,
      correct: a.correct,
      accuracy,
      testsCount: a.testsCount,
      trend: trendOf(a.series),
      avgSecondsPerQuestion: a.hasTime && a.timedQuestions > 0 ? a.timeSeconds / a.timedQuestions : null,
    });
  }

  // Stable, deterministic default ordering.
  result.sort((x, y) => y.weightage - x.weightage || x.chapterId.localeCompare(y.chapterId));
  return result;
}
