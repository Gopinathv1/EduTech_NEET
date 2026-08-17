import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { parseRange, dateKey } from '@/lib/admin/reports/util';
import { topStudents } from '@/lib/admin/reports/queries';
import ReportScaffold, { ReportTable } from '@/components/admin/reports/ReportScaffold';

type SP = Record<string, string | string[] | undefined>;

export default async function TopStudentsReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };

  const data = await topStudents(50);

  return (
    <ReportScaffold
      title="Top Performing Students"
      description="Ranked by best full-test score (all-time)."
      basePath="/admin/reports/top-students"
      exportPath="/api/admin/reports/top-students"
      initial={initial}
    >
      <ReportTable
        columns={[
          { label: '#' },
          { label: 'Student' },
          { label: 'District' },
          { label: 'Best score', align: 'right' },
          { label: 'Full tests', align: 'right' },
        ]}
        rows={data.map((r, i) => [
          i + 1,
          <Link key="n" href={`/admin/students/${r.studentId}`} className="font-medium text-brand hover:text-brand-dark">
            {r.name}
          </Link>,
          r.district ?? '—',
          <span key="b" className="font-bold text-slate-900">
            {r.best}
          </span>,
          r.fullTests,
        ])}
      />
    </ReportScaffold>
  );
}
