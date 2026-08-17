'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { z } from 'zod';
import { passwordLoginSchema, mobileSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';
import OtpStep from './OtpStep';

const mobileOnlySchema = z.object({ mobile: mobileSchema });

type Tab = 'otp' | 'password';

export default function LoginForm() {
  const t = useTranslations('auth.login');
  const [tab, setTab] = useState<Tab>('otp');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
        {(['otp', 'password'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              tab === key ? 'bg-white text-brand shadow-sm' : 'text-slate-600'
            }`}
          >
            {key === 'otp' ? t('tabOtp') : t('tabPassword')}
          </button>
        ))}
      </div>

      {tab === 'otp' ? <OtpLoginTab /> : <PasswordLoginTab />}

      <div className="space-y-2 border-t border-slate-100 pt-4 text-center text-sm">
        <p className="text-slate-600">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
            {t('register')}
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/forgot-password" className="font-medium text-slate-500 hover:text-slate-700">
            {t('forgot')}
          </Link>
          <Link href="/admin/login" className="font-medium text-slate-500 hover:text-slate-700">
            {t('adminLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PasswordLoginTab() {
  const t = useTranslations('auth.login');
  const tc = useTranslations('auth.common');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ identifier: string; password: string }>({
    defaultValues: { identifier: '', password: '' },
  });

  async function onSubmit(values: { identifier: string; password: string }) {
    setBanner(undefined);
    const data = parseForm(
      passwordLoginSchema,
      values,
      (n, m) => setError(n as 'identifier' | 'password', { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/login', data);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    setBanner(errText(res.error));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {banner ? <Banner kind="error">{banner}</Banner> : null}
      <Field label={t('identifier')} htmlFor="identifier" error={errors.identifier?.message}>
        <input
          id="identifier"
          autoComplete="username"
          className={inputClass}
          {...register('identifier')}
        />
      </Field>
      <Field label={t('password')} htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...register('password')}
        />
      </Field>
      <SubmitButton busy={isSubmitting} busyLabel={tc('loggingIn')}>
        {t('submit')}
      </SubmitButton>
    </form>
  );
}

function OtpLoginTab() {
  const t = useTranslations('auth.login');
  const tc = useTranslations('auth.common');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const [verify, setVerify] = useState<{ mobile: string; devOtp?: string } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ mobile: string }>({ defaultValues: { mobile: '' } });

  async function onSubmit(values: { mobile: string }) {
    setBanner(undefined);
    const data = parseForm(
      mobileOnlySchema,
      values,
      (n, m) => setError(n as 'mobile', { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/otp/request', { mobile: data.mobile, purpose: 'LOGIN' });
    if (res.ok) {
      setVerify({ mobile: data.mobile, devOtp: typeof res.devOtp === 'string' ? res.devOtp : undefined });
      return;
    }
    setBanner(errText(res.error));
  }

  if (verify) {
    return (
      <OtpStep
        mobile={verify.mobile}
        purpose="LOGIN"
        initialDevOtp={verify.devOtp}
        onBack={() => setVerify(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {banner ? <Banner kind="error">{banner}</Banner> : null}
      <Field label={t('mobile')} htmlFor="loginMobile" error={errors.mobile?.message}>
        <input
          id="loginMobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={inputClass}
          {...register('mobile')}
        />
      </Field>
      <SubmitButton busy={isSubmitting} busyLabel={tc('sending')}>
        {t('requestOtp')}
      </SubmitButton>
    </form>
  );
}
