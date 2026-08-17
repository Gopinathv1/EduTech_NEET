'use client';

import { useMemo, useState } from 'react';
import { apiPost, apiPatch, apiDelete } from '@/lib/client/api';
import { inputClass, selectClass } from '@/components/ui/Form';
import { Badge, btnPrimary, btnSecondary } from '@/components/admin/ui';
import { AlertIcon, CheckIcon, EditIcon, TrashIcon, PlusIcon } from '@/components/admin/icons';

export type ChapterRow = {
  id: string;
  nameEn: string;
  nameTa: string;
  class: number;
  weightage: number;
};

type Draft = { nameEn: string; nameTa: string; class: number; weightage: string };

const emptyDraft: Draft = { nameEn: '', nameTa: '', class: 11, weightage: '' };

/**
 * Per-subject chapter CRUD. Keeps a live local copy so the weightage total (and
 * the ≠100 warning) update instantly; every change is persisted to the API.
 */
export default function ChapterManager({
  subjectId,
  subjectName,
  initialChapters,
}: {
  subjectId: string;
  subjectName: string;
  initialChapters: ChapterRow[];
}) {
  const [chapters, setChapters] = useState<ChapterRow[]>(initialChapters);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const total = useMemo(
    () => chapters.reduce((sum, c) => sum + (Number.isFinite(c.weightage) ? c.weightage : 0), 0),
    [chapters],
  );
  const rounded = Math.round(total * 100) / 100;
  const balanced = chapters.length === 0 || Math.abs(rounded - 100) < 0.01;

  async function addChapter() {
    setError(undefined);
    const weightage = Number(draft.weightage);
    if (draft.nameEn.trim().length < 2 || Number.isNaN(weightage)) {
      setError('Enter an English name and a numeric weightage.');
      return;
    }
    setBusy(true);
    const res = await apiPost('/api/admin/chapters', {
      subjectId,
      nameEn: draft.nameEn,
      nameTa: draft.nameTa,
      class: draft.class,
      weightage,
    });
    setBusy(false);
    if (!res.ok || typeof res.id !== 'string') {
      setError('Could not add chapter.');
      return;
    }
    setChapters((prev) => [
      ...prev,
      { id: res.id as string, nameEn: draft.nameEn.trim(), nameTa: draft.nameTa.trim(), class: draft.class, weightage },
    ]);
    setDraft(emptyDraft);
  }

  function startEdit(c: ChapterRow) {
    setEditId(c.id);
    setEditDraft({ nameEn: c.nameEn, nameTa: c.nameTa, class: c.class, weightage: String(c.weightage) });
    setError(undefined);
  }

  async function saveEdit(id: string) {
    setError(undefined);
    const weightage = Number(editDraft.weightage);
    if (editDraft.nameEn.trim().length < 2 || Number.isNaN(weightage)) {
      setError('Enter an English name and a numeric weightage.');
      return;
    }
    setBusy(true);
    const res = await apiPatch(`/api/admin/chapters/${id}`, {
      nameEn: editDraft.nameEn,
      nameTa: editDraft.nameTa,
      class: editDraft.class,
      weightage,
    });
    setBusy(false);
    if (!res.ok) {
      setError('Could not save chapter.');
      return;
    }
    setChapters((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, nameEn: editDraft.nameEn.trim(), nameTa: editDraft.nameTa.trim(), class: editDraft.class, weightage }
          : c,
      ),
    );
    setEditId(null);
  }

  async function remove(id: string) {
    setError(undefined);
    if (!window.confirm('Delete this chapter? This cannot be undone.')) return;
    setBusy(true);
    const res = await apiDelete(`/api/admin/chapters/${id}`);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === 'chapterHasQuestions'
          ? `Cannot delete: ${res.count ?? ''} question(s) use this chapter.`
          : res.error === 'chapterHasTests'
            ? 'Cannot delete: a test uses this chapter.'
            : 'Could not delete chapter.',
      );
      return;
    }
    setChapters((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{subjectName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Total weightage</span>
          <Badge color={balanced ? 'green' : 'amber'}>
            {balanced ? <CheckIcon className="h-3.5 w-3.5" /> : <AlertIcon className="h-3.5 w-3.5" />}
            {rounded}%
          </Badge>
        </div>
      </div>

      {!balanced ? (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-800">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Chapter weightages sum to <strong>{rounded}%</strong>, not 100%. The random generator
            expects each subject to total 100%.
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-medium">Chapter (EN / TA)</th>
              <th className="px-3 py-2 font-medium">Class</th>
              <th className="px-3 py-2 font-medium">Weightage</th>
              <th className="px-5 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-500">
                  No chapters yet. Add one below.
                </td>
              </tr>
            ) : (
              chapters.map((c) =>
                editId === c.id ? (
                  <tr key={c.id} className="border-b border-slate-100 bg-slate-50 align-top">
                    <td className="px-5 py-2">
                      <input
                        className={inputClass}
                        value={editDraft.nameEn}
                        onChange={(e) => setEditDraft((d) => ({ ...d, nameEn: e.target.value }))}
                        placeholder="English name"
                        aria-label="Chapter English name"
                      />
                      <input
                        className={`${inputClass} mt-1`}
                        value={editDraft.nameTa}
                        onChange={(e) => setEditDraft((d) => ({ ...d, nameTa: e.target.value }))}
                        placeholder="Tamil name (optional)"
                        aria-label="Chapter Tamil name"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={selectClass}
                        value={editDraft.class}
                        onChange={(e) => setEditDraft((d) => ({ ...d, class: Number(e.target.value) }))}
                        aria-label="Class"
                      >
                        <option value={11}>11</option>
                        <option value={12}>12</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={`${inputClass} w-24`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={editDraft.weightage}
                        onChange={(e) => setEditDraft((d) => ({ ...d, weightage: e.target.value }))}
                        aria-label="Weightage"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <div className="flex justify-end gap-2">
                        <button className={btnPrimary} disabled={busy} onClick={() => saveEdit(c.id)}>
                          Save
                        </button>
                        <button className={btnSecondary} onClick={() => setEditId(null)}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{c.nameEn}</p>
                      {c.nameTa ? <p className="text-slate-500">{c.nameTa}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{c.class}</td>
                    <td className="px-3 py-3 text-slate-700">{c.weightage}%</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                          onClick={() => startEdit(c)}
                          aria-label="Edit chapter"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => remove(c.id)}
                          aria-label="Delete chapter"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div className="grid grid-cols-1 gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:grid-cols-[2fr,1fr,1fr,auto] sm:items-center">
        <div className="space-y-1">
          <input
            className={inputClass}
            value={draft.nameEn}
            onChange={(e) => setDraft((d) => ({ ...d, nameEn: e.target.value }))}
            placeholder="New chapter — English name"
            aria-label="New chapter English name"
          />
          <input
            className={inputClass}
            value={draft.nameTa}
            onChange={(e) => setDraft((d) => ({ ...d, nameTa: e.target.value }))}
            placeholder="Tamil name (optional)"
            aria-label="New chapter Tamil name"
          />
        </div>
        <select
          className={selectClass}
          value={draft.class}
          onChange={(e) => setDraft((d) => ({ ...d, class: Number(e.target.value) }))}
          aria-label="New chapter class"
        >
          <option value={11}>Class 11</option>
          <option value={12}>Class 12</option>
        </select>
        <input
          className={inputClass}
          type="number"
          min={0}
          max={100}
          step="0.5"
          value={draft.weightage}
          onChange={(e) => setDraft((d) => ({ ...d, weightage: e.target.value }))}
          placeholder="Weightage %"
          aria-label="New chapter weightage"
        />
        <button className={btnPrimary} disabled={busy} onClick={addChapter}>
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  );
}
