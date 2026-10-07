import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ transaction: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock('@/lib/auth/admin', () => ({ getAdminSession: mocks.auth }));
import { mutateTranslation } from '@/lib/question-translations/workflow';
import { canonicalContentHash } from '@/lib/question-translations/content';
import { PATCH, POST } from '@/app/api/admin/questions/[id]/translations/[language]/route';
const actor = { sub: 'editor', name: 'Editor' };
const en = { language: 'en', questionText: 'Find 2 + 3.', optionA: '2', optionB: '3', optionC: '5', optionD: '6', explanation: null, correctOption: 'C' };
const input = { revision: 0, questionText: '2 + 3 மதிப்பைக் காண்க.', optionA: '2', optionB: '3', optionC: '5', optionD: '6', explanation: null,
  translationSource: 'SIVORA_TRANSLATION' as const, sourceReference: 'SIVORA editor preparation', submitForReview: true };
let prior: Record<string, unknown> | null;
const tx = { question: { findUnique: vi.fn() }, questionTranslation: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  questionTranslationVersion: { create: vi.fn() }, auditLog: { create: vi.fn() } };
beforeEach(() => {
  vi.clearAllMocks(); prior = null; mocks.auth.mockResolvedValue(actor);
  tx.question.findUnique.mockResolvedValue({ questionType: 'SINGLE_CORRECT', translations: [en] });
  tx.questionTranslation.findUnique.mockImplementation(async () => prior);
  tx.questionTranslation.create.mockImplementation(async ({ data }) => ({ id: 'tr1', ...data }));
  tx.questionTranslation.updateMany.mockImplementation(async ({ data }) => { prior = { ...prior, ...data }; return { count: 1 }; });
  tx.questionTranslation.findUniqueOrThrow.mockImplementation(async () => prior);
  mocks.transaction.mockImplementation(async callback => callback(tx));
});
function req(body: unknown) { return new Request('http://localhost/api/admin/questions/q/translations/ta', { method: 'POST', body: JSON.stringify(body) }); }
const context = (language = 'ta') => ({ params: Promise.resolve({ id: 'q', language }) });
describe('translation-only editorial transactions', () => {
  it('creates review-required text with no copied answers and independent history/audit', async () => {
    expect(await mutateTranslation('q', 'ta', actor, { save: input })).toEqual({ revision: 1, reviewState: 'REVIEW_REQUIRED' });
    expect(tx.questionTranslation.create).toHaveBeenCalledWith({ data: expect.objectContaining({ correctOption: null, numericAnswer: null, numericTolerance: null, reviewed: false }) });
    expect(tx.questionTranslationVersion.create).toHaveBeenCalledOnce(); expect(tx.auditLog.create).toHaveBeenCalledOnce();
    expect(Object.keys(tx)).toEqual(['question', 'questionTranslation', 'questionTranslationVersion', 'auditLog']);
  });
  it('editing approved wording clears reviewer and resets only the translation', async () => {
    prior = { id: 'tr1', ...input, language: 'ta', revision: 3, reviewState: 'APPROVED', reviewed: true, reviewedById: 'old' };
    expect(await mutateTranslation('q', 'ta', actor, { save: { ...input, revision: 3, submitForReview: false } })).toEqual({ revision: 4, reviewState: 'REVIEW_REQUIRED' });
    expect(prior?.reviewedById).toBeNull();
  });
  it('requires semantic attestation and records the authenticated reviewer', async () => {
    prior = { id: 'tr1', ...input, language: 'ta', revision: 1, reviewState: 'REVIEW_REQUIRED', canonicalContentHash: canonicalContentHash('SINGLE_CORRECT', en) };
    await expect(mutateTranslation('q', 'ta', actor, { review: { revision: 1, action: 'APPROVE', note: 'Checked' } })).rejects.toMatchObject({ code: 'translationQa' });
    expect(await mutateTranslation('q', 'ta', actor, { review: { revision: 1, action: 'APPROVE', note: 'Checked', meaningAndOptionIdentityChecked: true } })).toEqual({ revision: 2, reviewState: 'APPROVED' });
    expect(prior?.reviewedById).toBe(actor.sub);
  });
  it('blocks a changed canonical source even with reviewer attestation', async () => {
    prior = { id: 'tr1', ...input, revision: 1, reviewState: 'REVIEW_REQUIRED', canonicalContentHash: 'stale' };
    await expect(mutateTranslation('q', 'hi', actor, { review: { revision: 1, action: 'APPROVE', note: 'Checked', meaningAndOptionIdentityChecked: true } })).rejects.toMatchObject({ code: 'translationQa' });
  });
  it.each(['REJECT', 'NEEDS_CORRECTION'] as const)('records independent %s state', async action => {
    prior = { id: 'tr1', ...input, revision: 1, reviewState: 'REVIEW_REQUIRED' };
    expect(await mutateTranslation('q', 'ta', actor, { review: { revision: 1, action, note: 'Terminology requires correction' } })).toMatchObject({ reviewState: action === 'REJECT' ? 'REJECTED' : action });
  });
  it('rejects stale concurrent edits without version or audit writes', async () => {
    prior = { id: 'tr1', revision: 2 };
    await expect(mutateTranslation('q', 'ta', actor, { save: input })).rejects.toMatchObject({ code: 'translationConflict' });
    expect(tx.questionTranslationVersion.create).not.toHaveBeenCalled();
  });
  it('rejects corrupted numbers before review', async () => {
    await expect(mutateTranslation('q', 'ta', actor, { save: { ...input, optionC: '9' } })).rejects.toMatchObject({ code: 'translationQa' });
  });
  it('requires an official translated wording reference and separate source review', async () => {
    await expect(mutateTranslation('q', 'ta', actor, { save: { ...input, translationSource: 'OFFICIAL_TRANSLATION' } })).rejects.toMatchObject({ code: 'officialWordingReferenceRequired' });
    prior = { id: 'tr1', ...input, revision: 1, reviewState: 'REVIEW_REQUIRED', translationSource: 'OFFICIAL_TRANSLATION', sourceReference: 'https://exam.example/ta-paper', canonicalContentHash: canonicalContentHash('SINGLE_CORRECT', en) };
    await expect(mutateTranslation('q', 'ta', actor, { review: { revision: 1, action: 'APPROVE', note: 'Checked', meaningAndOptionIdentityChecked: true } })).rejects.toMatchObject({ code: 'translationQa' });
  });
  it('checks authentication, language and strict payload before opening a transaction', async () => {
    mocks.auth.mockResolvedValue(null); expect((await PATCH(req(input), context())).status).toBe(401);
    mocks.auth.mockResolvedValue(actor); expect((await PATCH(req(input), context('en'))).status).toBe(400);
    expect((await PATCH(req({ ...input, correctOption: 'A' }), context())).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('returns explicit concurrency conflict from the route', async () => {
    prior = { revision: 2 }; expect((await PATCH(req(input), context())).status).toBe(409);
    expect((await POST(req({ revision: 1, action: 'APPROVE', note: '' }), context())).status).toBe(400);
  });
});
