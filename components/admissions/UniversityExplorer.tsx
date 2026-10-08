'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AdmissionUniversity } from '@/lib/data/admissions/universities';

export default function UniversityExplorer({ universities }: { universities: AdmissionUniversity[] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState('name');
  const visible = universities.filter((item) => `${item.name} ${item.countryName} ${item.city ?? ''} ${item.programme?.title ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'country' ? a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
  const compared = universities.filter((item) => selected.includes(item.id));
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current); }
  return <div className="space-y-6 text-[#344253]">
    <p className="text-sm leading-7">These are institution leads for research, not endorsements or confirmed admission availability. Confirm the exact degree, campus, internship, teaching and clinical languages, eligibility and current intake directly. An official identity source does not establish accreditation or eligibility to practise in India.</p>
    <div className="flex flex-wrap gap-4"><label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Search universities or programmes<input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 rounded-md border border-[#b9c4d0] bg-white px-3" /></label><label className="flex flex-col gap-2 text-sm">Sort universities<select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 rounded-md border border-[#b9c4d0] bg-white px-3"><option value="name">Name A–Z</option><option value="country">Country</option></select></label></div>
    <p role="status" className="text-sm">{visible.length} universities found. {selected.length}/3 selected for comparison.</p>
    {compared.length ? <section aria-label="University programme comparison" className="rounded-md border border-[#b9c4d0] bg-white p-4">
      <h3 className="text-xl font-semibold">Compare university programmes</h3><p className="my-3 text-sm">Select two or three institutions. Missing figures are not estimates.</p>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable university comparison"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">Selected institution and programme details</caption><thead><tr><th scope="col" className="p-3">Detail</th>{compared.map((item) => <th scope="col" className="p-3" key={item.id}>{item.name}<button onClick={() => toggle(item.id)} className="mt-2 block underline" aria-label={`Remove ${item.name}`}>Remove</button></th>)}</tr></thead><tbody>
      {['Country', 'City', 'Programme', 'Duration', 'Teaching language', 'Annual tuition', 'Living costs', 'Eligibility / intake / deadlines'].map((label) => <tr key={label} className="border-t border-[#dce0e2]"><th scope="row" className="p-3">{label}</th>{compared.map((item) => <td className="p-3 align-top" key={item.id}>{label === 'Country' ? item.countryName : label === 'City' ? item.city ?? 'Confirm with university' : label === 'Programme' ? item.programme?.title ?? 'Confirm with university' : label === 'Duration' ? item.programme?.duration ?? 'Confirm with university' : label === 'Teaching language' ? item.programme?.language ?? 'Confirm with university' : 'Confirm with university'}</td>)}</tr>)}
      </tbody></table></div>
    </section> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <article key={item.id} className="flex flex-col rounded-md border border-[#dce0e2] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider">{item.city ? `${item.city}, ` : ''}{item.countryName}</p><h3 className="mt-3 text-lg font-semibold">{item.name}</h3>
      <p className="mt-3 text-sm">{item.programme?.title ?? 'Programme details: confirm with university'}</p>
      <p className="mt-3 text-sm">{item.sourceUrl ? `Institution identity source reviewed ${item.reviewedAt}. Current fees and admission conditions require confirmation.` : 'Institution identity and current admissions information require review. Confirm with university.'}</p>
      {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 text-sm underline">Institution identity source</a> : null}
      {item.reviewNote ? <p className="mt-3 text-sm">{item.reviewNote}</p> : null}
      {item.programme ? <a href={item.programme.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 text-sm underline">Published programme information (reviewed {item.programme.reviewedAt}; confirm current intake)</a> : null}
      <div className="mt-auto flex flex-wrap gap-3 pt-5"><button type="button" aria-pressed={selected.includes(item.id)} disabled={!selected.includes(item.id) && selected.length >= 3} onClick={() => toggle(item.id)} className="min-h-11 rounded-md border border-[#344253] px-3 text-sm disabled:opacity-50">{selected.includes(item.id) ? 'Remove from comparison' : 'Compare programme'}</button><Link href={`/admissions/${item.countrySlug}?university=${encodeURIComponent(item.id)}#enquiry`} className="py-3 text-sm underline">Ask about this institution</Link></div>
    </article>)}</div>
    {!visible.length ? <p className="rounded-md border border-[#b9c4d0] p-5">No matching universities. Clear the search or ask SIVORA about other study paths.</p> : null}
    <Link href="/admissions#enquiry" className="inline-block underline">Explore engineering, other undergraduate and postgraduate study options</Link>
  </div>;
}
