import { prisma } from '@/lib/prisma';
import { requireAdminPage } from '@/lib/auth/admin';
import { localizedName } from '@/lib/admin/format';
import { buildLeadWhere } from '@/lib/admin/leads-filter';
import { AdminPageHeader, AdminCard } from '@/components/admin/ui';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadsTable, { type LeadRow } from '@/components/admin/leads/LeadsTable';

type SP = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters = {
    status: g('status'),
    countryId: g('countryId'),
    budget: g('budget'),
    scoreMin: g('scoreMin'),
    scoreMax: g('scoreMax'),
    from: g('from'),
    to: g('to'),
    q: g('q'),
  };
  const where = buildLeadWhere(filters);

  const [leads, countries, admins, statusCounts, countryCounts] = await Promise.all([
    prisma.admissionLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        student: { select: { name: true, mobile: true } },
        interestedCountry: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, select: { id: true, name: true } }),
    prisma.admin.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.admissionLead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.admissionLead.groupBy({ by: ['interestedCountryId'], _count: { _all: true } }),
  ]);

  const byStatus = new Map(statusCounts.map((r) => [r.status, r._count._all]));
  const total = statusCounts.reduce((s, r) => s + r._count._all, 0);
  const newCount = byStatus.get('NEW') ?? 0;
  const activeCount = (byStatus.get('IN_PROGRESS') ?? 0) + (byStatus.get('CONTACTED') ?? 0);
  const converted = byStatus.get('CONVERTED') ?? 0;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  const countryName = new Map(countries.map((c) => [c.id, localizedName(c.name, 'en')]));
  const countryRows = countryCounts
    .filter((r) => r.interestedCountryId && countryName.has(r.interestedCountryId))
    .map((r) => ({ name: countryName.get(r.interestedCountryId!)!, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    studentName: l.student.name,
    mobile: l.student.mobile,
    country: l.interestedCountry ? localizedName(l.interestedCountry.name, 'en') : '',
    budget: l.budget,
    neetScore: l.neetScore,
    status: l.status,
    assignedTo: l.assignedTo?.name ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div>
      <AdminPageHeader title="Admission Leads" description="Consultancy pipeline — filter, review and update each lead." />

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminCard>
          <p className="text-sm text-slate-500">Total leads</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{total}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-slate-500">New</p>
          <p className="mt-1 text-2xl font-extrabold text-brand">{newCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-slate-500">In progress</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{activeCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-slate-500">Converted</p>
          <p className="mt-1 text-2xl font-extrabold text-green-700">
            {converted} <span className="text-base font-semibold text-slate-400">· {conversionRate}%</span>
          </p>
        </AdminCard>
      </div>

      {/* Country-wise counts */}
      {countryRows.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {countryRows.map((c) => (
            <span key={c.name} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              {c.name}
              <span className="rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">{c.count}</span>
            </span>
          ))}
        </div>
      ) : null}

      <LeadFilters initial={filters} countries={countries.map((c) => ({ id: c.id, name: localizedName(c.name, 'en') }))} />

      <LeadsTable leads={rows} admins={admins} />

      {leads.length === 200 ? (
        <p className="mt-2 text-xs text-slate-400">Showing the latest 200 — narrow the filters or export CSV for the full set.</p>
      ) : null}
    </div>
  );
}
