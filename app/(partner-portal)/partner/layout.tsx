import PartnerNav from '@/components/partner/PartnerNav';
import { requirePartnerPage } from '@/lib/auth/partner';

export default async function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePartnerPage();
  return (
    <div className="min-h-screen bg-[#081214] text-slate-100">
      <PartnerNav userName={context.user.name} agencyName={context.agency.name} />
      <div className="lg:pl-72">
        <main id="main-content" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
