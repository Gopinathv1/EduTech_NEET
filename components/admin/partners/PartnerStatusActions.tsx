'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/admin/ui';

const actions = [
  { status: 'APPROVED', label: 'Approve', className: btnPrimary },
  { status: 'MORE_INFO_REQUIRED', label: 'Request More Info', className: btnSecondary },
  { status: 'REJECTED', label: 'Reject', className: btnDanger },
  { status: 'SUSPENDED', label: 'Suspend', className: btnDanger },
] as const;

export default function PartnerStatusActions({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(status: string) {
    setError(undefined);
    setBusy(status);
    const res = await apiPost(`/api/admin/partners/${agencyId}/status`, { status, note });
    setBusy(undefined);
    if (!res.ok) {
      setError('Could not update partner status.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label htmlFor="reviewNote" className="block text-sm font-medium text-textPrimary">
        Review note
      </label>
      <textarea
        id="reviewNote"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textPrimary outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        placeholder="Optional internal note or partner feedback"
      />
      {error ? <p className="text-sm font-medium text-red-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => submit(action.status)}
            disabled={busy !== undefined}
            className={action.className}
          >
            {busy === action.status ? 'Saving...' : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
