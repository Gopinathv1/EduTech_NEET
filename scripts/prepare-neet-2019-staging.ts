import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';
import { questionTextHash } from '../lib/admin/bulk';

// Local files only: no environment loading, network calls, Prisma, imports or approval writes.
const input = path.resolve(process.argv[2] ?? 'tmp/neet-2019');
const output = 'data/previous-year/neet/2019';
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const write = (file: string, data: unknown) => writeFileSync(path.join(output, file), JSON.stringify(data, null, 2) + '\n');
const paperUrl = 'https://cdn.aglasem.com/aglasem-doc/c925b19e-2d88-11eb-8a1a-02f21f5619c4/c925b19e-2d88-11eb-8a1a-02f21f5619c4.pdf';
const keyUrl = 'https://www.nta.ac.in/Download/Notice/20190605125750.pdf';
const paperHash = sha(path.join(input, 'booklet.pdf'));
const keyHash = sha(path.join(input, 'final-key.pdf'));
if (paperHash !== '8b10964cf8bd9f11a31b86edc480094951d65aa37e10c650290f89a2630c8f42'
  || keyHash !== 'fdb593f365502c8e1aff61901eafbb2ddd235879d0ca651eb7ecd481b0275769') {
  throw Error('Source PDF differs from the visually reviewed archived P1 booklet/official final key.');
}
const rawKey = (existsSync(path.join(input, 'key.json')) ? read(path.join(input, 'key.json'))
  : read(`${output}/final-answer-key.json`).printedKeyTokens) as Record<string, string>;
const extraction = (existsSync(path.join(input, 'extracted.json')) ? read(path.join(input, 'extracted.json'))
  : read(`${output}/raw-extraction.json`).records) as { originalQuestionNumber: number; sourcePage: number; sourceColumn: number; rawOcrText: string; boundaryDetected: boolean }[];
if (extraction.length !== 180 || new Set(extraction.map(q => q.originalQuestionNumber)).size !== 180
  || extraction.some(q => !q.boundaryDetected) || Object.keys(rawKey).length !== 180) throw Error('Incomplete source extraction/key.');
const key: Record<number, string[]> = Object.fromEntries(Array.from({ length: 180 }, (_, i) => {
  const number = i + 1; const answer = rawKey[String(number)];
  const accepted = ({ '1': ['A'], '2': ['B'], '3': ['C'], '4': ['D'], A: ['A', 'B'], F: ['C', 'D'] } as Record<string, string[]>)[answer];
  if (!accepted) throw Error(`Invalid final key Q${number}`);
  return [number, accepted];
}));
if (createHash('sha256').update(Array.from({ length: 180 }, (_, i) => rawKey[i + 1]).join('')).digest('hex')
  !== '2091c67d7ee31c9f153cb4d1cbcb981efd3f46b8f970a3e77011073a651ded8c') {
  throw Error('Extracted answers differ from the reviewed P1 final-key page.');
}

type Reviewed = [number, number, string, string, string, string, [string, string, string, string]];
const reviewFiles = readdirSync(input).filter(file => /^reviewed-\d+\.json$/.test(file)).sort();
const reviewed: Reviewed[] = reviewFiles.length ? reviewFiles.flatMap(file => read(path.join(input, file)) as Reviewed[])
  : read(`${output}/reviewed-transcriptions.json`).records;
