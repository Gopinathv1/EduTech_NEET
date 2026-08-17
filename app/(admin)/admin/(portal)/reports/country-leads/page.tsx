import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { leadsByCountry } from '@/lib/admin/reports/queries';
import { AdminPie } from '@/components/admin/charts/AdminCharts';
import ReportScaffold, { ReportTable, ChartCard } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function CountryLeadsReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const data = await leadsByCountry(range);
  const total = data.reduce((s, r) => s + r.value, 0);

  return (
    <ReportScaffold
      title="Country-wise Leads"
      description={`${total} lead${total === 1 ? '' : 's'} by preferred destination.`}
      basePath="/admin/reports/country-leads"
      exportPath="/api/admin/reports/country-leads"
      initial={initial}
    >
      <ChartCard title="Country preferences">
        <AdminPie data={data} />
      </ChartCard>
      <ReportTable
        columns={[{ label: 'Country' }, { label: 'Leads', align: 'right' }]}
        rows={data.map((r) => [r.label, r.value])}
      />
    </ReportScaffold>
  );
}
