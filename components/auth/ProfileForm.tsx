'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { CLASS_OPTIONS, BOARD_OPTIONS } from '@/lib/data/locations';
import { profileUpdateSchema } from '@/lib/validation/auth';
import { apiPatch } from '@/lib/client/api';
import { parseForm } from '@/lib/client/forms';
import { Field, inputClass, selectClass, Banner, SubmitButton } from '@/components/ui/Form';
import { useErrorText } from './hooks';

type ProfileValues = {
  name: string;
  schoolName: string;
  class: string;
  board: string;
  preferredLanguage: string;
};

export default function ProfileForm({ initial }: { initial: ProfileValues }) {
  const t = useTranslations('auth.profile');
  const tc = useTranslations('auth.common');
  const tOpt = useTranslations('auth.options');
  const errText = useErrorText();
  const locale = useLocale();

  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({ defaultValues: initial });

  async function onSubmit(values: ProfileValues) {
    setBanner(undefined);
    const data = parseForm(
      profileUpdateSchema,
      values,
      (n, m) => setError(n as keyof ProfileValues, { message: m }),
      errText,
    );
    if (!data) return;
    const res = await apiPatch('/api/auth/profile', data);
    if (res.ok) {
      // If the UI language changed, reload so server components re-render in it.
      if (res.locale && res.locale !== locale) {
        window.location.reload();
        return;
      }
      setBanner({ kind: 'success', text: t('success') });
      return;
    }
    setBanner({ kind: 'error', text: errText(res.error) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {banner ? <Banner kind={banner.kind}>{banner.text}</Banner> : null}

      <Field label={t('name')} htmlFor="pName" error={errors.name?.message}>
        <input id="pName" autoComplete="name" className={inputClass} {...register('name')} />
      </Field>

      <Field label={t('school')} htmlFor="pSchool" error={errors.schoolName?.message}>
        <input id="pSchool" className={inputClass} {...register('schoolName')} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('class')} htmlFor="pClass" error={errors.class?.message}>
          <select id="pClass" className={selectClass} {...register('class')}>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {tOpt(`class.${c}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('board')} htmlFor="pBoard" error={errors.board?.message}>
          <select id="pBoard" className={selectClass} {...register('board')}>
            {BOARD_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {tOpt(`board.${b}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('language')} htmlFor="pLang" error={errors.preferredLanguage?.message}>
        <select id="pLang" className={selectClass} {...register('preferredLanguage')}>
          {locales.map((code) => (
            <option key={code} value={code}>
              {localeNames[code]}
            </option>
          ))}
        </select>
      </Field>

      <p className="text-xs text-textSecondary">{t('readonlyNote')}</p>

      <SubmitButton busy={isSubmitting} busyLabel={tc('saving')}>
        {t('save')}
      </SubmitButton>
    </form>
  );
}
