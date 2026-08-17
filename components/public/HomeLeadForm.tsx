'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { contactEnquirySchema } from '@/lib/validation/contact';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from '@/components/auth/hooks';
import { CheckIcon } from './icons';

type LeadValues = {
  name: string;
  mobile: string;
  email: string;
  interest: string;
  destination: string;
};

const leadSchema = contactEnquirySchema
  .pick({ name: true, mobile: true, email: true })
  .extend({
    interest: z.string().trim().min(2, 'required'),
    destination: z.string().trim().max(120, 'nameTooLong').optional().default(''),
  });

export default function HomeLeadForm() {
  const t = useTranslations('home.leadForm');
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const [done, setDone] = useState(false);
  const interests = t.raw('interests') as string[];
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadValues>({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      interest: interests[0] ?? '',
      destination: '',
    },
  });

  async function onSubmit(values: LeadValues) {
    setBanner(undefined);
    const data = parseForm(
      leadSchema,
      values,
      (n, m) => setError(n as keyof LeadValues, { message: m }),
      errText,
    );
    if (!data) return;

    const message = [
      'Homepage callback request',
      `Area of interest: ${data.interest}`,
      data.destination ? `Preferred destination: ${data.destination}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await apiPost('/api/contact', {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      message,
    });

    if (res.ok) {
      setDone(true);
      reset();
      return;
    }
    setBanner(errText(res.error));
  }

  if (done) {
    return (
      <div className="border-y border-green-400/40 bg-green-950/20 p-6 text-center">
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

      <Field label={t('name')} htmlFor="leadName" error={errors.name?.message}>
        <input id="leadName" autoComplete="name" className={inputClass} {...register('name')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('mobile')} htmlFor="leadMobile" error={errors.mobile?.message}>
          <input
            id="leadMobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className={inputClass}
            {...register('mobile')}
          />
        </Field>
        <Field label={t('email')} htmlFor="leadEmail" error={errors.email?.message}>
          <input
            id="leadEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>
      </div>

      <Field label={t('interest')} htmlFor="leadInterest" error={errors.interest?.message}>
        <select id="leadInterest" className={inputClass} {...register('interest')}>
          {interests.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('destination')} htmlFor="leadDestination" error={errors.destination?.message}>
        <input id="leadDestination" className={inputClass} {...register('destination')} />
      </Field>

      <SubmitButton busy={isSubmitting} busyLabel={t('sending')}>
        {t('submit')}
      </SubmitButton>

      <p className="text-xs leading-6 text-textSecondary">
        {t('consent')}{' '}
        <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
          {t('privacy')}
        </Link>
      </p>
    </form>
  );
}
