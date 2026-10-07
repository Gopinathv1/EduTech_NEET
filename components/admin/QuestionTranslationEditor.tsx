'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch, apiPost } from '@/lib/client/api';
import { btnPrimary, btnSecondary } from '@/components/admin/ui';
import { inputClass } from '@/components/ui/Form';

export type TranslationEditorRow = {
  questionText: string; optionA: string | null; optionB: string | null; optionC: string | null; optionD: string | null; explanation: string | null;
  revision: number; reviewState: string; translationSource: 'SIVORA_TRANSLATION' | 'OFFICIAL_TRANSLATION' | null;
  sourceReference: string | null; reviewNote: string | null; reviewedByName: string | null; reviewedAt: string | null;
};
export default function QuestionTranslationEditor({ questionId, language, numerical, initial }: {
  questionId: string; language: 'ta' | 'hi'; numerical: boolean; initial: TranslationEditorRow | null;
}) {
  const router = useRouter();
  const [row, setRow] = useState<TranslationEditorRow>(initial ? { ...initial, translationSource: initial.translationSource ?? 'SIVORA_TRANSLATION' } : { questionText: '', optionA: null, optionB: null, optionC: null, optionD: null,
    explanation: null, revision: 0, reviewState: 'DRAFT', translationSource: 'SIVORA_TRANSLATION', sourceReference: 'SIVORA editorial preparation', reviewNote: null, reviewedByName: null, reviewedAt: null });
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState('');
  const [checked, setChecked] = useState(false);
  const [officialChecked, setOfficialChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  function change(patch: Partial<TranslationEditorRow>) { setRow(prior => ({ ...prior, ...patch })); setDirty(true); setChecked(false); setOfficialChecked(false); }
  const endpoint = `/api/admin/questions/${questionId}/translations/${language}`;
  async function run(action: 'DRAFT' | 'REVIEW' | 'APPROVE' | 'REJECT' | 'NEEDS_CORRECTION') {
    setBusy(true); setFeedback('');
    const res = action === 'DRAFT' || action === 'REVIEW'
      ? await apiPatch(endpoint, { revision: row.revision, questionText: row.questionText, optionA: row.optionA, optionB: row.optionB,
          optionC: row.optionC, optionD: row.optionD, explanation: row.explanation, translationSource: row.translationSource,
          sourceReference: row.sourceReference, submitForReview: action === 'REVIEW' })
      : await apiPost(endpoint, { revision: row.revision, action, note, meaningAndOptionIdentityChecked: checked, officialWordingSourceChecked: officialChecked });
    if (res.ok && typeof res.revision === 'number' && typeof res.reviewState === 'string') {
      setRow(prior => ({ ...prior, revision: res.revision as number, reviewState: res.reviewState as string }));
      setDirty(false); setChecked(false); setOfficialChecked(false); setFeedback('Saved.'); router.refresh();
    } else setFeedback(Array.isArray(res.issues) ? res.issues.join(' ') : String(res.error ?? 'Save failed.'));
    setBusy(false);
  }
  const fields = numerical ? ['questionText', 'explanation'] as const : ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'] as const;
  return <section className="space-y-3 rounded-xl border border-border p-4">
    <h2 className="text-lg font-bold">{language === 'ta' ? 'Tamil — தமிழ்' : 'Hindi — हिन्दी'}</h2>
    <p className="text-sm">Status: <strong>{row.reviewState}</strong> · Revision {row.revision}</p>
    {initial?.reviewedByName ? <p className="text-xs text-textSecondary">Reviewed by {initial.reviewedByName} · {initial.reviewedAt}</p> : null}
    {initial?.reviewNote ? <p className="text-sm text-textSecondary">Review note: {initial.reviewNote}</p> : null}
    {fields.map(field => <label key={field} className="block text-sm">{field === 'questionText' ? 'Question statement' : field === 'explanation' ? 'Explanation (optional)' : `Option ${field.slice(-1)}`}
      <textarea lang={language} className={`${inputClass} mt-1`} rows={field === 'questionText' ? 4 : 2} value={row[field] ?? ''}
        onChange={event => change({ [field]: field === 'questionText' ? event.target.value : event.target.value || null })} />
    </label>)}
    <label className="block text-sm">Wording source<select className={`${inputClass} mt-1`} value={row.translationSource ?? 'SIVORA_TRANSLATION'}
      onChange={event => change({ translationSource: event.target.value as TranslationEditorRow['translationSource'] })}>
      <option value="SIVORA_TRANSLATION">SIVORA translation</option><option value="OFFICIAL_TRANSLATION">Official translated wording</option>
    </select></label>
    <label className="block text-sm">Wording provenance / reference<input className={`${inputClass} mt-1`} value={row.sourceReference ?? ''} onChange={event => change({ sourceReference: event.target.value })} /></label>
    <p className="text-xs text-textSecondary">Official requires the actual translated wording source. An official English question or key alone does not qualify. Saving approved text returns it to review.</p>
    <div className="flex flex-wrap gap-2"><button disabled={busy} type="button" className={btnSecondary} onClick={() => void run('DRAFT')}>Save draft</button>
      <button disabled={busy} type="button" className={btnPrimary} onClick={() => void run('REVIEW')}>Submit for review</button></div>
    {['REVIEW_REQUIRED', 'NEEDS_CORRECTION'].includes(row.reviewState) ? <div className="space-y-2 border-t border-border pt-3">
      <label className="block text-sm">Review note<input className={inputClass} value={note} onChange={event => setNote(event.target.value)} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />I checked meaning, completeness, formulas, units, option identity/order, and absence of hints or answer leakage.</label>
      {row.translationSource === 'OFFICIAL_TRANSLATION' ? <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={officialChecked} onChange={event => setOfficialChecked(event.target.checked)} />I verified the authoritative source of this translated wording.</label> : null}
      <div className="flex flex-wrap gap-2">{(['APPROVE', 'REJECT', 'NEEDS_CORRECTION'] as const).map(action => <button key={action} type="button" className={btnSecondary}
        disabled={busy || dirty || !note.trim() || action === 'APPROVE' && (!checked || row.translationSource === 'OFFICIAL_TRANSLATION' && !officialChecked)} onClick={() => void run(action)}>{action.replaceAll('_', ' ')}</button>)}</div>
    </div> : null}
    <p role="status" className="text-sm">{feedback}</p>
  </section>;
}
