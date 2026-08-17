import type { AttemptStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateForAttempt } from '@/lib/generator/plan';
import { GeneratorError } from '@/lib/generator';
import { computeResult, type ResultQuestion, type ScoredOption } from './result';
import { computeRemainingSeconds } from './timer';
import {
  canShuffleOptions,
  optionDisplayOrder,
  applyDisplayOrder,
  canonicalToDisplay,
  type OptLetter,
} from './options';
import { buildResultNotificationData } from '@/lib/notifications/create';

/**
 * Server-side orchestration for a test attempt: starting/resuming, building the
 * exam payload (questions in both available languages), and finalising into a
 * Result. All time authority and re-attempt rules live here so the API routes and
 * the exam page share one implementation.
 */

export type StartOutcome =
  | { ok: true; attemptId: string; resumed: boolean }
  | { ok: false; code: 'notOwned' | 'notFound' | 'languageUnavailable' | 'alreadyCompleted' | 'generationFailed'; attemptId?: string };

const ACTIVE: AttemptStatus = 'IN_PROGRESS';

/**
 * Start a fresh attempt or resume the student's in-progress one. Enforces a single
 * active attempt per (student, test) and blocks re-attempting a completed test.
 */
export async function startOrResumeAttempt(
  studentId: string,
  testId: string,
  language: 'en' | 'ta',
): Promise<StartOutcome> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, isPublished: true, durationMinutes: true, availableLanguages: true, price: true },
  });
  if (!test || !test.isPublished) return { ok: false, code: 'notFound' };

  const owned = (await prisma.testEntitlement.count({ where: { studentId, testId } })) > 0;
  if (!owned) {
    if (test.price > 0) return { ok: false, code: 'notOwned' };
    await prisma.testEntitlement.upsert({
      where: { studentId_testId: { studentId, testId } },
      create: { studentId, testId, source: 'FREE' },
      update: {},
    });
  }

  // One attempt per test: resume an active one, block a completed one.
  const existing = await prisma.testAttempt.findFirst({
    where: { studentId, testId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true },
  });
  if (existing) {
    if (existing.status === ACTIVE) return { ok: true, attemptId: existing.id, resumed: true };
    return { ok: false, code: 'alreadyCompleted', attemptId: existing.id };
  }

  const languages = test.availableLanguages.length ? test.availableLanguages : ['en'];
  if (!languages.includes(language)) return { ok: false, code: 'languageUnavailable' };

  // Create the attempt first so its id can seed the generator, then freeze the
  // question order. If generation fails, roll the attempt back.
  const attempt = await prisma.testAttempt.create({
    data: {
      studentId,
      testId,
      selectedLanguage: language,
      remainingSeconds: test.durationMinutes * 60,
      status: ACTIVE,
      shuffleOptions: true, // new attempts present options in a shuffled order
    },
    select: { id: true },
  });

  try {
    const { questionIds } = await generateForAttempt(testId, language, attempt.id);
    if (questionIds.length === 0) throw new GeneratorError('Empty question set');
    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { questionOrder: questionIds, seed: attempt.id },
    });
    return { ok: true, attemptId: attempt.id, resumed: false };
  } catch (err) {
    await prisma.testAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    if (err instanceof GeneratorError) return { ok: false, code: 'generationFailed' };
    throw err;
  }
}

/**
 * Load an attempt that belongs to `studentId`, with the fields the API routes
 * need for time-authority checks. Returns null if it is missing or owned by
 * someone else (callers treat both as 404, never leaking existence).
 */
export async function loadAttemptContext(attemptId: string, studentId: string) {
  return prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      selectedLanguage: true,
      questionOrder: true,
      testId: true,
      test: { select: { durationMinutes: true } },
    },
  });
}

// ---- Exam payload ---------------------------------------------------------

export type ExamQuestionContent = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export type ExamQuestion = {
  id: string;
  order: number;
  questionType: string;
  imageUrl: string | null;
  en: ExamQuestionContent;
  /** Reviewed Tamil content, or null when the question has no reviewed Tamil. */
  ta: ExamQuestionContent | null;
};

