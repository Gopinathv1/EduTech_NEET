'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/lib/client/api';
import { LEAD_STATUSES, budgetLabelEn } from '@/lib/admission/config';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnPrimary, btnSecondary, Badge } from '@/components/admin/ui';
import { CloseIcon } from '@/components/admin/icons';
import type { LeadDetail } from '@/lib/admin/leads-service';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  IN_PROGRESS: 'In progress',
  CONVERTED: 'Converted',
  CLOSED: 'Closed',
};
const STATUS_BADGE: Record<string, string> = {
  NEW: 'blue',
  CONTACTED: 'amber',
  IN_PROGRESS: 'amber',
  CONVERTED: 'green',
  CLOSED: 'slate',
};
const EVENT_LABEL: Record<string, string> = {
  CREATED: 'Request submitted',
  STATUS_CHANGE: 'Status changed',
  ASSIGNMENT: 'Assignment',
  NOTE: 'Note',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LeadDrawer({
  leadId,
  admins,
  onClose,
}: {
  leadId: string | null;
  admins: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const res = await apiGet(`/api/admin/leads/${id}`);
    if (res.ok && res.lead) {
      const detail = res.lead as LeadDetail;
      setLead(detail);
      setStatusDraft(detail.status);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (leadId) {
      setLead(null);
      setStatusNote('');
      setNote('');
      void load(leadId);
    }
  }, [leadId, load]);

  if (!leadId) return null;

  async function refresh() {
    if (leadId) await load(leadId);
    router.refresh(); // keep the list + summary in sync
  }

  async function saveStatus() {
    if (!lead) return;
    setBusy(true);
    const res = await apiPatch(`/api/admin/leads/${lead.id}/status`, {
      status: statusDraft,
      note: statusNote.trim() || undefined,
    });
    setBusy(false);
    if (res.ok) {
      setStatusNote('');
      await refresh();
    }
  }

  async function changeAssignee(assignedToId: string) {
    if (!lead) return;
    setBusy(true);
    const res = await apiPatch(`/api/admin/leads/${lead.id}/assign`, { assignedToId: assignedToId || null });
    setBusy(false);
    if (res.ok) await refresh();
  }

  async function addNote() {
    if (!lead || !note.trim()) return;
    setBusy(true);
    const res = await apiPost(`/api/admin/leads/${lead.id}/notes`, { note: note.trim() });
    setBusy(false);
    if (res.ok) {
      setNote('');
      await refresh();
    }
  }

  const s = lead?.student;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-slate-50 shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{s?.name ?? 'Lead'}</h2>
            {lead ? <Badge color={STATUS_BADGE[lead.status] ?? 'slate'}>{STATUS_LABEL[lead.status] ?? lead.status}</Badge> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {loading || !lead ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Status + assignment controls */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Pipeline</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-500">
                  Status
                  <select className={`${selectClass} !mt-1 py-2 text-sm`} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABEL[st]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  Assigned to
                  <select
                    className={`${selectClass} !mt-1 py-2 text-sm`}
                    value={lead.assignedTo?.id ?? ''}
                    onChange={(e) => changeAssignee(e.target.value)}
                    disabled={busy}
                  >
                    <option value="">Unassigned</option>
                    {admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea
                className={`${inputClass} mt-3 text-sm`}
                rows={2}
                placeholder="Optional note for this status change…"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <button type="button" className={`${btnPrimary} mt-3`} onClick={saveStatus} disabled={busy || statusDraft === lead.status && !statusNote.trim()}>
                Update status
              </button>
            </section>

            {/* Student profile */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Student profile</h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Row label="Mobile" value={s ? `+91 ${s.mobile}` : '—'} />
                <Row label="Email" value={s?.email ?? '—'} />
                <Row label="District" value={s?.district ?? '—'} />
                <Row label="State" value={s?.state ?? '—'} />
                <Row label="School" value={s?.schoolName ?? '—'} />
                <Row label="Board" value={s?.board ?? '—'} />
                <Row label="Class" value={s?.class ?? '—'} />
              </dl>
            </section>

            {/* Test performance */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Test performance</h3>
              <div className="mt-3 flex gap-4 text-sm">
                <div className="rounded-lg bg-slate-50 px-4 py-2">
                  <p className="text-xs text-slate-500">Attempts</p>
                  <p className="text-lg font-bold text-slate-900">{lead.performance.attempts}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-2">
                  <p className="text-xs text-slate-500">Best score</p>
                  <p className="text-lg font-bold text-slate-900">
                    {lead.performance.bestScore != null ? `${lead.performance.bestScore}${lead.performance.bestMax ? ` / ${lead.performance.bestMax}` : ''}` : '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Submitted form data */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Submitted request</h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Row label="NEET score" value={lead.neetScore != null ? String(lead.neetScore) : '—'} />
                <Row label="Marks" value={lead.marks != null ? String(lead.marks) : '—'} />
                <Row label="Category" value={lead.category ?? '—'} />
                <Row label="Budget" value={budgetLabelEn(lead.budget)} />
                <Row label="Parent contact" value={lead.parentContact ? `+91 ${lead.parentContact}` : '—'} />
                <Row label="Consent" value={lead.consentAt ? `Yes · ${fmt(lead.consentAt)}` : 'No'} />
              </dl>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Interested countries: </span>
                <span className="font-medium text-slate-800">{lead.countries.map((c) => c.name).join(', ') || '—'}</span>
              </div>
            </section>

            {/* Add note */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Add follow-up note</h3>
              <textarea className={`${inputClass} mt-2 text-sm`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called parent, shared brochure…" />
              <button type="button" className={`${btnSecondary} mt-2`} onClick={addNote} disabled={busy || !note.trim()}>
                Add note
              </button>
            </section>

            {/* Timeline */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-800">Activity</h3>
              <ol className="mt-3 space-y-3">
                {lead.events.map((e) => (
                  <li key={e.id} className="border-l-2 border-brand/30 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">
                        {EVENT_LABEL[e.type] ?? e.type}
                        {e.type === 'STATUS_CHANGE' && e.toStatus ? (
                          <span className="ml-1 text-slate-500">
                            {e.fromStatus ? `${STATUS_LABEL[e.fromStatus]} → ` : ''}
                            {STATUS_LABEL[e.toStatus]}
                          </span>
                        ) : null}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">{fmt(e.createdAt)}</span>
                    </div>
                    {e.note ? <p className="mt-0.5 text-sm text-slate-600">{e.note}</p> : null}
                    {e.adminName ? <p className="text-[11px] text-slate-400">by {e.adminName}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
