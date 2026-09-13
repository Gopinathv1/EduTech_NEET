'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { completeProfileSchema } from '@/lib/validation/auth';
import { apiPost } from '@/lib/client/api';
import { parseForm, applyServerFieldErrors } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';

type FormValues = { mobile: string };

export default function CompleteProfileForm() {
  const errText = useErrorText();
  const [banner, setBanner] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { mobile: '' } });

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    const data = parseForm(
      completeProfileSchema,
      values,
      (name, message) => setError(name as keyof FormValues, { message }),
      errText,
    );
    if (!data) return;

    const res = await apiPost('/api/auth/complete-profile', data);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    if (res.error === 'validation') {
      applyServerFieldErrors(
        res.fields as Record<string, string[]>,
        (name, message) => setError(name as keyof FormValues, { message }),
        errText,
      );
    } else {
      setBanner(errText(res.error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-textPrimary">Complete your profile</h1>
        <p className="mt-1 text-sm text-textSecondary">
          We use your mobile number for counselling and admission-related contact.
        </p>
      </div>
      {banner ? <Banner kind="error">{banner}</Banner> : null}
      <Field label="Mobile number" htmlFor="completeMobile" error={errors.mobile?.message}>
        <input
          id="completeMobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={inputClass}
          {...register('mobile')}
        />
      </Field>
      <SubmitButton busy={isSubmitting} busyLabel="Saving...">
        Continue
      </SubmitButton>
    </form>
  );
}
