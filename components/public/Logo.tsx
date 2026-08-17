'use client';

import { useTranslations } from 'next-intl';
import VVOverseasLogo from '@/components/brand/VVOverseasLogo';

/** Compact public wordmark with an original peacock feather brand mark. */
export default function Logo({ className = '' }: { className?: string }) {
  const t = useTranslations('a11y');
  return <VVOverseasLogo className={className} label={t('homeLink')} />;
}
