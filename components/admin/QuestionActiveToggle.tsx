'use client';

import { useState } from 'react';
import { apiPatch } from '@/lib/client/api';

/** Optimistic active/inactive switch for a question row. */
export default function QuestionActiveToggle({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setBusy(true);
    setOn(next); // optimistic
    const res = await apiPatch(`/api/admin/questions/${id}/active`, { isActive: next });
    setBusy(false);
    if (!res.ok) setOn(!next); // revert on failure
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Active' : 'Inactive'}
      disabled={busy}
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
        on ? 'bg-brand' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-surfaceElevated shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
