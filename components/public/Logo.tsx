'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Brand logo placeholder: a deep-blue rounded "V" mark + wordmark. Inline SVG
 * (crisp, no request). Swap for a real logo asset later without touching pages.
 */
export default function Logo({ className = '' }: { className?: string }) {
  const t = useTranslations('a11y');
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2 ${className}`} aria-label={t('homeLink')}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="system-ui, sans-serif"
        >
          V
        </text>
      </svg>
      <span className="whitespace-nowrap text-base font-extrabold leading-tight text-brand-dark sm:text-lg">
        VV Overseas
      </span>
    </Link>
  );
}
