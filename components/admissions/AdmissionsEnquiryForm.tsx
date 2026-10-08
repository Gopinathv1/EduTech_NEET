'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiPost } from '@/lib/client/api';
import { admissionsEnquirySchema, ADMISSION_STUDY_PATHS, ADMISSION_CONTACT_PREFERENCES } from '@/lib/validation/admissions-enquiry';
import { ADMISSION_COUNTRIES } from '@/lib/data/admissions/countries';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';

type Values = { name: string; mobile: string; email: string; studyPath: string; destination: string; programme: string; contactPreference: string; consent: boolean };
export default function AdmissionsEnquiryForm({ destination = '', programme = '' }: { destination?: string; programme?: string }) {
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Values>({ defaultValues: { name: '', mobile: '', email: '', studyPath: 'Other / undecided', destination, programme, contactPreference: 'Email', consent: false } });
  async function submit(values: Values) {
    setError('');
    const parsed = admissionsEnquirySchema.safeParse(values);
    if (!parsed.success) { setError('Please check your name, Indian mobile number, email and contact consent.'); return; }
    const result = await apiPost('/api/admission/enquiries', parsed.data);
    if (result.ok && typeof result.reference === 'string') { setReference(result.reference); return; }
    setError(result.error === 'rateLimited' ? 'Too many requests. Please wait ten minutes and try again.' : 'We could not save your enquiry. Please try again.');
  }
  if (reference) return <div role="status" className="rounded-md border border-green-600 p-6"><h3 className="text-xl font-semibold">Enquiry received</h3><p className="mt-3">Your reference: {reference}. Keep this reference for follow-up. Our team will review your enquiry using your preferred contact method.</p><p className="mt-3">This is a counselling request, not a university application or admission offer.</p><Link href="/contact" className="mt-4 inline-block underline">Contact SIVORA</Link></div>;
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" aria-label="Admissions counselling enquiry">
    {error ? <Banner kind="error">{error}</Banner> : null}
    <Field label="Student name" htmlFor="admissions-name"><input id="admissions-name" required minLength={2} maxLength={80} autoComplete="name" className={inputClass} {...register('name')} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Indian mobile number" htmlFor="admissions-mobile"><input id="admissions-mobile" required type="tel" autoComplete="tel" className={inputClass} {...register('mobile')} /></Field>
      <Field label="Email" htmlFor="admissions-email"><input id="admissions-email" required type="email" autoComplete="email" className={inputClass} {...register('email')} /></Field>
    </div>
    <Field label="Study path" htmlFor="admissions-path"><select id="admissions-path" className={inputClass} {...register('studyPath')}>{ADMISSION_STUDY_PATHS.map((path) => <option key={path}>{path}</option>)}</select></Field>
    <Field label="Preferred destination" htmlFor="admissions-destination"><select id="admissions-destination" className={inputClass} {...register('destination')}><option value="">Undecided</option>{ADMISSION_COUNTRIES.map((country) => <option key={country.slug} value={country.slug}>{country.name}</option>)}<option value="other">Other destination</option></select></Field>
    <Field label="Programme or university (optional)" htmlFor="admissions-programme"><input id="admissions-programme" maxLength={120} className={inputClass} {...register('programme')} /></Field>
    <Field label="Preferred contact method" htmlFor="admissions-contact"><select id="admissions-contact" className={inputClass} {...register('contactPreference')}>{ADMISSION_CONTACT_PREFERENCES.map((preference) => <option key={preference}>{preference}</option>)}</select></Field>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0" {...register('consent')} /><span>I agree that SIVORA may contact me about this enquiry using my preferred method. <Link href="/privacy" className="underline">Privacy policy</Link></span></label>
    <SubmitButton busy={isSubmitting} busyLabel="Saving enquiry…">Request counselling</SubmitButton>
    <p className="text-xs leading-6">Submitting saves your enquiry. It does not send a WhatsApp message or guarantee admission, visa approval or medical registration.</p>
  </form>;
}
