'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { partnerRegisterSchema, type PartnerRegisterInput } from '@/lib/validation/partner';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';

type FormValues = PartnerRegisterInput;

export default function PartnerRegisterForm() {
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      agencyName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      city: '',
      state: '',
      country: 'India',
      website: '',
      registrationNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    const data = parseForm(partnerRegisterSchema, values, (n, m) => setError(n as keyof FormValues, { message: m }), partnerErrorText);
    if (!data) return;
    const res = await apiPost('/api/partner/register', data);
    if (res.ok) {
      setBanner({
        kind: 'success',
        text: `Application submitted. Partner ID: ${String(res.partnerCode ?? '')}. SIVORA UPRISING will review and activate login after approval.`,
      });
      return;
    }
    setBanner({ kind: 'error', text: partnerErrorText(res.error) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-textPrimary">Become a SIVORA UPRISING Partner</h1>
        <p className="mt-1 text-sm text-textSecondary">Submit your agency details for admin review.</p>
      </div>

      {banner ? <Banner kind={banner.kind}>{banner.text}</Banner> : null}

      <Field label="Agency name" htmlFor="agencyName" error={errors.agencyName?.message}>
        <input id="agencyName" className={inputClass} {...register('agencyName')} />
      </Field>
      <Field label="Contact person" htmlFor="contactPerson" error={errors.contactPerson?.message}>
        <input id="contactPerson" className={inputClass} {...register('contactPerson')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
          <input id="mobile" inputMode="tel" autoComplete="tel" className={inputClass} {...register('mobile')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <input id="city" className={inputClass} {...register('city')} />
        </Field>
        <Field label="State" htmlFor="state" error={errors.state?.message}>
          <input id="state" className={inputClass} {...register('state')} />
        </Field>
      </div>
      <Field label="Country" htmlFor="country" error={errors.country?.message}>
        <input id="country" className={inputClass} {...register('country')} />
      </Field>
      <Field label="Website (optional)" htmlFor="website" error={errors.website?.message}>
        <input id="website" type="url" className={inputClass} placeholder="https://example.com" {...register('website')} />
      </Field>
      <Field label="Business registration number (optional)" htmlFor="registrationNumber" error={errors.registrationNumber?.message}>
        <input id="registrationNumber" className={inputClass} {...register('registrationNumber')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="new-password" className={inputClass} {...register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <input id="confirmPassword" type="password" autoComplete="new-password" className={inputClass} {...register('confirmPassword')} />
        </Field>
      </div>

      <SubmitButton busy={isSubmitting} busyLabel="Submitting...">Submit application</SubmitButton>

      <p className="text-center text-sm text-textSecondary">
        Already approved?{' '}
        <Link href="/partner/login" className="font-medium text-accent hover:text-white">
          Partner login
        </Link>
      </p>
    </form>
  );
}

function partnerErrorText(code?: string) {
  const errors: Record<string, string> = {
    generic: 'Something went wrong. Please try again.',
    validation: 'Please check the highlighted fields.',
    required: 'This field is required.',
    nameTooLong: 'This value is too long.',
    emailInvalid: 'Enter a valid email address.',
    mobileInvalid: 'Enter a valid 10-digit Indian mobile number.',
    urlInvalid: 'Enter a valid website URL.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordTooLong: 'Password is too long.',
    passwordMismatch: 'Passwords do not match.',
    rateLimited: 'Too many attempts. Please wait a few minutes.',
    emailTaken: 'This email is already used by another partner application.',
    conflict: 'These partner details are already in use.',
    network: 'Network error. Please check your connection.',
  };
  return errors[code || 'generic'] ?? errors.generic;
}
