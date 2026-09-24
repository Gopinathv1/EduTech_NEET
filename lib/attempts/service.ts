import { randomUUID } from 'node:crypto';
import { FREE_ATTEMPT_LIMIT, validFullMock } from './config';
import { examPaidRetriesEnabled } from './paid-retries';
export { FREE_ATTEMPT_LIMIT } from './config';
import { Prisma, type AttemptStatus } from '@prisma/client';
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
import { isFreeSampleTest } from '@/lib/content/eligibility';

/**
 * Server-side orchestration for a test attempt: starting/resuming, building the
 * exam payload (questions in both available languages), and finalising into a
 * Result. All time authority and re-attempt rules live here so the API routes and
 * the exam page share one implementation.
 */

export type StartOutcome =
  | { ok: true; attemptId: string; resumed: boolean }
  | { ok: false; code: 'notFound' | 'languageUnavailable' | 'paymentRequired' | 'questionSetUnavailable' | 'generationFailed'; attemptId?: string };

const ACTIVE: AttemptStatus = 'IN_PROGRESS';


export async function getFreeAttemptSummary(studentId: string, testId: string) {
  const used = await prisma.testAttempt.count({ where: { studentId, testId } });
  return {
    used,
    limit: examPaidRetriesEnabled() ? FREE_ATTEMPT_LIMIT : null,
    remaining: examPaidRetriesEnabled() ? Math.max(FREE_ATTEMPT_LIMIT - used, 0) : null,
  };
}

/**
 * Start a fresh attempt or resume the student's in-progress one. Starting a new
 * attempt consumes one of the student's free attempts for this test.
 */
