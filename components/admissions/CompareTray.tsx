'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AdmissionCountryProfile } from '@/lib/data/admissions/countries';

export default function CompareTray({
  countries,
  labels,
}: {
  countries: AdmissionCountryProfile[];
  labels: {
    add: string;
    remove: string;
    compare: string;
    helper: string;
  };
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const href = useMemo(() => `/admissions/compare?countries=${selected.join(',')}`, [selected]);

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 3) return [...current.slice(1), slug];
      return [...current, slug];
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {countries.map((country) => {
          const active = selected.includes(country.slug);
          return (
            <button
              key={country.slug}
              type="button"
              onClick={() => toggle(country.slug)}
              className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                active ? 'border-brand bg-brand-soft text-white' : 'border-[#2B2B2B] bg-[#111111] text-[#D1D1D1] hover:border-brand/45'
              }`}
              aria-pressed={active}
            >
              <span className="min-w-0">
                <span className="mr-2 text-xl">{country.flag}</span>
                <span className="text-sm font-black uppercase tracking-[0.08em]">{country.name}</span>
              </span>
              <span className="shrink-0 text-xs font-black uppercase tracking-[0.1em]">
                {active ? labels.remove : labels.add}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[#D1D1D1]">{labels.helper}</p>
        {selected.length >= 2 ? (
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5"
          >
            {labels.compare}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
