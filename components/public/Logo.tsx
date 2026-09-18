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
  const scale = size === 'footer' ? 'text-xl sm:text-2xl' : size === 'compact' ? 'text-[17px] sm:text-[19px]' : 'text-xl';
  return <Link href="/" className={`inline-flex shrink-0 items-baseline gap-2 font-black uppercase tracking-[0.08em] text-[#171613] ${scale} ${className}`} aria-label={t('homeLink')}><span>SIVORA</span><span className="font-semibold tracking-[0.1em]">UP<span className="text-brand">↑</span>RISING</span>{showTagline ? <span className="sr-only">RISE BEYOND BOUNDARIES</span> : null}</Link>;
}
