import { useTranslations } from 'next-intl';

function BrandMarqueeTrack({ duplicate = false, items }: { duplicate?: boolean; items: string[] }) {
  return (
    <div className="sivora-brand-marquee flex w-max shrink-0 items-center gap-4 px-2" aria-hidden={duplicate ? true : undefined}>
      {items.map((item) => (
        <span key={item} className="flex shrink-0 items-center gap-4">
          <span className="text-xs font-black uppercase tracking-[0.22em] text-white/86 sm:text-sm">
            {item}
          </span>
          <span className="text-sm font-black text-[#f6d58a]" aria-hidden="true">
            *
          </span>
        </span>
      ))}
    </div>
  );
}

export default function BrandMarquee() {
  const t = useTranslations('brandMarquee');
  const items = t.raw('items') as string[];

  return (
    <div className="overflow-hidden border-y border-[#2B2B2B] bg-[#050505]/86 py-3 shadow-[0_0_36px_rgba(215,25,32,0.12)] backdrop-blur-sm">
      <div className="group flex w-max min-w-full">
        <BrandMarqueeTrack items={items} />
        <BrandMarqueeTrack items={items} duplicate />
      </div>
    </div>
  );
}