export type ExamAnswerState = {
  selectedOption: ScoredOption | null;
  markedForReview: boolean;
  visited: boolean;
};

export type ExamPayload = {
  attemptId: string;
  testTitle: unknown; // { en, ta } Json — localized in the page
  availableLanguages: string[];
  selectedLanguage: 'en' | 'ta';
  remainingSeconds: number;
  status: AttemptStatus;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerState>;
};

function pickContent(t: {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}): ExamQuestionContent {
  return {
    questionText: t.questionText,
    optionA: t.optionA,
    optionB: t.optionB,
    optionC: t.optionC,
    optionD: t.optionD,
  };
}

/**
 * Build the full exam payload for an in-progress attempt: every question in its
 * frozen order, with English content always present and reviewed-Tamil content
 * when available, plus the saved per-question answer state. Loading both languages
 * up front lets the client switch language instantly without a server round-trip
 * or losing any state.
 */
export async function buildExamPayload(attempt: {
  id: string;
  selectedLanguage: string;
  remainingSeconds: number;
  status: AttemptStatus;
  questionOrder: string[];
  seed: string | null;
  shuffleOptions: boolean;
  startedAt: Date;
  test: { title: unknown; availableLanguages: string[]; durationMinutes: number };
}): Promise<ExamPayload> {
  const orderIds = attempt.questionOrder;

  const [questions, answers] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        questionType: true,
        imageUrl: true,
        translations: {
          where: { language: { in: ['en', 'ta'] } },
          select: {
            language: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            reviewed: true,
          },
        },
      },
    }),
    prisma.answer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedOption: true, isMarkedForReview: true, visited: true },
    }),
  ]);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const examQuestions: ExamQuestion[] = [];
  orderIds.forEach((id, index) => {
    const q = byId.get(id);
    if (!q) return;
    const en = q.translations.find((tr) => tr.language === 'en');
    const ta = q.translations.find((tr) => tr.language === 'ta' && tr.reviewed);
    if (!en) return; // English is authoritative; skip a question missing it

    // Present options in a per-attempt shuffled order (same order for EN + TA),
    // skipping questions where reordering would break the options.
    const shuffle = attempt.shuffleOptions && canShuffleOptions(en, q.questionType);
    const order = optionDisplayOrder(attempt.seed, q.id, shuffle);
    const enContent = pickContent(en);
    const taContent = ta ? pickContent(ta) : null;

    examQuestions.push({
      id: q.id,
      order: index,
      questionType: q.questionType,
      imageUrl: q.imageUrl,
      en: applyDisplayOrder(enContent, order),
      ta: taContent ? applyDisplayOrder(taContent, order) : null,
    });
  });

  const answerMap: Record<string, ExamAnswerState> = {};
  for (const a of answers) {
    answerMap[a.questionId] = {
      selectedOption: a.selectedOption,
      markedForReview: a.isMarkedForReview,
      visited: a.visited,
    };
  }

  const selectedLanguage = attempt.selectedLanguage === 'ta' ? 'ta' : 'en';

  return {
    attemptId: attempt.id,
    testTitle: attempt.test.title,
    availableLanguages: attempt.test.availableLanguages.length ? attempt.test.availableLanguages : ['en'],
    selectedLanguage,
    remainingSeconds: computeRemainingSeconds(attempt.startedAt, attempt.test.durationMinutes),
    status: attempt.status,
    questions: examQuestions,
    answers: answerMap,
  };
}

// ---- Finalisation ---------------------------------------------------------

export type FinalizeOutcome = { ok: boolean; alreadyDone: boolean; status?: AttemptStatus };

/**
 * Finalise an attempt exactly once (idempotent, race-safe). `auto` distinguishes a
 * timer/expiry submission (AUTO_SUBMITTED) from a manual one (SUBMITTED). Scores
 * every answer, persists per-answer correctness, and writes the Result.
 */
