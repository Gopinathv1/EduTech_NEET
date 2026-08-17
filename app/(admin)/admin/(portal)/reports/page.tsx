import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/admin/ui';

const REPORTS = [
  { slug: 'students', title: 'Student Report', desc: 'Registrations by period, district and board.' },
  { slug: 'revenue', title: 'Revenue Report', desc: 'Revenue over time and by test.' },
  { slug: 'payments', title: 'Payment Report', desc: 'All transactions with statuses.' },
  { slug: 'country-leads', title: 'Country-wise Leads', desc: 'Consultancy leads by preferred country.' },
  { slug: 'test-performance', title: 'Test Performance', desc: 'Attempts, average score and completion rate per test.' },
  { slug: 'question-difficulty', title: 'Question Difficulty', desc: 'Per-question accuracy; flags mislabelled difficulty.' },
  { slug: 'most-attempted-chapters', title: 'Most Attempted Chapters', desc: 'Chapters students practise the most.' },
  { slug: 'weak-chapters', title: 'Weakest Chapters', desc: 'Lowest-accuracy chapters platform-wide.' },
  { slug: 'top-students', title: 'Top Performing Students', desc: 'Best full-test scorers.' },
];

export default async function ReportsHubPage() {
  await requireAdminPage();
  return (
    <div>
      <AdminPageHeader title="Reports" description="Usage, revenue and performance reports — each filterable and exportable to CSV." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.slug}
            href={`/admin/reports/${r.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand"
          >
            <h2 className="text-base font-semibold text-slate-900">{r.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{r.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-brand">Open report →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
