import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertValidJeeDataset, type JeeHistoricalQuestion, type JeeInventoryEntry, type JeeQuarantineRecord } from '../lib/previous-year/jee-dataset';
import { jeeExternalId, validateJeeAnswer, type JeeKeyQuestion } from '../lib/previous-year/jee-validation';

// This command assembles already reviewed evidence. It performs no extraction, OCR or database access.
// Source PDFs, rendered review images and working review inputs stay in tmp/.
const root = path.join(process.cwd(), 'data', 'previous-year', 'jee');
const json = async <T>(file: string): Promise<T> => JSON.parse(await readFile(file, 'utf8')) as T;
const serialize = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const years = [2021, 2022, 2023, 2024, 2025] as const;
type NativePaper = {
  paperId: string; pdf: string; sha256: string;
  questions: { questionId: string; originalQuestionNumber: number | null; sourceOrdinal?: number;
    questionType: 'SINGLE_CORRECT' | 'NUMERICAL_VALUE'; optionIds: string[]; sourcePage: number }[];
};
type Reviewed = Pick<JeeHistoricalQuestion, 'paperId' | 'questionId' | 'questionText' | 'subjectCode' | 'chapterSlug'
  | 'topic' | 'questionNature' | 'natureReason' | 'explanation'> & {
    options?: [string, string, string, string]; representationNote?: string; sourceReview?: Record<string, unknown>;
  };
const evidenceFiles: Record<number, string> = {
  2021: '2021-02-24-shift-1-aglasem.native.json',
  2022: '2022-07-25-shift-1-aglasem.native.json',
  2023: '2023-04-06-shift-1-aglasem.native.json',
  2024: '2024-04-06-shift-1-aglasem.review2024.json',
  2025: '2025-01-22-shift-1-college.review2025.json',
};

