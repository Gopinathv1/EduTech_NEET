import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { ScoredOption } from '@/lib/attempts/result';
import {
  canShuffleOptions,
  optionDisplayOrder,
  applyDisplayOrder,
  canonicalToDisplay,
  type OptLetter,
} from '@/lib/attempts/options';
import type { LocalizedText } from '@/lib/recommendations/types';

/**
 * Per-question answer review for a submitted attempt. Loads both English and
 * reviewed-Tamil content so the client can render in the student's preferred
 * language and fall back to English (with a notice) when a reviewed Tamil
 * translation is missing.
 */

export type ReviewContent = {
  questionText: string;
  options: Record<ScoredOption, string>;
  explanation: string | null;
};

export type ReviewStatus = 'correct' | 'wrong' | 'skipped';

export type ReviewItem = {
  number: number;
  questionId: string;
  subjectCode: string;
  chapterName: LocalizedText;
  questionType: string;
  imageUrl: string | null;
  en: ReviewContent;
  /** Reviewed Tamil content, or null when unavailable (client shows EN + notice). */
  ta: ReviewContent | null;
  correctOption: ScoredOption;
  selectedOption: ScoredOption | null;
  isCorrect: boolean | null;
  marked: boolean;
  status: ReviewStatus;
};

type TranslationRow = {
  language: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: ScoredOption;
  explanation: string | null;
  reviewed: boolean;
};

function toContent(t: TranslationRow): ReviewContent {
  return {
    questionText: t.questionText,
    options: { A: t.optionA, B: t.optionB, C: t.optionC, D: t.optionD },
    explanation: t.explanation,
  };
}

/** Build the ordered answer-review list, or null if the attempt has no result. */
export async function buildAnswerReview(attemptId: string, studentId: string): Promise<ReviewItem[] | null> {
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId },
    select: { id: true, status: true, questionOrder: true, seed: true, shuffleOptions: true },
  });
  if (!attempt || attempt.status === 'IN_PROGRESS') return null;

  const orderIds = attempt.questionOrder;

  const [questions, answers, subjects] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        subjectId: true,
        questionType: true,
        imageUrl: true,
        chapter: { select: { name: true } },
        translations: {
          where: { language: { in: ['en', 'ta'] } },
          select: {
            language: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctOption: true,
            explanation: true,
            reviewed: true,
          },
        },
      },
    }),
    prisma.answer.findMany({
      where: { attemptId },
      select: { questionId: true, selectedOption: true, isCorrect: true, isMarkedForReview: true },
    }),
    prisma.subject.findMany({ select: { id: true, code: true } }),
  ]);

  const codeBySubject = new Map(subjects.map((s) => [s.id, s.code]));
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const items: ReviewItem[] = [];
  orderIds.forEach((id, index) => {
    const q = questionById.get(id);
    if (!q) return;
    const enRaw = q.translations.find((t) => t.language === 'en') as TranslationRow | undefined;
    if (!enRaw) return; // English is authoritative
    const taRaw = q.translations.find((t) => t.language === 'ta' && t.reviewed) as TranslationRow | undefined;

    // Reconstruct the same per-attempt option order the student saw, so the
    // review shows options (and the correct/your-answer markers) in display space.
    const shuffle = attempt.shuffleOptions && canShuffleOptions(enRaw, q.questionType);
    const order = optionDisplayOrder(attempt.seed, id, shuffle);
    const en = applyDisplayOrder(enRaw, order);
    const taReviewed = taRaw ? applyDisplayOrder(taRaw, order) : undefined;
    const correctOption = canonicalToDisplay(order, enRaw.correctOption as OptLetter) as ScoredOption;

    const a = answerByQuestion.get(id);
    const selectedOption = (a?.selectedOption ?? null) as ScoredOption | null;
    const status: ReviewStatus =
      selectedOption === null ? 'skipped' : selectedOption === correctOption ? 'correct' : 'wrong';

    items.push({
      number: index + 1,
      questionId: id,
      subjectCode: codeBySubject.get(q.subjectId) ?? '',
      chapterName: { en: localizedName(q.chapter.name, 'en'), ta: localizedName(q.chapter.name, 'ta') || undefined },
      questionType: q.questionType,
      imageUrl: q.imageUrl,
      en: toContent(en),
      ta: taReviewed ? toContent(taReviewed) : null,
      correctOption,
      selectedOption,
      isCorrect: a?.isCorrect ?? (selectedOption === null ? null : selectedOption === correctOption),
      marked: a?.isMarkedForReview ?? false,
      status,
    });
  });

  return items;
}
