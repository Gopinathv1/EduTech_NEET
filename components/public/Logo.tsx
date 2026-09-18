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
  const scale = size === 'footer' ? 'text-[26px] sm:text-[30px]' : 'text-[19px] sm:text-[21px]';
  return <Link href="/" className={`sivora-wordmark inline-flex shrink-0 items-center gap-2.5 font-semibold uppercase tracking-[-0.06em] ${scale} ${className}`} aria-label={t('homeLink')}><span className="font-bold">SIVORA</span><span className="border-l border-current/25 pl-2.5 text-[0.56em] font-semibold tracking-[0.04em]">UP<span className="relative -top-[0.08em] mx-[0.02em] inline-block text-[1.25em] font-bold">↑</span>RISING</span>{showTagline ? <span className="sr-only">RISE BEYOND BOUNDARIES</span> : null}</Link>;
}
