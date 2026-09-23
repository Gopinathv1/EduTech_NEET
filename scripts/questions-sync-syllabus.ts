import { CURRENT_EXAM_STRUCTURES } from '../lib/question-bank/exam-structures';
import { assertAllowedOfficialSource, OFFICIAL_EXAM_SOURCES } from '../lib/question-bank/official-sources';
import { QUESTION_BANK_V1_TAXONOMY, validateTaxonomy } from '../lib/question-bank/taxonomy';

for (const url of Object.values(OFFICIAL_EXAM_SOURCES)) assertAllowedOfficialSource(url);
const errors = validateTaxonomy();
if (errors.length) throw new Error(errors.join('\n'));
console.log(JSON.stringify({ sources: OFFICIAL_EXAM_SOURCES, structures: CURRENT_EXAM_STRUCTURES, taxonomy: QUESTION_BANK_V1_TAXONOMY }, null, 2));
console.log('Repository syllabus manifest validated. No network or database write was performed.');
