import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { buildLeadWhere } from '@/lib/admin/leads-filter';
import { localizedName } from '@/lib/admin/format';
import { budgetLabel, LEAD_STATUS_LABEL } from '@/lib/admin/leads-service';
import { logAudit } from '@/lib/audit';
import { fail } from '@/lib/http';

export const runtime = 'nodejs';

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/leads/export — CSV of leads matching the current filters.
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const url = new URL(req.url);
  const g = (k: string) => url.searchParams.get(k) ?? undefined;
  const where = buildLeadWhere({
    status: g('status'),
    countryId: g('countryId'),
    budget: g('budget'),
    scoreMin: g('scoreMin'),
    scoreMax: g('scoreMax'),
    from: g('from'),
    to: g('to'),
    q: g('q'),
  });

  const [leads, countries] = await Promise.all([
    prisma.admissionLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { name: true, mobile: true, email: true, district: true, board: true, class: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.country.findMany({ select: { id: true, name: true } }),
  ]);
  const countryName = new Map(countries.map((c) => [c.id, localizedName(c.name, 'en')]));

  const header = [
    'date',
    'studentName',
    'studentMobile',
    'studentEmail',
    'district',
    'board',
    'class',
    'neetScore',
    'marks',
    'category',
    'budget',
    'interestedCountries',
    'parentContact',
    'status',
    'assignedTo',
  ];
  const lines = [header.join(',')];
  for (const l of leads) {
    const ids = l.interestedCountryIds.length ? l.interestedCountryIds : l.interestedCountryId ? [l.interestedCountryId] : [];
    const countryNames = ids.map((id) => countryName.get(id) ?? id).join('; ');
    lines.push(
      [
        l.createdAt.toISOString(),
        l.student.name,
        l.student.mobile,
        l.student.email ?? '',
        l.student.district ?? '',
        l.student.board ?? '',
        l.student.class ?? '',
        l.neetScore ?? '',
        l.marks ?? '',
        l.category ?? '',
        budgetLabel(l.budget),
        countryNames,
        l.parentContact ?? '',
        LEAD_STATUS_LABEL[l.status] ?? l.status,
        l.assignedTo?.name ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  const csv = lines.join('\n') + '\n';

  await logAudit(admin, { action: 'lead.export', entityType: 'AdmissionLead', entityId: null, details: { count: leads.length } });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
