import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { localizedName } from '@/lib/admin/format';
import { logAudit } from '@/lib/audit';
import { toCsv, csvResponse } from '@/lib/admin/csv';
import { parseRange } from '@/lib/admin/reports/util';
import { realDifficultyFromAccuracy, difficultyContradiction } from '@/lib/admin/reports/difficulty';
import * as q from '@/lib/admin/reports/queries';
import { fail } from '@/lib/http';
import type { PaymentStatus } from '@prisma/client';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ report: string }> };
type Row = (string | number | boolean | null)[];

// GET /api/admin/reports/[report] — CSV export for a report, honouring the current
// date range (and status, where relevant).
export async function GET(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { report } = await params;

  const url = new URL(req.url);
  const range = parseRange(url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);

  let headers: string[] = [];
  let rows: Row[] = [];

  switch (report) {
    case 'students': {
      const [byDistrict, byBoard] = await Promise.all([q.registrationsByDistrict(range), q.registrationsByBoard(range)]);
      headers = ['dimension', 'value', 'registrations'];
      rows = [
        ...byDistrict.map((r): Row => ['district', r.label, r.count]),
        ...byBoard.map((r): Row => ['board', r.label, r.count]),
      ];
      break;
    }
    case 'revenue': {
      const data = await q.revenueByTest(range);
      headers = ['test', 'payments', 'revenueINR'];
      rows = data.map((r): Row => [r.title, r.count, r.revenue]);
      break;
    }
    case 'payments': {
      const statusParam = url.searchParams.get('status') ?? '';
      const where = {
        createdAt: { gte: range.from, lte: range.to },
        ...(['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'].includes(statusParam)
          ? { status: statusParam as PaymentStatus }
          : {}),
      };
      const payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { name: true, mobile: true } }, test: { select: { title: true } } },
      });
      headers = ['date', 'invoice', 'student', 'mobile', 'test', 'amountINR', 'status'];
      rows = payments.map((p): Row => [
        p.createdAt.toISOString(),
        p.invoiceNumber ?? '',
        p.student.name,
        p.student.mobile,
        localizedName(p.test.title, 'en'),
        p.amount,
        p.status,
      ]);
      break;
    }
    case 'country-leads': {
      const data = await q.leadsByCountry(range);
      headers = ['country', 'leads'];
      rows = data.map((r): Row => [r.label, r.value]);
      break;
    }
    case 'test-performance': {
      const data = await q.testPerformance(range);
      headers = ['test', 'attempts', 'submitted', 'completionRatePct', 'avgScore'];
      rows = data.map((r): Row => [r.title, r.attempts, r.submitted, r.completionRate, r.avgScore ?? '']);
      break;
    }
    case 'question-difficulty': {
      const data = await q.questionDifficulty(range, 100000, 0);
      headers = ['question', 'subject', 'label', 'answered', 'correctPct', 'realDifficulty', 'flagged'];
      rows = data.map((r): Row => [
        r.text,
        r.subjectCode,
        r.difficulty,
        r.answered,
        r.correctPct,
        realDifficultyFromAccuracy(r.correctPct),
        difficultyContradiction(r.difficulty, r.correctPct, r.answered),
      ]);
      break;
    }
    case 'most-attempted-chapters': {
      const data = (await q.chapterStats(range)).sort((a, b) => b.answered - a.answered);
      headers = ['chapter', 'subject', 'answered', 'correct', 'accuracyPct'];
      rows = data.map((r): Row => [r.name, r.subjectCode, r.answered, r.correct, r.accuracy]);
      break;
    }
    case 'weak-chapters': {
      const data = (await q.chapterStats(range)).filter((c) => c.answered >= 10).sort((a, b) => a.accuracy - b.accuracy);
      headers = ['chapter', 'subject', 'answered', 'accuracyPct'];
      rows = data.map((r): Row => [r.name, r.subjectCode, r.answered, r.accuracy]);
      break;
    }
    case 'top-students': {
      const data = await q.topStudents(500);
      headers = ['student', 'district', 'bestFullTestScore', 'fullTests'];
      rows = data.map((r): Row => [r.name, r.district ?? '', r.best, r.fullTests]);
      break;
    }
    default:
      return fail('notFound', 404);
  }

  await logAudit(admin, { action: 'report.export', entityType: 'Report', entityId: report, details: { report, rows: rows.length } });
  return csvResponse(toCsv(headers, rows), `${report}-${new Date().toISOString().slice(0, 10)}.csv`);
}
