import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { monthlyRevenue } from '@/lib/admin/reports/queries';
import { AdminPageHeader, AdminCard, Badge } from '@/components/admin/ui';
import { AdminBarChart } from '@/components/admin/charts/AdminCharts';

export default async function FinancialsPage() {
  await requireAdminPage({ superOnly: true });

  const [months, totalAgg, refunds] = await Promise.all([
    monthlyRevenue(12),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { status: 'SUCCESS' } }),
    prisma.payment.count({ where: { status: 'REFUNDED' } }),
  ]);

  const totalRevenue = totalAgg._sum.amount ?? 0;
  const thisMonth = months[0]?.revenue ?? 0;
  const chartData = [...months].reverse().map((m) => ({ label: m.month.split(' ')[0], value: m.revenue }));

  return (
    <div>
      <AdminPageHeader title="Financials" description="Revenue summary, settlements and refunds." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-sm text-textSecondary">Total revenue (lifetime)</p>
          <p className="mt-1 text-3xl font-extrabold text-textPrimary">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-textSecondary">{totalAgg._count._all} successful payments</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-textSecondary">This month</p>
          <p className="mt-1 text-3xl font-extrabold text-green-200">₹{thisMonth.toLocaleString('en-IN')}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-textSecondary">Refunds</p>
          <p className="mt-1 text-3xl font-extrabold text-amber-600">{refunds}</p>
        </AdminCard>
      </div>

      {/* Monthly revenue */}
      <AdminCard className="mt-6">
        <h2 className="text-base font-semibold text-textPrimary">Monthly revenue</h2>
        {chartData.some((d) => d.value > 0) ? (
          <div className="mt-3">
            <AdminBarChart data={chartData} color="#16a34a" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-textSecondary">No revenue recorded yet.</p>
        )}
      </AdminCard>

      {/* Settlements */}
      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-textPrimary">Settlements</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-3 py-3 font-medium text-right">Payments</th>
                <th className="px-3 py-3 font-medium text-right">Gross (₹)</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {months.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-textSecondary">
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                months.map((m, i) => (
                  <tr key={m.monthKey} className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-textPrimary">{m.month}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-textSecondary">{m.payments}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-textPrimary">₹{m.revenue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {i === 0 ? <Badge color="amber">Pending</Badge> : <Badge color="green">Settled</Badge>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Settlement status is indicative. Wire live settlement data from the payment gateway when going live.
        </p>
      </div>

      {/* Refunds placeholder */}
      <AdminCard className="mt-6">
        <h2 className="text-base font-semibold text-textPrimary">Refunds</h2>
        <p className="mt-1 text-sm text-textSecondary">
          {refunds} payment{refunds === 1 ? '' : 's'} marked refunded. Initiating refunds from here is coming soon — for now,
          process refunds in the Razorpay dashboard; the webhook keeps statuses in sync.
        </p>
        <span className="mt-3 inline-block rounded-full bg-surfaceElevated px-3 py-1 text-xs font-semibold uppercase tracking-wide text-textSecondary">
          Coming soon
        </span>
      </AdminCard>
    </div>
  );
}
