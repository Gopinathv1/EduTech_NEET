'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost, apiPatch } from '@/lib/client/api';
import { inputClass, selectClass, Field, Banner } from '@/components/ui/Form';
import { btnPrimary, btnSecondary } from '@/components/admin/ui';
import QuestionPicker, { type PickedQuestion } from '@/components/admin/QuestionPicker';
import type { SubjectOption } from '@/components/admin/QuestionFilters';

const TEST_TYPES = [
  { value: 'FULL_TEST', label: 'Full Test (NEET 180)' },
  { value: 'MINI_TEST', label: 'Mini Test' },
  { value: 'CHAPTER_TEST', label: 'Chapter Test' },
  { value: 'SUBJECT_TEST', label: 'Subject Test' },
  { value: 'YEAR_PATTERN', label: 'Year Pattern' },
];

export type TestFormInitial = {
  id: string;
  titleEn: string;
  titleTa: string;
  descEn: string;
  descTa: string;
  testType: string;
  year: string;
  durationMinutes: string;
  price: string;
  mix: { EASY: number; MEDIUM: number; HARD: number };
  ta: boolean;
  mode: 'FIXED' | 'RANDOM';
  totalQuestions: string;
  scope: 'FULL_SYLLABUS' | 'SUBJECTS' | 'CHAPTERS';
  subjectIds: string[];
  chapterIds: string[];
  subjectId: string;
  chapterId: string;
  fixed: PickedQuestion[];
};

function defaults(): TestFormInitial {
  return {
    id: '',
    titleEn: '',
    titleTa: '',
    descEn: '',
    descTa: '',
    testType: 'MINI_TEST',
    year: '',
    durationMinutes: '30',
    price: '30',
    mix: { EASY: 30, MEDIUM: 50, HARD: 20 },
    ta: true,
    mode: 'RANDOM',
    totalQuestions: '20',
    scope: 'FULL_SYLLABUS',
    subjectIds: [],
    chapterIds: [],
    subjectId: '',
    chapterId: '',
    fixed: [],
  };
}

