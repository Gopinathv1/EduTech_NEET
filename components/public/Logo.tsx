'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import PeacockFeatherLogo from '@/components/brand/PeacockFeatherLogo';

/** Compact public wordmark with an original peacock feather brand mark. */
export default function Logo({ className = '' }: { className?: string }) {
  const t = useTranslations('a11y');
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label={t('homeLink')}>
      <PeacockFeatherLogo className="h-9 w-6 shrink-0 sm:h-11 sm:w-7" />
      <span className="whitespace-nowrap text-base font-extrabold leading-tight text-textPrimary sm:text-lg">
        <span className="text-brand">VV</span> Overseas
      </span>
    </Link>
  );
}
