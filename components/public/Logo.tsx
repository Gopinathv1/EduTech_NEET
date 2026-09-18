'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

/** Compact public logo with the SIVORA UP↑RISING brand mark. */
export default function Logo({
  className = '',
  size,
  showTagline = false,
}: {
  className?: string;
  size?: 'default' | 'compact' | 'footer';
  showTagline?: boolean;
}) {
  const t = useTranslations('a11y');
  const scale = size === 'footer' ? 'text-2xl' : 'text-[18px] sm:text-[20px]';
  return <Link href="/" className={`sivora-wordmark inline-flex shrink-0 items-center gap-2 font-semibold uppercase tracking-[-0.055em] ${scale} ${className}`} aria-label={t('homeLink')}><span>SIVORA</span><span className="border-l border-current/30 pl-2 text-[0.6em] font-medium tracking-[0.02em]">UP<span className="relative -top-px mx-[-0.05em] inline-block text-[1.12em] font-semibold">↑</span>RISING</span>{showTagline ? <span className="sr-only">RISE BEYOND BOUNDARIES</span> : null}</Link>;
}
