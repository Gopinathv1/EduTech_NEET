import fs from 'node:fs';
import crypto from 'node:crypto';

// Curated exact-paper decisions: quantities alone never imply calculation.
// Physics exceptions are qualitative laws, devices, graphs and direct recall.
// Chemistry numerical entries require arithmetic, stoichiometry, equation
// application, or systematic bond/isomer enumeration. Other entries require
// qualitative relationships, mechanisms, definitions or factual recall.
const physicsConceptual = {
  2021: [3,18,25],
  2022: [2,4,6,18,19,24,26,27,28,31,39,43],
  2023: [1,2,5,10,13,15,16,17,18,23,24,34,35,39,46],
  2024: [1,2,4,5,7,11,22,23,24,35,37,44,45,46,49],
  2025: [8,23,26,38],
};
const chemistryNumerical = {
  2021: [65,67,69,70,74,90],
  2022: [57,76,83,87,89,93,98],
  2023: [56,59,65,68,73,79,82,98,99,100],
  2024: [54,66,76,79,83,89,95,96,99,100],
  2025: [46,55,56,61,73,75,79,81,85,86,89],
};
const biologyNumerical = { 2021: [170], 2022: [164,185,188,193], 2023: [], 2024: [], 2025: [145,152] };
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function buildArtifact() {
  const questions = [2021,2022,2023,2024,2025].flatMap(year =>
    JSON.parse(fs.readFileSync(`data/previous-year/neet/${year}/questions.json`, 'utf8')));
  if (questions.length !== 780 || new Set(questions.map(q => q.externalId)).size !== 780) throw Error('Exact 780-question manifest required');
  const rows = questions.map(q => {
    const n = q.originalQuestionNumber;
    const numerical = q.subjectCode === 'PHYSICS' ? !physicsConceptual[q.year].includes(n)
      : q.subjectCode === 'CHEMISTRY' ? chemistryNumerical[q.year].includes(n) : biologyNumerical[q.year].includes(n);
    return { externalId: q.externalId, year: q.year, subject: q.subjectCode, chapter: q.chapterSlug,
      questionNature: numerical ? 'NUMERICAL_PROBLEM_SOLVING' : 'CONCEPTUAL_THEORY',
      classificationMethod: 'EXACT_PAPER_REASONING_TABLE_V1',
      classificationConfidence: 'RULE_SUPPORTED', reviewStatus: 'CLASSIFIED',
      rationale: numerical ? 'Derive a value, ratio, formula or count by calculation or systematic enumeration.'
        : 'Recall or interpret a fact, definition, mechanism, device, or qualitative relationship.',
      sourceSha256: sha(q) };
  });
  const counts = subset => ({ total: subset.length,
    conceptual: subset.filter(q => q.questionNature === 'CONCEPTUAL_THEORY').length,
    numerical: subset.filter(q => q.questionNature === 'NUMERICAL_PROBLEM_SOLVING').length,
    reviewRequired: subset.filter(q => q.reviewStatus === 'REVIEW_REQUIRED').length });
  return { version: 1, baselineCommit: '1ebe6532910f28a535a1fc23bfaef83b7d6ae57b',
    // Confidence is qualitative evidence metadata, not an invented probability
    // or a claim that a human reviewer approved this artifact.
    status: 'CLASSIFIED', manifestSha256: sha(questions),
    distribution: { ...counts(rows), byYear: Object.fromEntries([2021,2022,2023,2024,2025].map(y => [y, counts(rows.filter(q => q.year === y))])),
      bySubject: Object.fromEntries(['PHYSICS','CHEMISTRY','BIOLOGY'].map(s => [s, counts(rows.filter(q => s === 'BIOLOGY' ? ['BOTANY','ZOOLOGY'].includes(q.subject) : q.subject === s))])) }, rows };
}
if (process.argv[1]?.endsWith('build-neet-question-nature.mjs')) {
  const artifact = buildArtifact();
  fs.writeFileSync('data/previous-year/neet/question-nature.json', JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify(artifact.distribution, null, 2));
}
