'use client';

import { useTranslations } from 'next-intl';
import BrandLogo from '@/components/brand/Logo';

/** Compact public wordmark with the SIVORA UPRISING Trishul brand mark. */
export default function Logo({ className = '' }: { className?: string }) {
  const t = useTranslations('a11y');
  return <BrandLogo className={className} label={t('homeLink')} />;
}
