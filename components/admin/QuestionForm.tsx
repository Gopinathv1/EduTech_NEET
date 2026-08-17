'use client';

import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';
import { apiPost, apiPatch } from '@/lib/client/api';
import { inputClass, selectClass, Field, Banner } from '@/components/ui/Form';
import { btnPrimary, btnSecondary } from '@/components/admin/ui';
import { ImageIcon } from '@/components/admin/icons';
import type { SubjectOption } from '@/components/admin/QuestionFilters';

type Content = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation: string;
};

export type QuestionInitial = {
  id: string;
  subjectId: string;
  chapterId: string;
  topic: string;
  difficulty: string;
  questionType: string;
  status: string;
  year: string;
  tags: string;
  imageUrl: string;
  isActive: boolean;
  correctOption: 'A' | 'B' | 'C' | 'D';
  en: Content;
  ta: (Content & { reviewed: boolean }) | null;
};

const emptyContent: Content = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', explanation: '' };
const OPTIONS = ['A', 'B', 'C', 'D'] as const;

function defaults(subjects: SubjectOption[]): QuestionInitial {
  return {
    id: '',
    subjectId: subjects[0]?.id ?? '',
    chapterId: '',
    topic: '',
    difficulty: 'MEDIUM',
    questionType: 'SINGLE_CORRECT',
    status: 'DRAFT',
    year: '',
    tags: '',
    imageUrl: '',
    isActive: true,
    correctOption: 'A',
    en: { ...emptyContent },
    ta: null,
  };
}