if (new Set(reviewed.map(q => q[0])).size !== reviewed.length) throw Error('Repeated reviewed source identity.');
if (reviewed.some(q => !extraction.some(s => s.originalQuestionNumber === q[0]) || !q[5].trim()
  || q[6].length !== 4 || q[6].some(o => !o.trim()) || /[\u0900-\u097F\uFFFD]/.test([q[5], ...q[6]].join(' ')))) {
  throw Error('Incomplete or non-English reviewed transcription.');
}
const existing: { file: string; externalId: string; questionText: string }[] = [];
function collect(value: unknown, file: string) {
  if (!value || typeof value !== 'object') return;
  const row = value as Record<string, unknown>;
  const text = row.questionText ?? row.en_questionText;
  if (typeof text === 'string') existing.push({ file, externalId: String(row.externalId ?? ''), questionText: text });
  for (const child of Object.values(row)) if (typeof child === 'object') collect(child, file);
}
for (const exam of ['neet', 'jee']) for (const year of [2021, 2022, 2023, 2024, 2025]) {
  const file = `data/previous-year/${exam}/${year}/questions.json`; collect(read(file), file);
}
for (const file of readdirSync('data/question-bank').filter(file => /\.(json|csv)$/.test(file))) {
  const full = `data/question-bank/${file}`;
  collect(file.endsWith('.json') ? read(full) : Papa.parse(readFileSync(full, 'utf8'), { header: true }).data, full);
}
collect(read('data/previous-year/neet/2020/questions.json'), 'data/previous-year/neet/2020/questions.json');
collect(read('data/neet-2025-template.json'), 'data/neet-2025-template.json');
const hashes = new Map<string, typeof existing>();
for (const row of existing) { const hash = questionTextHash(row.questionText); hashes.set(hash, [...(hashes.get(hash) ?? []), row]); }
const retained: Record<string, unknown>[] = [];
const quarantine: Record<string, unknown>[] = [];
const layouts = new Set([144]);
const diagrams = new Set([17, 24, 33, 39, 42, 45, 47, 48, 55, 65, 69, 74, 78]);
const incompleteTaxonomy: Record<number, [string, string, string]> = {
  17: ['PHYSICS', 'physics-current-electricity', 'circuits'],
  24: ['PHYSICS', 'physics-current-electricity', 'circuits'],
  33: ['PHYSICS', 'physics-laws-of-motion', 'newtons-laws'],
  39: ['PHYSICS', 'physics-electronic-devices', 'logic-gates'],
  42: ['PHYSICS', 'physics-oscillations-waves', 'simple-harmonic-motion'],
  45: ['PHYSICS', 'physics-magnetic-effects', 'biot-savart-law'],
  47: ['CHEMISTRY', 'chemistry-oxygen', 'alcohols-phenols-ethers'],
  48: ['CHEMISTRY', 'chemistry-p-block', 'group-15-18'],
  55: ['CHEMISTRY', 'chemistry-hydrocarbons', 'alkenes-alkynes'],
  65: ['CHEMISTRY', 'chemistry-hydrocarbons', 'aromatic-hydrocarbons'],
  69: ['CHEMISTRY', 'chemistry-oxygen', 'alcohols-phenols-ethers'],
  74: ['CHEMISTRY', 'chemistry-hydrocarbons', 'alkenes-alkynes'],
  78: ['CHEMISTRY', 'chemistry-oxygen', 'carboxylic-acids'],
  144: ['BOTANY', 'biology-diversity-living-world', 'taxonomy-systematics'],
};
for (const source of extraction) {
  const number = source.originalQuestionNumber;
  const candidate = reviewed.find(row => row[0] === number);
  const reasons: string[] = [];
  if (key[number].length !== 1) reasons.push('OFFICIAL_MULTIPLE_ACCEPTED_ANSWERS_UNSUPPORTED_BY_SINGLE_CORRECT_STAGING');
  if (!candidate) reasons.push(diagrams.has(number) ? 'DIAGRAM_OR_STRUCTURAL_OPTIONS_NOT_STAGED'
    : layouts.has(number) ? 'SCIENTIFIC_NAME_TYPOGRAPHY_NOT_STAGED' : 'MATHEMATICAL_NOTATION_TRANSCRIPTION_NOT_VALIDATED');
  let duplicateMatches: typeof existing = [];
  if (candidate) {
    const [, page, subjectCode, chapterSlug, topic, questionText] = candidate;
    if (page !== source.sourcePage) throw Error(`Source page mismatch Q${number}`);
    if (!QUESTION_BANK_V1_TAXONOMY.some(t => t.exam === 'NEET' && t.subjectCode === subjectCode
      && t.unitSlug === chapterSlug && t.topicSlugs.includes(topic))) reasons.push('CANONICAL_TAXONOMY_GAP');
    duplicateMatches = hashes.get(questionTextHash(questionText)) ?? [];
    if (duplicateMatches.length) reasons.push('EXISTING_NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW');
  }
  const externalId = `historical-verified:neet:2019:p1:${number}`;
  if (reasons.length) {
    quarantine.push({ exam: 'NEET', year: 2019, examDate: '2019-05-05', paperCode: 'P1', language: 'en',
      externalId, originalQuestionNumber: number, sourcePage: source.sourcePage, sourceColumn: source.sourceColumn,
      reasons, recoveredQuestionText: candidate?.[5] ?? source.rawOcrText,
      ...(candidate ? { recoveredOptions: candidate[6], proposedSubjectCode: candidate[2], proposedChapterSlug: candidate[3], proposedTopic: candidate[4] } : {}),
      ...(!candidate ? { proposedSubjectCode: incompleteTaxonomy[number][0], proposedChapterSlug: incompleteTaxonomy[number][1], proposedTopic: incompleteTaxonomy[number][2],
        sourceEvidence: `${output}/evidence/quarantine-q${String(number).padStart(3, '0')}.png`, recoveredTextState: 'UNREVIEWED_OCR_NOT_IMPORTABLE' } : {}),
      officialAcceptedOptions: key[number], officialPrintedKeyToken: rawKey[number], duplicateMatches, validationState: 'QUARANTINED', reviewState: 'DRAFT', isActive: false,
      sourceUrl: paperUrl, officialAnswerKeyReference: keyUrl });
    continue;
  }
  const [, , subjectCode, chapterSlug, topic, questionText, options] = candidate!;
  const hash = questionTextHash(questionText);
  hashes.set(hash, [{ file: `${output}/questions.json`, externalId, questionText }]);
  retained.push({ externalId, identityKey: `NEET:2019:2019-05-05:P1:${number}`, exam: 'NEET', historicalExamName: 'NEET (UG) 2019',
    year: 2019, examYear: 2019, examDate: '2019-05-05', paperCode: 'P1', language: 'en', paperSession: 'Main 5 May 2019 | English booklet P1',
    originalQuestionNumber: number, originalOrder: number, originalSection: number <= 45 ? 'PHYSICS' : number <= 90 ? 'CHEMISTRY' : 'BIOLOGY',
    questionType: 'SINGLE_CORRECT', questionText, options, correctOption: key[number][0], subjectCode, chapterSlug, topic, difficulty: 'MEDIUM',
    explanation: `The official NTA final answer key for NEET (UG) 2019, held on 5 May 2019, booklet P1, maps question ${number} to printed option ${rawKey[number]} (${key[number][0]}).`,
    sourceType: 'HISTORICAL_VERIFIED', sourceName: 'NEET 2019 English booklet P1 historical paper', sourceUrl: paperUrl, officialAnswerKeyReference: keyUrl,
    contentClass: 'PRODUCTION', status: 'REVIEW', reviewState: 'REVIEW_REQUIRED', validationState: 'VALIDATED', isActive: false,
    source: { wordingArchiveUrl: paperUrl, canonicalPaperPdfUrl: paperUrl, paperHosting: 'THIRD_PARTY_ARCHIVE_OF_ORIGINAL_BOOKLET', officialFinalAnswerKeyUrl: keyUrl,
      paperSha256: paperHash, answerKeySha256: keyHash, sourcePage: source.sourcePage, sourceColumn: source.sourceColumn, answerKeyPage: 1,
      wordingSource: 'Original P1 Hindi-English booklet scan hosted by AglaSem; English right-hand column. Official-hosted paper URL not located.', answerAuthority: 'National Testing Agency final answer key declared 5 June 2019' },
    sourceReview: { method: 'ORIGINAL_BOOKLET_PAGE_VISUAL_REVIEW_WITH_OCR_AID', sourcePage: source.sourcePage,
      printedQuestionNumberChecked: true, completeOptionsChecked: true, languageChecked: 'en', diagramDependent: false,
      notation: 'Unicode subscripts/superscripts and Greek letters; display fractions linearized with explicit grouping; unavailable Latin subscripts use underscore. Source spelling, scientific values and option order retained.' },
    answerValidation: { officialFinalKeyOption: key[number][0], officialPrintedOption: Number(rawKey[number]), exactBooklet: 'P1', examDate: '2019-05-05' },
    duplicateValidation: { method: 'EXISTING_QUESTION_TEXT_HASH', normalizedStemSha256: hash, repositoryCollision: false, databaseChecked: false } });
}
mkdirSync(output, { recursive: true });
write('reviewed-transcriptions.json', { columns: ['originalQuestionNumber', 'sourcePage', 'subjectCode', 'chapterSlug', 'topic', 'questionText', 'options'], warning: 'Manual English transcriptions; candidates still pass answer, taxonomy and duplicate gates.', records: reviewed });
write('questions.json', retained);
write('quarantine.json', quarantine);
write('raw-extraction.json', { warning: 'Unreviewed OCR evidence only; never import this file.', method: 'RapidOCR on archived P1 booklet at 170 dpi; every numbered boundary manually checked on English source pages', records: extraction });
write('final-answer-key.json', { exam: 'NEET', year: 2019, examDate: '2019-05-05', paperCode: 'P1', authority: 'OFFICIAL_NTA_FINAL', page: 1, url: keyUrl, sha256: keyHash, printedKeyTokens: rawKey, tokenLegend: { A: [1, 2], C: [1, 4], D: [2, 3], F: [3, 4] }, answers: key });
const batches = [];
for (let start = 0; start < retained.length; start += 25) batches.push({ id: `neet-2019-p1-${String(batches.length + 1).padStart(2, '0')}`,
  externalIds: retained.slice(start, start + 25).map(q => q.externalId), status: 'UNPUBLISHED_REVIEW_REQUIRED' });
