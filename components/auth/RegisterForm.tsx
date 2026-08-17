'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { locales, localeNames } from '@/i18n/config';
import {
  STATES,
  DEFAULT_STATE,
  districtsForState,
  CLASS_OPTIONS,
  BOARD_OPTIONS,
} from '@/lib/data/locations';
import { registerSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm, applyServerFieldErrors } from '@/lib/client/forms';
import { Field, inputClass, selectClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';
import OtpStep from './OtpStep';

type FormValues = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  state: string;
  district: string;
  schoolName: string;
  class: string;
  board: string;
  preferredLanguage: string;
};

export default function RegisterForm() {
  const t = useTranslations('auth.register');
  const tOpt = useTranslations('auth.options');
  const errText = useErrorText();
  const locale = useLocale();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [mobile, setMobile] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [banner, setBanner] = useState<string>();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      state: DEFAULT_STATE,
      district: '',
      schoolName: '',
      class: '12',
      board: 'State Board',
      preferredLanguage: locale,
    },
  });

  const districts = districtsForState(watch('state'));
  const setFieldError = (name: string, message: string) =>
    setError(name as keyof FormValues, { message });

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    const data = parseForm(registerSchema, values, setFieldError, errText);
    if (!data) return;

    const res = await apiPost('/api/auth/register', data);
    if (res.ok) {
      setMobile(data.mobile);
      setDevOtp(typeof res.devOtp === 'string' ? res.devOtp : undefined);
      setStep('otp');
      return;
    }
    if (res.error === 'validation') {
      applyServerFieldErrors(res.fields as Record<string, string[]>, setFieldError, errText);
    } else {
      setBanner(errText(res.error));
    }
  }

  if (step === 'otp') {
    return (
      <OtpStep
        mobile={mobile}
        purpose="REGISTRATION"
        initialDevOtp={devOtp}
        onBack={() => setStep('form')}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      {banner ? <Banner kind="error">{banner}</Banner> : null}

      <Field label={t('name')} htmlFor="name" error={errors.name?.message}>
        <input id="name" autoComplete="name" className={inputClass} {...register('name')} />
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

      <Field
        label={t('mobile')}
        htmlFor="mobile"
        hint={t('mobileHint')}
        error={errors.mobile?.message}
      >
        <input
          id="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={inputClass}
          {...register('mobile')}
        />
      </Field>

      <Field
        label={t('password')}
        htmlFor="password"
        hint={t('passwordHint')}
        error={errors.password?.message}
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register('password')}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('state')} htmlFor="state" error={errors.state?.message}>
          <select id="state" className={selectClass} {...register('state')}>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('district')} htmlFor="district" error={errors.district?.message}>
          <select id="district" className={selectClass} {...register('district')}>
            <option value="">—</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('school')} htmlFor="schoolName" error={errors.schoolName?.message}>
        <input id="schoolName" className={inputClass} {...register('schoolName')} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('class')} htmlFor="class" error={errors.class?.message}>
          <select id="class" className={selectClass} {...register('class')}>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {tOpt(`class.${c}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('board')} htmlFor="board" error={errors.board?.message}>
          <select id="board" className={selectClass} {...register('board')}>
            {BOARD_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {tOpt(`board.${b}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={t('language')}
        htmlFor="preferredLanguage"
        error={errors.preferredLanguage?.message}
      >
        <select
          id="preferredLanguage"
          className={selectClass}
          {...register('preferredLanguage')}
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {localeNames[code]}
            </option>
          ))}
        </select>
      </Field>

      <SubmitButton busy={isSubmitting} busyLabel={t('submitting')}>
        {t('submit')}
      </SubmitButton>

      <p className="text-center text-sm text-slate-600">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          {t('login')}
        </Link>
      </p>
    </form>
  );
}