export async function startOrResumeAttempt(
  studentId: string,
  testId: string,
  language: 'en' | 'ta' | 'hi',
): Promise<StartOutcome> {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || !test.isPublished || (test.contentClass && test.contentClass !== 'PRODUCTION' && !isFreeSampleTest(test))) return { ok: false, code: 'notFound' };
  // Generate before insertion: a partially generated session is never visible.
  const existing = await prisma.testAttempt.findFirst({
    where: { studentId, testId, status: ACTIVE }, orderBy: { createdAt: 'desc' },
  });
  if (existing) return { ok: true, attemptId: existing.id, resumed: true };
  if (!(test.availableLanguages.length ? test.availableLanguages : ['en']).includes(language)) {
    return { ok: false, code: 'languageUnavailable' };
  }
  if (!validFullMock(test)) return { ok: false, code: 'generationFailed' };
  const seed = randomUUID();
  let questionIds: string[];
  try {
    ({ questionIds } = await generateForAttempt(testId, language, seed));
    if (!questionIds.length) throw new GeneratorError('Empty question set');
  } catch (error) {
    if (error instanceof GeneratorError) {
      // A test must keep its configured question count and duration. Never
      // silently shorten a practice paper just because its eligible pool is
      // temporarily smaller than the published configuration.
      return { ok: false, code: 'questionSetUnavailable' };
    }
    throw error;
  }
  for (let retry = 0; retry < 5; retry++) {
    try {
      return await prisma.$transaction(async (tx): Promise<StartOutcome> => {
        const active = await tx.testAttempt.findFirst({
          where: { studentId, testId, status: ACTIVE }, orderBy: { createdAt: 'desc' },
        });
        if (active) return { ok: true, attemptId: active.id, resumed: true };
        const used = await tx.testAttempt.count({ where: { studentId, testId } });
        let creditId: string | null = null;
        if (examPaidRetriesEnabled() && !isFreeSampleTest(test) && used >= FREE_ATTEMPT_LIMIT) {
          const credit = await tx.paidAttemptCredit.findFirst({ where: { studentId, testId, consumedAt: null, attemptId: null }, orderBy: { createdAt: 'asc' } });
          if (!credit) return { ok: false, code: 'paymentRequired' };
          creditId = credit.id;
        }
        const attempt = await tx.testAttempt.create({
          data: { studentId, testId, selectedLanguage: language,
            remainingSeconds: test.durationMinutes * 60, status: ACTIVE,
            shuffleOptions: true, questionOrder: questionIds, seed },
          select: { id: true },
        });
        if (creditId) await tx.paidAttemptCredit.update({ where: { id: creditId }, data: { attemptId: attempt.id, consumedAt: new Date() } });
        return { ok: true, attemptId: attempt.id, resumed: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && retry < 4) continue;
      throw error;
    }
  }
  return { ok: false, code: 'paymentRequired' };
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
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
};

export type ExamQuestion = {
  id: string;
  order: number;
  questionType: string;
  imageUrl: string | null;
  subjectCode: string;
  en: ExamQuestionContent;
  /** Reviewed Tamil content, or null when the question has no reviewed Tamil. */
  ta: ExamQuestionContent | null;
  hi: ExamQuestionContent | null;
};

export type ExamAnswerState = {
  selectedOption: ScoredOption | null;
  numericResponse: number | null;
  markedForReview: boolean;
  visited: boolean;
};

export type ExamPayload = {
  attemptId: string;
  testTitle: unknown; // { en, ta } Json — localized in the page
  availableLanguages: string[];
  selectedLanguage: 'en' | 'ta' | 'hi';
  remainingSeconds: number;
  status: AttemptStatus;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerState>;
};

function pickContent(t: {
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
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
        subject: { select: { code: true } },
        translations: {
          where: { language: { in: ['en', 'ta', 'hi'] } },
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
      select: { questionId: true, selectedOption: true, numericResponse: true, isMarkedForReview: true, visited: true },
    }),
  ]);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const examQuestions: ExamQuestion[] = [];
  orderIds.forEach((id, index) => {
    const q = byId.get(id);
    if (!q) throw new Error('Attempt question missing');
    const en = q.translations.find((tr) => tr.language === 'en');
    const hi = q.translations.find(tr => tr.language === 'hi' && tr.reviewed);
    const ta = q.translations.find((tr) => tr.language === 'ta' && tr.reviewed);
    if (!en) throw new Error('Attempt question has no English content');

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
      subjectCode: q.subject.code,
      en: applyDisplayOrder(enContent, order),
      ta: taContent ? applyDisplayOrder(taContent, order) : null,
      hi: hi ? applyDisplayOrder(pickContent(hi), order) : null,
    });
  });

  const answerMap: Record<string, ExamAnswerState> = {};
  for (const a of answers) {
    answerMap[a.questionId] = {
      selectedOption: a.selectedOption,
      numericResponse: a.numericResponse === null ? null : Number(a.numericResponse),
      markedForReview: a.isMarkedForReview,
      visited: a.visited,
    };
  }

  const selectedLanguage = attempt.selectedLanguage === 'hi' ? 'hi' : attempt.selectedLanguage === 'ta' ? 'ta' : 'en';

  return {
    attemptId: attempt.id,
    testTitle: attempt.test.title,
    availableLanguages: ['en', 'ta', 'hi'].filter(code => examQuestions.every(q => q[code as 'en' | 'ta' | 'hi'] !== null)),
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
            select: { correctOption: true, numericAnswer: true, numericTolerance: true, optionA: true, optionB: true, optionC: true, optionD: true },
          },
        },
      }),
      tx.answer.findMany({
        where: { attemptId },
        select: { questionId: true, selectedOption: true, numericResponse: true, timeSpentSeconds: true },
      }),
    ]);

    const qById = new Map(questionRows.map((q) => [q.id, q]));
    const questions: ResultQuestion[] = orderIds
      .map((id) => {
        const q = qById.get(id);
        const tr = q?.translations[0];
        if (!q || !tr) throw new Error('Cannot finalize: a frozen question or answer key is missing');
        if (q.questionType === 'NUMERICAL_VALUE') {
          if (tr.numericAnswer === null) throw new Error('Cannot finalize: a numerical answer key is missing');
          return {
            id: q.id, subjectId: q.subjectId, chapterId: q.chapterId,
            questionType: 'NUMERICAL_VALUE' as const, correctOption: null,
            numericAnswer: Number(tr.numericAnswer), numericTolerance: Number(tr.numericTolerance ?? 0),
          };
        }
        if (!tr.correctOption) throw new Error('Cannot finalize: an MCQ answer key is missing');
        // Answers were recorded in DISPLAY space, so map the canonical correct
        // option through the same per-attempt shuffle before comparing.
        const shuffle = attempt.shuffleOptions && canShuffleOptions(tr, q.questionType);
        const order = optionDisplayOrder(attempt.seed, q.id, shuffle);
        const displayCorrect = canonicalToDisplay(order, tr.correctOption as OptLetter);
        return { id: q.id, subjectId: q.subjectId, chapterId: q.chapterId, questionType: q.questionType, correctOption: displayCorrect as ScoredOption };
      });

    const answers: Record<string, { selectedOption: ScoredOption | null; numericResponse: number | null; timeSpentSeconds: number }> = {};
    for (const a of answerRows) {
      answers[a.questionId] = { selectedOption: a.selectedOption, numericResponse: a.numericResponse === null ? null : Number(a.numericResponse), timeSpentSeconds: a.timeSpentSeconds };
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
