'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { partnerLoginSchema, type PartnerLoginInput } from '@/lib/validation/partner';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';

export default function PartnerLoginForm() {
  const params = useSearchParams();
  const [banner, setBanner] = useState<string | undefined>(
    params.get('status') === 'not-approved' ? 'Your partner account is not approved or active yet.' : undefined,
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartnerLoginInput>({ defaultValues: { email: '', password: '' } });

  async function onSubmit(values: PartnerLoginInput) {
    setBanner(undefined);
    const data = parseForm(partnerLoginSchema, values, (n, m) => setError(n as keyof PartnerLoginInput, { message: m }), partnerErrorText);
    if (!data) return;
    const res = await apiPost('/api/partner/auth/login', data);
    if (res.ok && typeof res.redirect === 'string') {
      window.location.href = res.redirect;
      return;
    }
    if (typeof res.error === 'string' && res.error.startsWith('partnerStatus:')) {
      setBanner(`Your application status is ${res.error.replace('partnerStatus:', '').replaceAll('_', ' ')}. Portal access opens after approval.`);
      return;
    }
    setBanner(partnerErrorText(res.error));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-textPrimary">Partner Login</h1>
        <p className="mt-1 text-sm text-textSecondary">Approved SIVORA UP↑RISING agency partners only.</p>
      </div>

      {banner ? <Banner kind="error">{banner}</Banner> : null}

      <Field label="Email" htmlFor="partnerEmail" error={errors.email?.message}>
        <input id="partnerEmail" type="email" inputMode="email" autoComplete="username" className={inputClass} {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="partnerPassword" error={errors.password?.message}>
        <input id="partnerPassword" type="password" autoComplete="current-password" className={inputClass} {...register('password')} />
      </Field>

      <SubmitButton busy={isSubmitting} busyLabel="Logging in...">Login</SubmitButton>

      <p className="text-center text-sm text-textSecondary">
        Need agency approval?{' '}
        <Link href="/partner/register" className="font-medium text-accent hover:text-white">
          Become a partner
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
    emailInvalid: 'Enter a valid email address.',
    invalidCredentials: 'Incorrect partner login details.',
    accountInactive: 'This partner account is inactive. Contact SIVORA UP↑RISING.',
    rateLimited: 'Too many login attempts. Please wait a few minutes.',
    network: 'Network error. Please check your connection.',
  };
  return errors[code || 'generic'] ?? errors.generic;
}
