'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/client/api';

type Status = 'NEW' | 'RESPONDED' | 'CLOSED';
export default function ContactStatusSelect({ id, initial }: { id: string; initial: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function update(value: Status) {
    setSaving(true); setError('');
    const result = await apiPatch(`/api/admin/contact-enquiries/${id}/status`, { status: value });
    if (result.ok) { setStatus(value); router.refresh(); }
    else setError('Status was not saved. Please try again.');
    setSaving(false);
  }
  return <div><select aria-label="Enquiry status" value={status} disabled={saving} onChange={(event) => update(event.target.value as Status)} className="min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm text-[#171717] disabled:opacity-60"><option>NEW</option><option>RESPONDED</option><option>CLOSED</option></select>{error ? <p role="alert" className="mt-2 text-xs text-red-300">{error}</p> : null}{saving ? <p role="status" className="mt-2 text-xs text-textSecondary">Saving status…</p> : null}</div>;
}