export default function QuestionForm({
  subjects,
  initial,
}: {
  subjects: SubjectOption[];
  initial?: QuestionInitial;
}) {
  const router = useRouter();
  const base = initial ?? defaults(subjects);
  const isEdit = Boolean(initial?.id);

  const [tab, setTab] = useState<'details' | 'translations'>('details');
  const [subjectId, setSubjectId] = useState(base.subjectId);
  const [chapterId, setChapterId] = useState(base.chapterId);
  const [topic, setTopic] = useState(base.topic);
  const [difficulty, setDifficulty] = useState(base.difficulty);
  const [questionType, setQuestionType] = useState(base.questionType);
  const [status, setStatus] = useState(base.status);
  const [year, setYear] = useState(base.year);
  const [tags, setTags] = useState(base.tags);
  const [imageUrl, setImageUrl] = useState(base.imageUrl);
  const [isActive, setIsActive] = useState(base.isActive);
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>(base.correctOption);
  const [en, setEn] = useState<Content>(base.en);
  const [ta, setTa] = useState<Content>(base.ta ?? { ...emptyContent });
  const [taReviewed, setTaReviewed] = useState<boolean>(base.ta?.reviewed ?? false);

  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const chapters = subjects.find((s) => s.id === subjectId)?.chapters ?? [];
  const taAny = [ta.questionText, ta.optionA, ta.optionB, ta.optionC, ta.optionD].some((s) => s.trim());
  const taAll = [ta.questionText, ta.optionA, ta.optionB, ta.optionC, ta.optionD].every((s) => s.trim());

  function validate(): string[] {
    const errs: string[] = [];
    if (!subjectId) errs.push('Select a subject.');
    if (!chapterId) errs.push('Select a chapter.');
    if (!en.questionText.trim()) errs.push('English question text is required.');
    for (const o of OPTIONS) if (!en[`option${o}` as keyof Content].toString().trim()) errs.push(`English option ${o} is required.`);
    if (questionType === 'IMAGE_BASED' && !imageUrl) errs.push('Upload an image for an image-based question.');
    if (taAny && !taAll) errs.push('Complete all Tamil fields or clear them.');
    if (taReviewed && !taAll) errs.push('Only a complete Tamil translation can be marked reviewed.');
    return errs;
  }

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrors([]);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && typeof data.url === 'string') setImageUrl(data.url);
      else setErrors([data?.error === 'tooLarge' ? 'Image is too large (max 2 MB).' : 'Image upload failed.']);
    } catch {
      setErrors(['Image upload failed.']);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onSubmit() {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      // surface translation errors on the right tab
      if (errs.some((m) => m.toLowerCase().includes('tamil') || m.includes('option') || m.includes('question text'))) {
        setTab('translations');
      }
      return;
    }
    setErrors([]);
    setBusy(true);
    const payload = {
      subjectId,
      chapterId,
      topic: topic.trim(),
      difficulty,
      questionType,
      status,
      year: year.trim() ? Number(year) : null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl,
      isActive,
      correctOption,
      en,
      ta: taAll ? { ...ta, reviewed: taReviewed } : undefined,
    };
    const res = isEdit
      ? await apiPatch(`/api/admin/questions/${base.id}`, payload)
      : await apiPost('/api/admin/questions', payload);
    setBusy(false);
    if (res.ok) {
      router.push('/admin/question-bank');
      router.refresh();
      return;
    }
    setErrors([serverError(res.error)]);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {(['details', 'translations'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {key === 'details' ? 'Details' : 'Translations (EN / TA)'}
          </button>
        ))}
      </div>

      {errors.length > 0 ? (
        <div className="mb-4">
          <Banner kind="error">
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      {tab === 'details' ? (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="qSubject">
              <select
                id="qSubject"
                className={selectClass}
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId('');
                }}
              >
                <option value="">Select…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Chapter" htmlFor="qChapter">
              <select
                id="qChapter"
                className={selectClass}
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={!subjectId}
              >
                <option value="">Select…</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Topic" htmlFor="qTopic" hint="Optional — finer-grained than chapter (e.g. Newton's Laws)">
            <input id="qTopic" className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Difficulty" htmlFor="qDiff">
              <select id="qDiff" className={selectClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </Field>
            <Field label="Question type" htmlFor="qType">
              <select id="qType" className={selectClass} value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                <option value="SINGLE_CORRECT">Single correct</option>
                <option value="IMAGE_BASED">Image based</option>
                {/* Only selectable if the question already is A/R; disabled for new questions. */}
                <option value="ASSERTION_REASON" disabled={questionType !== 'ASSERTION_REASON'}>
                  Assertion-Reason (coming soon)
                </option>
              </select>
            </Field>
            <Field label="Year" htmlFor="qYear" hint="Optional (e.g. 2021)">
              <input
                id="qYear"
                type="number"
                min={1990}
                max={2100}
                className={inputClass}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Tags" htmlFor="qTags" hint="Comma-separated (e.g. units, force)">
            <input id="qTags" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>

          <div>
            <p className="block text-sm font-medium text-slate-700">Correct option</p>
            <div className="mt-1 flex gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setCorrectOption(o)}
                  className={`h-10 w-10 rounded-lg border text-sm font-semibold ${
                    correctOption === o
                      ? 'border-brand bg-brand text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={correctOption === o}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <p className="block text-sm font-medium text-slate-700">
              Image {questionType === 'IMAGE_BASED' ? '(required)' : '(optional)'}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className={`${btnSecondary} cursor-pointer`}>
                <ImageIcon className="h-4 w-4" />
                {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onUpload} />
              </label>
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Question" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                  <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setImageUrl('')}>
                    Remove
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <Field label="Status" htmlFor="qStatus" hint="Only Published questions are shown to students / used by tests.">
            <select
              id="qStatus"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setIsActive(e.target.value === 'PUBLISHED');
              }}
            >
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">In review</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </Field>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TranslationColumn title="English (required)" content={en} onChange={setEn} />
            <div>
              <TranslationColumn title="Tamil (optional)" content={ta} onChange={setTa} />
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={taReviewed}
                  onChange={(e) => setTaReviewed(e.target.checked)}
                  disabled={!taAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand disabled:opacity-50"
                />
                Translation reviewed
                <span className="text-xs text-slate-400">(only reviewed Tamil is shown to students)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={() => router.push('/admin/question-bank')}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={onSubmit}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create question'}
        </button>
      </div>
    </div>
  );
}

function TranslationColumn({
  title,
  content,
  onChange,
}: {
  title: string;
  content: Content;
  onChange: (c: Content) => void;
}) {
  const set = (k: keyof Content, val: string) => onChange({ ...content, [k]: val });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <Field label="Question text" htmlFor={`${title}-q`}>
        <textarea
          id={`${title}-q`}
          rows={3}
          className={inputClass}
          value={content.questionText}
          onChange={(e) => set('questionText', e.target.value)}
        />
      </Field>
      {OPTIONS.map((o) => (
        <Field key={o} label={`Option ${o}`} htmlFor={`${title}-${o}`}>
          <input
            id={`${title}-${o}`}
            className={inputClass}
            value={content[`option${o}` as keyof Content] as string}
            onChange={(e) => set(`option${o}` as keyof Content, e.target.value)}
          />
        </Field>
      ))}
      <Field label="Explanation" htmlFor={`${title}-exp`} hint="Optional">
        <textarea
          id={`${title}-exp`}
          rows={2}
          className={inputClass}
          value={content.explanation}
          onChange={(e) => set('explanation', e.target.value)}
        />
      </Field>
    </div>
  );
}

function serverError(code?: string): string {
  switch (code) {
    case 'validation':
      return 'Please check the fields and try again.';
    case 'chapterSubjectMismatch':
      return 'The chosen chapter does not belong to the selected subject.';
    case 'chapterNotFound':
      return 'The selected chapter no longer exists.';
    case 'unauthorized':
      return 'Your session has expired. Please log in again.';
    default:
      return 'Could not save the question. Please try again.';
  }
}
