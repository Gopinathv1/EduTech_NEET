export type FixedNeetQuestion = {
  id: string;
  externalId: string | null;
  subjectCode: string;
  approved: boolean;
  activeEligible: boolean;
};

export type FixedNeetSelectionSummary = {
  total: number;
  unique: number;
  approved: number;
  activeEligible: number;
  physics: number;
  chemistry: number;
  biology: number;
  botany: number;
  zoology: number;
};

/** The fixed SIVORA mock accepts the official combined Biology quota only. */
export function summarizeFixedNeetSelection(rows: FixedNeetQuestion[]): FixedNeetSelectionSummary {
  const bySubject = (code: string) => rows.filter((row) => row.subjectCode === code).length;
  const botany = bySubject('BOTANY');
  const zoology = bySubject('ZOOLOGY');
  return {
    total: rows.length,
    unique: new Set(rows.map((row) => row.id)).size,
    approved: rows.filter((row) => row.approved).length,
    activeEligible: rows.filter((row) => row.activeEligible).length,
    physics: bySubject('PHYSICS'),
    chemistry: bySubject('CHEMISTRY'),
    biology: botany + zoology,
    botany,
    zoology,
  };
}

export function isExactFixedNeetSelection(summary: FixedNeetSelectionSummary) {
  return summary.total === 180
    && summary.unique === 180
    && summary.approved === 180
    && summary.activeEligible === 180
    && summary.physics === 45
    && summary.chemistry === 45
    && summary.biology === 90;
}
