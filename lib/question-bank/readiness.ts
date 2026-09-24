export type EligibleQuestionRecord = {
  id: string;
  exam: 'NEET' | 'JEE';
  subjectCode: string;
  chapterSlug: string;
  topic: string;
  year?: number | null;
  sourceType: string;
  questionType?: 'SINGLE_CORRECT' | 'IMAGE_BASED' | 'ASSERTION_REASON' | 'NUMERICAL_VALUE';
  reviewState?: 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED';
  eligible: boolean;
};

export type PracticeRequest = {
  mode: 'YEAR' | 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'PART' | 'MIXED' | 'FULL_MOCK';
  totalQuestions: number;
  exam: 'NEET' | 'JEE';
  subjectCodes?: readonly string[];
  chapterSlugs?: readonly string[];
  topics?: readonly string[];
  year?: number;
  subjectQuotas?: Record<string, number>;
};

/** NTA specifies one Biology quota; Botany/Zoology are SIVORA storage categories. */
export function matchesSubjectQuota(record: EligibleQuestionRecord, subject: string): boolean {
  return subject === 'BIOLOGY'
    ? record.subjectCode === 'BOTANY' || record.subjectCode === 'ZOOLOGY'
    : record.subjectCode === subject;
}

export function readinessCounts(records: readonly EligibleQuestionRecord[]) {
  const eligible = records.filter((record) => record.eligible);
  const group = (key: (record: EligibleQuestionRecord) => string) => {
    const result: Record<string, number> = {};
    for (const record of eligible) result[key(record)] = (result[key(record)] ?? 0) + 1;
    return result;
  };
  return {
    total: eligible.length,
    byExam: group((r) => r.exam),
    bySubject: group((r) => `${r.exam}:${r.subjectCode}`),
    byChapter: group((r) => `${r.exam}:${r.subjectCode}:${r.chapterSlug}`),
    byTopic: group((r) => `${r.exam}:${r.subjectCode}:${r.chapterSlug}:${r.topic}`),
    byYear: group((r) => `${r.exam}:${r.year ?? 'UNSPECIFIED'}`),
    bySourceType: group((r) => `${r.exam}:${r.sourceType}`),
    approved: records.filter((record) => record.reviewState === 'APPROVED').length,
    reviewRequired: records.filter((record) => record.reviewState === 'REVIEW_REQUIRED').length,
  };
}

/** Exact official full-paper quotas. This checks unique eligible inventory only. */
export function evaluateFullMockReadiness(records: readonly EligibleQuestionRecord[], exam: 'NEET' | 'JEE') {
  if (exam === 'NEET') {
    return evaluatePracticeReadiness(records, {
      mode: 'FULL_MOCK', exam, totalQuestions: 180,
      subjectQuotas: { PHYSICS: 45, CHEMISTRY: 45, BIOLOGY: 90 },
    });
  }

  const eligible = [...new Map(records.filter((record) => record.eligible && record.exam === 'JEE').map((record) => [record.id, record])).values()];
  const reasons: string[] = [];
  for (const subject of ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS']) {
    const mcq = eligible.filter((record) => record.subjectCode === subject && record.questionType !== 'NUMERICAL_VALUE').length;
    const numerical = eligible.filter((record) => record.subjectCode === subject && record.questionType === 'NUMERICAL_VALUE').length;
    if (mcq < 20) reasons.push(`${subject} MCQ: need 20, found ${mcq}.`);
    if (numerical < 5) reasons.push(`${subject} Numerical: need 5, found ${numerical}.`);
  }
  if (eligible.length < 75) reasons.push(`Not enough reviewed questions available yet: need 75, found ${eligible.length}.`);
  return { ready: reasons.length === 0, availableUnique: eligible.length, reasons };
}

export function evaluatePracticeReadiness(records: readonly EligibleQuestionRecord[], request: PracticeRequest) {
  let pool = records.filter((record) => record.eligible && record.exam === request.exam);
  if (request.mode === 'YEAR') pool = pool.filter((record) => record.year === request.year && record.sourceType === 'OFFICIAL_NTA');
  if (request.subjectCodes?.length) pool = pool.filter((record) => request.subjectCodes!.includes(record.subjectCode));
  if (request.chapterSlugs?.length) pool = pool.filter((record) => request.chapterSlugs!.includes(record.chapterSlug));
  if (request.topics?.length) pool = pool.filter((record) => request.topics!.includes(record.topic));
  const unique = new Map(pool.map((record) => [record.id, record]));
  const reasons: string[] = [];
  if (unique.size < request.totalQuestions) reasons.push(`Not enough reviewed questions available yet: need ${request.totalQuestions}, found ${unique.size}.`);
  for (const [subject, quota] of Object.entries(request.subjectQuotas ?? {})) {
    const available = [...unique.values()].filter((record) => matchesSubjectQuota(record, subject)).length;
    if (available < quota) reasons.push(`${subject}: need ${quota}, found ${available}.`);
  }
  return { ready: reasons.length === 0, availableUnique: unique.size, reasons };
}
