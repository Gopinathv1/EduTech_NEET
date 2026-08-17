/** Shared types for the (pure, rule-based) recommendation engine. */

export type LocalizedText = { en: string; ta?: string };

export type ChapterTrend = 'declining' | 'improving' | 'flat';

/** Aggregated performance for one chapter across all of a student's attempts. */
export type ChapterPerf = {
  chapterId: string;
  subjectCode: string;
  name: LocalizedText;
  /** NEET weightage % of the chapter (drives "high weightage first"). */
  weightage: number;
  attempted: number; // correct + wrong summed across attempts
  correct: number;
  accuracy: number; // 0–100 over attempted
  testsCount: number; // how many attempts touched this chapter
  trend: ChapterTrend;
  /** Chapter-level average seconds per question, or null if time is unknown. */
  avgSecondsPerQuestion: number | null;
};

export type RecommendationKind = 'weakChapter' | 'decliningChapter' | 'slowAccurate';

export type Recommendation = {
  chapterId: string;
  subjectCode: string;
  name: LocalizedText;
  kind: RecommendationKind;
  /** Priority group (1 = highest). Lower sorts first. */
  group: number;
  accuracy: number;
  attempted: number;
  testsCount: number;
  weightage: number;
  avgSecondsPerQuestion: number | null;
  /**
   * Reason as a code + numeric params so the UI renders it bilingually (the
   * chapter name is localized at render time from `name`).
   */
  reason: { code: RecommendationKind; accuracy: number; tests: number };
};
