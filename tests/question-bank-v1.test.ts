import { describe, expect, it } from 'vitest';
import { CURRENT_EXAM_STRUCTURES } from '@/lib/question-bank/exam-structures';
import { officialExternalId, sivoraExternalId } from '@/lib/question-bank/identity';
import { isAllowedOfficialSource } from '@/lib/question-bank/official-sources';
import { planPracticeQuestionIds } from '@/lib/question-bank/practice';
import { evaluateCandidateFullMockReadiness, evaluateFullMockReadiness, evaluatePracticeReadiness, readinessCounts, type EligibleQuestionRecord } from '@/lib/question-bank/readiness';
import { QUESTION_BANK_V1_TAXONOMY, validateTaxonomy } from '@/lib/question-bank/taxonomy';
import { validateQuestionBank, type BankQuestion } from '@/lib/question-bank/validator';

const record = (id: string, overrides: Partial<EligibleQuestionRecord> = {}): EligibleQuestionRecord => ({
  id, exam: 'NEET', subjectCode: 'PHYSICS', chapterSlug: 'physics-gravitation', topic: 'satellites', sourceType: 'SIVORA_AUTHORED', eligible: true, ...overrides,
});

const question = (overrides: Partial<BankQuestion> = {}): BankQuestion => ({
  externalId: 'sivora-authored:test-1', exam: 'NEET', subjectCode: 'PHYSICS', chapterSlug: 'physics-gravitation', topic: 'satellites', difficulty: 'EASY', questionType: 'SINGLE_CORRECT', questionText: 'Which force keeps a satellite in orbit?', options: ['Gravity', 'Friction', 'Buoyancy', 'Magnetism'], correctOption: 'A', explanation: 'Gravity provides centripetal force.', sourceType: 'SIVORA_AUTHORED', sourceName: 'SIVORA Practice', status: 'DRAFT', contentClass: 'SAMPLE', ...overrides,
});

describe('question bank V1 sources and identity', () => {
  it('allows only approved HTTPS official hosts', () => {
    expect(isAllowedOfficialSource('https://neet.nta.nic.in/')).toBe(true);
    expect(isAllowedOfficialSource('https://cdnbbsr.s3waas.gov.in/file.pdf')).toBe(true);
    expect(isAllowedOfficialSource('http://neet.nta.nic.in/file.pdf')).toBe(false);
    expect(isAllowedOfficialSource('https://neet.nta.nic.in.evil.example/file.pdf')).toBe(false);
    expect(isAllowedOfficialSource('https://example.com/file.pdf')).toBe(false);
  });

  it('builds deterministic identities without depending on question text', () => {
    const identity = { exam: 'JEE' as const, year: 2026, session: 'April Shift 1', paper: 'Paper 1', questionNumber: 17 };
    expect(officialExternalId(identity)).toBe(officialExternalId(identity));
    expect(officialExternalId(identity)).not.toBe(officialExternalId({ ...identity, questionNumber: 18 }));
    expect(sivoraExternalId('NEET:gravitation:pilot:1')).toBe(sivoraExternalId('NEET:gravitation:pilot:1'));
  });
});

