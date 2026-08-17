'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import type { AppSettings } from '@/lib/settings/config';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnPrimary } from '@/components/admin/ui';

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
];

export default function SystemConfig({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function toggleLang(code: string) {
    setV((p) => ({
      ...p,
      supportedLanguages: p.supportedLanguages.includes(code)
        ? p.supportedLanguages.filter((c) => c !== code)
        : [...p.supportedLanguages, code],
    }));
  }

  async function save() {
    if (v.supportedLanguages.length === 0) {
      setMsg({ kind: 'err', text: 'Select at least one language.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await apiPost('/api/admin/settings', {
      testPriceDefault: v.testPriceDefault,
      admissionScoreCutoff: v.admissionScoreCutoff,
      otpProvider: v.otpProvider,
      supportedLanguages: v.supportedLanguages,
      maintenanceMode: v.maintenanceMode,
    });
    setBusy(false);
    setMsg(res.ok ? { kind: 'ok', text: 'Settings saved.' } : { kind: 'err', text: 'Could not save settings.' });
    if (res.ok) router.refresh();
  }

  const numCls = `${inputClass} !mt-1 text-sm`;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Default test price (₹)
            <input
              type="number"
              min={0}
              className={numCls}
              value={v.testPriceDefault}
              onChange={(e) => setV({ ...v, testPriceDefault: Number(e.target.value) })}
            />
            <span className="mt-1 block text-xs text-slate-400">Pre-filled when creating a new test.</span>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Consultancy score cutoff
            <input
              type="number"
              min={0}
              max={720}
              className={numCls}
              value={v.admissionScoreCutoff}
              onChange={(e) => setV({ ...v, admissionScoreCutoff: Number(e.target.value) })}
            />
            <span className="mt-1 block text-xs text-slate-400">Full-test score below which the study-abroad banner shows.</span>
          </label>
          <label className="text-sm font-medium text-slate-700">
            OTP provider
            <select className={`${selectClass} !mt-1 text-sm`} value={v.otpProvider} onChange={(e) => setV({ ...v, otpProvider: e.target.value as AppSettings['otpProvider'] })}>
              <option value="console">Console (dev)</option>
              <option value="msg91">MSG91 (production)</option>
            </select>
          </label>
          <div className="text-sm font-medium text-slate-700">
            Supported languages
            <div className="mt-2 flex gap-4">
              {LANG_OPTIONS.map((l) => (
                <label key={l.code} className="flex items-center gap-2 text-sm font-normal text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand" checked={v.supportedLanguages.includes(l.code)} onChange={() => toggleLang(l.code)} />
                  {l.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand" checked={v.maintenanceMode} onChange={(e) => setV({ ...v, maintenanceMode: e.target.checked })} />
          <span>
            <span className="block text-sm font-medium text-slate-800">Maintenance mode</span>
            <span className="block text-xs text-slate-500">When on, students see a maintenance screen. Admins are unaffected.</span>
          </span>
        </label>

        {msg ? (
          <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>
        ) : null}

        <button type="button" className={`${btnPrimary} mt-4`} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
