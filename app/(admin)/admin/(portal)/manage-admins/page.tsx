import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { AdminPageHeader } from '@/components/admin/ui';
import AdminManager, { type AdminRow } from '@/components/admin/manage/AdminManager';

export default async function ManageAdminsPage() {
  const session = await requireAdminPage({ superOnly: true });

  const admins = await prisma.admin.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
  });
  const rows: AdminRow[] = admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
  }));

  return (
    <div>
      <AdminPageHeader title="Manage Admins" description="Create, deactivate and set roles for back-office staff." />
      <AdminManager admins={rows} currentAdminId={session.sub} />
    </div>
  );
}
