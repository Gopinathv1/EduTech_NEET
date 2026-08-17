/**
 * Pure helpers for the student test catalogue: computing which subjects/chapters
 * a test covers, and mapping the "Biology/Physics/Chemistry" filter to subject
 * codes (Biology = Botany + Zoology).
 */

export type SubjectMeta = { id: string; code: string };
export type ChapterMeta = { id: string; subjectId: string };

export type CoverageInput = {
  testType: string;
  isRandom: boolean;
  subjectId: string | null;
  chapterId: string | null;
  rules: unknown;
  testQuestions: { question: { subjectId: string; chapterId: string } }[];
};

export function computeCoverage(
  test: CoverageInput,
  subjectsById: Map<string, SubjectMeta>,
  chaptersById: Map<string, ChapterMeta>,
  allSubjectCodes: string[],
): { subjectCodes: Set<string>; chapterIds: Set<string> } {
  const subjectCodes = new Set<string>();
  const chapterIds = new Set<string>();

  const addSubjectById = (id: string | null | undefined) => {
    if (!id) return;
    const s = subjectsById.get(id);
    if (s) subjectCodes.add(s.code);
  };
  const addChapterById = (id: string | null | undefined) => {
    if (!id) return;
    chapterIds.add(id);
    const c = chaptersById.get(id);
    if (c) addSubjectById(c.subjectId);
  };

  // Catalogue tags always count.
  addSubjectById(test.subjectId);
  addChapterById(test.chapterId);

  if (test.testType === 'FULL_TEST') {
    for (const code of allSubjectCodes) subjectCodes.add(code);
  }

  if (test.isRandom) {
    const rules = (test.rules ?? {}) as {
      random?: { scope?: string; subjectIds?: string[]; chapterIds?: string[] };
    };
    const scope = rules.random?.scope ?? 'FULL_SYLLABUS';
    if (scope === 'FULL_SYLLABUS') {
      for (const code of allSubjectCodes) subjectCodes.add(code);
    } else if (scope === 'SUBJECTS') {
      for (const sid of rules.random?.subjectIds ?? []) addSubjectById(sid);
    } else if (scope === 'CHAPTERS') {
      for (const cid of rules.random?.chapterIds ?? []) addChapterById(cid);
    }
  } else {
    for (const tq of test.testQuestions) {
      addSubjectById(tq.question.subjectId);
      chapterIds.add(tq.question.chapterId);
    }
  }

  return { subjectCodes, chapterIds };
}

/** Subject-filter value → matching subject codes. Biology = Botany + Zoology. */
export function subjectFilterCodes(value: string): string[] {
  switch (value) {
    case 'physics':
      return ['PHYSICS'];
    case 'chemistry':
      return ['CHEMISTRY'];
    case 'biology':
      return ['BOTANY', 'ZOOLOGY'];
    default:
      return [];
  }
}
