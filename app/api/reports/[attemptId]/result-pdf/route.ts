import { getSession } from '@/lib/auth/session';
import { buildResultReport } from '@/lib/reports/result-report';
import { generateResultPdf } from '@/lib/reports/result-pdf';
import { fail } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ attemptId: string }> };

// GET /api/reports/[attemptId]/result-pdf — download the PDF report (owner only).
export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);
  const { attemptId } = await params;

  const report = await buildResultReport(attemptId, session.sub);
  if (!report) return fail('notFound', 404);

  const pdf = await generateResultPdf(report);

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="neet-result-${attemptId}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
