'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { apiPost } from '@/lib/client/api';
import { admissionsEnquirySchema, ADMISSION_STUDY_PATHS, ADMISSION_CONTACT_PREFERENCES } from '@/lib/validation/admissions-enquiry';
import { ADMISSION_COUNTRIES } from '@/lib/data/admissions/countries';
import { ADMISSION_UNIVERSITIES } from '@/lib/data/admissions/universities';
import { Field, inputClass, Banner, SubmitButton } from '@/components/ui/Form';

type Values = { name: string; mobile: string; email: string; studyPath: string; destination: string; programme: string; contactPreference: string; consent: boolean };
export default function AdmissionsEnquiryForm({ destination = '', programme = '' }: { destination?: string; programme?: string }) {
  return <Suspense fallback={<p role="status">Loading university selection…</p>}><RouteEnquiryForm destination={destination} programme={programme} /></Suspense>;
}

function RouteEnquiryForm({ destination, programme }: { destination: string; programme: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ids = searchParams.getAll('university');
  const universityId = ids[0] ?? '';
  const university = ADMISSION_UNIVERSITIES.find((item) => item.id === universityId);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [navigating, setNavigating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const consistent = ids.length <= 1 && (!ids.length || (!!university && university.countrySlug === destination && pathname === `/admissions/${destination}`));
  useEffect(() => { setNavigating(false); }, [routeKey]);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    // A Link can be pending while the URL still names the previous university.
    // Block the old form from the initiating click until the route commits.
    function startNavigation(event: MouseEvent) {
      const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.origin === window.location.origin && target.pathname.startsWith('/admissions') && `${target.pathname}${target.search}` !== `${window.location.pathname}${window.location.search}`) setNavigating(true);
    }
    document.addEventListener('click', startNavigation, true);
    return () => document.removeEventListener('click', startNavigation, true);
  }, []);
  // React Hook Form defaults are mount-only. A new identity starts a fresh
  // enquiry, including fresh consent and success/duplicate-submission state.
  return <EnquiryFields key={`${destination}:${universityId}`} destination={destination} programme={university?.name ?? programme} universityId={universityId} blocked={!hydrated || !consistent || navigating} routeKey={routeKey} />;
}

function EnquiryFields({ destination, programme, universityId, blocked, routeKey }: { destination: string; programme: string; universityId: string; blocked: boolean; routeKey: string }) {
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Values>({ defaultValues: { name: '', mobile: '', email: '', studyPath: 'Other / undecided', destination, programme, contactPreference: 'Email', consent: false } });
  async function submit(values: Values) {
    setError('');
    const current = new URL(window.location.href);
    if (blocked || `${current.pathname}?${current.searchParams.toString()}` !== routeKey) { setError('University selection is changing or inconsistent. Please select the university again.'); return; }
    if (submitting.current) return;
    const parsed = admissionsEnquirySchema.safeParse({ ...values, universityId });
    if (!parsed.success) { setError(parsed.error.issues.some((issue) => issue.path[0] === 'universityId') ? 'University selection is inconsistent. Please select the university again.' : 'Please check your name, Indian mobile number, email and contact consent.'); return; }
    submitting.current = true;
    const result = await apiPost('/api/admission/enquiries', parsed.data);
    submitting.current = false;
    if (`${window.location.pathname}?${new URL(window.location.href).searchParams.toString()}` !== routeKey) return;
    if (result.ok && typeof result.reference === 'string') { setReference(result.reference); return; }
    setError(result.error === 'rateLimited' ? 'Too many requests. Please wait ten minutes and try again.' : result.error === 'validation' ? 'Please check your details and select the university again.' : 'We could not save your enquiry. Please try again.');
  }
  if (reference) return <div role="status" className="rounded-md border border-green-600 p-6"><h3 className="text-xl font-semibold">Enquiry received</h3><p className="mt-3">Your reference: {reference}. Keep this reference for follow-up. Our team will review your enquiry using your preferred contact method.</p><p className="mt-3">This is a counselling request, not a university application or admission offer.</p><Link href="/contact" className="mt-4 inline-block underline">Contact SIVORA</Link></div>;
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" aria-label="Admissions counselling enquiry">
    <input type="hidden" name="universityId" value={universityId} />
    {blocked ? <Banner kind="error">University selection is changing or inconsistent. Please select the university again.</Banner> : null}
    {error ? <Banner kind="error">{error}</Banner> : null}
    <Field label="Student name" htmlFor="admissions-name"><input id="admissions-name" required minLength={2} maxLength={80} autoComplete="name" className={inputClass} {...register('name')} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Indian mobile number" htmlFor="admissions-mobile"><input id="admissions-mobile" required type="tel" autoComplete="tel" className={inputClass} {...register('mobile')} /></Field>
      <Field label="Email" htmlFor="admissions-email"><input id="admissions-email" required type="email" autoComplete="email" className={inputClass} {...register('email')} /></Field>
    </div>
    <Field label="Study path" htmlFor="admissions-path"><select id="admissions-path" className={inputClass} {...register('studyPath')}>{ADMISSION_STUDY_PATHS.map((path) => <option key={path}>{path}</option>)}</select></Field>
    <Field label="Preferred destination" htmlFor="admissions-destination"><select id="admissions-destination" className={inputClass} {...register('destination')} {...(universityId ? { value: destination, onChange: () => {} } : {})}><option value="">Undecided</option>{ADMISSION_COUNTRIES.map((country) => <option key={country.slug} value={country.slug}>{country.name}</option>)}<option value="other">Other destination</option></select></Field>
    <Field label="Programme or university (optional)" htmlFor="admissions-programme"><input id="admissions-programme" readOnly={!!universityId} maxLength={120} className={inputClass} {...register('programme')} /></Field>
    <Field label="Preferred contact method" htmlFor="admissions-contact"><select id="admissions-contact" className={inputClass} {...register('contactPreference')}>{ADMISSION_CONTACT_PREFERENCES.map((preference) => <option key={preference}>{preference}</option>)}</select></Field>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0" {...register('consent')} /><span>I agree that SIVORA may contact me about this enquiry using my preferred method. <Link href="/privacy" className="underline">Privacy policy</Link></span></label>
    <SubmitButton busy={isSubmitting || blocked} busyLabel={blocked ? 'Select university again' : 'Saving enquiry…'}>Request counselling</SubmitButton>
    <p className="text-xs leading-6">Submitting saves your enquiry. It does not send a WhatsApp message or guarantee admission, visa approval or medical registration.</p>
  </form>;
}
