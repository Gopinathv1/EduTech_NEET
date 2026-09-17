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

export const FREE_ATTEMPT_LIMIT = 3;

export function validFullMock(test: { testType: string; totalQuestions: number; durationMinutes: number }) {
  return test.testType !== 'FULL_TEST' ||
    (test.totalQuestions === NEET_CONFIG.totalQuestions && test.durationMinutes === NEET_CONFIG.durationMinutes);
}
