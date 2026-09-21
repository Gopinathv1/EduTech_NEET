'use client';
import { useState } from 'react';
import { apiPatch } from '@/lib/client/api';

export default function ContactStatusSelect({ id, initial }: { id: string; initial: 'NEW' | 'RESPONDED' | 'CLOSED' }) {
  const [status, setStatus] = useState(initial);
  async function update(value: 'NEW' | 'RESPONDED' | 'CLOSED') {
    const result = await apiPatch(`/api/admin/contact-enquiries/${id}/status`, { status: value });
    if (result.ok) setStatus(value);
  }
  return <select value={status} onChange={(e) => update(e.target.value as typeof status)} className="rounded-md border border-border bg-white px-2 py-1 text-xs text-textPrimary"><option>NEW</option><option>RESPONDED</option><option>CLOSED</option></select>;
}
