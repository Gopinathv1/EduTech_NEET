'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { partnerProfileSchema, type PartnerProfileInput } from '@/lib/validation/partner';
import { apiPatch } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';

export default function PartnerProfileForm({ defaultValues }: { defaultValues: PartnerProfileInput }) {
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartnerProfileInput>({ defaultValues });

  async function onSubmit(values: PartnerProfileInput) {
    setBanner(undefined);
    const data = parseForm(partnerProfileSchema, values, (n, m) => setError(n as keyof PartnerProfileInput, { message: m }), partnerErrorText);
    if (!data) return;
    const res = await apiPatch('/api/partner/profile', data);
    setBanner(res.ok ? { kind: 'success', text: 'Agency profile updated.' } : { kind: 'error', text: partnerErrorText(res.error) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {banner ? <Banner kind={banner.kind}>{banner.text}</Banner> : null}
      <Field label="Contact person" htmlFor="contactPerson" error={errors.contactPerson?.message}>
        <input id="contactPerson" className={inputClass} {...register('contactPerson')} />
      </Field>
      <Field label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
        <input id="mobile" inputMode="tel" className={inputClass} {...register('mobile')} />
      </Field>
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
      <Field label="Website" htmlFor="website" error={errors.website?.message}>
        <input id="website" type="url" className={inputClass} {...register('website')} />
      </Field>
      <SubmitButton busy={isSubmitting} busyLabel="Saving...">Save profile</SubmitButton>
    </form>
  );
}

function partnerErrorText(code?: string) {
  const errors: Record<string, string> = {
    generic: 'Something went wrong. Please try again.',
    validation: 'Please check the highlighted fields.',
    required: 'This field is required.',
    nameTooLong: 'This value is too long.',
    mobileInvalid: 'Enter a valid 10-digit Indian mobile number.',
    urlInvalid: 'Enter a valid website URL.',
    unauthorized: 'Please login again.',
    network: 'Network error. Please check your connection.',
  };
  return errors[code || 'generic'] ?? errors.generic;
}
