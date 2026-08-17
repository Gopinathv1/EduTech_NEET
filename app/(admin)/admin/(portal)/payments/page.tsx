import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { buildPaymentWhere } from '@/lib/admin/payments-filter';
import { AdminPageHeader, AdminCard, Badge } from '@/components/admin/ui';
import PaymentFilters from '@/components/admin/PaymentFilters';

const STATUS_BADGE: Record<string, string> = {
  SUCCESS: 'green',
  CREATED: 'slate',
  FAILED: 'red',
  REFUNDED: 'amber',
};
const STATUS_LABEL: Record<string, string> = {
  CREATED: 'Pending',
  SUCCESS: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

type SP = Record<string, string | string[] | undefined>;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters = { status: g('status'), from: g('from'), to: g('to'), q: g('q') };
  const where = buildPaymentWhere(filters);

  const [payments, grouped] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        student: { select: { name: true, mobile: true } },
        test: { select: { title: true } },
      },
    }),
    prisma.payment.groupBy({ by: ['status'], where, _count: { _all: true }, _sum: { amount: true } }),
  ]);

  const byStatus = new Map(grouped.map((row) => [row.status, row]));
  const revenue = byStatus.get('SUCCESS')?._sum.amount ?? 0;
  const paidCount = byStatus.get('SUCCESS')?._count._all ?? 0;
  const failedCount = byStatus.get('FAILED')?._count._all ?? 0;
  const pendingCount = byStatus.get('CREATED')?._count._all ?? 0;

  return (
    <div>
      <AdminPageHeader title="Payments" description="All test purchases. Filter, review and export." />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminCard>
          <p className="text-sm text-textSecondary">Revenue (filtered)</p>
          <p className="mt-1 text-2xl font-extrabold text-textPrimary">₹{revenue}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-textSecondary">Paid</p>
          <p className="mt-1 text-2xl font-extrabold text-green-200">{paidCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-textSecondary">Failed</p>
          <p className="mt-1 text-2xl font-extrabold text-red-600">{failedCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-textSecondary">Pending</p>
          <p className="mt-1 text-2xl font-extrabold text-textSecondary">{pendingCount}</p>
        </AdminCard>
      </div>

      <PaymentFilters initial={filters} />

      <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-3 py-3 font-medium">Test</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-textSecondary">
                  No payments match these filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-textPrimary">{p.student.name}</p>
                    <p className="text-xs text-textSecondary">+91 {p.student.mobile}</p>
                  </td>
                  <td className="px-3 py-3 text-textSecondary">{localizedName(p.test.title, 'en')}</td>
                  <td className="px-3 py-3 text-textSecondary">₹{p.amount}</td>
                  <td className="px-3 py-3">
                    <Badge color={STATUS_BADGE[p.status] ?? 'slate'}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-textSecondary">
                    {p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-textSecondary">{p.invoiceNumber ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {payments.length === 200 ? (
        <p className="mt-2 text-xs text-slate-400">
          Showing the latest 200 — narrow the filters or export CSV for the full set.
        </p>
      ) : null}
    </div>
  );
}
