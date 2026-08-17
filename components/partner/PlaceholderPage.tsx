export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1b1e] p-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">{phase}</p>
      <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
        This area is reserved for the approved partner workflow and has no live records yet.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
        No data is shown until the next approved phase connects this module.
      </div>
    </section>
  );
}
