import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';
import { questionTextHash } from '../lib/admin/bulk';

// Local files only: no environment loading, network calls, Prisma, imports or approval writes.
const input = path.resolve(process.argv[2] ?? 'tmp/neet-2020');
const output = 'data/previous-year/neet/2020';
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const write = (file: string, data: unknown) => writeFileSync(path.join(output, file), JSON.stringify(data, null, 2) + '\n');
const paperUrl = 'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2022/02/2022021555.pdf';
const keyUrl = 'https://www.nta.ac.in/Download/Notice/Notice_20201016104324.pdf';
const paperHash = sha(path.join(input, 'paper-e1.pdf'));
const keyHash = sha(path.join(input, 'final-key.pdf'));
if (paperHash !== '5b6d11dfaa2918e6e638da7a178cbc41a26573967e76c6d1f0e352d533f715f4'
  || keyHash !== '54280c1c2ef1684e444b521e7eca228c4cc792d7bbcf692cebca3dff53b729f9') {
  throw Error('Source PDF differs from the visually reviewed official E1 paper/final key.');
}
const rawKey = (existsSync(path.join(input, 'key.json')) ? read(path.join(input, 'key.json'))
  : Object.fromEntries(Object.entries(read(`${output}/final-answer-key.json`).answers).map(([number, answer]) =>
    [number, 'ABCD'.indexOf(String(answer)) + 1]))) as Record<string, number>;
const extraction = (existsSync(path.join(input, 'extracted.json')) ? read(path.join(input, 'extracted.json'))
  : read(`${output}/raw-extraction.json`).records) as { originalQuestionNumber: number; sourcePage: number; sourceColumn: number; rawOcrText: string; boundaryDetected: boolean }[];
if (extraction.length !== 180 || new Set(extraction.map(q => q.originalQuestionNumber)).size !== 180
  || extraction.some(q => !q.boundaryDetected) || Object.keys(rawKey).length !== 180) throw Error('Incomplete source extraction/key.');
const key = Object.fromEntries(Array.from({ length: 180 }, (_, i) => {
  const number = i + 1; const answer = rawKey[String(number)];
  if (![1, 2, 3, 4].includes(answer)) throw Error(`Invalid final key Q${number}`);
  return [number, ['A', 'B', 'C', 'D'][answer - 1]];
}));
if (createHash('sha256').update(Array.from({ length: 180 }, (_, i) => key[i + 1]).join('')).digest('hex')
  !== '5bc76e290614d1545b87f8cea0efd7b5937373456df89e8750d6915d25af199e') {
  throw Error('Extracted answers differ from the reviewed E1 final-key page.');
}
type Reviewed = [number, number, string, string, string, string, [string, string, string, string]];
const reviewFiles = readdirSync(input).filter(file => /^reviewed-\d+\.json$/.test(file)).sort();
const reviewed: Reviewed[] = reviewFiles.length ? reviewFiles.flatMap(file => read(path.join(input, file)) as Reviewed[])
  : read(`${output}/reviewed-transcriptions.json`).records;
