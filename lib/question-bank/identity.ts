import { createHash } from 'node:crypto';

export type OfficialQuestionIdentity = {
  exam: 'NEET' | 'JEE';
  year: number;
  session: string;
  paper: string;
  questionNumber: string | number;
};

export function officialExternalId(identity: OfficialQuestionIdentity): string {
  const stable = [identity.exam, identity.year, identity.session, identity.paper, identity.questionNumber]
    .map((value) => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .join(':');
  return `official-nta:${stable}`;
}

export function sivoraExternalId(stableKey: string): string {
  const normalized = stableKey.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) throw new Error('A stable SIVORA identity key is required');
  return `sivora-authored:${createHash('sha256').update(normalized).digest('hex').slice(0, 24)}`;
}
