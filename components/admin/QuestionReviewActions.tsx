'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/admin/ui';

const actions = [
  { action: 'APPROVE', label: 'Approve', className: btnPrimary },
  { action: 'NEEDS_CORRECTION', label: 'Needs correction', className: btnSecondary },
  { action: 'REJECT', label: 'Reject', className: btnDanger },
] as const;

export default function QuestionReviewActions({ questionId, reviewState, reviewNote }: { questionId: string; reviewState: string; reviewNote: string }) {
  const router = useRouter();
  const [note, setNote] = useState(reviewNote);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(action: (typeof actions)[number]['action']) {
    setError(undefined);
    setBusy(action);
    const result = await apiPost(`/api/admin/questions/${questionId}/review`, { action, note });
    setBusy(undefined);
    if (!result.ok) {
      const details = Array.isArray(result.issues) ? result.issues.join(' ') : '';
      setError(details || (result.error === 'reviewNoteRequired' ? 'Add a review note before rejecting or requesting correction.' : 'Could not update review status.'));
      return;
    }
    router.refresh();
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-surface p-5" aria-labelledby="question-review-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="question-review-heading" className="font-semibold text-textPrimary">Editorial review</h2>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-textSecondary">{reviewState.replaceAll('_', ' ')}</span>
      </div>
      <label htmlFor="questionReviewNote" className="mt-4 block text-sm font-medium text-textSecondary">Review note</label>
      <textarea id="questionReviewNote" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textPrimary outline-none focus:border-brand focus:ring-2 focus:ring-brand/40" placeholder="Required for rejection or correction request" />
      {error ? <p className="mt-2 text-sm font-medium text-red-600" role="alert">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((item) => (
          <button key={item.action} type="button" className={item.className} disabled={busy !== undefined} onClick={() => submit(item.action)}>
            {busy === item.action ? 'Saving…' : item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
