import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { Breakdown } from '@/lib/attempts/result';
import {
  accuracyPct,
  attemptedOf,
  avgSecondsPerQuestion,
  maxScoreFor,
  strengthOf,
  type Strength,
} from '@/lib/attempts/analysis';
import {
  aggregateChapterPerformance,
  recommend,
  type AttemptChapters,
  type ChapterMeta,
  type ChapterPerf,
  type LocalizedText,
  type Recommendation,
} from '@/lib/recommendations';
import { computeCoverage } from '@/lib/student/catalogue';

/**
 * Cross-attempt performance analytics for a student: score/accuracy/time trends,
 * subject accuracy, strong & weak chapters (min sample size), and matched
 * recommendations. All chart-ready and shared by the performance dashboard and
 * (recommendations only) the student dashboard.
 */

/** A chapter must have at least this many attempted questions to be judged. */
export const MIN_QUALIFY = 10;

export type PerfAttemptRow = {
  attemptId: string;
  testId: string;
  testTitle: LocalizedText;
  submittedAt: string | null;
  status: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  avgSecondsPerQuestion: number;
};

export type TrendPoint = {
  attemptId: string;
  label: string; // "T1", "T2", … — language-neutral x-axis
  date: string | null;
  score: number;
  accuracy: number;
  avgSeconds: number;
};

export type SubjectAccuracyRow = { code: string; name: LocalizedText; attempted: number; correct: number; accuracy: number };

export type ChapterListRow = {
  chapterId: string;
  name: LocalizedText;
  subjectCode: string;
  accuracy: number;
  attempted: number;
  testsCount: number;
  strength: Strength;
};

export type MatchedRecommendation = Recommendation & { test: { id: string; title: LocalizedText } | null };

export type Performance = {
  attemptsCount: number;
  history: PerfAttemptRow[]; // newest first
  trend: TrendPoint[]; // oldest → newest
  subjectAccuracy: SubjectAccuracyRow[];
  strongChapters: ChapterListRow[];
  weakChapters: ChapterListRow[];
  recommendations: MatchedRecommendation[];
};

type TimeAnalysis = { totalSeconds?: number; bySubject?: Record<string, number>; byQuestion?: Record<string, number> };

function asBreakdownMap(json: unknown): Record<string, Breakdown> {
  return json && typeof json === 'object' ? (json as Record<string, Breakdown>) : {};
}
function toLocalized(json: unknown): LocalizedText {
  return { en: localizedName(json, 'en') || '', ta: localizedName(json, 'ta') || undefined };
}

type FinishedAttempt = {
  id: string;
  testId: string;
  submittedAt: Date | null;
  status: string;
  questionOrder: string[];
  test: { title: unknown };
  result: {
    score: number;
    totalQuestions: number;
    correct: number;
    wrong: number;
    skipped: number;
    subjectAnalysis: unknown;
    chapterAnalysis: unknown;
    timeAnalysis: unknown;
  } | null;
};

async function loadFinished(studentId: string): Promise<FinishedAttempt[]> {
  const attempts = await prisma.testAttempt.findMany({
    where: { studentId, status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] }, result: { isNot: null } },
    orderBy: { submittedAt: 'asc' },
    select: {
      id: true,
      testId: true,
      submittedAt: true,
      status: true,
      questionOrder: true,
      test: { select: { title: true } },
      result: {
        select: {
          score: true,
          totalQuestions: true,
          correct: true,
          wrong: true,
          skipped: true,
          subjectAnalysis: true,
          chapterAnalysis: true,
          timeAnalysis: true,
        },
      },
    },
  });
  return attempts as FinishedAttempt[];
}

