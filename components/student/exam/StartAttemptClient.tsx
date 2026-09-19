'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';
import type { ExamLanguage } from '@/lib/attempts/examState';
import CheckoutClient from '@/components/student/CheckoutClient';
import { requestAttemptStart } from '@/lib/client/paid-retry-flow';

/**
 * The language chooser + Start button on the instructions page. If the student
 * already has an active attempt we render a Resume button instead (the parent
 * decides which via `resume`).
 */
export default function StartAttemptClient({
  testId,
  languages,
  defaultLanguage,
  resume,
}: {
  testId: string;
  languages: ExamLanguage[];
  defaultLanguage: ExamLanguage;
  resume: boolean;
}) {
  const t = useTranslations('exam.instructions');
  const [language, setLanguage] = useState<ExamLanguage>(defaultLanguage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [paymentRequired, setPaymentRequired] = useState(false);

  async function start(): Promise<boolean> {
    setBusy(true);
    setError(undefined);
    setPaymentRequired(false);
    const outcome = await requestAttemptStart({
      post: apiPost,
      testId,
      language,
      navigate: (url) => { window.location.href = url; },
    });
    if (outcome === 'started') {
      return true;
    }
    setBusy(false);
    if (outcome === 'paymentRequired') {
      setPaymentRequired(true);
      return false;
    }
    setError(t('startError'));
    return false;
  }

  return (
    <div>
      {!resume && languages.length > 1 ? (
        <fieldset className="mt-2">
          <legend className="text-sm font-semibold text-textPrimary">{t('languageChoice')}</legend>
          <p className="mt-1 text-xs text-textSecondary">{t('languageNote')}</p>
          <div className="mt-3 flex gap-3">
            {languages.map((lang) => {
              const active = lang === language;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={active}
                  className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'border-brand bg-brand text-white' : 'border-border text-textSecondary hover:bg-surface'
                  }`}
                >
                  {lang === 'ta' ? 'தமிழ்' : lang === 'hi' ? 'हिन्दी' : 'English'}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {paymentRequired ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-textPrimary">{t('paidRetryTitle')}</h2>
          <p className="mt-2 text-sm text-textSecondary">{t('paidRetryNote')}</p>
          <CheckoutClient
            testId={testId}
            price={30}
            title={t('paidRetryAttempt')}
            orderEndpoint="/api/payments/retry-order"
            heading={t('paidRetryTitle')}
            subtitle={t('paidRetryNote')}
            buttonLabel={t('paidRetryButton')}
            onOrderConflict={start}
            onVerified={start}
          />
        </div>
      ) : null}

      {!paymentRequired ? (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-brand px-6 py-3.5 text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {busy ? t('starting') : resume ? t('resume') : t('start')}
        </button>
      ) : null}
    </div>
  );
}
