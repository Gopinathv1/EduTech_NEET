'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { registerSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm, applyServerFieldErrors } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';
import GoogleButton from './GoogleButton';

type FormValues = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  preferredLanguage: string;
};

export default function RegisterForm() {
  const t = useTranslations('auth.register');
  const errText = useErrorText();
  const locale = useLocale();
  const [banner, setBanner] = useState<string>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: locale,
    },
  });

  const setFieldError = (name: string, message: string) =>
    setError(name as keyof FormValues, { message });

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    const data = parseForm(registerSchema, values, setFieldError, errText);
    if (!data) return;

    const res = await apiPost('/api/auth/register', data);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    if (res.error === 'validation') {
      applyServerFieldErrors(res.fields as Record<string, string[]>, setFieldError, errText);
    } else {
      setBanner(errText(res.error));
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <h1 className="text-xl font-bold text-textPrimary">{t('title')}</h1>
          <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>
        </div>

        {banner ? <Banner kind="error">{banner}</Banner> : null}

        <Field label={t('name')} htmlFor="name" error={errors.name?.message}>
          <input id="name" autoComplete="name" className={inputClass} {...register('name')} />
        </Field>

        <Field label={t('mobile')} htmlFor="mobile" hint={t('mobileHint')} error={errors.mobile?.message}>
          <input
            id="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={inputClass}
            {...register('mobile')}
          />
        </Field>

        <Field label={t('email')} htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>

        <Field label={t('password')} htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('password')}
          />
        </Field>

        <Field label={t('confirmPassword')} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('confirmPassword')}
          />
        </Field>

        <SubmitButton busy={isSubmitting} busyLabel={t('submitting')}>
          {t('submit')}
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase text-textSecondary">
        <span className="h-px flex-1 bg-border" />
        {t('or')}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label={t('google')} />

      <p className="text-center text-sm text-textSecondary">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-brand hover:text-accent">
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
