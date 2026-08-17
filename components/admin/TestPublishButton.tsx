'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import { btnSecondary } from '@/components/admin/ui';

/** Publish/unpublish a test. On a failed publish, shows the feasibility errors. */
export default function TestPublishButton({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<string[]>([]);

  async function toggle() {
    setBusy(true);
    setErrs([]);
    const res = await apiPost(`/api/admin/tests/${id}/publish`, { publish: !isPublished });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    if (res.error === 'notFeasible' && Array.isArray(res.errors)) setErrs(res.errors as string[]);
    else setErrs(['Could not update publish status.']);
  }

  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy} className={btnSecondary}>
        {busy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
      </button>
      {errs.length > 0 ? (
        <ul className="mt-1 max-w-[220px] list-inside list-disc text-xs text-red-600">
          {errs.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
