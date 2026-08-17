'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { z } from 'zod';
import { mobileSchema, passwordResetSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText, useCountdown } from './hooks';

const mobileOnlySchema = z.object({ mobile: mobileSchema });

export default function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot');
  const tc = useTranslations('auth.common');
  const tOtp = useTranslations('auth.otp');
  const errText = useErrorText();
  const { seconds, start } = useCountdown();

  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [mobile, setMobile] = useState('');
  const [devOtp, setDevOtp] = useState<string>();
  const [banner, setBanner] = useState<string>();

  const requestForm = useForm<{ mobile: string }>({ defaultValues: { mobile: '' } });
  const resetForm = useForm<{ otp: string; newPassword: string }>({
    defaultValues: { otp: '', newPassword: '' },
  });

  async function onRequest(values: { mobile: string }) {
    setBanner(undefined);
    const data = parseForm(
      mobileOnlySchema,
      values,
      (n, m) => requestForm.setError(n as 'mobile', { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/otp/request', {
      mobile: data.mobile,
      purpose: 'PASSWORD_RESET',
    });
    if (res.ok) {
      setMobile(data.mobile);
      setDevOtp(typeof res.devOtp === 'string' ? res.devOtp : undefined);
      setStep('reset');
      return;
    }
    setBanner(errText(res.error));
  }

  async function onReset(values: { otp: string; newPassword: string }) {
    setBanner(undefined);
    const data = parseForm(
      passwordResetSchema,
      { mobile, ...values },
      (n, m) => {
        if (n === 'otp' || n === 'newPassword') resetForm.setError(n, { message: m });
        else setBanner(m);
      },
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/password/reset', data);
    if (res.ok) {
      setStep('done');
      return;
    }
    setBanner(errText(res.error));
  }

  async function resend() {
    setBanner(undefined);
    const res = await apiPost('/api/auth/otp/request', { mobile, purpose: 'PASSWORD_RESET' });
    if (res.ok) {
      start(30);
      if (typeof res.devOtp === 'string') setDevOtp(res.devOtp);
    } else {
      setBanner(errText(res.error));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      {banner ? <Banner kind="error">{banner}</Banner> : null}

      {step === 'request' ? (
        <form onSubmit={requestForm.handleSubmit(onRequest)} className="space-y-4" noValidate>
          <Field
            label={t('mobile')}
            htmlFor="fpMobile"
            error={requestForm.formState.errors.mobile?.message}
          >
            <input
              id="fpMobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className={inputClass}
              {...requestForm.register('mobile')}
            />
          </Field>
          <SubmitButton busy={requestForm.formState.isSubmitting} busyLabel={tc('sending')}>
            {t('sendOtp')}
          </SubmitButton>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4" noValidate>
          {devOtp ? <Banner kind="success">{tOtp('devHint', { otp: devOtp })}</Banner> : null}
          <Field label={t('otp')} htmlFor="fpOtp" error={resetForm.formState.errors.otp?.message}>
            <input
              id="fpOtp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`${inputClass} tracking-[0.3em]`}
              {...resetForm.register('otp')}
            />
          </Field>
          <Field
            label={t('newPassword')}
            htmlFor="fpPassword"
            error={resetForm.formState.errors.newPassword?.message}
          >
            <input
              id="fpPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...resetForm.register('newPassword')}
            />
          </Field>
          <SubmitButton busy={resetForm.formState.isSubmitting} busyLabel={tc('saving')}>
            {t('submit')}
          </SubmitButton>
          <button
            type="button"
            onClick={resend}
            disabled={seconds > 0}
            className="w-full text-center text-sm font-medium text-brand hover:text-brand-dark disabled:opacity-50"
          >
            {seconds > 0 ? tOtp('resendIn', { seconds }) : tOtp('resend')}
          </button>
        </form>
      ) : null}

      {step === 'done' ? <Banner kind="success">{t('success')}</Banner> : null}

      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
