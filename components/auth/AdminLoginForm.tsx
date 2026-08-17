'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { adminLoginSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';

export default function AdminLoginForm() {
  const t = useTranslations('auth.adminLogin');
  const tc = useTranslations('auth.common');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: { email: string; password: string }) {
    setBanner(undefined);
    const data = parseForm(
      adminLoginSchema,
      values,
      (n, m) => setError(n as 'email' | 'password', { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/admin/login', data);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    setBanner(errText(res.error));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-textPrimary">{t('title')}</h1>
        <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>
      </div>

      {banner ? <Banner kind="error">{banner}</Banner> : null}

      <Field label={t('email')} htmlFor="adminEmail" error={errors.email?.message}>
        <input
          id="adminEmail"
          type="email"
          inputMode="email"
          autoComplete="username"
          className={inputClass}
          {...register('email')}
        />
      </Field>
      <Field label={t('password')} htmlFor="adminPassword" error={errors.password?.message}>
        <input
          id="adminPassword"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...register('password')}
        />
      </Field>
      <SubmitButton busy={isSubmitting} busyLabel={tc('loggingIn')}>
        {t('submit')}
      </SubmitButton>

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-textSecondary hover:text-textPrimary">
          {t('studentLogin')}
        </Link>
      </p>
    </form>
  );
}
