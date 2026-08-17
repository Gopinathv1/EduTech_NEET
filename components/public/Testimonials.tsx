'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { QuoteIcon, StarIcon, ArrowRightIcon } from './icons';

/**
 * Lightweight testimonials carousel — no external library. Prev/next controls,
 * dot indicators, and gentle auto-advance (paused on hover/focus and when the
 * user prefers reduced motion). Content comes from the locale files.
 */
export type Testimonial = { name: string; role: string; quote: string };

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const t = useTranslations('a11y');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const go = (next: number) => setIndex(((next % count) + count) % count);

  useEffect(() => {
    if (paused || count <= 1) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;
  const current = items[index];

  return (
    <div
      className="relative mx-auto max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="rounded-2xl border border-border bg-surfaceElevated p-6 shadow-sm sm:p-8">
        <QuoteIcon className="h-8 w-8 text-brand/30" />
        <p
          className="mt-3 text-lg leading-relaxed text-textPrimary"
          aria-live="polite"
        >
          {current.quote}
        </p>
        <div className="mt-5 flex items-center gap-1 text-accent" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-4 w-4" />
          ))}
        </div>
        <div className="mt-3">
          <p className="font-semibold text-textPrimary">{current.name}</p>
          <p className="text-sm text-textSecondary">{current.role}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-textSecondary hover:bg-surfaceElevated"
          aria-label={t('previous')}
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
        </button>

        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={t('goToSlide', { number: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-textSecondary hover:bg-surfaceElevated"
          aria-label={t('next')}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