/** Turn stored results into the per-attempt chapter breakdown the aggregator wants. */
function buildAttemptChapters(
  attempts: FinishedAttempt[],
  questionChapter: Map<string, string>,
): AttemptChapters[] {
  return attempts.map((a) => {
    const chapterBreak = asBreakdownMap(a.result?.chapterAnalysis);
    const time = (a.result?.timeAnalysis ?? {}) as TimeAnalysis;
    const byQuestion = time.byQuestion ?? {};

    // Sum per-question time into its chapter for this attempt.
    const chapterTime: Record<string, number> = {};
    for (const [qid, seconds] of Object.entries(byQuestion)) {
      const chapterId = questionChapter.get(qid);
      if (!chapterId) continue;
      chapterTime[chapterId] = (chapterTime[chapterId] ?? 0) + (seconds as number);
    }

    const chapters: AttemptChapters['chapters'] = {};
    for (const [chapterId, b] of Object.entries(chapterBreak)) {
      chapters[chapterId] = {
        correct: b.correct,
        wrong: b.wrong,
        total: b.total,
        timeSeconds: chapterTime[chapterId],
      };
    }
    return { date: a.submittedAt ? a.submittedAt.getTime() : 0, chapters };
  });
}

/** Aggregate chapter performance + overall pace for a student's finished attempts. */
async function aggregateChapters(
  attempts: FinishedAttempt[],
): Promise<{ chapterPerf: ChapterPerf[]; overallAvgSecondsPerQuestion: number | null }> {
  const allQuestionIds = [...new Set(attempts.flatMap((a) => a.questionOrder))];
  const [questions, subjects] = await Promise.all([
    prisma.question.findMany({ where: { id: { in: allQuestionIds } }, select: { id: true, chapterId: true } }),
    prisma.subject.findMany({ select: { id: true, code: true } }),
  ]);
  const questionChapter = new Map(questions.map((q) => [q.id, q.chapterId]));
  const chapterIds = [...new Set(questions.map((q) => q.chapterId))];
  const codeBySubject = new Map(subjects.map((s) => [s.id, s.code]));

  const chapters = await prisma.chapter.findMany({
    where: { id: { in: chapterIds } },
    select: { id: true, name: true, subjectId: true, weightage: true },
  });
  const meta: Record<string, ChapterMeta> = {};
  for (const c of chapters) {
    meta[c.id] = {
      subjectCode: codeBySubject.get(c.subjectId) ?? '',
      name: toLocalized(c.name),
      weightage: c.weightage,
    };
  }

  const attemptChapters = buildAttemptChapters(attempts, questionChapter);
  const chapterPerf = aggregateChapterPerformance(meta, attemptChapters);

  let totalSeconds = 0;
  let totalTimed = 0;
  for (const a of attempts) {
    const time = (a.result?.timeAnalysis ?? {}) as TimeAnalysis;
    totalSeconds += time.totalSeconds ?? 0;
    totalTimed += a.result?.totalQuestions ?? 0;
  }
  const overallAvgSecondsPerQuestion = totalTimed > 0 && totalSeconds > 0 ? totalSeconds / totalTimed : null;

  return { chapterPerf, overallAvgSecondsPerQuestion };
}

/** Find the most specific published test that covers a recommended chapter/subject. */
async function matchTests(recs: Recommendation[]): Promise<MatchedRecommendation[]> {
  if (recs.length === 0) return [];

  const [tests, subjects, chapters] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        testType: true,
        isRandom: true,
        subjectId: true,
        chapterId: true,
        rules: true,
        testQuestions: { select: { question: { select: { subjectId: true, chapterId: true } } } },
      },
    }),
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.chapter.findMany({ select: { id: true, subjectId: true } }),
  ]);

  const subjectsById = new Map(subjects.map((s) => [s.id, { id: s.id, code: s.code }]));
  const chaptersById = new Map(chapters.map((c) => [c.id, { id: c.id, subjectId: c.subjectId }]));
  const allCodes = subjects.map((s) => s.code);

  const covered = tests.map((t) => {
    const cov = computeCoverage(t, subjectsById, chaptersById, allCodes);
    return { id: t.id, title: toLocalized(t.title), chapterIds: cov.chapterIds, subjectCodes: cov.subjectCodes, size: cov.chapterIds.size };
  });

  return recs.map((rec) => {
    // Prefer the most specific test that explicitly covers the chapter.
    const chapterMatches = covered
      .filter((c) => c.chapterIds.has(rec.chapterId))
      .sort((a, b) => a.size - b.size);
    const subjectMatches = covered
      .filter((c) => c.subjectCodes.has(rec.subjectCode))
      .sort((a, b) => a.size - b.size);
    const match = chapterMatches[0] ?? subjectMatches[0] ?? null;
    return { ...rec, test: match ? { id: match.id, title: match.title } : null };
  });
}