export async function finalizeAttempt(
  attemptId: string,
  opts: { auto: boolean },
): Promise<FinalizeOutcome> {
  const targetStatus: AttemptStatus = opts.auto ? 'AUTO_SUBMITTED' : 'SUBMITTED';

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        questionOrder: true,
        studentId: true,
        seed: true,
        shuffleOptions: true,
        test: { select: { title: true } },
      },
    });
    if (!attempt) return { ok: false, alreadyDone: false };
    if (attempt.status !== ACTIVE) return { ok: true, alreadyDone: true, status: attempt.status };

    // Claim the attempt — only the first finaliser flips it out of IN_PROGRESS.
    const claim = await tx.testAttempt.updateMany({
      where: { id: attemptId, status: ACTIVE },
      data: { status: targetStatus, submittedAt: new Date(), remainingSeconds: 0 },
    });
    if (claim.count === 0) {
      const fresh = await tx.testAttempt.findUnique({ where: { id: attemptId }, select: { status: true } });
      return { ok: true, alreadyDone: true, status: fresh?.status };
    }

    const orderIds = attempt.questionOrder;
    const [questionRows, answerRows] = await Promise.all([
      tx.question.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          subjectId: true,
          chapterId: true,
          questionType: true,
          translations: {
            where: { language: 'en' },
            select: { correctOption: true, optionA: true, optionB: true, optionC: true, optionD: true },
          },
        },
      }),
      tx.answer.findMany({
        where: { attemptId },
        select: { questionId: true, selectedOption: true, timeSpentSeconds: true },
      }),
    ]);

    const qById = new Map(questionRows.map((q) => [q.id, q]));
    const questions: ResultQuestion[] = orderIds
      .map((id) => {
        const q = qById.get(id);
        const tr = q?.translations[0];
        if (!q || !tr?.correctOption) return null;
        // Answers were recorded in DISPLAY space, so map the canonical correct
        // option through the same per-attempt shuffle before comparing.
        const shuffle = attempt.shuffleOptions && canShuffleOptions(tr, q.questionType);
        const order = optionDisplayOrder(attempt.seed, q.id, shuffle);
        const displayCorrect = canonicalToDisplay(order, tr.correctOption as OptLetter);
        return { id: q.id, subjectId: q.subjectId, chapterId: q.chapterId, correctOption: displayCorrect as ScoredOption };
      })
      .filter((q): q is ResultQuestion => q !== null);

    const answers: Record<string, { selectedOption: ScoredOption | null; timeSpentSeconds: number }> = {};
    for (const a of answerRows) {
      answers[a.questionId] = { selectedOption: a.selectedOption, timeSpentSeconds: a.timeSpentSeconds };
    }

    const result = computeResult(questions, answers);

    // Persist per-answer correctness (only for questions that have an Answer row).
    const answered = new Set(answerRows.map((a) => a.questionId));
    for (const pq of result.perQuestion) {
      if (!answered.has(pq.questionId)) continue;
      await tx.answer.updateMany({
        where: { attemptId, questionId: pq.questionId },
        data: { isCorrect: pq.isCorrect },
      });
    }

    await tx.result.create({
      data: {
        attemptId,
        totalQuestions: result.totalQuestions,
        correct: result.correct,
        wrong: result.wrong,
        skipped: result.skipped,
        score: result.score,
        chapterAnalysis: result.chapterAnalysis as unknown as Prisma.InputJsonValue,
        subjectAnalysis: result.subjectAnalysis as unknown as Prisma.InputJsonValue,
        timeAnalysis: result.timeAnalysis as unknown as Prisma.InputJsonValue,
      },
    });

    // Notify the student their result is ready (linked to the result page).
    await tx.notification.create({
      data: buildResultNotificationData({ studentId: attempt.studentId, attemptId, title: attempt.test.title }),
    });

    return { ok: true, alreadyDone: false, status: targetStatus };
  });
}
