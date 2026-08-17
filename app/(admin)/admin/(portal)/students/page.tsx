import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { buildStudentWhere } from '@/lib/admin/students-filter';
import { parsePage, totalPages } from '@/lib/admin/reports/util';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import StudentFilters from '@/components/admin/StudentFilters';
import Pager from '@/components/admin/Pager';

type SP = Record<string, string | string[] | undefined>;

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters = { q: g('q'), district: g('district'), board: g('board'), class: g('class'), from: g('from'), to: g('to') };
  const where = buildStudentWhere({ ...filters, klass: filters.class });
  const { page, skip, take, perPage } = parsePage(g('page'), 25);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        mobile: true,
        district: true,
        board: true,
        class: true,
        isMobileVerified: true,
        createdAt: true,
      },
    }),
    prisma.student.count({ where }),
  ]);

  const baseQuery = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div>
      <AdminPageHeader title="Students" description={`${total} registered student${total === 1 ? '' : 's'}.`} />
      <StudentFilters initial={filters} />

      <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-3 py-3 font-medium">District</th>
              <th className="px-3 py-3 font-medium">Board</th>
              <th className="px-3 py-3 font-medium">Class</th>
              <th className="px-3 py-3 font-medium">Verified</th>
              <th className="px-3 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-textSecondary">
                  No students match these filters.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-textPrimary">{s.name}</p>
                    <p className="text-xs text-textSecondary">+91 {s.mobile}</p>
                  </td>
                  <td className="px-3 py-3 text-textSecondary">{s.district ?? '—'}</td>
                  <td className="px-3 py-3 text-textSecondary">{s.board ?? '—'}</td>
                  <td className="px-3 py-3 text-textSecondary">{s.class ?? '—'}</td>
                  <td className="px-3 py-3">
                    {s.isMobileVerified ? <Badge color="green">Verified</Badge> : <Badge color="slate">Pending</Badge>}
                  </td>
                  <td className="px-3 py-3 text-textSecondary">
                    {s.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${s.id}`} className="font-semibold text-brand hover:text-red-200">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/students" baseQuery={baseQuery} page={page} totalPages={totalPages(total, perPage)} total={total} />
    </div>
  );
}
