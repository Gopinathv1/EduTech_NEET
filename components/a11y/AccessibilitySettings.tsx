'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  setFontScale,
  setContrast,
  type FontScale,
  type Contrast,
} from '@/lib/a11y';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/**
 * Full-page accessibility controls (larger touch targets than the header
 * popover) for /student/settings. Same cookie-backed server actions as
 * AccessibilityMenu; a refresh re-stamps <html> so the change is applied
 * app-wide. Language selection is included here too so every display preference
 * lives in one place.
 */
export default function AccessibilitySettings({
  fontScale: initialFont,
  contrast: initialContrast,
}: {
  fontScale: FontScale;
  contrast: Contrast;
}) {
  const t = useTranslations('a11y');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fontScale, setFont] = useState<FontScale>(initialFont);
  const [contrast, setC] = useState<Contrast>(initialContrast);

  function toggleFont() {
    const next: FontScale = fontScale === 'large' ? 'normal' : 'large';
    setFont(next);
    document.documentElement.dataset.fontScale = next;
    startTransition(async () => {
      await setFontScale(next);
      router.refresh();
    });
  }
  function toggleContrast() {
    const next: Contrast = contrast === 'high' ? 'normal' : 'high';
    setC(next);
    document.documentElement.dataset.contrast = next;
    startTransition(async () => {
      await setContrast(next);
      router.refresh();
    });
  }

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      <Row
        label={t('largeFont')}
        hint={t('largeFontHint')}
        on={fontScale === 'large'}
        disabled={isPending}
        onToggle={toggleFont}
        onText={t('on')}
        offText={t('off')}
      />
      <Row
        label={t('highContrast')}
        hint={t('highContrastHint')}
        on={contrast === 'high'}
        disabled={isPending}
        onToggle={toggleContrast}
        onText={t('on')}
        offText={t('off')}
      />
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-medium text-slate-900">{t('language')}</p>
          <p className="text-sm text-slate-500">{t('languageHint')}</p>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  on,
  disabled,
  onToggle,
  onText,
  offText,
}: {
  label: string;
  hint: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
  onText: string;
  offText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-base font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className="flex flex-shrink-0 items-center gap-2 disabled:opacity-60"
      >
        <span className="text-sm font-medium text-slate-600">{on ? onText : offText}</span>
        <span
          aria-hidden="true"
          className={`inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            on ? 'bg-brand' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              on ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
