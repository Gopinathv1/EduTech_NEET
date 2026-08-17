import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { testPerformance } from '@/lib/admin/reports/queries';
import { AdminBarChart } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function TestPerformanceReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const data = await testPerformance(range);
  const chartData = data
    .filter((r) => r.avgScore != null)
    .slice(0, 8)
    .map((r) => ({ label: r.title.length > 14 ? r.title.slice(0, 12) + '…' : r.title, value: r.avgScore ?? 0 }));

  return (
    <ReportScaffold
      title="Test Performance"
      description="Attempts, average score and completion rate per test."
      basePath="/admin/reports/test-performance"
      exportPath="/api/admin/reports/test-performance"
      initial={initial}
    >
      {chartData.length > 0 ? (
        <ChartCard title="Average score by test">
          <AdminBarChart data={chartData} />
        </ChartCard>
      ) : null}
      <ReportTable
        columns={[
          { label: 'Test' },
          { label: 'Attempts', align: 'right' },
          { label: 'Submitted', align: 'right' },
          { label: 'Completion', align: 'right' },
          { label: 'Avg score', align: 'right' },
        ]}
        rows={data.map((r) => [r.title, r.attempts, r.submitted, `${r.completionRate}%`, r.avgScore ?? '—'])}
      />
    </ReportScaffold>
  );
}
