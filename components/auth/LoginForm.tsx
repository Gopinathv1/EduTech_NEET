'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { loginPasswordSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';
import GoogleButton from './GoogleButton';

type FormValues = { mobile: string; password: string };

export default function LoginForm() {
  const t = useTranslations('auth.login');
  const tc = useTranslations('auth.common');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { mobile: '', password: '' } });

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    const data = parseForm(
      loginPasswordSchema,
      values,
      (n, m) => setError(n as keyof FormValues, { message: m }),
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-textPrimary">{t('title')}</h1>
        <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>
      </div>

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
        <Field label={t('password')} htmlFor="loginPassword" error={errors.password?.message}>
          <input
            id="loginPassword"
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

      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-textSecondary hover:text-textPrimary">
          {t('forgotPassword')}
        </Link>
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase text-textSecondary">
        <span className="h-px flex-1 bg-border" />
        {t('or')}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label={t('google')} />

      <div className="space-y-2 border-t border-border pt-4 text-center text-sm">
        <p className="text-textSecondary">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-brand hover:text-accent">
            {t('register')}
          </Link>
        </p>
        <Link href="/admin/login" className="font-medium text-textSecondary hover:text-textPrimary">
          {t('adminLogin')}
        </Link>
      </div>
    </div>
  );
}
