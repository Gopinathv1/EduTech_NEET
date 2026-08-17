import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { budgetLabel, LEAD_STATUS_LABEL } from '@/lib/admin/leads-service';
import { AdminPageHeader, AdminCard, Badge } from '@/components/admin/ui';

type Ctx = { params: Promise<{ id: string }> };

const ATTEMPT_BADGE: Record<string, string> = { SUBMITTED: 'green', AUTO_SUBMITTED: 'amber', IN_PROGRESS: 'slate' };
const PAY_BADGE: Record<string, string> = { SUCCESS: 'green', CREATED: 'slate', FAILED: 'red', REFUNDED: 'amber' };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export default async function StudentDetailPage({ params }: Ctx) {
  await requireAdminPage();
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      attempts: {
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { test: { select: { title: true } }, result: { select: { score: true, totalQuestions: true } } },
      },
      payments: { orderBy: { createdAt: 'desc' }, include: { test: { select: { title: true } } } },
      leads: { orderBy: { createdAt: 'desc' }, include: { interestedCountry: { select: { name: true } } } },
    },
  });
  if (!student) notFound();

  const paid = student.payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <Link href="/admin/students" className="text-sm font-medium text-brand hover:text-brand-dark">
        ← All students
      </Link>
      <div className="mt-2">
        <AdminPageHeader title={student.name} description={`+91 ${student.mobile}${student.email ? ` · ${student.email}` : ''}`} />
      </div>

      {/* Profile */}
      <AdminCard>
        <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Row label="State" value={student.state ?? '—'} />
          <Row label="District" value={student.district ?? '—'} />
          <Row label="School" value={student.schoolName ?? '—'} />
          <Row label="Board" value={student.board ?? '—'} />
          <Row label="Class" value={student.class ?? '—'} />
          <Row label="Language" value={student.preferredLanguage.toUpperCase()} />
          <Row label="Mobile verified" value={student.isMobileVerified ? 'Yes' : 'No'} />
          <Row label="Registered" value={student.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
        </dl>
      </AdminCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attempts + scores */}
        <AdminCard>
          <h2 className="text-base font-semibold text-slate-900">Attempts &amp; scores</h2>
          {student.attempts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No attempts yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {student.attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-800">{localizedName(a.test.title, 'en')}</span>
                    <span className="text-xs text-slate-400">
                      {a.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge color={ATTEMPT_BADGE[a.status] ?? 'slate'}>{a.status.replace('_', ' ').toLowerCase()}</Badge>
                    {a.result ? (
                      <span className="text-sm font-bold text-slate-900" title={`out of ${a.result.totalQuestions * 4}`}>
                        {a.result.score}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Payments */}
        <AdminCard>
          <h2 className="text-base font-semibold text-slate-900">Payments</h2>
          <p className="mt-0.5 text-xs text-slate-500">₹{paid} paid across {student.payments.filter((p) => p.status === 'SUCCESS').length} test(s).</p>
          {student.payments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {student.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-800">{localizedName(p.test.title, 'en')}</span>
                    <span className="text-xs text-slate-400">
                      {p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">₹{p.amount}</span>
                    <Badge color={PAY_BADGE[p.status] ?? 'slate'}>{p.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {/* Leads */}
      <AdminCard className="mt-6">
        <h2 className="text-base font-semibold text-slate-900">Consultancy leads</h2>
        {student.leads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No leads.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {student.leads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Badge color="blue">{LEAD_STATUS_LABEL[l.status] ?? l.status}</Badge>
                  <span className="text-slate-700">{l.interestedCountry ? localizedName(l.interestedCountry.name, 'en') : '—'}</span>
                </span>
                <span className="text-slate-500">
                  NEET {l.neetScore ?? '—'} · {budgetLabel(l.budget)} ·{' '}
                  {l.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
