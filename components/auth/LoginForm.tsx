'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { loginOtpRequestSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';
import OtpStep from './OtpStep';

export default function LoginForm() {
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
      loginOtpRequestSchema,
      values,
      (n, m) => setError(n as 'mobile', { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/auth/login', { mobile: data.mobile });
    if (res.ok) {
      setVerify({
        mobile: data.mobile,
        devOtp: typeof res.devOtp === 'string' ? res.devOtp : undefined,
      });
      return;
    }
    setBanner(errText(res.error));
  }

  if (verify) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
        </div>
        <OtpStep
          mobile={verify.mobile}
          purpose="LOGIN"
          initialDevOtp={verify.devOtp}
          onBack={() => setVerify(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
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
        <SubmitButton busy={isSubmitting} busyLabel={tc('sending')}>
          {t('requestOtp')}
        </SubmitButton>
      </form>

      <div className="space-y-2 border-t border-slate-100 pt-4 text-center text-sm">
        <p className="text-slate-600">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
            {t('register')}
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/admin/login" className="font-medium text-slate-500 hover:text-slate-700">
            {t('adminLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
