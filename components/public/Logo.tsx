'use client';

import { useTranslations } from 'next-intl';
import BrandLogo from '@/components/brand/Logo';

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
  return <BrandLogo className={className} label={t('homeLink')} size={size} showTagline={showTagline} />;
}
