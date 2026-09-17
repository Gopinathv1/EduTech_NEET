'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';
import {
  examReducer,
  summarize,
  type AnswerState,
  type ExamLanguage,
  type ExamOption,
} from '@/lib/attempts/examState';
import { formatClock } from '@/lib/attempts/format';
import type { ExamPayload } from '@/lib/attempts/service';
import QuestionPalette from './QuestionPalette';
import SubmitDialog from './SubmitDialog';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const OPTIONS: ExamOption[] = ['A', 'B', 'C', 'D'];
const SYNC_INTERVAL_MS = 30_000;
// Back-off delays (ms) between autosave retries on a flaky connection. The
// answer endpoint is idempotent for state actions, so retrying is always safe.
const RETRY_DELAYS = [400, 1200, 3000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Answers/marks that failed to save are queued under a per-question category so
// the latest intent wins and is replayed on reconnect / next sync.
type SaveAction = 'answer' | 'clear' | 'mark' | 'unmark' | 'visit';
const saveCategory = (a: SaveAction) => (a === 'mark' || a === 'unmark' ? 'mark' : 'response');

export default function ExamClient({
  payload,
  testTitle,
  studentName,
}: {
  payload: ExamPayload;
  testTitle: string;
  studentName: string;
}) {
  const t = useTranslations('exam.ui');
  const locale = useLocale();
  const tn = useTranslations('neetPractice');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { attemptId, questions, availableLanguages } = payload;
  const questionIds = questions.map((q) => q.id);

  const [state, dispatch] = useReducer(examReducer, {
    lang: payload.selectedLanguage,
    currentIndex: 0,
    answers: payload.answers as Record<string, AnswerState>,
  });
  const [remaining, setRemaining] = useState(payload.remainingSeconds);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refs so the interval callbacks and async handlers read the latest values.
  const indexRef = useRef(state.currentIndex);
  indexRef.current = state.currentIndex;
  const submitRef = useRef(false);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const clockRef = useRef({ seconds: payload.remainingSeconds, at: performance.now() });
  const doneRef = useRef(false); // guards against double submit / redirect
  const enteredRef = useRef<{ qid: string; at: number }>({ qid: questionIds[0], at: performance.now() });

  const goResult = useCallback((url: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    window.location.href = url;
  }, []);

  // ---- Autosave -----------------------------------------------------------
  // Queue of answers/marks whose save failed, keyed by `${questionId}|category`
  // so only the student's latest intent per question is retried.
  const pendingRef = useRef<
    Map<string, { action: SaveAction; questionId: string; extra?: { selectedOption?: ExamOption } }>
  >(new Map());

  // POST an action, retrying with back-off on transient network/parse errors.
  const postAction = useCallback(
    async (body: { questionId: string; action: SaveAction; selectedOption?: ExamOption; timeSpentDelta?: number }, isCurrent: () => boolean = () => true) => {
      const run = async () => {
        if (!isCurrent()) return { ok: true };
        let res = await apiPost(`/api/attempts/${attemptId}/answer`, body);
        for (const delay of RETRY_DELAYS) {
          if (res.ok || !(res.error === 'network' || res.error === 'generic')) break;
          await sleep(delay);
          if (doneRef.current || !isCurrent()) break;
          // Dwell deltas must not be incremented twice after an uncertain reply.
          res = await apiPost(`/api/attempts/${attemptId}/answer`, { ...body, timeSpentDelta: 0 });
        }
        return res;
      };
      const queued = saveChain.current.then(run, run);
      saveChain.current = queued;
      return queued;
    },
    [attemptId],
  );

  // Replay any queued (previously failed) answers/marks — called opportunistically
  // after a successful save, on the periodic sync, and when the browser reconnects.
  const flushPending = useCallback(async () => {
    if (doneRef.current || pendingRef.current.size === 0) return;
    for (const [key, item] of [...pendingRef.current.entries()]) {
      const res = await postAction({ questionId: item.questionId, action: item.action, ...item.extra }, () => pendingRef.current.get(key) === item);
      if (res.ok && pendingRef.current.get(key) === item) pendingRef.current.delete(key);
    }
    if (pendingRef.current.size === 0) setSaveStatus('saved');
  }, [postAction]);

  const persist = useCallback(
    async (
      action: SaveAction,
      questionId: string,
      extra?: { selectedOption?: ExamOption; timeSpentDelta?: number },
    ) => {
      if (doneRef.current) return;
      setSaveStatus('saving');
      const queueKey = action === 'visit' ? null : `${questionId}|${saveCategory(action)}`;
      const item = { action, questionId, extra: extra?.selectedOption ? { selectedOption: extra.selectedOption } : undefined };
      if (queueKey) pendingRef.current.set(queueKey, item);
      const isCurrent = () => !queueKey || pendingRef.current.get(queueKey) === item;
      const res = await postAction({ questionId, action, ...extra }, isCurrent);
      if (res.ok) {
        if (queueKey && isCurrent()) pendingRef.current.delete(queueKey);
        setSaveStatus(pendingRef.current.size > 0 ? 'saving' : 'saved');
        if (typeof res.remainingSeconds === 'number') {
          clockRef.current = { seconds: res.remainingSeconds, at: performance.now() };
          setRemaining(res.remainingSeconds);
        }
      } else if (typeof res.redirect === 'string') {
        goResult(res.redirect);
      } else {
        setSaveStatus('error');
      }
    },
    [postAction, goResult],
  );

  /** Record how long the student dwelled on the question they are leaving. */
  const flushTime = useCallback(() => {
    const { qid, at } = enteredRef.current;
    const delta = Math.floor((performance.now() - at) / 1000);
    enteredRef.current = { qid, at: performance.now() };
    if (delta > 0 && qid) void persist('visit', qid, { timeSpentDelta: delta });
  }, [persist]);

  // ---- Navigation ---------------------------------------------------------
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= questionIds.length || index === indexRef.current) return;
      flushTime();
      const nextQid = questionIds[index];
      enteredRef.current = { qid: nextQid, at: performance.now() };
      dispatch({ type: 'NAVIGATE', index });
      dispatch({ type: 'VISIT', questionId: nextQid });
      void persist('visit', nextQid);
    },
    [flushTime, persist, questionIds],
  );

  // ---- Answer actions -----------------------------------------------------
  const current = questions[state.currentIndex];
  const currentAnswer = state.answers[current.id];

  const selectOption = (option: ExamOption) => {
    dispatch({ type: 'SELECT_OPTION', questionId: current.id, option });
    void persist('answer', current.id, { selectedOption: option });
  };
  const clearResponse = () => {
    dispatch({ type: 'CLEAR', questionId: current.id });
    void persist('clear', current.id);
  };
  const toggleMark = () => {
    const nextMarked = !currentAnswer?.markedForReview;
    dispatch({ type: 'TOGGLE_MARK', questionId: current.id });
    void persist(nextMarked ? 'mark' : 'unmark', current.id);
  };

  // ---- Language switch (does not touch timer/answers/palette/current) ------
  const switchLanguage = (lang: ExamLanguage) => {
    if (lang === state.lang) return;
    dispatch({ type: 'SET_LANGUAGE', lang });
    void apiPost(`/api/attempts/${attemptId}/language`, { language: lang });
  };

  // ---- Submit -------------------------------------------------------------
  const submit = useCallback(async () => {
    if (doneRef.current || submitRef.current) return;
    submitRef.current = true;
    setSubmitting(true);
    flushTime();
    await saveChain.current;
    await flushPending();
    if (pendingRef.current.size && remaining > 0) {
      submitRef.current = false;
      setSubmitting(false);
      setSaveStatus('error');
      return;
    }
    const res = await apiPost(`/api/attempts/${attemptId}/submit`, {});
    if (res.ok && typeof res.redirect === 'string') {
      goResult(res.redirect);
    } else if (typeof res.redirect === 'string') {
      goResult(res.redirect);
    } else {
      submitRef.current = false;
      setSubmitting(false);
      setSaveStatus('error');
    }
  }, [attemptId, flushTime, flushPending, remaining, goResult]);

  // Mark the very first question visited on mount.
  useEffect(() => {
    dispatch({ type: 'VISIT', questionId: questionIds[0] });
    void persist('visit', questionIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Timer: local countdown + periodic server resync --------------------
  useEffect(() => {
    const tick = setInterval(() => {
      const anchor = clockRef.current;
      const next = Math.max(0, anchor.seconds - Math.floor((performance.now() - anchor.at) / 1000));
      setRemaining(next);
      if (next === 0) void submit();
    }, 250);
    return () => clearInterval(tick);
  }, [submit]);

  useEffect(() => {
    const sync = setInterval(async () => {
      if (doneRef.current) return;
      await flushPending(); // re-push any answers that failed to save earlier
      flushTime();
      const res = await apiPost(`/api/attempts/${attemptId}/sync`, {});
      if (res.ok && typeof res.remainingSeconds === 'number') {
        clockRef.current = { seconds: res.remainingSeconds, at: performance.now() };
        setRemaining(res.remainingSeconds);
      }
      if (typeof res.redirect === 'string' && res.status && res.status !== 'IN_PROGRESS') {
        goResult(res.redirect);
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(sync);
  }, [attemptId, flushPending, flushTime, goResult]);

  // When the browser regains connectivity, immediately replay queued saves
  // instead of waiting for the next 30s sync — key for flaky rural networks.
  useEffect(() => {
    const onOnline = () => void flushPending();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushPending]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pendingRef.current.size) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  // ---- Render -------------------------------------------------------------
  const content = current[state.lang] ?? current.en;
  const showTaNotice = !current[state.lang] || (locale !== 'en' && state.lang === 'en');
  const subjectCodes = [...new Set(questions.map(q => q.subjectCode))];
  const counts = summarize(questionIds, state.answers);
  const lowTime = remaining <= 60;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surfaceElevated">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0"><p className="text-xs font-bold text-brand">SIVORA UP↑RISING</p><h1 className="truncate text-sm font-bold text-textPrimary">{tn('title')}</h1><p className="max-w-64 truncate text-xs text-textSecondary">{testTitle}</p></div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                lowTime ? 'bg-red-950 text-red-100 ring-2 ring-red-400' : remaining <= 300 ? 'bg-amber-950 text-amber-100' : 'bg-brand-soft text-brand'
              }`}
              role="timer"
              aria-live="off"
            >
              <span className="text-xs font-medium uppercase tracking-wide opacity-70">{t('timeLeft')}</span>
              {formatClock(remaining)}
            </div>

            {availableLanguages.length > 1 ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
                {availableLanguages.map((code) => {
                  const lang = code as ExamLanguage;
                  const active = lang === state.lang;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => switchLanguage(lang)}
                      aria-pressed={active}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active ? 'bg-brand text-white' : 'text-textSecondary hover:bg-surfaceElevated'
                      }`}
                    >
                      {code.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button type="button" onClick={() => setShowSubmit(true)} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">{t('submit')}</button>
            <span className="hidden text-sm text-textSecondary sm:inline">{studentName}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Question area */}
        <main id="main-content" className="min-w-0 flex-1">
          <nav aria-label={tn('subjectsLabel')} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {subjectCodes.map(code => {
              const indices = questions.map((q, i) => q.subjectCode === code ? i : -1).filter(i => i >= 0);
              const answered = indices.filter(i => state.answers[questions[i].id]?.selectedOption).length;
              return <button key={code} type="button" aria-pressed={current.subjectCode === code}
                onClick={() => goTo(indices[0])} className={`rounded-lg border p-3 text-sm font-semibold ${current.subjectCode === code ? 'border-brand bg-brand-soft text-brand' : 'border-border text-textSecondary'}`}>
                {tn(`subjects.${code}`)} <span className="text-xs">{answered}/{indices.length}</span>
              </button>;
            })}
          </nav>
          <div className="rounded-2xl border border-border bg-surfaceElevated p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">
                {t('questionOf', { current: state.currentIndex + 1, total: questions.length })}
              </span>
              <span aria-live="polite" className="text-xs font-medium text-slate-400">
                {saveStatus === 'saving'
                  ? t('saving')
                  : saveStatus === 'saved'
                    ? t('saved')
                    : saveStatus === 'error'
                      ? t('saveError')
                      : ''}
              </span>
            </div>

            {showTaNotice ? (
              <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
                {tn('languageUnavailable')}
              </p>
            ) : null}

            <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed text-textPrimary">
              {content.questionText}
            </p>

            {current.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.imageUrl}
                alt=""
                className="mt-4 max-h-72 max-w-full w-auto rounded-lg border border-border"
              />
            ) : null}

            <fieldset disabled={submitting || remaining <= 0} className="mt-5 space-y-3">
              <legend className="sr-only">{tn('chooseOne')}</legend>
              {OPTIONS.map((opt) => {
                const label = content[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'];
                const selected = currentAnswer?.selectedOption === opt;
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer focus-within:ring-2 focus-within:ring-brand items-start gap-3 rounded-xl border p-4 transition-colors ${
                      selected ? 'border-brand bg-brand-soft' : 'border-border bg-surfaceElevated hover:border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${current.id}`}
                      checked={selected}
                      onChange={() => selectOption(opt)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                        selected ? 'border-brand bg-brand text-white' : 'border-border text-textSecondary'
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="min-w-0 break-words whitespace-pre-wrap pt-0.5 text-sm text-textPrimary">{label}</span>
                  </label>
                );
              })}
            </fieldset>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(state.currentIndex - 1)}
              disabled={state.currentIndex === 0}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textSecondary hover:bg-surface disabled:opacity-40"
            >
              ← {t('previous')}
            </button>
            <button
              type="button"
              onClick={() => { if (!currentAnswer?.markedForReview) toggleMark(); goTo(state.currentIndex + 1); }}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                currentAnswer?.markedForReview
                  ? 'border-amber-400 bg-amber-950/30 text-amber-100'
                  : 'border-border text-textSecondary hover:bg-surface'
              }`}
            >
              {tn('markNext')}
            </button>
            <button
              type="button"
              onClick={clearResponse}
              disabled={!currentAnswer?.selectedOption}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textSecondary hover:bg-surface disabled:opacity-40"
            >
              {t('clear')}
            </button>
            <button
              type="button"
              onClick={() => goTo(state.currentIndex + 1)}
              disabled={state.currentIndex === questions.length - 1}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
            >
              {tn('saveNext')} →
            </button>
          </div>
        </main>

        {/* Palette + submit */}
        <button type="button" aria-expanded={paletteOpen} aria-controls="exam-palette" onClick={() => setPaletteOpen(!paletteOpen)} className="rounded-lg border border-border p-3 font-semibold lg:hidden">{t('palette')}</button>
        <aside id="exam-palette" className={`${paletteOpen ? 'block' : 'hidden'} lg:block lg:w-72 lg:shrink-0`}>

          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-border bg-surfaceElevated p-5 lg:sticky lg:top-24">
            <QuestionPalette
              questionIds={questionIds}
              answers={state.answers}
              currentIndex={state.currentIndex}
              onJump={goTo}
            />
            <button
              type="button"
              onClick={() => setShowSubmit(true)}
              className="mt-5 w-full rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark"
            >
              {t('submit')}
            </button>
          </div>
        </aside>
      </div>

      {showSubmit ? (
        <SubmitDialog
          counts={counts}
          total={questions.length}
          submitting={submitting}
          onConfirm={submit}
          onCancel={() => setShowSubmit(false)}
        />
      ) : null}
    </div>
  );
}
