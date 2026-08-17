import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { dailyRevenue, revenueByTest } from '@/lib/admin/reports/queries';
import { AdminLineChart } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function RevenueReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const [series, byTest] = await Promise.all([dailyRevenue(range), revenueByTest(range)]);
  const total = series.reduce((s, r) => s + r.value, 0);

  return (
    <ReportScaffold
      title="Revenue Report"
      description={`₹${total} collected in this range.`}
      basePath="/admin/reports/revenue"
      exportPath="/api/admin/reports/revenue"
      initial={initial}
    >
      <ChartCard title="Revenue over time (₹)">
        <AdminLineChart data={series} color="#16a34a" />
      </ChartCard>

      <h2 className="mb-2 text-sm font-semibold text-slate-800">By test</h2>
      <ReportTable
        columns={[{ label: 'Test' }, { label: 'Payments', align: 'right' }, { label: 'Revenue (₹)', align: 'right' }]}
        rows={byTest.map((r) => [r.title, r.count, r.revenue])}
      />
    </ReportScaffold>
  );
}
