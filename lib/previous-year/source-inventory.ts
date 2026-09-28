import inventoryJson from '@/data/previous-year/official-source-inventory.json';
import historicalMatrixJson from '@/data/previous-year/historical-matrix.json';
import { isAllowedOfficialSource } from '@/lib/question-bank/official-sources';

export const PREVIOUS_YEAR_WINDOW = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;
export const PREVIOUS_YEAR_MODES = ['YEAR_WISE', 'MIXED_FIVE_YEARS', 'SUBJECT_CHAPTER'] as const;

export type PreviousYearExam = 'NEET' | 'JEE';
export type PaperAvailability = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
export type AnswerKeyAvailability = PaperAvailability;

export type OfficialSourceRecord = {
  exam: PreviousYearExam;
  year: number;
  session?: string;
  examDate?: string;
  shift?: string;
  sourceUrl: string;
  officialDomain: string;
  sourceDocumentTitle: string;
  sourceType: string;
  retrievalNotes: string;
  paperAvailability: PaperAvailability;
  verifiedQuestionCount: number;
  answerKeyAvailability: AnswerKeyAvailability;
  provenanceNotes: string;
};

type HistoricalMatrixSource = {
  exam: PreviousYearExam;
  year: number;
  sessions: string[];
  officialSourceUrl: string;
  officialPaperAvailability: PaperAvailability;
  answerKeyAvailability: string;
  historicalExamName: string;
  notes: string;
  validatedQuestionCount: number;
};

const historicalSourceRecords = (historicalMatrixJson as HistoricalMatrixSource[])
  .filter((record) => record.year < 2021)
  .map((record): OfficialSourceRecord => ({
    exam: record.exam,
    year: record.year,
    session: record.sessions.join(', '),
    sourceUrl: record.officialSourceUrl,
    officialDomain: new URL(record.officialSourceUrl).hostname,
    sourceDocumentTitle: record.historicalExamName,
    sourceType: record.officialPaperAvailability === 'AVAILABLE' ? 'OFFICIAL_QUESTION_PAPER' : 'OFFICIAL_IDENTITY_RECORD',
    retrievalNotes: record.notes,
    paperAvailability: record.officialPaperAvailability,
    verifiedQuestionCount: record.validatedQuestionCount,
    answerKeyAvailability: record.answerKeyAvailability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
    provenanceNotes: record.notes,
  }));

export const officialSourceInventory = [...historicalSourceRecords, ...(inventoryJson as OfficialSourceRecord[])];

export function validateOfficialSourceInventory(records: readonly OfficialSourceRecord[]) {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    const identity = [record.exam, record.year, record.session ?? '', record.examDate ?? '', record.shift ?? ''].join(':');
    if (seen.has(identity)) issues.push(`Duplicate source identity: ${identity}`);
    seen.add(identity);
    if (!PREVIOUS_YEAR_WINDOW.includes(record.year as (typeof PREVIOUS_YEAR_WINDOW)[number])) issues.push(`Unsupported year: ${record.year}`);
    if (!isAllowedOfficialSource(record.sourceUrl)) issues.push(`Non-official source: ${record.sourceUrl}`);
    if (new URL(record.sourceUrl).hostname !== record.officialDomain) issues.push(`Domain mismatch: ${identity}`);
    if (record.paperAvailability !== 'AVAILABLE' && record.verifiedQuestionCount !== 0) issues.push(`Unavailable paper has questions: ${identity}`);
    if (!Number.isInteger(record.verifiedQuestionCount) || record.verifiedQuestionCount < 0) issues.push(`Invalid verified question count: ${identity}`);
  }
  for (const exam of ['NEET', 'JEE'] as const) {
    for (const year of PREVIOUS_YEAR_WINDOW) {
      if (!records.some((record) => record.exam === exam && record.year === year)) issues.push(`Missing source record: ${exam}:${year}`);
    }
  }
  return issues;
}

export function sourceInventoryFor(exam: PreviousYearExam) {
  return officialSourceInventory.filter((record) => record.exam === exam).sort((a, b) => b.year - a.year);
}

export function totalVerifiedQuestions(exam: PreviousYearExam) {
  return sourceInventoryFor(exam).reduce((total, record) => total + record.verifiedQuestionCount, 0);
}