describe('question bank V1 taxonomy and official structures', () => {
  it('has unique stable taxonomy identities', () => {
    expect(validateTaxonomy()).toEqual([]);
    expect(QUESTION_BANK_V1_TAXONOMY.some((entry) => entry.subjectCode === 'BOTANY')).toBe(true);
    expect(QUESTION_BANK_V1_TAXONOMY.some((entry) => entry.subjectCode === 'ZOOLOGY')).toBe(true);
    const gravitation = QUESTION_BANK_V1_TAXONOMY.find((entry) => entry.unitSlug === 'physics-gravitation');
    expect(gravitation?.topicSlugs).toEqual(expect.arrayContaining(['keplers-laws', 'gravitational-potential', 'escape-velocity', 'satellite-motion']));
  });

  it.each([
    ['NEET', 'PHYSICS', 'physics-optics', 'ray-optics'],
    ['NEET', 'CHEMISTRY', 'chemistry-coordination-compounds', 'bonding'],
    ['NEET', 'BOTANY', 'biology-plant-physiology', 'photosynthesis'],
    ['NEET', 'ZOOLOGY', 'biology-reproduction', 'human-reproduction'],
    ['JEE', 'JEE_PHYSICS', 'jee-physics-electrostatics', 'electric-charge-field'],
    ['JEE', 'JEE_CHEMISTRY', 'jee-chemistry-chemical-kinetics', 'rate-law'],
    ['JEE', 'JEE_MATHEMATICS', 'jee-mathematics-integral-calculus', 'definite-integrals'],
  ] as const)('accepts expanded %s %s taxonomy: %s/%s', (exam, subjectCode, chapterSlug, topic) => {
    const identityKey = `${exam}:${subjectCode}:${chapterSlug}:${topic}:test`;
    expect(validateQuestionBank([question({
      identityKey,
      externalId: sivoraExternalId(identityKey),
      exam,
      subjectCode,
      chapterSlug,
      topic,
      status: 'REVIEW',
      reviewState: 'REVIEW_REQUIRED',
      contentClass: 'PRODUCTION',
    })])).toEqual([]);
  });

  it('continues to reject an unknown expanded-taxonomy chapter and topic', () => {
    const issues = validateQuestionBank([question({ chapterSlug: 'physics-not-real', topic: 'invented-topic' })]);
    expect(issues.map((issue) => issue.code)).toContain('unsupported_taxonomy');
  });

  it('pins the verified current full-mock structures', () => {
    expect(CURRENT_EXAM_STRUCTURES.NEET).toMatchObject({ totalQuestions: 180, durationMinutes: 180, marking: { correct: 4, incorrect: -1 } });
    expect(CURRENT_EXAM_STRUCTURES.JEE_MAIN_PAPER_1).toMatchObject({ totalQuestions: 75, durationMinutes: 180, perSubject: { mcq: 20, numerical: 5, total: 25 } });
  });
});

describe('question validation', () => {
  it('accepts original SIVORA draft content', () => expect(validateQuestionBank([question()])).toEqual([]));

  it('rejects malformed answers, duplicate options, duplicate content, and missing taxonomy', () => {
    const issues = validateQuestionBank([
      question({ externalId: 'a', chapterSlug: '', options: ['Same', 'Same', 'C', 'D'], correctOption: 'E' }),
      question({ externalId: 'b' }),
      question({ externalId: 'c' }),
    ]);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['missing_chapter', 'duplicate_options', 'invalid_answer', 'duplicate_question']));
  });

  it('enforces official provenance and review metadata', () => {
    const issues = validateQuestionBank([question({ sourceType: 'OFFICIAL_NTA', sourceName: 'NTA', sourceUrl: 'https://example.com/paper.pdf', status: 'PUBLISHED', contentClass: 'PRODUCTION' })]);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['invalid_official_source', 'incomplete_official_identity', 'incomplete_review']));
  });

  it('accepts a real numerical question and rejects fake numerical MCQs', () => {
    expect(validateQuestionBank([question({ questionType: 'NUMERICAL_VALUE', options: [], correctOption: undefined, numericAnswer: 42 })])).toEqual([]);
    const issues = validateQuestionBank([question({ questionType: 'NUMERICAL_VALUE', numericAnswer: 42 })]);
    expect(issues.map((issue) => issue.code)).toContain('numerical_fake_mcq');
  });

  it('checks supplied deterministic SIVORA identities and review states', () => {
    const identityKey = 'NEET:Physics:Gravitation:review-candidate';
    expect(validateQuestionBank([question({ identityKey, externalId: sivoraExternalId(identityKey), status: 'REVIEW', reviewState: 'REVIEW_REQUIRED', contentClass: 'PRODUCTION' })])).toEqual([]);
    expect(validateQuestionBank([question({ identityKey, externalId: 'sivora-authored:not-a-match' })]).map((issue) => issue.code)).toContain('invalid_external_id');
  });
});

