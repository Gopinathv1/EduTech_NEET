/**
 * Client-safe CSV column list + template for bulk question import.
 * (Kept separate from bulk.ts, which pulls in node:crypto and can't be bundled
 * into a client component.)
 */
export const BULK_COLUMNS = [
  'subjectCode',
  'chapterName',
  'difficulty',
  'questionType',
  'year',
  'tags',
  'correctOption',
  'en_questionText',
  'en_optionA',
  'en_optionB',
  'en_optionC',
  'en_optionD',
  'en_explanation',
  'ta_questionText',
  'ta_optionA',
  'ta_optionB',
  'ta_optionC',
  'ta_optionD',
  'ta_explanation',
  'ta_reviewed',
] as const;

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Header row + one worked example, for the downloadable template. */
export function csvTemplate(): string {
  const header = BULK_COLUMNS.join(',');
  const example = [
    'PHYSICS',
    'Laws of Motion',
    'EASY',
    'SINGLE_CORRECT',
    '2021',
    'units;force',
    'A',
    'What is the SI unit of force?',
    'Newton',
    'Joule',
    'Pascal',
    'Watt',
    'Force is measured in newtons.',
    'விசையின் SI அலகு எது?',
    'நியூட்டன்',
    'ஜூல்',
    'பாஸ்கல்',
    'வாட்',
    'விசை நியூட்டனில் அளக்கப்படுகிறது.',
    'true',
  ]
    .map(csvCell)
    .join(',');
  return `${header}\n${example}\n`;
}
