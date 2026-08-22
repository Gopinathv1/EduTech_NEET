import PartnerProfileForm from '@/components/partner/forms/PartnerProfileForm';
import { requirePartnerPage } from '@/lib/auth/partner';

export default async function PartnerProfilePage() {
  const { agency } = await requirePartnerPage();
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#0b1b1e] p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">Agency Profile</p>
        <h1 className="mt-3 text-3xl font-black text-white">{agency.name}</h1>
        <dl className="mt-6 space-y-4 text-sm">
          <Row label="Partner Code" value={agency.partnerCode} />
          <Row label="Email" value={agency.email} />
          <Row label="Approval Status" value={agency.approvalStatus} />
          <Row label="Created" value={agency.createdAt.toLocaleDateString('en-IN')} />
          <Row label="Registration Number" value={agency.registrationNumber ?? 'Not provided'} />
        </dl>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#0b1b1e] p-6">
        <h2 className="text-xl font-black text-white">Editable contact details</h2>
        <p className="mt-1 text-sm text-slate-400">Partner code and approval status are controlled by SIVORA UP↑RISING admin.</p>
        <div className="mt-5">
          <PartnerProfileForm
            defaultValues={{
              contactPerson: agency.contactPerson,
              mobile: agency.mobile,
              city: agency.city,
              state: agency.state,
              country: agency.country,
              website: agency.website ?? '',
            }}
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-100">{value}</dd>
    </div>
  );
}
