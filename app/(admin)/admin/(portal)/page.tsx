import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { parseRange } from '@/lib/admin/reports/util';
import { pct } from '@/lib/admin/reports/util';
import { dailyRegistrations, dailyRevenue, dailyAttempts, leadsByCountry } from '@/lib/admin/reports/queries';
import { AdminPageHeader, AdminCard, PrimaryButtonLink } from '@/components/admin/ui';
import { AdminLineChart, AdminPie } from '@/components/admin/charts/AdminCharts';

export default async function AdminDashboardPage() {
  const session = await requireAdminPage();
  const range = parseRange(undefined, undefined, 30);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    todayRegs,
    revenueAgg,
    testsAttempted,
    payingStudents,
    leadsCount,
    countryPrefs,
    regSeries,
    revSeries,
    attemptSeries,
    newLeads,
    recent,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
    prisma.testAttempt.count(),
    prisma.payment.findMany({ where: { status: 'SUCCESS' }, distinct: ['studentId'], select: { studentId: true } }),
    prisma.admissionLead.count(),
    leadsByCountry(),
    dailyRegistrations(range),
    dailyRevenue(range),
    dailyAttempts(range),
    prisma.admissionLead.count({ where: { status: 'NEW' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  const revenue = revenueAgg._sum.amount ?? 0;
  const conversion = pct(payingStudents.length, totalStudents);

  const kpis = [
    { label: 'Total Students', value: totalStudents },
    { label: "Today's Registrations", value: todayRegs },
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}` },
    { label: 'Tests Attempted', value: testsAttempted },
    { label: 'Conversion Rate', value: `${conversion}%`, sub: `${payingStudents.length} paying / ${totalStudents}` },
    { label: 'Consultancy Leads', value: leadsCount },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome, ${session.name}.`}
        actions={<PrimaryButtonLink href="/admin/reports">View reports</PrimaryButtonLink>}
      />

      {newLeads > 0 ? (
        <Link
          href="/admin/leads?status=NEW"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand hover:bg-brand-soft/70"
        >
          <span>🔔 {newLeads} new admission {newLeads === 1 ? 'lead' : 'leads'} waiting to be reviewed.</span>
          <span className="font-semibold">Open leads →</span>
        </Link>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map((k) => (
          <AdminCard key={k.label}>
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{k.value}</p>
            {k.sub ? <p className="mt-1 text-xs text-slate-500">{k.sub}</p> : null}
          </AdminCard>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-sm font-semibold text-slate-800">Registrations (30 days)</h2>
          <div className="mt-3">
            <AdminLineChart data={regSeries} />
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="text-sm font-semibold text-slate-800">Revenue ₹ (30 days)</h2>
          <div className="mt-3">
            <AdminLineChart data={revSeries} color="#16a34a" />
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="text-sm font-semibold text-slate-800">Tests attempted (30 days)</h2>
          <div className="mt-3">
            <AdminLineChart data={attemptSeries} color="#0891b2" />
          </div>
        </AdminCard>
        <AdminCard>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Country preferences</h2>
            <Link href="/admin/reports/country-leads" className="text-xs font-medium text-brand hover:text-brand-dark">
              Report →
            </Link>
          </div>
          <div className="mt-1">
            <AdminPie data={countryPrefs} />
          </div>
        </AdminCard>
      </div>

      {/* Recent activity */}
      <AdminCard className="mt-6">
        <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((log) => (
              <li key={log.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-700">
                  <span className="font-medium">{log.adminName}</span> <span className="text-slate-500">{log.action}</span>
                </span>
                <time className="shrink-0 text-xs text-slate-400" dateTime={log.createdAt.toISOString()}>
                  {log.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
