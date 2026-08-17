import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminCard, AdminPageHeader, SecondaryButtonLink } from '@/components/admin/ui';
import PartnerStatusActions from '@/components/admin/partners/PartnerStatusActions';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export default async function AdminPartnerDetailPage({ params }: Params) {
  const { id } = await params;
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: 'asc' } } },
  });
  if (!agency) notFound();

  return (
    <div>
      <AdminPageHeader
        title={agency.name}
        description={`${agency.partnerCode} - ${agency.approvalStatus.replaceAll('_', ' ')}`}
        actions={<SecondaryButtonLink href="/admin/partners">Back to partners</SecondaryButtonLink>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <AdminCard>
          <h2 className="text-lg font-bold text-textPrimary">Agency information</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Row label="Partner Code" value={agency.partnerCode} />
            <Row label="Contact Person" value={agency.contactPerson} />
            <Row label="Email" value={agency.email} />
            <Row label="Mobile" value={agency.mobile} />
            <Row label="City" value={agency.city} />
            <Row label="State" value={agency.state} />
            <Row label="Country" value={agency.country} />
            <Row label="Website" value={agency.website ?? 'Not provided'} />
            <Row label="Registration Number" value={agency.registrationNumber ?? 'Not provided'} />
            <Row label="Created" value={agency.createdAt.toLocaleString('en-IN')} />
            <Row label="Active" value={agency.isActive ? 'Yes' : 'No'} />
            <Row label="Review Note" value={agency.reviewNote ?? 'None'} />
          </dl>
        </AdminCard>
        <AdminCard>
          <h2 className="text-lg font-bold text-textPrimary">Approval actions</h2>
          <p className="mt-1 text-sm text-textSecondary">
            Approval activates partner portal access. Rejecting or suspending disables agency users.
          </p>
          <div className="mt-5">
            <PartnerStatusActions agencyId={agency.id} />
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mt-6">
        <h2 className="text-lg font-bold text-textPrimary">Agency users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-textSecondary">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agency.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2 text-textPrimary">{user.name}</td>
                  <td className="px-3 py-2 text-textSecondary">{user.email}</td>
                  <td className="px-3 py-2 text-textSecondary">{user.mobile}</td>
                  <td className="px-3 py-2 text-textSecondary">{user.role}</td>
                  <td className="px-3 py-2 text-textSecondary">{user.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-textSecondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-textPrimary">{value}</dd>
    </div>
  );
}
