import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { dailyRegistrations, registrationsByDistrict, registrationsByBoard } from '@/lib/admin/reports/queries';
import { AdminLineChart } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function StudentReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const [series, byDistrict, byBoard] = await Promise.all([
    dailyRegistrations(range),
    registrationsByDistrict(range),
    registrationsByBoard(range),
  ]);
  const total = series.reduce((s, r) => s + r.value, 0);

  return (
    <ReportScaffold
      title="Student Report"
      description={`${total} registration${total === 1 ? '' : 's'} in this range, broken down by district and board.`}
      basePath="/admin/reports/students"
      exportPath="/api/admin/reports/students"
      initial={initial}
    >
      <ChartCard title="Registrations over time">
        <AdminLineChart data={series} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-textPrimary">By district</h2>
          <ReportTable
            columns={[{ label: 'District' }, { label: 'Registrations', align: 'right' }]}
            rows={byDistrict.map((r) => [r.label, r.count])}
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-textPrimary">By board</h2>
          <ReportTable
            columns={[{ label: 'Board' }, { label: 'Registrations', align: 'right' }]}
            rows={byBoard.map((r) => [r.label, r.count])}
          />
        </div>
      </div>
    </ReportScaffold>
  );
}
