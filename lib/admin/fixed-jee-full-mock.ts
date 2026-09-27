export type FixedJeeQuestion = {
  id: string;
  subjectCode: string;
  questionType: string;
  approved: boolean;
  activeEligible: boolean;
};

export type FixedJeeSelectionSummary = {
  total: number;
  unique: number;
  approved: number;
  activeEligible: number;
  physics: number;
  chemistry: number;
  mathematics: number;
  mcq: number;
  numerical: number;
};

export function summarizeFixedJeeSelection(rows: FixedJeeQuestion[]): FixedJeeSelectionSummary {
  const bySubject = (code: string) => rows.filter((row) => row.subjectCode === code).length;
  return {
    total: rows.length,
    unique: new Set(rows.map((row) => row.id)).size,
    approved: rows.filter((row) => row.approved).length,
    activeEligible: rows.filter((row) => row.activeEligible).length,
    physics: bySubject('JEE_PHYSICS'),
    chemistry: bySubject('JEE_CHEMISTRY'),
    mathematics: bySubject('JEE_MATHEMATICS'),
    mcq: rows.filter((row) => row.questionType === 'SINGLE_CORRECT').length,
    numerical: rows.filter((row) => row.questionType === 'NUMERICAL_VALUE').length,
  };
}

export function isExactFixedJeeSelection(summary: FixedJeeSelectionSummary) {
  return summary.total === 75 && summary.unique === 75 && summary.approved === 75 && summary.activeEligible === 75
    && summary.physics === 25 && summary.chemistry === 25 && summary.mathematics === 25
    && summary.mcq === 60 && summary.numerical === 15;
}
