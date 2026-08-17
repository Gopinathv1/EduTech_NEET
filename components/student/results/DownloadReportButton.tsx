'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/** Triggers a download of the attempt's PDF report. */
export default function DownloadReportButton({ attemptId }: { attemptId: string }) {
  const t = useTranslations('results');
  const [busy, setBusy] = useState(false);

  function download() {
    setBusy(true);
    // The browser handles the file download from the attachment response; drop the
    // busy state shortly after so the button doesn't stay disabled.
    window.location.href = `/api/reports/${attemptId}/result-pdf`;
    setTimeout(() => setBusy(false), 4000);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M10 3v9m0 0 3-3m-3 3-3-3M4 15v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {busy ? t('downloading') : t('downloadReport')}
    </button>
  );
}
