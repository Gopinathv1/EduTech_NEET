import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import AdminNav from '@/components/admin/AdminNav';

/**
 * Admin portal shell — applies to every authenticated /admin/* page (but NOT
 * /admin/login, which lives outside this route group). Guards the session
 * (defence-in-depth behind middleware) and renders the sidebar chrome.
 */
export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const newLeadsCount = await prisma.admissionLead.count({ where: { status: 'NEW' } });

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav name={session.name} role={session.role} newLeadsCount={newLeadsCount} />
      <div className="lg:pl-64">
        <main id="main-content" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
