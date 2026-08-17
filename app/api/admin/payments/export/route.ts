import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { buildPaymentWhere } from '@/lib/admin/payments-filter';
import { localizedName } from '@/lib/admin/format';
import { logAudit } from '@/lib/audit';
import { fail } from '@/lib/http';

export const runtime = 'nodejs';

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/payments/export — CSV of payments matching the current filters.
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const url = new URL(req.url);
  const where = buildPaymentWhere({
    status: url.searchParams.get('status') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  });

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { student: { select: { name: true, mobile: true, email: true } }, test: { select: { title: true } } },
  });

  const header = [
    'invoiceNumber',
    'date',
    'studentName',
    'studentMobile',
    'studentEmail',
    'test',
    'amountINR',
    'currency',
    'status',
    'razorpayOrderId',
    'razorpayPaymentId',
  ];
  const lines = [header.join(',')];
  for (const p of payments) {
    lines.push(
      [
        p.invoiceNumber ?? '',
        p.createdAt.toISOString(),
        p.student.name,
        p.student.mobile,
        p.student.email ?? '',
        localizedName(p.test.title, 'en'),
        p.amount,
        p.currency,
        p.status,
        p.razorpayOrderId ?? '',
        p.razorpayPaymentId ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  const csv = lines.join('\n') + '\n';

  await logAudit(admin, { action: 'payment.export', entityType: 'Payment', entityId: null, details: { count: payments.length } });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
