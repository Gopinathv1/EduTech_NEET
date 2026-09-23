import { OFFICIAL_EXAM_SOURCES } from './official-sources';

export const CURRENT_EXAM_STRUCTURES = {
  NEET: {
    version: 'NEET_UG_2026',
    sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_BULLETIN,
    durationMinutes: 180,
    totalQuestions: 180,
    questionTypes: ['SINGLE_CORRECT'] as const,
    marking: { correct: 4, incorrect: -1, unanswered: 0 },
    subjectCounts: { PHYSICS: 45, CHEMISTRY: 45, BIOLOGY: 90 },
    applicationSubjectMapping: { BIOLOGY: ['BOTANY', 'ZOOLOGY'] as const },
  },
  JEE_MAIN_PAPER_1: {
    version: 'JEE_MAIN_2026_PAPER_1',
    sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_BULLETIN,
    durationMinutes: 180,
    totalQuestions: 75,
    questionTypes: ['SINGLE_CORRECT', 'NUMERICAL_VALUE'] as const,
    marking: { correct: 4, incorrect: -1, unanswered: 0 },
    perSubject: { mcq: 20, numerical: 5, total: 25 },
    subjects: ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'] as const,
  },
} as const;
