import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminCard, AdminPageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminPartnersPage() {
  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      partnerCode: true,
      name: true,
      contactPerson: true,
      email: true,
      mobile: true,
      city: true,
      approvalStatus: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="Partners / Agencies"
        description="Review B2B partner applications and control portal activation."
      />
      <AdminCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-textSecondary">
                <th className="px-4 py-3">Partner Code</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-semibold text-textPrimary">
                    <Link href={`/admin/partners/${agency.id}`} className="hover:text-brand">
                      {agency.partnerCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-textPrimary">{agency.name}</td>
                  <td className="px-4 py-3 text-textSecondary">
                    <span className="block text-textPrimary">{agency.contactPerson}</span>
                    <span>{agency.email}</span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">{agency.mobile}</td>
                  <td className="px-4 py-3 text-textSecondary">{agency.city}</td>
                  <td className="px-4 py-3"><StatusChip status={agency.approvalStatus} /></td>
                  <td className="px-4 py-3 text-textSecondary">{agency.createdAt.toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {agencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-textSecondary">
                    No partner applications yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-200',
    APPROVED: 'bg-green-500/10 text-green-200',
    REJECTED: 'bg-red-500/10 text-red-200',
    MORE_INFO_REQUIRED: 'bg-blue-500/10 text-blue-200',
    SUSPENDED: 'bg-slate-500/20 text-slate-200',
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${colors[status] ?? colors.PENDING}`}>{status.replaceAll('_', ' ')}</span>;
}
