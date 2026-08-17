import { describe, it, expect } from 'vitest';
import {
  aggregateChapterPerformance,
  trendOf,
  recommend,
  type ChapterMeta,
  type ChapterPerf,
} from '@/lib/recommendations';

// ---- aggregation ----------------------------------------------------------

const meta: Record<string, ChapterMeta> = {
  humanPhysio: { subjectCode: 'ZOOLOGY', name: { en: 'Human Physiology', ta: 'மனித உடலியல்' }, weightage: 20 },
  genetics: { subjectCode: 'BOTANY', name: { en: 'Genetics', ta: 'மரபியல்' }, weightage: 12 },
  optics: { subjectCode: 'PHYSICS', name: { en: 'Optics' }, weightage: 8 },
};

describe('trendOf', () => {
  it('needs at least two points', () => {
    expect(trendOf([])).toBe('flat');
    expect(trendOf([50])).toBe('flat');
  });
  it('detects declining and improving beyond the delta threshold', () => {
    expect(trendOf([80, 78, 40, 35])).toBe('declining');
    expect(trendOf([30, 35, 70, 75])).toBe('improving');
    expect(trendOf([50, 52, 48, 51])).toBe('flat');
  });
});

describe('aggregateChapterPerformance', () => {
  it('sums correct/wrong, counts tests, and derives accuracy + trend + avg time', () => {
    const perf = aggregateChapterPerformance(meta, [
      {
        date: 1,
        chapters: {
          humanPhysio: { correct: 8, wrong: 2, total: 10, timeSeconds: 300 }, // 80%
          genetics: { correct: 2, wrong: 8, total: 10, timeSeconds: 200 }, // 20%
        },
      },
      {
        date: 2,
        chapters: {
          humanPhysio: { correct: 2, wrong: 8, total: 10, timeSeconds: 300 }, // 20% → declining
          genetics: { correct: 3, wrong: 7, total: 10, timeSeconds: 200 }, // 30%
        },
      },
    ]);

    const hp = perf.find((c) => c.chapterId === 'humanPhysio')!;
    expect(hp.attempted).toBe(20);
    expect(hp.correct).toBe(10);
    expect(hp.accuracy).toBe(50);
    expect(hp.testsCount).toBe(2);
    expect(hp.trend).toBe('declining'); // 80% → 20%
    expect(hp.avgSecondsPerQuestion).toBe(30); // 600s / 20 questions
  });

  it('ignores chapters without metadata and leaves time null when unknown', () => {
    const perf = aggregateChapterPerformance(meta, [
      { date: 1, chapters: { optics: { correct: 5, wrong: 5, total: 10 }, ghost: { correct: 9, wrong: 1, total: 10 } } },
    ]);
    expect(perf.map((c) => c.chapterId)).toEqual(['optics']); // ghost dropped
    expect(perf[0].avgSecondsPerQuestion).toBeNull();
  });
});

// ---- recommendation rules -------------------------------------------------

function chap(over: Partial<ChapterPerf>): ChapterPerf {
  return {
    chapterId: 'c',
    subjectCode: 'ZOOLOGY',
    name: { en: 'Chapter' },
    weightage: 10,
    attempted: 20,
    correct: 10,
    accuracy: 50,
    testsCount: 2,
    trend: 'flat',
    avgSecondsPerQuestion: null,
    ...over,
  };
}

describe('recommend', () => {
  it('drops chapters below the minimum sample size', () => {
    const recs = recommend([chap({ chapterId: 'small', attempted: 5, accuracy: 10 })]);
    expect(recs).toEqual([]);
  });

  it('prioritises weak + high-weightage first', () => {
    const recs = recommend([
      chap({ chapterId: 'weakLowWeight', accuracy: 30, weightage: 5 }),
      chap({ chapterId: 'weakHighWeight', accuracy: 30, weightage: 20 }),
    ]);
    expect(recs[0].chapterId).toBe('weakHighWeight');
    expect(recs[0].kind).toBe('weakChapter');
    expect(recs[0].group).toBe(1);
    expect(recs[0].reason).toEqual({ code: 'weakChapter', accuracy: 30, tests: 2 });
  });

  it('orders groups: weak, then declining, then slow-accurate', () => {
    const recs = recommend(
      [
        chap({ chapterId: 'slow', accuracy: 90, avgSecondsPerQuestion: 60, trend: 'flat' }),
        chap({ chapterId: 'declining', accuracy: 55, trend: 'declining' }),
        chap({ chapterId: 'weak', accuracy: 25, weightage: 15 }),
      ],
      { overallAvgSecondsPerQuestion: 30 }, // slow = >37.5s/q
    );
    expect(recs.map((r) => r.chapterId)).toEqual(['weak', 'declining', 'slow']);
    expect(recs.map((r) => r.kind)).toEqual(['weakChapter', 'decliningChapter', 'slowAccurate']);
  });

  it('does not double-list a weak chapter that is also declining', () => {
    const recs = recommend([chap({ chapterId: 'both', accuracy: 30, trend: 'declining' })]);
    expect(recs).toHaveLength(1);
    expect(recs[0].kind).toBe('weakChapter');
  });

  it('omits slow-accurate when the overall pace is unknown', () => {
    const recs = recommend([chap({ chapterId: 'slow', accuracy: 90, avgSecondsPerQuestion: 90 })]);
    expect(recs).toEqual([]);
  });

  it('respects the limit', () => {
    const recs = recommend(
      [
        chap({ chapterId: 'a', accuracy: 10, weightage: 30 }),
        chap({ chapterId: 'b', accuracy: 20, weightage: 20 }),
        chap({ chapterId: 'c', accuracy: 30, weightage: 10 }),
      ],
      { limit: 2 },
    );
    expect(recs.map((r) => r.chapterId)).toEqual(['a', 'b']);
  });
});
