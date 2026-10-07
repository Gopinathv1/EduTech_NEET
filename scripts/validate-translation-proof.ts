/** Offline only: no env loading, Prisma client, API, or database access. */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import wording from '../data/question-translations-v1/proof-wording.json';
import { canonicalContentHash, protectedTokens, translationQa } from '../lib/question-translations/content';

async function main() {
  const bank: Array<Record<string, unknown>> = [];
  for (const exam of ['neet', 'jee']) for (const year of [2021, 2022, 2023, 2024, 2025]) bank.push(...JSON.parse(await readFile(`data/previous-year/${exam}/${year}/questions.json`, 'utf8')));
  if (wording.length !== 10 || new Set(wording.map(row => row.externalId)).size !== 10) throw new Error('Proof requires ten unique canonical questions.');
  const neetNature = JSON.parse(await readFile('data/previous-year/neet/question-nature.json', 'utf8')).rows as Array<{ externalId: string; questionNature: string }>;
  const records = wording.flatMap(proof => {
    const q = bank.find(row => row.externalId === proof.externalId);
    if (!q) throw new Error('Canonical identity missing.');
    const options = q.options as string[] | null;
    const en = { questionText: q.questionText as string, optionA: options?.[0] ?? null, optionB: options?.[1] ?? null,
      optionC: options?.[2] ?? null, optionD: options?.[3] ?? null, explanation: q.explanation as string | null,
      correctOption: (q.correctOption as string | null) ?? null, numericAnswer: q.numericAnswer ?? null, numericTolerance: q.questionType === 'NUMERICAL_VALUE' ? 0 : null };
    return (['ta', 'hi'] as const).map(language => {
      const translated = proof[language];
      const content = { questionText: translated.questionText, optionA: translated.options?.[0] ?? null, optionB: translated.options?.[1] ?? null,
        optionC: translated.options?.[2] ?? null, optionD: translated.options?.[3] ?? null, explanation: null };
      const issues = translationQa(q.questionType as string, en, content);
      if (issues.length) throw new Error(`${proof.externalId} ${language}: ${issues.join('; ')}`);
      return { externalId: proof.externalId, language, exam: proof.externalId.startsWith('jee-') ? 'JEE' : 'NEET',
        subjectCode: q.subjectCode, questionType: q.questionType, questionNature: q.questionNature ?? neetNature.find(row => row.externalId === proof.externalId)?.questionNature,
        canonicalQuestionSha256: createHash('sha256').update(JSON.stringify(q)).digest('hex'),
        canonicalContentHash: canonicalContentHash(q.questionType as string, en),
        translationSource: 'SIVORA_TRANSLATION', sourceReference: 'SIVORA V1 proof wording; authored and checked in repository; independent editorial review pending',
        reviewState: 'REVIEW_REQUIRED', content,
        qa: { mechanical: 'PASS', optionIdentity: 'A/B/C/D fixed; no reordering', meaning: 'Prepared and checked by implementation author; independent editorial approval pending',
          protectedTokens: [en.questionText, ...options ?? []].map(protectedTokens), explanation: 'Omitted; canonical English explanation remains available in review' },
      };
    });
  });
  const releaseSha256 = createHash('sha256').update(JSON.stringify(records)).digest('hex');
  const report = { format: 'SIVORA_QUESTION_TRANSLATION_PROOF_V1', releaseSha256, proofQuestions: 10, neet: 5, jee: 5, tamil: 10, hindi: 10,
    officialTranslations: 0, sivoraTranslations: 20, plannedTranslationVersions: 20, plannedAuditLogs: 20,
    studentVisibleBeforeIndependentApproval: 0, productionWrites: 0, records };
  await writeFile('data/question-translations-v1/proof-manifest.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report, records: undefined }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Offline proof validation failed.'); process.exitCode = 1; });
