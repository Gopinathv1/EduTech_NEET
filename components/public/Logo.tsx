'use client';

import { useTranslations } from 'next-intl';
import BrandLogo from '@/components/brand/Logo';

/** Compact public logo with the SIVORA UP↑RISING brand mark. */
export default function Logo({ className = '' }: { className?: string }) {
  const t = useTranslations('a11y');
  return <BrandLogo className={className} label={t('homeLink')} />;
}
