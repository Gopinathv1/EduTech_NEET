'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText, useCountdown } from './hooks';

/**
 * OTP entry + verify + resend. On success the server has set the session cookie,
 * so we do a full navigation to the returned redirect (picks up the cookie and
 * any locale change). Reused by registration and mobile-OTP login.
 */
export default function OtpStep({
  mobile,
  purpose,
  initialDevOtp,
  onBack,
}: {
  mobile: string;
  purpose: 'REGISTRATION' | 'LOGIN';
  initialDevOtp?: string;
  onBack?: () => void;
}) {
  const t = useTranslations('auth.otp');
  const tc = useTranslations('auth.common');
  const errText = useErrorText();
  const { seconds, start } = useCountdown();

  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setNotice(undefined);
    setBusy(true);
    const res = await apiPost('/api/auth/otp/verify', { mobile, otp, purpose });
    setBusy(false);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    setError(errText(res.error));
  }

  async function resend() {
    setError(undefined);
    setNotice(undefined);
    const res = await apiPost('/api/auth/otp/request', { mobile, purpose });
    if (res.ok) {
      setNotice(t('sent'));
      start(30);
      if (typeof res.devOtp === 'string') setDevOtp(res.devOtp);
    } else {
      setError(errText(res.error));
    }
  }

  return (
    <form onSubmit={verify} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle', { mobile: `+91 ${mobile}` })}</p>
      </div>

      {devOtp ? <Banner kind="success">{t('devHint', { otp: devOtp })}</Banner> : null}
      {notice ? <Banner kind="success">{notice}</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}

      <Field label={t('label')} htmlFor="otp">
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
        />
      </Field>

      <SubmitButton busy={busy} busyLabel={tc('verifying')}>
        {t('verify')}
      </SubmitButton>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-slate-500 hover:text-slate-700"
        >
          {t('changeNumber')}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={seconds > 0}
          className="font-medium text-brand hover:text-brand-dark disabled:opacity-50"
        >
          {seconds > 0 ? t('resendIn', { seconds }) : t('resend')}
        </button>
      </div>
    </form>
  );
}
