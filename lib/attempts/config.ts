/** NTA NEET (UG) 2026 Information Bulletin, chapter 4, pp. 21–22.
 * Verified 2026-09-17. Biology is officially 90 questions; the 45/45
 * Botany/Zoology subdivision is SIVORA's practice-paper convention.
 */
export const NEET_CONFIG = {
  version: 'NEET_UG_2026',
  source: 'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf',
  totalQuestions: 180,
  durationMinutes: 180,
  maximumMarks: 720,
  correct: 4,
  wrong: -1,
  unanswered: 0,
  questionType: 'SINGLE_CORRECT',
  subjects: ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'],
  questionsPerPracticeSubject: 45,
} as const;

/** JEE Main 2026 Information Bulletin, Paper 1 (B.E./B.Tech), pp. 16–17.
 * Section B numerical-value responses are entered as nearest integers.
 */
export const JEE_MAIN_CONFIG = {
  version: 'JEE_MAIN_2026_PAPER_1',
  source: 'https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/11/202511021649722475.pdf',
  totalQuestions: 75,
  durationMinutes: 180,
  maximumMarks: 300,
  correct: 4,
  wrong: -1,
  unanswered: 0,
  numericalResponsesAreIntegers: true,
} as const;

export const FREE_ATTEMPT_LIMIT = 3;

export function validFullMock(test: { testType: string; totalQuestions: number; durationMinutes: number; rules?: unknown }) {
  if (test.testType !== 'FULL_TEST') return true;
  const exam = test.rules && typeof test.rules === 'object' && 'exam' in test.rules
    ? (test.rules as { exam?: unknown }).exam : undefined;
  return test.durationMinutes === 180 && (exam === 'JEE' ? test.totalQuestions === 75 : test.totalQuestions === NEET_CONFIG.totalQuestions);
}