/** Top-N matched recommendations for a student (used by the student dashboard). */
export async function buildStudentRecommendations(studentId: string, limit = 3): Promise<MatchedRecommendation[]> {
  const attempts = await loadFinished(studentId);
  if (attempts.length === 0) return [];
  const { chapterPerf, overallAvgSecondsPerQuestion } = await aggregateChapters(attempts);
  const recs = recommend(chapterPerf, { overallAvgSecondsPerQuestion, limit });
  return matchTests(recs);
}

/** Full performance analytics view model for /student/performance. */
export async function buildPerformance(studentId: string): Promise<Performance> {
  const attempts = await loadFinished(studentId);
  if (attempts.length === 0) {
    return {
      attemptsCount: 0,
      history: [],
      trend: [],
      subjectAccuracy: [],
      strongChapters: [],
      weakChapters: [],
      recommendations: [],
    };
  }

  const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' }, select: { id: true, code: true, name: true } });

  // Attempt history + trend (attempts are already oldest → newest).
  const trend: TrendPoint[] = [];
  const history: PerfAttemptRow[] = [];
  attempts.forEach((a, i) => {
    const r = a.result!;
    const time = (r.timeAnalysis ?? {}) as TimeAnalysis;
    const avg = avgSecondsPerQuestion(time.totalSeconds ?? 0, r.totalQuestions);
    const accuracy = accuracyPct(r.correct, r.wrong);
    const row: PerfAttemptRow = {
      attemptId: a.id,
      testId: a.testId,
      testTitle: toLocalized(a.test.title),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      status: a.status,
      score: r.score,
      maxScore: maxScoreFor(r.totalQuestions),
      totalQuestions: r.totalQuestions,
      correct: r.correct,
      wrong: r.wrong,
      skipped: r.skipped,
      accuracy,
      avgSecondsPerQuestion: avg,
    };
    history.push(row);
    trend.push({
      attemptId: a.id,
      label: `T${i + 1}`,
      date: row.submittedAt,
      score: r.score,
      accuracy: Math.round(accuracy * 10) / 10,
      avgSeconds: Math.round(avg * 10) / 10,
    });
  });

  // Subject accuracy aggregated across attempts.
  const subjectAgg = new Map<string, { correct: number; wrong: number }>();
  for (const a of attempts) {
    const sa = asBreakdownMap(a.result?.subjectAnalysis);
    for (const [subjectId, b] of Object.entries(sa)) {
      const cur = subjectAgg.get(subjectId) ?? { correct: 0, wrong: 0 };
      cur.correct += b.correct;
      cur.wrong += b.wrong;
      subjectAgg.set(subjectId, cur);
    }
  }
  const subjectAccuracy: SubjectAccuracyRow[] = subjects.map((s) => {
    const agg = subjectAgg.get(s.id) ?? { correct: 0, wrong: 0 };
    return {
      code: s.code,
      name: toLocalized(s.name),
      attempted: agg.correct + agg.wrong,
      correct: agg.correct,
      accuracy: accuracyPct(agg.correct, agg.wrong),
    };
  });

  // Chapters, strong/weak, recommendations.
  const { chapterPerf, overallAvgSecondsPerQuestion } = await aggregateChapters(attempts);
  const qualifying = chapterPerf.filter((c) => c.attempted >= MIN_QUALIFY);
  const toRow = (c: ChapterPerf): ChapterListRow => ({
    chapterId: c.chapterId,
    name: c.name,
    subjectCode: c.subjectCode,
    accuracy: c.accuracy,
    attempted: c.attempted,
    testsCount: c.testsCount,
    strength: strengthOf(c.accuracy),
  });
  const strongChapters = qualifying.filter((c) => c.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy).map(toRow);
  const weakChapters = qualifying.filter((c) => c.accuracy < 40).sort((a, b) => a.accuracy - b.accuracy).map(toRow);

  const recs = recommend(chapterPerf, { overallAvgSecondsPerQuestion, limit: 3 });
  const recommendations = await matchTests(recs);

  return {
    attemptsCount: attempts.length,
    history: [...history].reverse(), // newest first for the table
    trend,
    subjectAccuracy,
    strongChapters,
    weakChapters,
    recommendations,
  };
}
