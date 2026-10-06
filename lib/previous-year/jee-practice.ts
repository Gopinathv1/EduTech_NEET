import { JEE_MAIN_CONFIG } from '@/lib/attempts/config';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import { GeneratorError, type GeneratorQuestion } from '@/lib/generator';
import { generateBalancedHistoricalSet } from '@/lib/generator/historical';
import type { JeeHistoricalQuestion } from './jee-dataset';

export const JEE_SUBJECTS = ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'] as const;
export const JEE_YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const subjectName = (code: string) => code.replace('JEE_', '').toLowerCase().replace(/^./, letter => letter.toUpperCase());

export type JeePracticePlan = {
  id: string; title: string; description: string;
  testType: 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST' | 'YEAR_PATTERN';
  totalQuestions: number; durationMinutes: number; isRandom: boolean;
  externalIds: string[]; subjectCode?: string; chapterSlug?: string;
  rules: Record<string, unknown>;
};

/** Plan from canonical artifacts before any production row exists. */
export function buildJeePracticePlans(questions: readonly JeeHistoricalQuestion[]): JeePracticePlan[] {
  if (!questions.length || new Set(questions.map(row => row.externalId)).size !== questions.length) throw new Error('Invalid JEE practice selection.');
  const plans: JeePracticePlan[] = [];
  const add = (rows: readonly JeeHistoricalQuestion[], plan: Omit<JeePracticePlan, 'externalIds' | 'rules'> & { rules: Record<string, unknown> }) => {
    if (!rows.length || plan.totalQuestions < 1) throw new Error(`Empty JEE practice: ${plan.id}`);
    plans.push({ ...plan, externalIds: rows.map(row => row.externalId), rules: {
      ...plan.rules, exam: 'JEE', sourceType: 'HISTORICAL_VERIFIED',
      scoring: { correct: 4, incorrect: -1, unanswered: 0 }, payment: 'NONE', retake: 'FREE_UNLIMITED',
      historical: { exam: 'JEE', years: [...new Set(rows.map(row => row.year))].sort(),
        sourceType: 'HISTORICAL_VERIFIED', externalIds: rows.map(row => row.externalId), balanceYears: true },
    } });
  };
  for (const paperId of [...new Set(questions.map(row => row.paperId))].sort()) {
    const rows = questions.filter(row => row.paperId === paperId).sort((a, b) => a.sourceOrder - b.sourceOrder);
    const paper = rows[0];
    add(rows, { id: `${paperId}-verified-partial`, title: `JEE Main ${paper.year} · Session ${paper.session} · ${paper.examDate} · Shift ${paper.shift} — Verified partial practice`,
      description: `${rows.length} individually verified questions in source order. This is a partial historical shift practice.`,
      testType: 'YEAR_PATTERN', totalQuestions: rows.length, durationMinutes: Math.ceil(rows.length * 2.4), isRandom: false,
      rules: { previousYearMode: 'HISTORICAL_SHIFT', paperIdentity: { year: paper.year, session: paper.session,
        examDate: paper.examDate, shift: paper.shift, regionVariant: paper.regionVariant, paperId }, completeness: 'PARTIAL_VERIFIED_PRACTICE' } });
  }
  for (const year of JEE_YEARS) {
    const rows = questions.filter(row => row.year === year).sort((a, b) => a.paperId.localeCompare(b.paperId) || a.sourceOrder - b.sourceOrder);
    add(rows, { id: `jee-pyq-${year}-year-practice`, title: `JEE Main ${year} — Year-wise verified practice`,
      description: `A ${rows.length}-question year aggregate drawn from selected verified shifts; not a complete historical paper.`,
      testType: 'YEAR_PATTERN', totalQuestions: rows.length, durationMinutes: Math.ceil(rows.length * 2.4), isRandom: false,
      rules: { previousYearMode: 'YEAR_WISE', year, completeness: 'PARTIAL_VERIFIED_PRACTICE' } });
  }
  for (const subject of JEE_SUBJECTS) {
    for (const type of ['SINGLE_CORRECT', 'NUMERICAL_VALUE'] as const) {
      const needed = type === 'SINGLE_CORRECT' ? 20 : 5;
      if (questions.filter(row => row.subjectCode === subject && row.questionType === type).length < needed) throw new Error(`Insufficient mixed JEE pool: ${subject}/${type}`);
    }
  }
  add(questions, { id: 'jee-pyq-mixed-2021-2025', title: 'JEE Main Mixed Previous-Year Practice 2021–2025',
    description: '75 verified historical questions: 20 MCQs and 5 numerical-value questions per subject, balanced across years where available.',
    testType: 'FULL_TEST', totalQuestions: JEE_MAIN_CONFIG.totalQuestions, durationMinutes: JEE_MAIN_CONFIG.durationMinutes,
    isRandom: true, rules: { previousYearMode: 'MIXED_FIVE_YEARS', random: { scope: 'FULL_SYLLABUS' } } });
  for (const period of [...JEE_YEARS, 'mixed' as const]) {
    const periodRows = questions.filter(row => period === 'mixed' || row.year === period);
    for (const subjectCode of JEE_SUBJECTS) {
      const rows = periodRows.filter(row => row.subjectCode === subjectCode);
      if (!rows.length) continue;
      const label = period === 'mixed' ? '2021–2025' : String(period);
      const base = { previousYearMode: 'SUBJECT_CHAPTER', practiceSource: period === 'mixed' ? 'MIXED_2021_2025' : `YEAR_${period}`, subjectCode };
      add(rows, { id: `jee-pyq-${period}-${subjectCode.toLowerCase()}`, title: `JEE Main ${label} ${subjectName(subjectCode)} Practice`,
        description: `All ${rows.length} verified ${subjectName(subjectCode)} questions for ${label}, with shuffled order.`,
        testType: 'SUBJECT_TEST', totalQuestions: rows.length, durationMinutes: Math.ceil(rows.length * 2.4), isRandom: true, subjectCode,
        rules: { ...base, filterLevel: 'SUBJECT', random: { scope: 'SUBJECTS' } } });
      for (const chapterSlug of [...new Set(rows.map(row => row.chapterSlug))].sort()) {
        const chapterRows = rows.filter(row => row.chapterSlug === chapterSlug);
        const chapter = QUESTION_BANK_V1_TAXONOMY.find(unit => unit.exam === 'JEE' && unit.subjectCode === subjectCode && unit.unitSlug === chapterSlug);
        if (!chapter) throw new Error(`Noncanonical practice chapter: ${chapterSlug}`);
        add(chapterRows, { id: `jee-pyq-${period}-${chapterSlug}`, title: `JEE Main ${label} ${chapter.unitName} Practice`,
          description: `All ${chapterRows.length} verified ${chapter.unitName} questions for ${label}, with shuffled order.`,
          testType: 'CHAPTER_TEST', totalQuestions: chapterRows.length, durationMinutes: Math.ceil(chapterRows.length * 2.4), isRandom: true,
          subjectCode, chapterSlug, rules: { ...base, filterLevel: 'CHAPTER', chapterSlug, random: { scope: 'CHAPTERS' } } });
      }
    }
  }
  if (new Set(plans.map(plan => plan.id)).size !== plans.length) throw new Error('Duplicate JEE practice IDs.');
  return plans;
}

