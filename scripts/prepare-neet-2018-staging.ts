import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';
import { questionTextHash } from '../lib/admin/bulk';

// Local-only replay of the 2019/2020 staging gates. No environment, database or approval writes.
const root = 'data/previous-year/neet/2018';
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const write = (name: string, value: unknown) => writeFileSync(`${root}/${name}`, JSON.stringify(value, null, 2) + '\n');
const paperUrl = 'https://unacademy.com/content/wp-content/uploads/sites/2/2022/10/neet-2018-question-paper-code-AA.pdf';
const paperHash = '305e91121edf28e563a8fb283f7a866a1f1fed9ee3430719e1292e6415f556b4';
const keyHash = '81c2560e11580dcbc39126486b76a3c0560276b3a824f9c78d8f834b4256bc9e';
for (const [file, expected] of [['tmp/neet-2018/booklet.pdf', paperHash], ['tmp/neet-2018/revised-key.pdf', keyHash]]) {
  if (existsSync(file) && digest(file) !== expected) throw Error(`Unreviewed source bytes: ${file}`);
}
type Reviewed = [number, number, string, string, string, string, [string, string, string, string]];
type Slot = { originalQuestionNumber: number; sourcePage: number; sourceColumn: number; bounds: number[]; proposedClassification: [string, string, string] };
const reviewed: Reviewed[] = read(`${root}/reviewed-transcriptions.json`).records;
const slots: Slot[] = read(`${root}/slot-manifest.json`).records;
const key = read(`${root}/candidate-answer-key.json`);
if (slots.length !== 180 || slots.some((s, i) => s.originalQuestionNumber !== i + 1)
  || new Set(reviewed.map(q => q[0])).size !== reviewed.length || reviewed.length !== 167) throw Error('Incomplete identity ledger');
if (key.authority !== 'UNVERIFIED_ARCHIVE_CANDIDATE' || key.officialFinalKeyAuthenticated !== false || key.sha256 !== keyHash
  || createHash('sha256').update(Array.from({ length: 180 }, (_, i) => key.printedKeyTokens[i + 1]).join('')).digest('hex')
    !== '29e2c4fa066ac46fd5dca413a41215cbc0c4b920835976f1829bd1ed656a3893') throw Error('Candidate key evidence changed');
if (reviewed.some(q => !slots.some(s => s.originalQuestionNumber === q[0] && s.sourcePage === q[1])
  || !q[5].trim() || q[6].length !== 4 || q[6].some(o => !o.trim())
  || /[\u0900-\u097F\uE000-\uF8FF\uFFFD]/.test([q[5], ...q[6]].join(' ')))) throw Error('Invalid English transcription');

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
for (const year of [2019, 2020]) {
  const file = `data/previous-year/neet/${year}/questions.json`; collect(read(file), file);
}
for (const file of readdirSync('data/question-bank').filter(f => /\.(json|csv)$/.test(f))) {
  const full = `data/question-bank/${file}`;
  collect(file.endsWith('.json') ? read(full) : Papa.parse(readFileSync(full, 'utf8'), { header: true }).data, full);
}
collect(read('data/neet-2025-template.json'), 'data/neet-2025-template.json');
const hashes = new Map<string, typeof existing>();
for (const q of existing) { const hash = questionTextHash(q.questionText); hashes.set(hash, [...(hashes.get(hash) ?? []), q]); }
const quarantine = slots.map(slot => {
  const number = slot.originalQuestionNumber;
  const candidate = reviewed.find(q => q[0] === number);
  const [subjectCode, chapterSlug, topic] = slot.proposedClassification;
  const reasons = ['OFFICIAL_FINAL_ANSWER_KEY_PUBLICATION_CHAIN_NOT_AUTHENTICATED'];
  const duplicateMatches = candidate ? hashes.get(questionTextHash(candidate[5])) ?? [] : [];
  if (!candidate) reasons.push('DIAGRAM_OR_STRUCTURAL_OPTIONS_NOT_STAGED');
  if ([12, 18, 34, 36].includes(number)) reasons.push('VECTOR_ARROW_GLYPH_RENDERING_REQUIRES_REVIEW');
  if (!QUESTION_BANK_V1_TAXONOMY.some(t => t.exam === 'NEET' && t.subjectCode === subjectCode
    && t.unitSlug === chapterSlug && t.topicSlugs.includes(topic))) reasons.push('CANONICAL_TAXONOMY_GAP');
  if (duplicateMatches.length) reasons.push('EXISTING_NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW');
  if (key.knownConflictingCoachingAnswers[number]) reasons.push('CONFLICTING_CANDIDATE_AND_COACHING_ANSWER_KEYS');
  if (candidate) {
    if (JSON.stringify(candidate.slice(2, 5)) !== JSON.stringify(slot.proposedClassification)) throw Error(`Classification mismatch Q${number}`);
    const hash = questionTextHash(candidate[5]);
    hashes.set(hash, [...(hashes.get(hash) ?? []), { file: `${root}/reviewed-transcriptions.json`, externalId: `neet:2018:aa:${number}`, questionText: candidate[5] }]);
  }
  return { externalId: `historical-candidate:neet:2018:aa:${number}`, identityKey: `NEET:2018:2018-05-06:AA:${number}`,
    exam: 'NEET', historicalExamName: 'NEET (UG) 2018', year: 2018, examDate: '2018-05-06', paperCode: 'AA', bookletCode: 'ACHLA', language: 'en',
    originalQuestionNumber: number, originalSection: number <= 45 ? 'PHYSICS' : number <= 90 ? 'CHEMISTRY' : 'BIOLOGY',
    sourcePage: slot.sourcePage, sourceColumn: slot.sourceColumn, proposedSubjectCode: subjectCode, proposedChapterSlug: chapterSlug, proposedTopic: topic,
    ...(candidate ? { recoveredQuestionText: candidate[5], recoveredOptions: candidate[6], transcriptionState: 'ENGLISH_TEXT_OPTIONS_VISUALLY_REVIEWED' }
      : { sourceEvidence: `${root}/evidence/quarantine-q${String(number).padStart(3, '0')}.png`, transcriptionState: 'INCOMPLETE_DIAGRAM_TRANSCRIPTION' }),
    candidatePrintedKeyToken: key.printedKeyTokens[number], candidateAnswerKeyReference: key.url, candidateAnswerKeyPage: 1,
    answerValidation: { officialFinalKeyAuthenticated: false, correctAnswerVerified: false },
    reasons, duplicateMatches, validationState: 'QUARANTINED', reviewState: 'DRAFT', status: 'DRAFT', isActive: false,
    sourceUrl: paperUrl, source: { paperSha256: paperHash, candidateAnswerKeySha256: keyHash,
      paperHosting: 'THIRD_PARTY_ARCHIVE_OF_ORIGINAL_ENGLISH_BOOKLET', answerAuthority: 'UNVERIFIED_ARCHIVE_CANDIDATE' } };
});
// No candidate answers may enter questions.json until a separately reviewed official-final-key workflow exists.
write('questions.json', []);
write('quarantine.json', quarantine);
const completeness = { expected: 180, extractedSourceSlots: 180, completeManualTranscriptions: 167, validated: 0,
  quarantined: 180, missingUnaccountedSourceSlots: 0, missingValidatedQuestions: 180, approved: 0, studentVisible: 0, status: 'BLOCKED_UNPUBLISHED' };