if (new Set(reviewed.map(q => q[0])).size !== reviewed.length) throw Error('Repeated reviewed source identity.');
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
collect(read('data/neet-2025-template.json'), 'data/neet-2025-template.json');
const hashes = new Map<string, typeof existing>();
for (const row of existing) { const hash = questionTextHash(row.questionText); hashes.set(hash, [...(hashes.get(hash) ?? []), row]); }
const retained: Record<string, unknown>[] = [];
const quarantine: Record<string, unknown>[] = [];
const layouts = new Set([4, 9, 27, 28, 30, 37, 48, 52, 55, 60, 62, 70, 76, 80, 84, 96, 130, 131]);
const diagrams = new Set([95, 102, 133, 135, 160, 163, 164, 180]);
for (const source of extraction) {
  const number = source.originalQuestionNumber;
  const candidate = reviewed.find(row => row[0] === number);
  const reasons: string[] = [];
  if (!candidate) reasons.push(diagrams.has(number) ? 'DIAGRAM_OR_STRUCTURAL_OPTIONS_NOT_STAGED'
    : layouts.has(number) ? 'TABLE_LAYOUT_TRANSCRIPTION_NOT_VALIDATED' : 'MATHEMATICAL_NOTATION_TRANSCRIPTION_NOT_VALIDATED');
  let duplicateMatches: typeof existing = [];
  if (candidate) {
    const [, page, subjectCode, chapterSlug, topic, questionText] = candidate;
    if (page !== source.sourcePage) throw Error(`Source page mismatch Q${number}`);
    if (!QUESTION_BANK_V1_TAXONOMY.some(t => t.exam === 'NEET' && t.subjectCode === subjectCode
      && t.unitSlug === chapterSlug && t.topicSlugs.includes(topic))) reasons.push('CANONICAL_TAXONOMY_GAP');
    duplicateMatches = hashes.get(questionTextHash(questionText)) ?? [];
    if (duplicateMatches.length) reasons.push('EXISTING_NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW');
  }
  const externalId = `historical-verified:neet:2020:e1:${number}`;
  if (reasons.length) {
    quarantine.push({ exam: 'NEET', year: 2020, examDate: '2020-09-13', paperCode: 'E1', language: 'en',
      externalId, originalQuestionNumber: number, sourcePage: source.sourcePage, sourceColumn: source.sourceColumn,
      reasons, recoveredQuestionText: candidate?.[5] ?? source.rawOcrText,
      ...(candidate ? { recoveredOptions: candidate[6], proposedSubjectCode: candidate[2], proposedChapterSlug: candidate[3], proposedTopic: candidate[4] } : {}),
      officialFinalKeyOption: key[number], duplicateMatches, validationState: 'QUARANTINED', reviewState: 'DRAFT', isActive: false,
      sourceUrl: paperUrl, officialAnswerKeyReference: keyUrl });
    continue;
  }
  const [, , subjectCode, chapterSlug, topic, questionText, options] = candidate!;
  const hash = questionTextHash(questionText);
  hashes.set(hash, [{ file: `${output}/questions.json`, externalId, questionText }]);
  retained.push({ externalId, identityKey: `NEET:2020:2020-09-13:E1:${number}`, exam: 'NEET', historicalExamName: 'NEET (UG) 2020',
    year: 2020, examYear: 2020, examDate: '2020-09-13', paperCode: 'E1', language: 'en', paperSession: 'Main 13 September 2020 | English booklet E1',
    originalQuestionNumber: number, originalOrder: number, originalSection: number <= 90 ? 'BIOLOGY' : number <= 135 ? 'CHEMISTRY' : 'PHYSICS',
    questionType: 'SINGLE_CORRECT', questionText, options, correctOption: key[number], subjectCode, chapterSlug, topic, difficulty: 'MEDIUM',
    explanation: `The official NTA final answer key for NEET (UG) 2020, held on 13 September 2020, booklet E1, maps question ${number} to printed option ${rawKey[number]} (${key[number]}).`,
    sourceType: 'HISTORICAL_VERIFIED', sourceName: 'NEET 2020 English booklet E1 historical paper', sourceUrl: paperUrl, officialAnswerKeyReference: keyUrl,
    contentClass: 'PRODUCTION', status: 'REVIEW', reviewState: 'REVIEW_REQUIRED', validationState: 'VALIDATED', isActive: false,
    source: { wordingArchiveUrl: paperUrl, canonicalPaperPdfUrl: paperUrl, officialFinalAnswerKeyUrl: keyUrl,
      paperSha256: paperHash, answerKeySha256: keyHash, sourcePage: source.sourcePage, sourceColumn: source.sourceColumn, answerKeyPage: 1,
      wordingSource: 'Official NTA archive English E1 scanned booklet', answerAuthority: 'National Testing Agency final answer key declared 16 October 2020' },
    sourceReview: { method: 'OFFICIAL_SOURCE_PAGE_VISUAL_REVIEW_WITH_OCR_AID', sourcePage: source.sourcePage,
      printedQuestionNumberChecked: true, completeOptionsChecked: true, languageChecked: 'en', diagramDependent: false,
      notation: 'Unicode subscripts/superscripts and Greek letters; display fractions linearized with explicit grouping; unavailable Latin subscripts use underscore. Source spelling, scientific values and option order retained.' },
    answerValidation: { officialFinalKeyOption: key[number], officialPrintedOption: rawKey[number], exactBooklet: 'E1', examDate: '2020-09-13' },
    duplicateValidation: { method: 'EXISTING_QUESTION_TEXT_HASH', normalizedStemSha256: hash, repositoryCollision: false, databaseChecked: false } });
}
mkdirSync(output, { recursive: true });
write('questions.json', retained);
write('quarantine.json', quarantine);
write('raw-extraction.json', { warning: 'Unreviewed OCR evidence only; never import this file.', method: 'RapidOCR on official PDF at 170 dpi; every numbered boundary manually located on source pages', records: extraction });
write('final-answer-key.json', { exam: 'NEET', year: 2020, examDate: '2020-09-13', paperCode: 'E1', authority: 'OFFICIAL_NTA_FINAL', page: 1, url: keyUrl, sha256: keyHash, answers: key });
const batches = [];
for (let start = 0; start < retained.length; start += 25) batches.push({ id: `neet-2020-e1-${String(batches.length + 1).padStart(2, '0')}`,
  externalIds: retained.slice(start, start + 25).map(q => q.externalId), status: 'UNPUBLISHED_REVIEW_REQUIRED' });