export type JeeGeneratorQuestion = GeneratorQuestion & { questionType: string; subjectCode: string };
export function selectJeeHistoricalPool(pool: JeeGeneratorQuestion[], mixed: boolean, seed: string) {
  if (!pool.length) throw new GeneratorError('No validated questions available for this filter.');
  const select = (rows: JeeGeneratorQuestion[], count: number, group: string) => {
    if (rows.length < count) throw new GeneratorError(`Insufficient verified JEE pool for ${group}.`);
    const ids = [...new Set(rows.map(row => row.subjectId))].sort();
    return generateBalancedHistoricalSet({ totalQuestions: count, language: 'en', difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 },
      pool: rows, subjects: ids.map(subjectId => ({ subjectId, count: rows.filter(row => row.subjectId === subjectId).length, chapters: [] }))
        .map(quota => ({ ...quota, count: ids.length === 1 ? count : quota.count })) },
      [...new Set(rows.map(row => row.year).filter((year): year is number => year !== null && year !== undefined))].sort(), `${seed}:${group}`);
  };
  if (!mixed) return select(pool, pool.length, 'practice');
  const questionIds: string[] = []; const warnings: string[] = [];
  for (const subject of JEE_SUBJECTS) {
    for (const type of ['SINGLE_CORRECT', 'NUMERICAL_VALUE']) {
      const result = select(pool.filter(row => row.subjectCode === subject && row.questionType === type), type === 'SINGLE_CORRECT' ? 20 : 5, `${subject}:${type}`);
      questionIds.push(...result.questionIds); warnings.push(...result.warnings);
    }
  }
  return { questionIds, warnings };
}