write('source-manifest.json', { schemaVersion: 1, exam: 'NEET', year: 2018, examDate: '2018-05-06', paperCode: 'AA', bookletCode: 'ACHLA', language: 'en',
  completeness, pattern: { totalPrintedQuestions: 180, physics: 45, chemistry: 45, biology: 90 },
  sources: { questionPaper: paperUrl, paperSha256: paperHash, paperPages: 24, candidateAnswerKey: key.url, candidateAnswerKeySha256: keyHash,
    candidateKeyPrintedDate: '2018-05-30', candidateKeyPage: 1, officialHostedPaperLocated: false, officialFinalAnswerKeyAuthenticated: false,
    rejectedEarlierKey: 'https://static.collegedekho.com/media/uploads/2022/07/15/neet-answer-key-2018-english-code-aa.pdf',
    rejectedEarlierKeySha256: 'e09ce4b74d1ef4e694b12bec152bfc44636ddf38b6bd7b0fd78d4ac8d81176f7',
    rejectedEarlierKeyReason: '20 May mirror has extensive answer mismatches against the selected AA booklet; final status and correct version cannot be established.' },
  releaseGate: { importReady: false, published: false, approvalRequired: true, productionImportAuthorized: false },
  duplicateScope: 'Repository NEET 2019/2020 staging; NEET/JEE 2021–2025; question-bank JSON/CSV; NEET 2025 template; within this paper. Normalized stem only, no database or semantic duplicate check.',
  duplicateCollisionNumbers: quarantine.filter(q => q.duplicateMatches.length).map(q => q.originalQuestionNumber),
  taxonomyGapNumbers: quarantine.filter(q => q.reasons.includes('CANONICAL_TAXONOMY_GAP')).map(q => q.originalQuestionNumber),
  diagramIncompleteNumbers: quarantine.filter(q => q.transcriptionState === 'INCOMPLETE_DIAGRAM_TRANSCRIPTION').map(q => q.originalQuestionNumber),
  notationRenderingIssueNumbers: [12, 18, 34, 36],
  batches: Array.from({ length: 8 }, (_, i) => ({ id: `neet-2018-aa-${String(i + 1).padStart(2, '0')}`, originalQuestionNumbers: slots.slice(i * 25, (i + 1) * 25).map(s => s.originalQuestionNumber), status: 'QUARANTINED_UNPUBLISHED' })),
  questionsSha256: digest(`${root}/questions.json`), quarantineSha256: digest(`${root}/quarantine.json`),
  reviewedTranscriptionsSha256: digest(`${root}/reviewed-transcriptions.json`), slotManifestSha256: digest(`${root}/slot-manifest.json`), candidateKeySha256: digest(`${root}/candidate-answer-key.json`),
  limitations: ['Final CBSE answer-key authority remains unauthenticated. A post-challenge date and mirror title do not prove official final status.',
    'All 180 records quarantined; 167 complete text transcriptions, 13 original diagram crops awaiting supported rendering.',
    'Chapter/topic assignments are proposed; mineral-nutrition lacks a canonical topic. Generic stem collisions are not proof of identical full questions.',
    'No approved content, release manifests, practice filters, database, Admissions or Multilingual changes.'] });
console.log(JSON.stringify({ ...completeness, collisions: quarantine.filter(q => q.duplicateMatches.length).map(q => q.originalQuestionNumber) }, null, 2));
