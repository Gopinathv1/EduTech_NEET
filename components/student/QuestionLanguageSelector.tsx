'use client';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { localeNames } from '@/i18n/config';
import { useTranslations } from 'next-intl';
export default function QuestionLanguageSelector({ language, onChange }: { language: ExamLanguage; onChange: (language: ExamLanguage) => void }) {
  const t = useTranslations('questionContent');
  return <fieldset className="flex flex-wrap items-center gap-1 rounded-xl border border-border p-1">
    <legend className="px-1 text-xs text-textSecondary">{t('language')}</legend>
    {(['en', 'ta', 'hi'] as const).map(code => <button key={code} type="button" onClick={() => onChange(code)}
      aria-label={localeNames[code]} aria-pressed={language === code}
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${language === code ? 'bg-brand text-white' : 'text-textSecondary hover:bg-surfaceElevated'}`}>
      {code.toUpperCase()}
    </button>)}
  </fieldset>;
}
