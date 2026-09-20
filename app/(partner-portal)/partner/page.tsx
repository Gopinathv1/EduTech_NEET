import { requirePartnerPage } from '@/lib/auth/partner';

const futureAreas = [
  ['Admissions referrals', 'Coming Soon'],
  ['Counselling referrals', 'Coming Soon'],
  ['Courses participation', 'Coming Soon'],
  ['Marketplace seller tools', 'Coming Soon'],
];

export default async function PartnerDashboardPage() {
  const { user, agency } = await requirePartnerPage();
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#0b1b1e] p-6 shadow-xl shadow-black/20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">Approved Partner</p>
        <h1 className="mt-3 text-3xl font-black text-white">Welcome back, {user.name}</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Info label="Agency" value={agency.name} />
          <Info label="Partner ID" value={agency.partnerCode} />
          <Info label="Approval" value="Approved" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {futureAreas.map(([label, note]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#0b1b1e] p-5">
            <p className="text-sm font-semibold text-slate-200">{label}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[.14em] text-[#75aaff]">{note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0b1b1e] p-6">
        <h2 className="text-xl font-black text-white">Your approved partner foundation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Your agency account is approved. Partner Portal tools will be introduced in future phases as workflows become available.
        </p>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-white">{value}</p>
    </div>
  );
}
