'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { admissionLeadSchema } from '@/lib/validation/admission';
import { LEAD_CATEGORIES, BUDGET_RANGES } from '@/lib/admission/config';
import { apiPost } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, selectClass, Banner } from '@/components/ui/Form';
import { useErrorText } from '@/components/auth/hooks';
import { CheckIcon } from '@/components/public/icons';

export type LeadFormCountry = { id: string; name: string; flag: string };

type FormValues = {
  neetScore: string;
  marks: string;
  category: string;
  budget: string;
  parentContact: string;
  consent: boolean;
};

export default function AdmissionLeadForm({
  countries,
  defaults,
}: {
  countries: LeadFormCountry[];
  defaults: { neetScore?: number };
}) {
  const t = useTranslations('consultancy');
  const errText = useErrorText();
  const [selected, setSelected] = useState<string[]>([]);
  const [countryError, setCountryError] = useState<string>();
  const [banner, setBanner] = useState<string>();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      neetScore: defaults.neetScore != null ? String(defaults.neetScore) : '',
      marks: '',
      category: '',
      budget: '',
      parentContact: '',
      consent: false,
    },
  });

  function toggleCountry(id: string) {
    setCountryError(undefined);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(values: FormValues) {
    setBanner(undefined);
    setCountryError(undefined);
    const payload = {
      neetScore: values.neetScore,
      marks: values.marks,
      category: values.category,
      budget: values.budget,
      parentContact: values.parentContact,
      consent: values.consent,
      interestedCountryIds: selected,
    };
    const data = parseForm(
      admissionLeadSchema,
      payload,
      (name, message) => {
        if (name === 'interestedCountryIds') setCountryError(message);
        else setError(name as keyof FormValues, { message });
      },
      errText,
    );
    if (!data) return;

    const res = await apiPost('/api/admission/leads', data);
    if (res.ok) {
      setDone(true);
      return;
    }
    setBanner(errText(res.error));
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-lg font-semibold text-slate-900">{t('success.title')}</h3>
        <p className="mt-1 text-sm text-slate-600">{t('success.body')}</p>
        <Link
          href="/student/admission-guidance"
          className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t('success.viewStatus')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t('form.heading')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('form.subtitle')}</p>
      </div>

      {banner ? <Banner kind="error">{banner}</Banner> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={`${t('form.neetScore')} (${t('form.optional')})`}
          htmlFor="neetScore"
          error={errors.neetScore?.message}
          hint={t('form.neetScoreHint')}
        >
          <input id="neetScore" type="number" inputMode="numeric" min={0} max={720} className={inputClass} {...register('neetScore')} />
        </Field>
        <Field label={`${t('form.marks')} (${t('form.optional')})`} htmlFor="marks" error={errors.marks?.message}>
          <input id="marks" type="number" inputMode="numeric" min={0} max={720} className={inputClass} {...register('marks')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.category')} htmlFor="category" error={errors.category?.message}>
          <select id="category" className={selectClass} defaultValue="" {...register('category')}>
            <option value="" disabled>
              {t('form.selectPlaceholder')}
            </option>
            {LEAD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.budget')} htmlFor="budget" error={errors.budget?.message}>
          <select id="budget" className={selectClass} defaultValue="" {...register('budget')}>
            <option value="" disabled>
              {t('form.selectPlaceholder')}
            </option>
            {BUDGET_RANGES.map((code) => (
              <option key={code} value={code}>
                {t(`budgets.${code}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Interested countries (multi-select) */}
      <div>
        <p className="block text-sm font-medium text-slate-700">{t('form.countries')}</p>
        <p className="text-xs text-slate-500">{t('form.countriesHint')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {countries.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCountry(c.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand'
                }`}
              >
                <span aria-hidden="true">{c.flag}</span>
                {c.name}
                {active ? <CheckIcon className="h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
        {countryError ? (
          <p className="mt-1 text-xs font-medium text-red-600" role="alert">
            {countryError}
          </p>
        ) : null}
      </div>

      <Field label={t('form.parentContact')} htmlFor="parentContact" error={errors.parentContact?.message}>
        <input id="parentContact" type="tel" inputMode="numeric" autoComplete="tel" className={inputClass} {...register('parentContact')} />
      </Field>

      {/* Consent */}
      <div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand" {...register('consent')} />
          <span className="text-sm text-slate-700">{t('form.consent')}</span>
        </label>
        {errors.consent?.message ? (
          <p className="mt-1 text-xs font-medium text-red-600" role="alert">
            {errors.consent.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isSubmitting ? t('form.submitting') : t('form.submit')}
      </button>
    </form>
  );
}
