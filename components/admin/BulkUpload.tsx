'use client';

import { useState, type ChangeEvent } from 'react';
import { apiPost } from '@/lib/client/api';
import { csvTemplate, BULK_COLUMNS } from '@/lib/admin/bulk-columns';
import { btnPrimary, btnSecondary, Badge } from '@/components/admin/ui';
import { DownloadIcon, UploadIcon } from '@/components/admin/icons';

type RowResult = { line: number; status: 'valid' | 'error' | 'committed'; errors: string[]; preview: string };
type Summary = { total: number; valid: number; errors: number; committed?: number };

export default function BulkUpload() {
  const [csv, setCsv] = useState('');
  const [filename, setFilename] = useState('');
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [committed, setCommitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  function downloadTemplate() {
    const blob = new Blob([csvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neet-questions-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    setResults(null);
    setSummary(null);
    setCommitted(false);
    setFilename(file.name);
    setCsv(await file.text());
    e.target.value = '';
  }

  async function run(commit: boolean) {
    if (!csv) {
      setError('Choose a CSV file first.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const res = await apiPost('/api/admin/questions/bulk', { csv, commit });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === 'badHeaders'
          ? 'The CSV headers do not match the template. Download the template and try again.'
          : res.error === 'emptyCsv'
            ? 'The file has no data rows.'
            : 'Could not process the file.',
      );
      return;
    }
    setResults(res.results as RowResult[]);
    setSummary(res.summary as Summary);
    setCommitted(Boolean(res.committed));
  }

  const canImport = !committed && (summary?.valid ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">1. Download the template</h2>
        <p className="mt-1 text-sm text-slate-600">
          Fill one question per row. Bulk import supports single-correct text questions. Reference a
          chapter by its subject code and English chapter name.
        </p>
        <button type="button" className={`${btnSecondary} mt-3`} onClick={downloadTemplate}>
          <DownloadIcon className="h-4 w-4" />
          Download CSV template
        </button>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand">Column reference</summary>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
            {BULK_COLUMNS.map((c) => (
              <li key={c} className="font-mono">
                {c}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">2. Upload &amp; validate</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className={`${btnSecondary} cursor-pointer`}>
            <UploadIcon className="h-4 w-4" />
            {filename || 'Choose CSV file'}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
          <button type="button" className={btnSecondary} disabled={!csv || busy} onClick={() => run(false)}>
            {busy && !committed ? 'Validating…' : 'Validate'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {summary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {committed ? 'Import complete' : '3. Review report'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge color="slate">{summary.total} rows</Badge>
              <Badge color="green">{summary.valid} valid</Badge>
              <Badge color="red">{summary.errors} errors</Badge>
              {committed ? <Badge color="blue">{summary.committed} imported</Badge> : null}
            </div>
          </div>

          {canImport ? (
            <button type="button" className={`${btnPrimary} mt-4`} disabled={busy} onClick={() => run(true)}>
              {busy ? 'Importing…' : `Import ${summary.valid} valid row${summary.valid === 1 ? '' : 's'}`}
            </button>
          ) : null}
          {committed ? (
            <p className="mt-3 text-sm text-green-700">
              {summary.committed} question{summary.committed === 1 ? '' : 's'} imported. Rows with
              errors were skipped — fix and re-upload them separately.
            </p>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Preview / errors</th>
                </tr>
              </thead>
              <tbody>
                {results?.map((r) => (
                  <tr key={r.line} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-2 text-slate-500">{r.line}</td>
                    <td className="px-3 py-2">
                      {r.status === 'error' ? (
                        <Badge color="red">Error</Badge>
                      ) : r.status === 'committed' ? (
                        <Badge color="blue">Imported</Badge>
                      ) : (
                        <Badge color="green">Valid</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-slate-700">{r.preview}</p>
                      {r.errors.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc text-xs text-red-600">
                          {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
