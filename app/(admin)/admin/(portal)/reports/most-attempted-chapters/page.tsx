import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { chapterStats } from '@/lib/admin/reports/queries';
import { AdminBarChart } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function MostAttemptedChaptersReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const data = (await chapterStats(range)).sort((a, b) => b.answered - a.answered);
  const chartData = data.slice(0, 8).map((r) => ({ label: r.name.length > 12 ? r.name.slice(0, 10) + '…' : r.name, value: r.answered }));

  return (
    <ReportScaffold
      title="Most Attempted Chapters"
      description="Chapters ranked by how many questions students answered."
      basePath="/admin/reports/most-attempted-chapters"
      exportPath="/api/admin/reports/most-attempted-chapters"
      initial={initial}
    >
      {chartData.some((d) => d.value > 0) ? (
        <ChartCard title="Top chapters by answers">
          <AdminBarChart data={chartData} />
        </ChartCard>
      ) : null}
      <ReportTable
        columns={[
          { label: 'Chapter' },
          { label: 'Subject' },
          { label: 'Answered', align: 'right' },
          { label: 'Correct', align: 'right' },
          { label: 'Accuracy', align: 'right' },
        ]}
        rows={data.map((r) => [r.name, r.subjectCode, r.answered, r.correct, `${r.accuracy}%`])}
      />
    </ReportScaffold>
  );
}
