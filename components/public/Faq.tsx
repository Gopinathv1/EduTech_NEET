import { ChevronDownIcon } from './icons';

/**
 * Accessible FAQ accordion built on native <details>/<summary> — fully
 * keyboard-operable and screen-reader-friendly with ZERO client JS, and the
 * answers stay in the SSR HTML (good for SEO). Content comes from the locale
 * files (passed in as `items`).
 */
export type FaqItem = { q: string; a: string };

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-[#2B2B2B] rounded-2xl border border-[#2B2B2B] bg-[#111111] shadow-xl shadow-black/5">
      {items.map((item, i) => (
        <details key={i} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-black text-white [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm leading-7 text-[#D1D1D1]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
