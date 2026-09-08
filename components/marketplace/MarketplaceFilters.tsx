'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { MarketplaceCategory, MarketplaceListing, MarketplaceLevel } from '@/lib/marketplace/catalog';

function normalized(value: string) {
  return value.trim().toLowerCase();
}

export default function MarketplaceFilters({
  categories,
  listings,
  initialCategory = 'ALL',
  labels,
}: {
  categories: MarketplaceCategory[];
  listings: MarketplaceListing[];
  initialCategory?: string;
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    condition: string;
    level: string;
    all: string;
    categories: Record<string, string>;
    levels: Record<MarketplaceLevel, string>;
    buy: string;
    soldBy: string;
    delivery: string;
    pickup: string;
    noResults: string;
    noResultsForCategory: string;
  };
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState('ALL');
  const [level, setLevel] = useState('ALL');

  const categoryFamilies = useMemo(() => {
    const families = Object.fromEntries(
      categories.map((current) => [current.slug, new Set<string>([current.slug])]),
    ) as Record<string, Set<string>>;

    for (const current of categories) {
      let parent = current.parentSlug;
      while (parent) {
        families[parent]?.add(current.slug);
        parent = categories.find((candidate) => candidate.slug === parent)?.parentSlug;
      }
    }

    return families;
  }, [categories]);

  const categoryOptions = useMemo(
    () => categories.filter((current) => !current.parentSlug),
    [categories],
  );

  const categoryLabels = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, current) => {
        acc[current.slug] = labels.categories[current.labelKey] ?? current.slug.replaceAll('-', ' ');
        return acc;
      }, {}),
    [categories, labels.categories],
  );

  const visible = useMemo(() => {
    const q = normalized(query);
    return listings.filter((listing) => {
      const categoryFamily = categoryFamilies[category];
      const matchesQuery =
        !q ||
        normalized(listing.title).includes(q) ||
        normalized(listing.description).includes(q) ||
        normalized(listing.location).includes(q) ||
        normalized(listing.categorySlug).includes(q) ||
        normalized(listing.subcategorySlug ?? '').includes(q);
      const matchesCategory =
        category === 'ALL' ||
        categoryFamily?.has(listing.categorySlug) ||
        categoryFamily?.has(listing.subcategorySlug ?? '');
      const matchesCondition = condition === 'ALL' || listing.condition === condition;
      const matchesLevel = level === 'ALL' || listing.level === level;
      return matchesQuery && matchesCategory && matchesCondition && matchesLevel;
    });
  }, [category, categoryFamilies, condition, level, listings, query]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 md:grid-cols-[1fr_220px_180px_180px]">
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
          <span className="sr-only">{labels.category}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white outline-none transition focus:border-brand"
          >
            <option value="ALL">{labels.all}</option>
            {categoryOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {categoryLabels[option.slug]}
              </option>
            ))}
          </select>
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
        <label className="block">
          <span className="sr-only">{labels.level}</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-12 w-full rounded-xl border border-[#2B2B2B] bg-[#050505] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white outline-none transition focus:border-brand"
          >
            <option value="ALL">{labels.all}</option>
            <option value="BEGINNER">{labels.levels.BEGINNER}</option>
            <option value="INTERMEDIATE">{labels.levels.INTERMEDIATE}</option>
            <option value="ADVANCED">{labels.levels.ADVANCED}</option>
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
                <span className="px-4 text-xs font-black uppercase tracking-[0.18em] text-brand">
                  {categoryLabels[listing.subcategorySlug ?? listing.categorySlug] ?? listing.categorySlug.replaceAll('-', ' ')}
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <h3 className="text-lg font-black uppercase leading-tight text-white">{listing.title}</h3>
                <p className="shrink-0 text-lg font-black text-brand">₹{listing.priceInr.toLocaleString('en-IN')}</p>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#D1D1D1]">{listing.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D1D1D1]">
                <span className="rounded-full border border-[#2B2B2B] px-3 py-1">{listing.condition.replace('_', ' ')}</span>
                <span className="rounded-full border border-[#2B2B2B] px-3 py-1">{listing.listingType}</span>
                {listing.level ? (
                  <span className="rounded-full border border-[#2B2B2B] px-3 py-1">{labels.levels[listing.level]}</span>
                ) : null}
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
        <p className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 text-sm font-bold leading-7 text-[#D1D1D1]">
          {category === 'ALL' ? labels.noResults : labels.noResultsForCategory.replace('{category}', categoryLabels[category] ?? category)}
        </p>
      )}
    </div>
  );
}