export default function TestForm({
  subjects,
  initial,
}: {
  subjects: SubjectOption[];
  initial?: TestFormInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [f, setF] = useState<TestFormInitial>(initial ?? defaults());
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isFull = f.testType === 'FULL_TEST';
  const mode = isFull ? 'RANDOM' : f.mode;
  const mixTotal = f.mix.EASY + f.mix.MEDIUM + f.mix.HARD;
  const tagChapters = subjects.find((s) => s.id === f.subjectId)?.chapters ?? [];

  function set<K extends keyof TestFormInitial>(key: K, val: TestFormInitial[K]) {
    setF((prev) => ({ ...prev, [key]: val }));
  }
  function setMix(k: 'EASY' | 'MEDIUM' | 'HARD', v: string) {
    setF((prev) => ({ ...prev, mix: { ...prev.mix, [k]: Number(v) || 0 } }));
  }
  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (f.titleEn.trim().length < 2) errs.push('English title is required.');
    if (mixTotal !== 100) errs.push('Difficulty mix must total 100%.');
    if (!(Number(f.durationMinutes) >= 1)) errs.push('Duration must be at least 1 minute.');
    if (mode === 'FIXED') {
      if (f.fixed.length < 1) errs.push('Pick at least one question for a fixed test.');
    } else if (!isFull) {
      if (!(Number(f.totalQuestions) >= 1)) errs.push('Set the number of questions.');
      if (f.scope === 'SUBJECTS' && f.subjectIds.length < 1) errs.push('Choose at least one subject.');
      if (f.scope === 'CHAPTERS' && f.chapterIds.length < 1) errs.push('Choose at least one chapter.');
    }
    return errs;
  }

  async function onSubmit() {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setBusy(true);
    const payload = {
      titleEn: f.titleEn,
      titleTa: f.titleTa,
      descEn: f.descEn,
      descTa: f.descTa,
      testType: f.testType,
      year: f.year.trim() ? Number(f.year) : null,
      durationMinutes: Number(f.durationMinutes),
      price: Number(f.price),
      difficultyMix: f.mix,
      availableLanguages: f.ta ? ['en', 'ta'] : ['en'],
      mode,
      questionIds: mode === 'FIXED' ? f.fixed.map((x) => x.id) : [],
      totalQuestions: mode === 'RANDOM' ? Number(isFull ? 180 : f.totalQuestions) : undefined,
      scope: mode === 'RANDOM' ? (isFull ? 'FULL_SYLLABUS' : f.scope) : undefined,
      subjectIds: f.subjectIds,
      chapterIds: f.chapterIds,
      subjectId: f.subjectId || null,
      chapterId: f.chapterId || null,
    };
    const res = isEdit
      ? await apiPatch(`/api/admin/tests/${f.id}`, payload)
      : await apiPost('/api/admin/tests', payload);
    setBusy(false);
    if (res.ok) {
      router.push('/admin/tests');
      router.refresh();
      return;
    }
    setErrors([serverError(res.error)]);
  }

  const numCls = `${inputClass} w-24`;

  return (
    <div className="space-y-5">
      {errors.length > 0 ? (
        <Banner kind="error">
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Banner>
      ) : null}

      {/* Basics */}
      <section className="rounded-xl border border-border bg-surfaceElevated p-5">
        <h2 className="mb-4 text-base font-semibold text-textPrimary">Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title (English)" htmlFor="titleEn">
            <input id="titleEn" className={inputClass} value={f.titleEn} onChange={(e) => set('titleEn', e.target.value)} />
          </Field>
          <Field label="Title (Tamil)" htmlFor="titleTa">
            <input id="titleTa" className={inputClass} value={f.titleTa} onChange={(e) => set('titleTa', e.target.value)} />
          </Field>
          <Field label="Description (English)" htmlFor="descEn">
            <textarea id="descEn" rows={2} className={inputClass} value={f.descEn} onChange={(e) => set('descEn', e.target.value)} />
          </Field>
          <Field label="Description (Tamil)" htmlFor="descTa">
            <textarea id="descTa" rows={2} className={inputClass} value={f.descTa} onChange={(e) => set('descTa', e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Test type" htmlFor="testType">
            <select id="testType" className={selectClass} value={f.testType} onChange={(e) => set('testType', e.target.value)}>
              {TEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" htmlFor="year" hint="Optional">
            <input id="year" type="number" min={1990} max={2100} className={inputClass} value={f.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
          <Field label="Duration (min)" htmlFor="dur">
            <input id="dur" type="number" min={1} max={600} className={inputClass} value={f.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
          </Field>
          <Field label="Price (₹)" htmlFor="price">
            <input id="price" type="number" min={0} className={inputClass} value={f.price} onChange={(e) => set('price', e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-textSecondary">Available languages</p>
          <div className="mt-1 flex gap-4 text-sm">
            <label className="flex items-center gap-2 text-textSecondary">
              <input type="checkbox" checked disabled className="h-4 w-4 rounded border-border" /> English
            </label>
            <label className="flex items-center gap-2 text-textSecondary">
              <input type="checkbox" checked={f.ta} onChange={(e) => set('ta', e.target.checked)} className="h-4 w-4 rounded border-border text-brand" /> Tamil
            </label>
          </div>
        </div>
      </section>

      {/* Difficulty mix */}
      <section className="rounded-xl border border-border bg-surfaceElevated p-5">
        <h2 className="mb-1 text-base font-semibold text-textPrimary">Difficulty mix</h2>
        <p className="mb-3 text-sm text-textSecondary">Target percentage of each difficulty (must total 100%).</p>
        <div className="flex flex-wrap items-end gap-4">
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
            <Field key={d} label={d[0] + d.slice(1).toLowerCase()} htmlFor={`mix-${d}`}>
              <input id={`mix-${d}`} type="number" min={0} max={100} className={numCls} value={f.mix[d]} onChange={(e) => setMix(d, e.target.value)} />
            </Field>
          ))}
          <span className={`text-sm font-semibold ${mixTotal === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            Total: {mixTotal}%
          </span>
        </div>
      </section>

      {/* Question selection */}
      <section className="rounded-xl border border-border bg-surfaceElevated p-5">
        <h2 className="mb-1 text-base font-semibold text-textPrimary">Questions</h2>
        {isFull ? (
          <p className="mb-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
            Full Test: 180 questions — Physics 45, Chemistry 45, Botany 45, Zoology 45, generated
            per attempt across the full syllabus by chapter weightage.
          </p>
        ) : (
          <div className="mb-4 flex gap-4 text-sm">
            {(['RANDOM', 'FIXED'] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-textSecondary">
                <input type="radio" name="mode" checked={mode === m} onChange={() => set('mode', m)} className="h-4 w-4 text-brand" />
                {m === 'RANDOM' ? 'Random (generated per attempt)' : 'Fixed (hand-picked)'}
              </label>
            ))}
          </div>
        )}

        {mode === 'FIXED' ? (
          <QuestionPicker subjects={subjects} value={f.fixed} onChange={(v) => set('fixed', v)} />
        ) : (
          <div className="space-y-4">
            {!isFull ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Total questions" htmlFor="totalQ">
                  <input id="totalQ" type="number" min={1} max={500} className={inputClass} value={f.totalQuestions} onChange={(e) => set('totalQuestions', e.target.value)} />
                </Field>
                <Field label="Scope" htmlFor="scope">
                  <select id="scope" className={selectClass} value={f.scope} onChange={(e) => set('scope', e.target.value as TestFormInitial['scope'])}>
                    <option value="FULL_SYLLABUS">Full syllabus</option>
                    <option value="SUBJECTS">Chosen subjects</option>
                    <option value="CHAPTERS">Chosen chapters</option>
                  </select>
                </Field>
              </div>
            ) : null}

            {!isFull && f.scope === 'SUBJECTS' ? (
              <div>
                <p className="mb-2 text-sm font-medium text-textSecondary">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <label key={s.id} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${f.subjectIds.includes(s.id) ? 'border-brand bg-brand-soft text-brand' : 'border-border text-textSecondary'}`}>
                      <input type="checkbox" className="sr-only" checked={f.subjectIds.includes(s.id)} onChange={() => set('subjectIds', toggleId(f.subjectIds, s.id))} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {!isFull && f.scope === 'CHAPTERS' ? (
              <div className="space-y-3">
                {subjects.map((s) => (
                  <div key={s.id}>
                    <p className="mb-1 text-sm font-medium text-textSecondary">{s.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.chapters.map((c) => (
                        <label key={c.id} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs ${f.chapterIds.includes(c.id) ? 'border-brand bg-brand-soft text-brand' : 'border-border text-textSecondary'}`}>
                          <input type="checkbox" className="sr-only" checked={f.chapterIds.includes(c.id)} onChange={() => set('chapterIds', toggleId(f.chapterIds, c.id))} />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Catalogue tags */}
      <section className="rounded-xl border border-border bg-surfaceElevated p-5">
        <h2 className="mb-1 text-base font-semibold text-textPrimary">Catalogue tags</h2>
        <p className="mb-3 text-sm text-textSecondary">Optional — helps students filter this test by subject/chapter.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="tagSubject">
            <select id="tagSubject" className={selectClass} value={f.subjectId} onChange={(e) => { set('subjectId', e.target.value); set('chapterId', ''); }}>
              <option value="">None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chapter" htmlFor="tagChapter">
            <select id="tagChapter" className={selectClass} value={f.chapterId} onChange={(e) => set('chapterId', e.target.value)} disabled={!f.subjectId}>
              <option value="">None</option>
              {tagChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={() => router.push('/admin/tests')}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={onSubmit}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create test'}
        </button>
      </div>

      {isEdit ? (
        <p className="text-right text-xs text-slate-400">Editing unpublishes the test — re-publish to make it live.</p>
      ) : null}
    </div>
  );
}

function serverError(code?: string): string {
  switch (code) {
    case 'validation':
      return 'Please check the fields and try again.';
    case 'questionsNotFound':
      return 'Some selected questions no longer exist.';
    case 'duplicateQuestions':
      return 'A question was selected more than once.';
    default:
      return 'Could not save the test. Please try again.';
  }
}
