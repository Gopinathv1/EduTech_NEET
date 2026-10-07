import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ questions: vi.fn(), answers: vi.fn(), attempt: vi.fn(), subjects: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { question: { findMany: mocked.questions }, answer: { findMany: mocked.answers }, testAttempt: { findFirst: mocked.attempt }, subject: { findMany: mocked.subjects } } }));
import { buildExamPayload } from '@/lib/attempts/service';
import { buildAnswerReview } from '@/lib/reports/answer-review';
import { canonicalContentHash } from '@/lib/question-translations/content';
const en = { language: 'en', questionText: 'Find 5 m/s.', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'B', numericAnswer: null, numericTolerance: null, explanation: 'English explanation', reviewed: true };
const ta = { ...en, language: 'ta', questionText: '5 m/s மதிப்பைக் காண்க.', explanation: null, reviewState: 'APPROVED', translationSource: 'SIVORA_TRANSLATION', reviewedById: 'editor', reviewedAt: new Date(), canonicalContentHash: canonicalContentHash('SINGLE_CORRECT', en) };
const q = { id: 'q1', questionType: 'SINGLE_CORRECT', imageUrl: null, subjectId: 's1', subject: { code: 'PHYSICS' }, chapter: { name: { en: 'Motion' } }, translations: [en, ta, { ...ta, language: 'hi', reviewState: 'REJECTED', reviewed: true }] };
const attempt = { id: 'attempt', selectedLanguage: 'en', remainingSeconds: 600, status: 'IN_PROGRESS' as const, questionOrder: ['q1'], seed: 'seed', shuffleOptions: true, startedAt: new Date(), test: { title: { en: 'Proof' }, availableLanguages: ['en'], durationMinutes: 10 } };
beforeEach(() => {
  vi.clearAllMocks(); mocked.questions.mockResolvedValue([q]); mocked.answers.mockResolvedValue([{ questionId: 'q1', selectedOption: 'A', numericResponse: null, isMarkedForReview: false, visited: true }]);
  mocked.attempt.mockResolvedValue({ ...attempt, status: 'SUBMITTED' }); mocked.subjects.mockResolvedValue([{ id: 's1', code: 'PHYSICS' }]);
});
describe('student exam and review content boundaries', () => {
  it('offers every content language with per-question fallback and never serializes correct answers or review metadata', async () => {
    const payload = await buildExamPayload(attempt);
    expect(payload.availableLanguages).toEqual(['en', 'ta', 'hi']); expect(payload.questions[0].ta?.questionText).toBe(ta.questionText); expect(payload.questions[0].hi).toBeNull();
    expect(JSON.stringify(payload)).not.toContain('correctOption'); expect(JSON.stringify(payload)).not.toContain('canonicalContentHash'); expect(JSON.stringify(payload)).not.toContain('numericAnswer');
    expect(payload.questions[0].en.optionA).toBe(payload.questions[0].ta?.optionA); expect(payload.answers.q1.selectedOption).toBe('A');
  });
  it('review uses canonical answers and the identical display permutation while filtering rejected wording', async () => {
    const exam = await buildExamPayload(attempt); const review = await buildAnswerReview('attempt', 'student');
    expect(review?.[0].ta?.questionText).toBe(ta.questionText); expect(review?.[0].hi).toBeNull();
    expect(review?.[0].en.options.A).toBe(exam.questions[0].en.optionA); expect(review?.[0].ta?.options.A).toBe(exam.questions[0].ta?.optionA);
  });
  it('numerical translations cannot replace canonical answers or introduce options', async () => {
    const numericEn = { ...en, correctOption: null, optionA: null, optionB: null, optionC: null, optionD: null, numericAnswer: 15, numericTolerance: 0 };
    mocked.questions.mockResolvedValue([{ ...q, questionType: 'NUMERICAL_VALUE', translations: [numericEn, { ...ta, ...numericEn, language: 'ta', questionText: ta.questionText, explanation: null, numericAnswer: 999,
      canonicalContentHash: canonicalContentHash('NUMERICAL_VALUE', numericEn) }] }]);
    const exam = await buildExamPayload(attempt); const review = await buildAnswerReview('attempt', 'student');
    expect(exam.questions[0].ta?.optionA).toBeNull(); expect(JSON.stringify(exam)).not.toContain('999'); expect(review?.[0].numericAnswer).toBe(15);
  });
});
