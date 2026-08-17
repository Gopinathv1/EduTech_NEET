import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { Breakdown } from '@/lib/attempts/result';
import {
  accuracyPct,
  attemptedOf,
  marksFor,
  maxScoreFor,
  avgSecondsPerQuestion,
  round1,
  strengthOf,
  type Strength,
} from '@/lib/attempts/analysis';
import type { LocalizedText } from '@/lib/recommendations/types';

/**
 * Server-side view model for a single attempt's result — the score summary plus
 * subject, chapter and time analysis. Built once from the stored `Result` JSON and
 * shared by the result page (Analysis tab) and the PDF report so both show
 * identical numbers.
 */

export type SubjectRow = {
  code: string;
  name: LocalizedText;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  accuracy: number;
  marks: number;
  timeSeconds: number;
};

export type ChapterRow = {
  chapterId: string;
  name: LocalizedText;
  subjectCode: string;
  attempted: number;
  correct: number;
  total: number;
  accuracy: number;
  strength: Strength;
};

export type ResultReport = {
  attemptId: string;
  status: string;
  submittedAt: Date | null;
  selectedLanguage: 'en' | 'ta';
  testTitle: LocalizedText;
  studentName: string;
  summary: {
    score: number;
    maxScore: number;
    percentage: number;
    totalQuestions: number;
    correct: number;
    wrong: number;
    skipped: number;
    attempted: number;
    accuracy: number;
    timeTakenSeconds: number;
    allottedSeconds: number;
  };
  subjects: SubjectRow[];
  chapters: ChapterRow[];
  time: {
    totalSeconds: number;
    allottedSeconds: number;
    avgSecondsPerQuestion: number;
    bySubject: { code: string; name: LocalizedText; seconds: number }[];
    slowest: { number: number; seconds: number; subjectCode: string; chapterName: LocalizedText }[];
  };
};

type TimeAnalysis = {
  totalSeconds?: number;
  bySubject?: Record<string, number>;
  byQuestion?: Record<string, number>;
};

function toLocalized(json: unknown): LocalizedText {
  const en = localizedName(json, 'en');
  const ta = localizedName(json, 'ta');
  return { en: en || '', ta: ta || undefined };
}

function asBreakdownMap(json: unknown): Record<string, Breakdown> {
  return json && typeof json === 'object' ? (json as Record<string, Breakdown>) : {};
}

/** Load and assemble the result report, or null if the attempt has no result. */
export async function buildResultReport(attemptId: string, studentId: string): Promise<ResultReport | null> {
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      selectedLanguage: true,
      questionOrder: true,
      student: { select: { name: true } },
      test: { select: { title: true, durationMinutes: true, totalQuestions: true } },
      result: true,
    },
  });
  if (!attempt || !attempt.result || attempt.status === 'IN_PROGRESS') return null;

  const result = attempt.result;
  const subjectAnalysis = asBreakdownMap(result.subjectAnalysis);
  const chapterAnalysis = asBreakdownMap(result.chapterAnalysis);
  const timeAnalysis = (result.timeAnalysis ?? {}) as TimeAnalysis;
  const byQuestion = timeAnalysis.byQuestion ?? {};
  const bySubjectTime = timeAnalysis.bySubject ?? {};

  const orderIds = attempt.questionOrder;

  const [subjects, questions] = await Promise.all([
    prisma.subject.findMany({ orderBy: { order: 'asc' }, select: { id: true, code: true, name: true } }),
    prisma.question.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, subjectId: true, chapterId: true, chapter: { select: { name: true } } },
    }),
  ]);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const questionById = new Map(questions.map((q) => [q.id, q]));

  // Subject rows — always all four subjects, in display order.
  const subjectRows: SubjectRow[] = subjects.map((s) => {
    const b = subjectAnalysis[s.id] ?? { correct: 0, wrong: 0, skipped: 0, total: 0 };
    const attempted = attemptedOf(b);
    return {
      code: s.code,
      name: toLocalized(s.name),
      attempted,
      correct: b.correct,
      wrong: b.wrong,
      skipped: b.skipped,
      total: b.total,
      accuracy: accuracyPct(b.correct, b.wrong),
      marks: marksFor(b),
      timeSeconds: bySubjectTime[s.id] ?? 0,
    };
  });

  // Chapter rows — those actually in the test.
  const chapterMeta = new Map<string, { name: unknown; subjectCode: string }>();
  for (const q of questions) {
    if (!chapterMeta.has(q.chapterId)) {
      chapterMeta.set(q.chapterId, {
        name: q.chapter.name,
        subjectCode: subjectById.get(q.subjectId)?.code ?? '',
      });
    }
  }
  const chapterRows: ChapterRow[] = Object.entries(chapterAnalysis)
    .map(([chapterId, b]) => {
      const meta = chapterMeta.get(chapterId);
      const accuracy = accuracyPct(b.correct, b.wrong);
      return {
        chapterId,
        name: meta ? toLocalized(meta.name) : { en: chapterId },
        subjectCode: meta?.subjectCode ?? '',
        attempted: attemptedOf(b),
        correct: b.correct,
        total: b.total,
        accuracy,
        strength: strengthOf(accuracy),
      };
    })
    .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode) || a.accuracy - b.accuracy);

  // Time analysis.
  const allottedSeconds = attempt.test.durationMinutes * 60;
  const totalSeconds = timeAnalysis.totalSeconds ?? 0;
  const bySubject = subjects
    .map((s) => ({ code: s.code, name: toLocalized(s.name), seconds: bySubjectTime[s.id] ?? 0 }))
    .filter((r) => r.seconds > 0);

  const slowest = Object.entries(byQuestion)
    .map(([questionId, seconds]) => {
      const idx = orderIds.indexOf(questionId);
      const q = questionById.get(questionId);
      return {
        number: idx >= 0 ? idx + 1 : 0,
        seconds: seconds as number,
        subjectCode: q ? subjectById.get(q.subjectId)?.code ?? '' : '',
        chapterName: q ? toLocalized(q.chapter.name) : { en: '' },
      };
    })
    .filter((r) => r.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds || a.number - b.number)
    .slice(0, 5);

  const totalQuestions = result.totalQuestions;
  const attempted = result.correct + result.wrong;
  const maxScore = maxScoreFor(totalQuestions);
  // Overall percentage = marks obtained ÷ total marks (can be negative because of
  // negative marking; clamped to 0 for display).
  const percentage = maxScore > 0 ? round1(Math.max(0, (result.score / maxScore) * 100)) : 0;

  return {
    attemptId: attempt.id,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    selectedLanguage: attempt.selectedLanguage === 'ta' ? 'ta' : 'en',
    testTitle: toLocalized(attempt.test.title),
    studentName: attempt.student.name,
    summary: {
      score: result.score,
      maxScore,
      percentage,
      totalQuestions,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      attempted,
      accuracy: accuracyPct(result.correct, result.wrong),
      timeTakenSeconds: totalSeconds,
      allottedSeconds,
    },
    subjects: subjectRows,
    chapters: chapterRows,
    time: {
      totalSeconds,
      allottedSeconds,
      avgSecondsPerQuestion: avgSecondsPerQuestion(totalSeconds, totalQuestions),
      bySubject,
      slowest,
    },
  };
}
