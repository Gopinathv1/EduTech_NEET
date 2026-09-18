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
    <div className="divide-y divide-[#d2c9bd] rounded-md border border-[#d2c9bd] bg-[#eee8df]">
      {items.map((item, i) => (
        <details key={i} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-[#171613] [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm leading-7 text-[#6e685f]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
