'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import { NOTIFICATION_TYPES, AUDIENCE_MODES, notificationStyle } from '@/lib/notifications/types';
import { CLASS_OPTIONS, BOARD_OPTIONS, TN_DISTRICTS } from '@/lib/data/locations';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnPrimary } from '@/components/admin/ui';

const TYPE_LABEL: Record<string, string> = {
  NEW_MOCK_TEST: 'New mock test',
  RESULT: 'Result',
  OFFER: 'Offer',
  COUNSELLING: 'Counselling',
  ADMISSION_ALERT: 'Admission alert',
  PAYMENT_CONFIRMATION: 'Payment',
};
const AUDIENCE_LABEL: Record<string, string> = {
  ALL: 'All students',
  CLASS: 'By class',
  DISTRICT: 'By district',
  BOARD: 'By board',
};

const empty = {
  type: 'OFFER',
  titleEn: '',
  titleTa: '',
  messageEn: '',
  messageTa: '',
  audienceMode: 'ALL',
  audienceValue: '',
  linkUrl: '',
};

export default function NotificationComposer() {
  const router = useRouter();
  const [v, setV] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function set<K extends keyof typeof empty>(key: K, val: string) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  const style = notificationStyle(v.type);
  const needsValue = v.audienceMode !== 'ALL';
  const canSend =
    v.titleEn.trim() && v.titleTa.trim() && v.messageEn.trim() && v.messageTa.trim() && (!needsValue || v.audienceValue);

  async function send() {
    setBusy(true);
    setMsg(null);
    const res = await apiPost('/api/admin/notifications', v);
    setBusy(false);
    if (res.ok) {
      setMsg({ kind: 'ok', text: `Sent to ${res.deliveredCount ?? 0} student(s).` });
      setV(empty);
      router.refresh();
    } else {
      setMsg({ kind: 'err', text: 'Could not send. Check the fields and try again.' });
    }
  }

  const fieldCls = `${inputClass} !mt-1 text-sm`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Compose */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Compose</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Type
            <select className={`${selectClass} !mt-1 text-sm`} value={v.type} onChange={(e) => set('type', e.target.value)}>
              {NOTIFICATION_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {TYPE_LABEL[tp]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Audience
            <select
              className={`${selectClass} !mt-1 text-sm`}
              value={v.audienceMode}
              onChange={(e) => setV((p) => ({ ...p, audienceMode: e.target.value, audienceValue: '' }))}
            >
              {AUDIENCE_MODES.map((m) => (
                <option key={m} value={m}>
                  {AUDIENCE_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {needsValue ? (
          <label className="mt-3 block text-xs font-medium text-slate-600">
            {v.audienceMode === 'CLASS' ? 'Class' : v.audienceMode === 'BOARD' ? 'Board' : 'District'}
            <select className={`${selectClass} !mt-1 text-sm`} value={v.audienceValue} onChange={(e) => set('audienceValue', e.target.value)}>
              <option value="">Select…</option>
              {(v.audienceMode === 'CLASS' ? CLASS_OPTIONS : v.audienceMode === 'BOARD' ? BOARD_OPTIONS : TN_DISTRICTS).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Title (English)
            <input className={fieldCls} value={v.titleEn} onChange={(e) => set('titleEn', e.target.value)} maxLength={120} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Title (Tamil)
            <input className={fieldCls} value={v.titleTa} onChange={(e) => set('titleTa', e.target.value)} maxLength={120} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Message (English)
            <textarea className={fieldCls} rows={3} value={v.messageEn} onChange={(e) => set('messageEn', e.target.value)} maxLength={1000} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Message (Tamil)
            <textarea className={fieldCls} rows={3} value={v.messageTa} onChange={(e) => set('messageTa', e.target.value)} maxLength={1000} />
          </label>
        </div>

        <label className="mt-3 block text-xs font-medium text-slate-600">
          Link URL (optional)
          <input className={fieldCls} value={v.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="/student/tests" />
        </label>

        {msg ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </p>
        ) : null}

        <button type="button" className={`${btnPrimary} mt-4`} onClick={send} disabled={busy || !canSend}>
          {busy ? 'Sending…' : 'Send notification'}
        </button>
      </div>

      {/* Bilingual preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Preview</h2>
        <p className="mt-1 text-xs text-slate-500">How students see it in each language.</p>
        <div className="mt-4 space-y-3">
          {(['English', 'Tamil'] as const).map((lang) => {
            const title = lang === 'English' ? v.titleEn : v.titleTa;
            const message = lang === 'English' ? v.messageEn : v.messageTa;
            return (
              <div key={lang}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{lang}</p>
                <div className={`flex gap-3 rounded-xl border border-slate-200 border-l-4 bg-slate-50 p-3 ${style.accent}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${style.chip}`}>
                    {style.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{title || <span className="text-slate-400">Title…</span>}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{message || <span className="text-slate-400">Message…</span>}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