describe('readiness and practice planning', () => {
  const records = [record('p1'), record('p2'), record('c1', { subjectCode: 'CHEMISTRY', chapterSlug: 'chemistry-basic', topic: 'mole' }), record('draft', { eligible: false })];

  it('counts only eligible inventory by exam, subject, chapter, topic, year and source', () => {
    const counts = readinessCounts(records);
    expect(counts.total).toBe(3);
    expect(counts.bySubject['NEET:PHYSICS']).toBe(2);
    expect(counts.byChapter['NEET:CHEMISTRY:chemistry-basic']).toBe(1);
  });

  it.each([
    ['SUBJECT', { subjectCodes: ['PHYSICS'] }],
    ['CHAPTER', { chapterSlugs: ['physics-gravitation'] }],
    ['TOPIC', { topics: ['satellites'] }],
    ['PART', { chapterSlugs: ['physics-gravitation', 'chemistry-basic'] }],
    ['MIXED', {}],
  ] as const)('supports %s practice readiness', (mode, filters) => {
    expect(evaluatePracticeReadiness(records, { mode, exam: 'NEET', totalQuestions: 1, ...filters }).ready).toBe(true);
  });

  it('rejects full mocks when unique reviewed inventory is insufficient', () => {
    const result = evaluatePracticeReadiness(records, { mode: 'FULL_MOCK', exam: 'NEET', totalQuestions: 180, subjectQuotas: { PHYSICS: 45, CHEMISTRY: 45, BOTANY: 45, ZOOLOGY: 45 } });
    expect(result.ready).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/Not enough reviewed questions/);
  });

  it('treats Botany and Zoology as the official NEET Biology quota without imposing a split', () => {
    const biology = [record('botany', { subjectCode: 'BOTANY' }), record('zoology', { subjectCode: 'ZOOLOGY' })];
    const request = { mode: 'FULL_MOCK' as const, exam: 'NEET' as const, totalQuestions: 2, subjectQuotas: { BIOLOGY: 2 } };
    expect(evaluatePracticeReadiness(biology, request).ready).toBe(true);
    expect(planPracticeQuestionIds(biology, request, 'biology')).toHaveLength(2);
  });

  it('enforces official-only year-wise practice', () => {
    const yearRecords = [record('official', { year: 2025, sourceType: 'OFFICIAL_NTA' }), record('sivora', { year: 2025, sourceType: 'SIVORA_AUTHORED' })];
    const result = evaluatePracticeReadiness(yearRecords, { mode: 'YEAR', exam: 'NEET', year: 2025, totalQuestions: 2 });
    expect(result).toMatchObject({ ready: false, availableUnique: 1 });
  });

  it('never returns a duplicate question inside an attempt', () => {
    const ids = planPracticeQuestionIds([...records, record('p1')], { mode: 'MIXED', exam: 'NEET', totalQuestions: 3 }, 'attempt-1');
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('requires all six JEE MCQ/numerical quotas for a full mock', () => {
    const rows: EligibleQuestionRecord[] = [];
    for (const subjectCode of ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS']) {
      for (let i = 0; i < 20; i++) rows.push(record(`${subjectCode}-m-${i}`, { exam: 'JEE', subjectCode, questionType: 'SINGLE_CORRECT' }));
      for (let i = 0; i < 5; i++) rows.push(record(`${subjectCode}-n-${i}`, { exam: 'JEE', subjectCode, questionType: 'NUMERICAL_VALUE' }));
    }
    expect(evaluateFullMockReadiness(rows, 'JEE').ready).toBe(true);
    expect(evaluateFullMockReadiness(rows.slice(0, -1), 'JEE').ready).toBe(false);
  });

  it('distinguishes complete candidate inventory from approved production eligibility', () => {
    const rows: EligibleQuestionRecord[] = [];
    for (let i = 0; i < 45; i++) rows.push(record(`p-${i}`, { reviewState: 'REVIEW_REQUIRED', eligible: false }));
    for (let i = 0; i < 45; i++) rows.push(record(`c-${i}`, { subjectCode: 'CHEMISTRY', reviewState: 'REVIEW_REQUIRED', eligible: false }));
    for (let i = 0; i < 90; i++) rows.push(record(`b-${i}`, { subjectCode: i % 2 ? 'BOTANY' : 'ZOOLOGY', reviewState: 'REVIEW_REQUIRED', eligible: false }));
    expect(evaluateCandidateFullMockReadiness(rows, 'NEET').ready).toBe(true);
    expect(evaluateFullMockReadiness(rows, 'NEET').ready).toBe(false);
  });
});