const summary = { expected: 180, extractedSourceSlots: extraction.length, completeManualTranscriptions: reviewed.length, validated: retained.length,
  quarantined: quarantine.length, missingUnaccountedSourceSlots: 180 - retained.length - quarantine.length, missingValidatedQuestions: 180 - retained.length, approved: 0, studentVisible: 0, status: 'PARTIAL_UNPUBLISHED' };
write('source-manifest.json', { schemaVersion: 1, exam: 'NEET', year: 2020, historicalExamName: 'NEET (UG) 2020', examDate: '2020-09-13', paperCode: 'E1', language: 'en',
  pattern: { totalPrintedQuestions: 180, questionsRequiredToAnswer: 180, biology: 90, chemistry: 45, physics: 45 }, completeness: summary,
  sources: { archiveIndex: 'https://neet.nta.nic.in/archive/', archiveTitle: 'English Set E1 NEET QP 2020', questionPaper: paperUrl, finalAnswerKey: keyUrl,
    finalAnswerKeyIndex: 'https://www.nta.ac.in/NoticeBoardArchive', paperSha256: paperHash, answerKeySha256: keyHash, paperPages: 24, keyPage: 1 },
  provenance: 'HISTORICAL_VERIFIED', releaseGate: { importReady: false, published: false, approvalRequired: true, productionImportAuthorized: false },
  duplicateScope: 'Repository 2021–2025 NEET/JEE historical datasets, all question-bank JSON/CSV files and NEET 2025 template. Database not contacted; semantic/OCR-spelling variants need final editorial/database review.',
  subjectCounts: Object.fromEntries(['BOTANY', 'ZOOLOGY', 'CHEMISTRY', 'PHYSICS'].map(subject => [subject, retained.filter(q => q.subjectCode === subject).length])),
  batches, questionsSha256: sha(`${output}/questions.json`), quarantineSha256: sha(`${output}/quarantine.json`),
  limitations: ['Selected E1 main paper only; not all 2020 variants or October re-examination.', 'OCR extraction is evidence, not validated text. Quarantine includes complete text with taxonomy/duplicate gates and incomplete layout transcriptions.', 'No existing release manifest, filter availability, historical matrix, importer or approval script changed. No database access.'] });
console.log(JSON.stringify({ ...summary, quarantine: quarantine.map(q => ({ number: q.originalQuestionNumber, reasons: q.reasons })) }, null, 2));
