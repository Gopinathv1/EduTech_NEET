'use client';

import { useState } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary, Badge } from '@/components/admin/ui';
import { SearchIcon, PlusIcon, TrashIcon } from '@/components/admin/icons';
import type { SubjectOption } from '@/components/admin/QuestionFilters';

export type PickedQuestion = { id: string; preview: string; meta: string; hasTa: boolean };
type SearchRow = {
  id: string;
  preview: string;
  subjectName: string;
  chapterName: string;
  difficulty: string;
  hasTa: boolean;
};

export default function QuestionPicker({
  subjects,
  value,
  onChange,
}: {
  subjects: SubjectOption[];
  value: PickedQuestion[];
  onChange: (v: PickedQuestion[]) => void;
}) {
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [busy, setBusy] = useState(false);

  const chapters = subjects.find((s) => s.id === subject)?.chapters ?? [];
  const selectedIds = new Set(value.map((v) => v.id));

  async function search() {
    setBusy(true);
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (chapter) params.set('chapter', chapter);
    if (difficulty) params.set('difficulty', difficulty);
    if (q) params.set('q', q);
    params.set('limit', '25');
    const res = await fetch(`/api/admin/questions?${params}`).then((r) => r.json()).catch(() => null);
    setBusy(false);
    setResults(res?.ok ? (res.questions as SearchRow[]) : []);
  }

  function add(row: SearchRow) {
    if (selectedIds.has(row.id)) return;
    onChange([
      ...value,
      { id: row.id, preview: row.preview, meta: `${row.subjectName} · ${row.chapterName}`, hasTa: row.hasTa },
    ]);
  }
  function remove(id: string) {
    onChange(value.filter((v) => v.id !== id));
  }
  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Search */}
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">Find questions</p>
        <div className="grid grid-cols-2 gap-2">
          <select
            className={cls}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setChapter('');
            }}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className={cls} value={chapter} onChange={(e) => setChapter(e.target.value)} disabled={!subject}>
            <option value="">All chapters</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className={cls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Any difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <input
            className={`${inputClass} !mt-0 py-2 text-sm`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
            placeholder="Search text…"
          />
        </div>
        <button type="button" className={`${btnSecondary} mt-2`} onClick={search} disabled={busy}>
          <SearchIcon className="h-4 w-4" />
          {busy ? 'Searching…' : 'Search'}
        </button>

        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {results.length === 0 ? (
            <li className="py-4 text-center text-sm text-slate-400">No results yet — search above.</li>
          ) : (
            results.map((r) => (
              <li key={r.id} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-800">{r.preview || '(no text)'}</p>
                  <p className="text-xs text-slate-500">
                    {r.subjectName} · {r.chapterName} · {r.difficulty.toLowerCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => add(r)}
                  disabled={selectedIds.has(r.id)}
                  className="shrink-0 rounded-lg p-1.5 text-brand hover:bg-brand-soft disabled:opacity-40"
                  aria-label="Add question"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Selected */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Selected</p>
          <Badge color="blue">{value.length} question{value.length === 1 ? '' : 's'}</Badge>
        </div>
        {value.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No questions selected yet.</p>
        ) : (
          <ol className="max-h-80 space-y-2 overflow-y-auto">
            {value.map((v, i) => (
              <li key={v.id} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2 text-sm">
                <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-800">{v.preview || '(no text)'}</p>
                  <p className="text-xs text-slate-500">
                    {v.meta}
                    {!v.hasTa ? ' · no reviewed TA' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button type="button" onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Move down">
                    ↓
                  </button>
                  <button type="button" onClick={() => remove(v.id)} className="rounded p-1 text-red-500 hover:bg-red-50" aria-label="Remove">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