const summary = { expected: 180, extractedSourceSlots: extraction.length, completeManualTranscriptions: reviewed.length, validated: retained.length,
  quarantined: quarantine.length, missingUnaccountedSourceSlots: 180 - retained.length - quarantine.length, missingValidatedQuestions: 180 - retained.length, approved: 0, studentVisible: 0, status: 'PARTIAL_UNPUBLISHED' };
write('source-manifest.json', { schemaVersion: 1, exam: 'NEET', year: 2019, historicalExamName: 'NEET (UG) 2019', examDate: '2019-05-05', paperCode: 'P1', language: 'en',
  pattern: { totalPrintedQuestions: 180, questionsRequiredToAnswer: 180, biology: 90, chemistry: 45, physics: 45 }, completeness: summary,
  sources: { archiveIndex: 'https://docs.aglasem.com/view/c925b19e-2d88-11eb-8a1a-02f21f5619c4', archiveTitle: 'NEET 2019 Question Paper _English, Hindi_ 05 May', officialHostedPaperLocated: false, corroboratingBooklet: 'https://www.oldyearpaper.com/portal/Neet_paper_2019_shift2_05052019.pdf', corroboratingBookletSha256: '9d9b3b0083ea01d7b9034759db59a2ff189ea384b2f8c49a2e4175832eb8d9f5', questionPaper: paperUrl, finalAnswerKey: keyUrl,
    finalAnswerKeyIndex: 'https://www.nta.ac.in/NoticeBoardArchive', paperSha256: paperHash, answerKeySha256: keyHash, paperPages: 44, keyPage: 1 },
  provenance: 'HISTORICAL_VERIFIED', releaseGate: { importReady: false, published: false, approvalRequired: true, productionImportAuthorized: false },
  duplicateScope: 'Repository 2020 NEET staging and 2021–2025 NEET/JEE historical datasets, all question-bank JSON/CSV files and NEET 2025 template. Database not contacted; semantic/OCR-spelling variants need final editorial/database review.',
  subjectCounts: Object.fromEntries(['BOTANY', 'ZOOLOGY', 'CHEMISTRY', 'PHYSICS'].map(subject => [subject, retained.filter(q => q.subjectCode === subject).length])),
  batches, questionsSha256: sha(`${output}/questions.json`), quarantineSha256: sha(`${output}/quarantine.json`),
  limitations: ['Selected P1 5 May main paper only; excludes 20 May re-exam and other variants.', 'Original bilingual booklet is archived by third parties; no surviving official-hosted 2019 paper URL located. Publisher attribution is not represented as official hosting.', 'OCR extraction is evidence, not validated text. Quarantine includes complete text with taxonomy/duplicate gates and incomplete layout transcriptions.', 'No existing release manifest, filter availability, historical matrix, importer or approval script changed. No database access.'] });
console.log(JSON.stringify({ ...summary, quarantine: quarantine.map(q => ({ number: q.originalQuestionNumber, reasons: q.reasons })) }, null, 2));
