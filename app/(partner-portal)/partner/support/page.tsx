import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { requirePartnerPage } from '@/lib/auth/partner';

export default async function PartnerSupportPage() {
  const { agency } = await requirePartnerPage();
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1b1e] p-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">Support</p>
      <h1 className="mt-3 text-3xl font-black text-white">Need help?</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
        Full support ticketing is coming later. For Phase 1, use WhatsApp to reach the SIVORA UPRISING partner team.
      </p>
      <div className="mt-6">
        <WhatsAppLink
          label="Chat with SIVORA UPRISING on WhatsApp"
          message={`Hello SIVORA UPRISING,\nI am contacting you from ${agency.name} and need partner support.`}
          className="inline-flex rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-emerald-100 hover:bg-emerald-500/20"
        />
      </div>
    </section>
  );
}
