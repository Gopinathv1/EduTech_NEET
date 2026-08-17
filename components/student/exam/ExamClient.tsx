'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const doneRef = useRef(false); // guards against double submit / redirect
  const enteredRef = useRef<{ qid: string; at: number }>({ qid: questionIds[0], at: Date.now() });

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
    async (body: { questionId: string; action: SaveAction; selectedOption?: ExamOption; timeSpentDelta?: number }) => {
      let res = await apiPost(`/api/attempts/${attemptId}/answer`, body);
      for (const delay of RETRY_DELAYS) {
        if (res.ok || !(res.error === 'network' || res.error === 'generic')) break;
        await sleep(delay);
        if (doneRef.current) break;
        res = await apiPost(`/api/attempts/${attemptId}/answer`, body);
      }
      return res;
    },
    [attemptId],
  );

  // Replay any queued (previously failed) answers/marks — called opportunistically
  // after a successful save, on the periodic sync, and when the browser reconnects.
  const flushPending = useCallback(async () => {
    if (doneRef.current || pendingRef.current.size === 0) return;
    for (const [key, item] of [...pendingRef.current.entries()]) {
      const res = await postAction({ questionId: item.questionId, action: item.action, ...item.extra });
      if (res.ok) pendingRef.current.delete(key);
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
      const res = await postAction({ questionId, action, ...extra });
      // 'visit' just tracks dwell time — not worth queueing if it fails.
      const queueKey = action === 'visit' ? null : `${questionId}|${saveCategory(action)}`;
      if (res.ok) {
        if (queueKey) pendingRef.current.delete(queueKey);
        setSaveStatus(pendingRef.current.size > 0 ? 'saving' : 'saved');
        if (typeof res.remainingSeconds === 'number') {
          setRemaining((r) => Math.min(r, res.remainingSeconds as number));
        }
        void flushPending(); // drain anything queued from earlier failures
      } else if (typeof res.redirect === 'string') {
        goResult(res.redirect); // time up / attempt closed
      } else {
        // Remember the latest intent for this question so the next sync/reconnect
        // re-pushes it — the server never silently diverges from the UI.
        if (queueKey) {
          pendingRef.current.set(queueKey, {
            action,
            questionId,
            extra: extra?.selectedOption ? { selectedOption: extra.selectedOption } : undefined,
          });
        }
        setSaveStatus('error');
      }
    },
    [postAction, flushPending, goResult],
  );

  /** Record how long the student dwelled on the question they are leaving. */
  const flushTime = useCallback(() => {
    const { qid, at } = enteredRef.current;
    const delta = Math.floor((Date.now() - at) / 1000);
    enteredRef.current = { qid, at: Date.now() };
    if (delta > 0 && qid) void persist('visit', qid, { timeSpentDelta: delta });
  }, [persist]);

  // ---- Navigation ---------------------------------------------------------
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= questionIds.length || index === indexRef.current) return;
      flushTime();
      const nextQid = questionIds[index];
      enteredRef.current = { qid: nextQid, at: Date.now() };
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
    if (doneRef.current) return;
    setSubmitting(true);
    flushTime();
    const res = await apiPost(`/api/attempts/${attemptId}/submit`, {});
    if (res.ok && typeof res.redirect === 'string') {
      goResult(res.redirect);
    } else if (typeof res.redirect === 'string') {
      goResult(res.redirect);
    } else {
      setSubmitting(false);
    }
  }, [attemptId, flushTime, goResult]);

  // Mark the very first question visited on mount.
  useEffect(() => {
    dispatch({ type: 'VISIT', questionId: questionIds[0] });
    void persist('visit', questionIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Timer: local countdown + periodic server resync --------------------
  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick);
          void submit(); // time up → auto-submit (server records AUTO_SUBMITTED)
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [submit]);

  useEffect(() => {
    const sync = setInterval(async () => {
      if (doneRef.current) return;
      await flushPending(); // re-push any answers that failed to save earlier
      flushTime();
      const res = await apiPost(`/api/attempts/${attemptId}/sync`, {});
      if (res.ok && typeof res.remainingSeconds === 'number') {
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

  // ---- Render -------------------------------------------------------------
  const content = state.lang === 'ta' && current.ta ? current.ta : current.en;
  const showTaNotice = state.lang === 'ta' && !current.ta;
  const counts = summarize(questionIds, state.answers);
  const lowTime = remaining <= 60;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surfaceElevated">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <h1 className="max-w-[45%] truncate text-sm font-bold text-textPrimary sm:text-base">{testTitle}</h1>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                lowTime ? 'bg-red-950/40 text-red-200' : 'bg-brand-soft text-brand'
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

            <span className="hidden text-sm text-textSecondary sm:inline">{studentName}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Question area */}
        <main id="main-content" className="flex-1">
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
                {t('taFallbackNotice')}
              </p>
            ) : null}

            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-textPrimary">
              {content.questionText}
            </p>

            {current.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.imageUrl}
                alt=""
                className="mt-4 max-h-72 w-auto rounded-lg border border-border"
              />
            ) : null}

            <fieldset className="mt-5 space-y-3">
              {OPTIONS.map((opt) => {
                const label = content[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'];
                const selected = currentAnswer?.selectedOption === opt;
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
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
                    <span className="pt-0.5 text-sm text-textPrimary">{label}</span>
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
              onClick={toggleMark}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                currentAnswer?.markedForReview
                  ? 'border-amber-400 bg-amber-950/30 text-amber-100'
                  : 'border-border text-textSecondary hover:bg-surface'
              }`}
            >
              {currentAnswer?.markedForReview ? t('marked') : t('markReview')}
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
              {t('next')} →
            </button>
          </div>
        </main>

        {/* Palette + submit */}
        <aside className="lg:w-72 lg:shrink-0">
          <div className="rounded-2xl border border-border bg-surfaceElevated p-5">
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
