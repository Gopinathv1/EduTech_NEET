import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { chapterStats } from '@/lib/admin/reports/queries';
import { AdminBarChart } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

const MIN_ANSWERS = 10;

export default async function WeakChaptersReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const data = (await chapterStats(range)).filter((c) => c.answered >= MIN_ANSWERS).sort((a, b) => a.accuracy - b.accuracy);
  const chartData = data.slice(0, 8).map((r) => ({ label: r.name.length > 12 ? r.name.slice(0, 10) + '…' : r.name, value: r.accuracy }));

  return (
    <ReportScaffold
      title="Weakest Chapters"
      description={`Lowest platform-wide accuracy (chapters with at least ${MIN_ANSWERS} answers).`}
      basePath="/admin/reports/weak-chapters"
      exportPath="/api/admin/reports/weak-chapters"
      initial={initial}
    >
      {chartData.length > 0 ? (
        <ChartCard title="Lowest accuracy (%)">
          <AdminBarChart data={chartData} color="#dc2626" />
        </ChartCard>
      ) : null}
      <ReportTable
        columns={[
          { label: 'Chapter' },
          { label: 'Subject' },
          { label: 'Answered', align: 'right' },
          { label: 'Accuracy', align: 'right' },
        ]}
        rows={data.map((r) => [r.name, r.subjectCode, r.answered, <span key="a" className="font-semibold text-red-700">{r.accuracy}%</span>])}
        empty={`No chapters have ${MIN_ANSWERS}+ answers in this range yet.`}
      />
    </ReportScaffold>
  );
}