async function main() {
  const inventory = await json<{ entries: JeeInventoryEntry[] }>(path.join(root, 'acquisition-manifest.json'));
  const officialKeys = await json<{ entries: { paperId: string; questions: JeeKeyQuestion[] }[] }>(path.join(root, 'final-answer-keys.json'));
  const retained: JeeHistoricalQuestion[] = [];
  const quarantine: JeeQuarantineRecord[] = [];
  const reviewsByYear = new Map<number, Reviewed[]>();
  const evidenceByYear = new Map<number, NativePaper>();
  for (const year of years) {
    const suffix = year === 2021 ? '' : `-${year}`;
    const reviews = await json<Reviewed[]>(`tmp/jee-reviewed${suffix}-transcriptions.json`);
    const excluded = await json<JeeQuarantineRecord[]>(`tmp/jee-reviewed${suffix}-quarantine.json`);
    const evidence = await json<NativePaper>(`tmp/jee-main-pyq/${evidenceFiles[year]}`);
    reviewsByYear.set(year, reviews); evidenceByYear.set(year, evidence); quarantine.push(...excluded);
    const paper = inventory.entries.find(entry => entry.id === evidence.paperId);
    if (!paper || paper.year !== year) throw new Error(`Unlisted source identity for ${year}.`);
    const archive = paper.questionPaperSource.find(source => source.publisher === (year === 2025 ? 'CollegePravesh' : 'AglaSem'));
    if (!archive) throw new Error(`No declared wording archive for ${year}.`);
    const keys = officialKeys.entries.find(entry => entry.paperId === paper.id)?.questions ?? [];
    for (const review of reviews) {
      if (review.paperId !== paper.id) throw new Error('Review/evidence paper mismatch.');
      const matches = evidence.questions.filter(question => question.questionId === review.questionId);
      if (matches.length !== 1) throw new Error(`Ambiguous source question ${review.questionId}.`);
      const question = matches[0];
      const answer = validateJeeAnswer({ paper, questionId: question.questionId,
        questionType: question.questionType, optionIds: question.optionIds, labelledOptions: year === 2022 }, keys);
      if (!answer.valid) throw new Error(`${paper.id}:${question.questionId}: ${answer.reason}`);
      const key = keys.find(entry => entry.questionId === question.questionId)!;
      const sourceOrder = evidence.questions.indexOf(question) + 1;
      const paperSession = `Session ${paper.session} | ${paper.examDate} | Shift ${paper.shift}${paper.regionVariant === 'DOMESTIC' ? ' | Domestic' : ''}`;
      retained.push({ ...review, exam: 'JEE_MAIN', paper: 'PAPER_1', year, session: paper.session,
        examDate: paper.examDate, shift: paper.shift, regionVariant: paper.regionVariant,
        externalId: jeeExternalId(paper, question.originalQuestionNumber, question.questionId),
        originalQuestionNumber: question.originalQuestionNumber, sourceOrder, questionType: question.questionType,
        ...(answer.correctOption !== undefined ? { correctOption: answer.correctOption } : { numericAnswer: answer.numericAnswer }),
        chapterClassification: 'SIVORA_CLASSIFICATION', subjectAuthority: 'SOURCE_PAPER_SECTION', difficulty: 'MEDIUM',
        sourceType: 'HISTORICAL_VERIFIED', sourceName: `JEE Main ${year} ${paperSession} historical paper`,
        sourceUrl: archive.url, officialAnswerKeyReference: paper.finalAnswerKeySource.url,
        examYear: year, paperSession, validationState: 'VALIDATED',
        source: { wordingArchiveUrl: archive.url, paperSha256: evidence.sha256,
          officialFinalAnswerKeyUrl: paper.finalAnswerKeySource.url, answerKeySha256: paper.finalAnswerKeySource.sha256,
          answerKeyPage: paper.finalAnswerKeySource.page, sourcePage: question.sourcePage },
        answerValidation: { authority: 'OFFICIAL_NTA_FINAL', questionId: question.questionId,
          rawAnswer: key.rawAnswer, optionIds: question.optionIds, labelledOptions: year === 2022 },
        sourceReview: review.sourceReview ?? { method: 'ORIGINAL_SOURCE_IMAGE_VISUAL_REVIEW',
          sourcePdf: evidence.pdf, sourcePdfSha256: evidence.sha256, sourcePage: question.sourcePage,
          identityAuthority: 'PRINTED_NUMBER_AND_EXACT_NTA_QUESTION_ID', subjectAuthority: 'SOURCE_PAPER_SECTION' },
      });
    }
  }
  assertValidJeeDataset(retained, inventory.entries, officialKeys.entries, quarantine);
  const releaseYears = [];
  for (const year of years) {
    const directory = path.join(root, String(year)); await mkdir(directory, { recursive: true });
    const questions = retained.filter(question => question.year === year).sort((a, b) => a.sourceOrder - b.sourceOrder);
    const evidence = evidenceByYear.get(year)!;
    const excluded = quarantine.filter(row => row.paperId === evidence.paperId);
    const selected = new Set([...questions, ...excluded].map(row => row.questionId));
    const unselected = evidence.questions.filter(question => !selected.has(question.questionId)).map(question => question.questionId);
    const first = questions[0];
    const contents = serialize(questions);
    await writeFile(path.join(directory, 'questions.json'), contents);
    await writeFile(path.join(directory, 'quarantine.json'), serialize(excluded));
    const summary = { year, paperId: evidence.paperId, sourceQuestions: evidence.questions.length,
      reviewed: selected.size, validated: questions.length, quarantined: excluded.length,
      notSelectedForV1: unselected.length, notSelectedQuestionIds: unselected,
      historicalCompleteness: 'PARTIAL_VERIFIED_PRACTICE', questionsSha256: sha256(contents) };
    const sourceManifest = { ...summary,
      paperIdentity: { exam: first.exam, paper: first.paper, year, session: first.session,
        examDate: first.examDate, shift: first.shift, regionVariant: first.regionVariant },
      wordingSource: { url: first.sourceUrl, sha256: first.source.paperSha256, authority: 'HISTORICAL_ARCHIVE', provenance: 'HISTORICAL_VERIFIED' },
      finalAnswerKey: { url: first.officialAnswerKeyReference, sha256: first.source.answerKeySha256,
        page: first.source.answerKeyPage, authority: 'OFFICIAL_NTA_FINAL' },
      subjectAuthority: 'SOURCE_PAPER_SECTION', classificationAuthority: 'SIVORA_CLASSIFICATION',
      numbering: year === 2022 ? 'Exact NTA question ID; printed question number absent/null; independent source order.' : 'Printed source question number and exact NTA question ID.',
      extractionReview: year === 2023 ? 'Original PDF visual review corrected defective native image associations.'
        : year === 2024 ? 'First English block only; repeated bilingual IDs and logo/name collisions corrected against original PDF.'
          : year === 2025 ? 'Question-image boundaries corrected and checked against original PDF.' : 'Original source question blocks visually reviewed.',
    };
    await writeFile(path.join(directory, 'source-manifest.json'), serialize(sourceManifest)); releaseYears.push(summary);
  }
  const classification = retained.map(question => ({ externalId: question.externalId, paperId: question.paperId,
    year: question.year, subjectCode: question.subjectCode, chapterSlug: question.chapterSlug,
    topic: question.topic, classificationAuthority: 'SIVORA_CLASSIFICATION',
    questionType: question.questionType, questionNature: question.questionNature, natureReason: question.natureReason }));
  await writeFile(path.join(root, 'question-nature.json'), serialize({ schemaVersion: 1, rows: classification }));
  const reasons = [...new Set(quarantine.map(row => row.reason))].sort().map(reason => ({
    reason, count: quarantine.filter(row => row.reason === reason).length,
  }));
  const taxonomyGaps = quarantine.filter(row => row.reason === 'CANONICAL_CHAPTER_MISSING');
  await writeFile(path.join(root, 'quarantine-report.json'), serialize({ schemaVersion: 1,
    reviewed: retained.length + quarantine.length, retained: retained.length, quarantined: quarantine.length,
    notSelectedForV1: releaseYears.reduce((total, year) => total + year.notSelectedForV1, 0),
    note: 'Unreviewed source questions and unselected acquired shifts are outside V1, not quarantined.',
    reasons, records: quarantine }));
  await writeFile(path.join(root, 'taxonomy-gap-report.json'), serialize({ schemaVersion: 1,
    classificationAuthority: 'SIVORA_CLASSIFICATION', taxonomyWrites: 0,
    policy: 'Questions without a supported canonical chapter remain quarantined; no substitute chapter is inferred.',
    affectedQuestions: taxonomyGaps.length, records: taxonomyGaps }));
  const distribution = (rows: readonly JeeHistoricalQuestion[]) => ({ total: rows.length,
    subjects: Object.fromEntries(['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'].map(code => [code, rows.filter(row => row.subjectCode === code).length])),
    types: Object.fromEntries(['SINGLE_CORRECT', 'NUMERICAL_VALUE'].map(type => [type, rows.filter(row => row.questionType === type).length])),
    natures: Object.fromEntries(['CONCEPTUAL_THEORY', 'NUMERICAL_PROBLEM_SOLVING'].map(nature => [nature, rows.filter(row => row.questionNature === nature).length])),
  });
  await writeFile(path.join(root, 'classification-report.json'), serialize({ schemaVersion: 1,
    authority: 'SIVORA_CLASSIFICATION', ...distribution(retained),
    byYear: Object.fromEntries(years.map(year => [year, distribution(retained.filter(row => row.year === year))])) }));
  const selectedPapers = new Map(releaseYears.map(year => [year.paperId, year]));
  const acquisition = inventory as { entries: (JeeInventoryEntry & { processingStatus?: string; v1Review?: unknown })[] };
  for (const entry of acquisition.entries) {
    const review = selectedPapers.get(entry.id);
    entry.processingStatus = review ? 'V1_PARTIAL_REVIEW_FINALIZED' : 'DEFERRED_OUTSIDE_V1';
    if (review) entry.v1Review = { reviewed: review.reviewed, validated: review.validated,
      quarantined: review.quarantined, notSelectedForV1: review.notSelectedForV1 };
  }
  await writeFile(path.join(root, 'acquisition-manifest.json'), serialize(acquisition));
  const artifactFiles = [...years.flatMap(year => ['questions.json', 'quarantine.json', 'source-manifest.json'].map(file => `${year}/${file}`)),
    'acquisition-manifest.json', 'final-answer-keys.json', 'question-nature.json', 'quarantine-report.json', 'taxonomy-gap-report.json', 'classification-report.json'];
  const artifactSha256 = Object.fromEntries(await Promise.all(artifactFiles.map(async file => [file, sha256(await readFile(path.join(root, file), 'utf8'))])));
  await writeFile(path.join(root, 'release-manifest.json'), serialize({ schemaVersion: 1,
    scope: 'JEE_MAIN_PAPER_1_2021_2025_V1', status: 'DATASET_VALIDATED_PRODUCT_CHECKS_PENDING', importReady: false,
    sourceSelection: 'One high-quality exact-key shift per year; individually reviewed representative subsets. Other acquired shifts remain outside V1.',
    identityException: '2022 unnumbered sources retain originalQuestionNumber null and use the exact NTA question ID; sourceOrder is recorded separately.',
    validated: retained.length, quarantined: quarantine.length, years: releaseYears,
    artifactSha256,
    acquisitionManifestSha256: sha256(await readFile(path.join(root, 'acquisition-manifest.json'), 'utf8')),
    finalAnswerKeysSha256: sha256(await readFile(path.join(root, 'final-answer-keys.json'), 'utf8')),
    questionNatureSha256: sha256(await readFile(path.join(root, 'question-nature.json'), 'utf8')) }));
  console.log(JSON.stringify({ validated: retained.length, quarantined: quarantine.length,
    years: releaseYears.map(({ year, validated, quarantined, reviewed }) => ({ year, validated, quarantined, reviewed })) }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Dataset assembly failed.'); process.exitCode = 1; });
