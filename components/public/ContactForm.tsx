'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { contactEnquirySchema } from '@/lib/validation/contact';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from '@/components/auth/hooks';
import { CheckIcon } from './icons';

type ContactValues = { name: string; mobile: string; email: string; message: string };

export default function ContactForm() {
  const t = useTranslations('contact.form');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    defaultValues: { name: '', mobile: '', email: '', message: '' },
  });

  async function onSubmit(values: ContactValues) {
    setBanner(undefined);
    const data = parseForm(
      contactEnquirySchema,
      values,
      (n, m) => setError(n as keyof ContactValues, { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPost('/api/contact', data);
    if (res.ok) {
      setDone(true);
      return;
    }
    setBanner(errText(res.error));
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-950/30 p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-950/40 text-green-200">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-lg font-semibold text-textPrimary">{t('successTitle')}</h3>
        <p className="mt-1 text-sm text-textSecondary">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {banner ? <Banner kind="error">{banner}</Banner> : null}

      <Field label={t('name')} htmlFor="cName" error={errors.name?.message}>
        <input id="cName" autoComplete="name" className={inputClass} {...register('name')} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('mobile')} htmlFor="cMobile" error={errors.mobile?.message}>
          <input
            id="cMobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={inputClass}
            {...register('mobile')}
          />
        </Field>
        <Field label={t('email')} htmlFor="cEmail" error={errors.email?.message}>
          <input
            id="cEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>
      </div>

      <Field label={t('message')} htmlFor="cMessage" error={errors.message?.message}>
        <textarea
          id="cMessage"
          rows={5}
          className={inputClass}
          {...register('message')}
        />
      </Field>

      <SubmitButton busy={isSubmitting} busyLabel={t('sending')}>
        {t('submit')}
      </SubmitButton>
    </form>
  );
}
