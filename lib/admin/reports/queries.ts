import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { fillSeries, dateKey, pct, type DateRange } from './util';

/**
 * Server-side report queries. Time-series use raw SQL (date_trunc) and the
 * heavier per-question / per-chapter aggregates use raw SQL with FILTER so the
 * database does the work; simpler groupings use Prisma aggregates. Counts are cast
 * to ::int and averages to ::float so results come back as JS numbers.
 */

export type Series = { date: string; value: number }[];

type DayRow = { day: Date; value: number };
function toSeries(rows: DayRow[], from: Date, to: Date): Series {
  const m = new Map(rows.map((r) => [dateKey(new Date(r.day)), Number(r.value)]));
  return fillSeries(from, to, m);
}

function jsonName(v: unknown): string {
  if (typeof v === 'string') {
    try {
      return localizedName(JSON.parse(v), 'en') || v;
    } catch {
      return v;
    }
  }
  return localizedName(v, 'en');
}

// ---- Time series (dashboard + student/revenue reports) --------------------

export async function dailyRegistrations({ from, to }: DateRange): Promise<Series> {
  const rows = await prisma.$queryRaw<DayRow[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS value
    FROM "Student" WHERE "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY day ORDER BY day`;
  return toSeries(rows, from, to);
}

export async function dailyRevenue({ from, to }: DateRange): Promise<Series> {
  const rows = await prisma.$queryRaw<DayRow[]>`
    SELECT date_trunc('day', "createdAt") AS day, COALESCE(SUM("amount"), 0)::int AS value
    FROM "Payment" WHERE "status" = 'SUCCESS' AND "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY day ORDER BY day`;
  return toSeries(rows, from, to);
}

export async function dailyAttempts({ from, to }: DateRange): Promise<Series> {
  const rows = await prisma.$queryRaw<DayRow[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS value
    FROM "TestAttempt" WHERE "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY day ORDER BY day`;
  return toSeries(rows, from, to);
}

// ---- Student report -------------------------------------------------------

export async function registrationsByDistrict({ from, to }: DateRange) {
  const rows = await prisma.student.groupBy({
    by: ['district'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ label: r.district ?? '—', count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function registrationsByBoard({ from, to }: DateRange) {
  const rows = await prisma.student.groupBy({
    by: ['board'],
    where: { createdAt: { gte: from, lte: to } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ label: r.board ?? '—', count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

// ---- Revenue report -------------------------------------------------------

export type RevenueByTest = { testId: string; title: string; count: number; revenue: number };

export async function revenueByTest({ from, to }: DateRange): Promise<RevenueByTest[]> {
  const rows = await prisma.payment.groupBy({
    by: ['testId'],
    where: { status: 'SUCCESS', createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const tests = await prisma.test.findMany({ where: { id: { in: rows.map((r) => r.testId) } }, select: { id: true, title: true } });
  const nameById = new Map(tests.map((t) => [t.id, localizedName(t.title, 'en')]));
  return rows
    .map((r) => ({ testId: r.testId, title: nameById.get(r.testId) ?? r.testId, count: r._count._all, revenue: r._sum.amount ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ---- Country-wise leads (also the dashboard mini-chart) -------------------

export type CountryLeads = { label: string; value: number };

export async function leadsByCountry(range?: DateRange): Promise<CountryLeads[]> {
  const rows = await prisma.admissionLead.groupBy({
    by: ['interestedCountryId'],
    where: range ? { createdAt: { gte: range.from, lte: range.to } } : undefined,
    _count: { _all: true },
  });
  const countries = await prisma.country.findMany({ select: { id: true, name: true } });
  const nameById = new Map(countries.map((c) => [c.id, localizedName(c.name, 'en')]));
  return rows
    .filter((r) => r.interestedCountryId)
    .map((r) => ({ label: nameById.get(r.interestedCountryId!) ?? '—', value: r._count._all }))
    .sort((a, b) => b.value - a.value);
}

// ---- Test performance -----------------------------------------------------

export type TestPerfRow = {
  testId: string;
  title: string;
  attempts: number;
  submitted: number;
  completionRate: number;
  avgScore: number | null;
};

export async function testPerformance({ from, to }: DateRange): Promise<TestPerfRow[]> {
  const rows = await prisma.$queryRaw<
    { testid: string; attempts: number; submitted: number; avgscore: number | null }[]
  >`
    SELECT a."testId" AS testid,
      COUNT(*)::int AS attempts,
      (COUNT(*) FILTER (WHERE a."status" IN ('SUBMITTED','AUTO_SUBMITTED')))::int AS submitted,
      AVG(r."score")::float AS avgscore
    FROM "TestAttempt" a
    LEFT JOIN "Result" r ON r."attemptId" = a.id
    WHERE a."createdAt" BETWEEN ${from} AND ${to}
    GROUP BY a."testId"`;
  const tests = await prisma.test.findMany({ where: { id: { in: rows.map((r) => r.testid) } }, select: { id: true, title: true } });
  const nameById = new Map(tests.map((t) => [t.id, localizedName(t.title, 'en')]));
  return rows
    .map((r) => ({
      testId: r.testid,
      title: nameById.get(r.testid) ?? r.testid,
      attempts: r.attempts,
      submitted: r.submitted,
      completionRate: pct(r.submitted, r.attempts),
      avgScore: r.avgscore != null ? Math.round(r.avgscore * 10) / 10 : null,
    }))
    .sort((a, b) => b.attempts - a.attempts);
}

// ---- Question difficulty --------------------------------------------------

export type QuestionDiffRow = {
  questionId: string;
  text: string;
  subjectCode: string;
  difficulty: string;
  answered: number;
  correct: number;
  correctPct: number;
};

export async function questionDifficulty({ from, to }: DateRange, limit: number, offset: number): Promise<QuestionDiffRow[]> {
  const rows = await prisma.$queryRaw<
    { questionid: string; difficulty: string; subjectcode: string; answered: number; correct: number; text: string | null }[]
  >`
    SELECT q.id AS questionid, q."difficulty"::text AS difficulty, sub."code" AS subjectcode,
      (COUNT(a.id) FILTER (WHERE a."selectedOption" IS NOT NULL))::int AS answered,
      (COUNT(a.id) FILTER (WHERE a."isCorrect" = true))::int AS correct,
      MAX(qt."questionText") AS text
    FROM "Question" q
    JOIN "Subject" sub ON sub.id = q."subjectId"
    LEFT JOIN "QuestionTranslation" qt ON qt."questionId" = q.id AND qt."language" = 'en'
    LEFT JOIN "Answer" a ON a."questionId" = q.id AND a."createdAt" BETWEEN ${from} AND ${to}
    GROUP BY q.id, q."difficulty", sub."code"
    ORDER BY answered DESC, questionid ASC
    LIMIT ${limit} OFFSET ${offset}`;
  return rows.map((r) => ({
    questionId: r.questionid,
    text: r.text ?? '(no English text)',
    subjectCode: r.subjectcode,
    difficulty: r.difficulty,
    answered: r.answered,
    correct: r.correct,
    correctPct: pct(r.correct, r.answered),
  }));
}

// ---- Chapter stats (most-attempted + weakest) -----------------------------

export type ChapterStatRow = {
  chapterId: string;
  name: string;
  subjectCode: string;
  answered: number;
  correct: number;
  accuracy: number;
};

export async function chapterStats({ from, to }: DateRange): Promise<ChapterStatRow[]> {
  const rows = await prisma.$queryRaw<
    { chapterid: string; subjectcode: string; name: unknown; answered: number; correct: number }[]
  >`
    SELECT c.id AS chapterid, sub."code" AS subjectcode, c."name" AS name,
      (COUNT(a.id) FILTER (WHERE a."selectedOption" IS NOT NULL))::int AS answered,
      (COUNT(a.id) FILTER (WHERE a."isCorrect" = true))::int AS correct
    FROM "Chapter" c
    JOIN "Subject" sub ON sub.id = c."subjectId"
    LEFT JOIN "Question" q ON q."chapterId" = c.id
    LEFT JOIN "Answer" a ON a."questionId" = q.id AND a."createdAt" BETWEEN ${from} AND ${to}
    GROUP BY c.id, sub."code", c."name"`;
  return rows.map((r) => ({
    chapterId: r.chapterid,
    name: jsonName(r.name),
    subjectCode: r.subjectcode,
    answered: r.answered,
    correct: r.correct,
    accuracy: pct(r.correct, r.answered),
  }));
}

// ---- Financials (super admin) ---------------------------------------------

export type MonthlyRevenue = { month: string; monthKey: string; revenue: number; payments: number };

export async function monthlyRevenue(months = 12): Promise<MonthlyRevenue[]> {
  const rows = await prisma.$queryRaw<{ month: Date; revenue: number; payments: number }[]>`
    SELECT date_trunc('month', "createdAt") AS month, SUM("amount")::int AS revenue, COUNT(*)::int AS payments
    FROM "Payment" WHERE "status" = 'SUCCESS'
    GROUP BY month ORDER BY month DESC LIMIT ${months}`;
  return rows.map((r) => ({
    monthKey: new Date(r.month).toISOString().slice(0, 7),
    month: new Date(r.month).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    revenue: r.revenue,
    payments: r.payments,
  }));
}

// ---- Top performing students ----------------------------------------------

export type TopStudentRow = { studentId: string; name: string; district: string | null; best: number; fullTests: number };

export async function topStudents(limit = 25): Promise<TopStudentRow[]> {
  const rows = await prisma.$queryRaw<
    { studentid: string; name: string; district: string | null; best: number; fulltests: number }[]
  >`
    SELECT s.id AS studentid, s."name" AS name, s."district" AS district,
      MAX(r."score")::float AS best, COUNT(r.id)::int AS fulltests
    FROM "Result" r
    JOIN "TestAttempt" a ON a.id = r."attemptId"
    JOIN "Test" t ON t.id = a."testId"
    JOIN "Student" s ON s.id = a."studentId"
    WHERE t."testType" = 'FULL_TEST'
    GROUP BY s.id, s."name", s."district"
    ORDER BY best DESC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    studentId: r.studentid,
    name: r.name,
    district: r.district,
    best: Math.round(r.best),
    fullTests: r.fulltests,
  }));
}
