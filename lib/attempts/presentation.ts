export type StudentExam = 'NEET' | 'JEE';

const SUBJECT_CODES: Record<StudentExam, readonly string[]> = {
  NEET: ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'],
  JEE: ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'],
};

/** Identifies the practice exam without relying on a display title. */
export function studentExamFromRules(rules: unknown): StudentExam {
  return rules && typeof rules === 'object' && (rules as { exam?: unknown }).exam === 'JEE' ? 'JEE' : 'NEET';
}

/** Attempt payloads do not include test rules, so their canonical subject codes are authoritative. */
export function studentExamFromSubjectCodes(subjectCodes: readonly string[]): StudentExam {
  return subjectCodes.some((code) => SUBJECT_CODES.JEE.includes(code)) ? 'JEE' : 'NEET';
}

export function studentExamHeadingKey(exam: StudentExam, result = false) {
  return `${result ? 'resultTitles' : 'titles'}.${exam}`;
}

export function studentSubjectLabelKey(code: string) {
  return `subjects.${code}`;
}

/** Keeps only the subjects present in an attempt, in its exam's intended display order. */
export function orderAttemptSubjectCodes(exam: StudentExam, subjectCodes: readonly string[]) {
  const present = new Set(subjectCodes);
  return SUBJECT_CODES[exam].filter((code) => present.has(code));
}
