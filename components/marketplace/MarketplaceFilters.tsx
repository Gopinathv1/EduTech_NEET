'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { MarketplaceListing } from '@/lib/marketplace/catalog';

function normalized(value: string) {
  return value.trim().toLowerCase();
}

export default function MarketplaceFilters({
  listings,
  labels,
}: {
  listings: MarketplaceListing[];
  labels: {
    search: string;
    searchPlaceholder: string;
    condition: string;
    all: string;
    buy: string;
    soldBy: string;
    delivery: string;
    pickup: string;
    noResults: string;
  };
}) {
  const [query, setQuery] = useState('');
  const [condition, setCondition] = useState('ALL');

  const visible = useMemo(() => {
    const q = normalized(query);
    return listings.filter((listing) => {
      const matchesQuery =
        !q ||
        normalized(listing.title).includes(q) ||
        normalized(listing.description).includes(q) ||
        normalized(listing.location).includes(q);
      const matchesCondition = condition === 'ALL' || listing.condition === condition;
      return matchesQuery && matchesCondition;
    });
  }, [condition, listings, query]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="sr-only">{labels.search}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm text-white outline-none transition placeholder:text-[#8A8A8A] focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="sr-only">{labels.condition}</span>
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white outline-none transition focus:border-brand"
          >
            <option value="ALL">{labels.all}</option>
            <option value="NEW">New</option>
            <option value="LIKE_NEW">Like new</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => (
            <Link
              key={listing.slug}
              href={`/marketplace/${listing.slug}`}
              className="group flex min-h-80 flex-col rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
            >
              <div className="flex h-36 items-center justify-center rounded-xl border border-[#2B2B2B] bg-[linear-gradient(135deg,#050505,#191919)] text-center">
                <span className="px-4 text-xs font-black uppercase tracking-[0.18em] text-brand">{listing.categorySlug.replaceAll('-', ' ')}</span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <h3 className="text-lg font-black uppercase leading-tight text-white">{listing.title}</h3>
                <p className="shrink-0 text-lg font-black text-brand">₹{listing.priceInr.toLocaleString('en-IN')}</p>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#D1D1D1]">{listing.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D1D1D1]">
                <span className="rounded-full border border-[#2B2B2B] px-3 py-1">{listing.condition.replace('_', ' ')}</span>
                <span className="rounded-full border border-[#2B2B2B] px-3 py-1">{listing.listingType}</span>
                <span className="rounded-full border border-[#2B2B2B] px-3 py-1">
                  {listing.deliveryAvailable ? labels.delivery : labels.pickup}
                </span>
              </div>
              <p className="mt-auto pt-6 text-xs font-black uppercase tracking-[0.12em] text-brand">
                {labels.soldBy}: {listing.sellerName}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 text-sm text-[#D1D1D1]">{labels.noResults}</p>
      )}
    </div>
  );
}
