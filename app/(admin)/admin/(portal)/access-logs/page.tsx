import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { parsePage, totalPages } from '@/lib/admin/reports/util';
import { AdminPageHeader } from '@/components/admin/ui';
import AccessLogFilters from '@/components/admin/AccessLogFilters';
import Pager from '@/components/admin/Pager';

type SP = Record<string, string | string[] | undefined>;

export default async function AccessLogsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage({ superOnly: true });
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters = { adminId: g('adminId'), action: g('action'), from: g('from'), to: g('to') };
  const { page, skip, take, perPage } = parsePage(g('page'), 40);

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.adminId) where.adminId = filters.adminId;
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from && !Number.isNaN(Date.parse(filters.from))) createdAt.gte = new Date(filters.from);
  if (filters.to && !Number.isNaN(Date.parse(filters.to))) {
    const d = new Date(filters.to);
    d.setHours(23, 59, 59, 999);
    createdAt.lte = d;
  }
  if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;

  const [logs, total, admins] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.auditLog.count({ where }),
    prisma.admin.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const baseQuery = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div>
      <AdminPageHeader title="Access Logs" description="Every back-office action, including logins." />
      <AccessLogFilters initial={filters} admins={admins} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-3 py-3 font-medium">Admin</th>
              <th className="px-3 py-3 font-medium">Action</th>
              <th className="px-3 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No log entries match these filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {log.createdAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{log.adminName}</td>
                  <td className="px-3 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{log.action}</code>
                  </td>
                  <td className="px-3 py-3 text-slate-500">
                    {log.entityType}
                    {log.entityId ? <span className="block text-xs text-slate-400">{log.entityId.slice(0, 12)}…</span> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {log.details ? (
                      <span className="line-clamp-2 max-w-xs break-words">{JSON.stringify(log.details)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/access-logs" baseQuery={baseQuery} page={page} totalPages={totalPages(total, perPage)} total={total} />
    </div>
  );
}
