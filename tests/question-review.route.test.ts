import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getAdminSession: vi.fn() }));
const versioning = vi.hoisted(() => ({ writeQuestionVersion: vi.fn() }));
const audit = vi.hoisted(() => ({ logAudit: vi.fn() }));
const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => auth);
vi.mock('@/lib/admin/question-version', () => versioning);
vi.mock('@/lib/audit', () => audit);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: { findUnique: db.findUnique },
    $transaction: db.transaction,
  },
}));

import { POST } from '@/app/api/admin/questions/[id]/review/route';

const admin = { sub: 'admin-1', name: 'Editor', kind: 'admin', role: 'ADMIN' };
const baseQuestion = {
  id: 'question-1',
  chapterId: 'chapter-1',
  externalId: 'sivora-authored:question-1',
  exam: 'NEET',
  examYear: null,
  topic: 'satellites',
  sourceType: 'SIVORA_AUTHORED',
  sourceName: 'SIVORA Practice',
  sourceUrl: null,
  reviewState: 'REVIEW_REQUIRED',
  translations: [{
    language: 'en',
    questionText: 'Which force keeps a satellite in orbit?',
    optionA: 'Gravity',
    optionB: 'Friction',
    optionC: 'Buoyancy',
    optionD: 'Magnetism',
    correctOption: 'A',
    explanation: 'Gravity supplies the centripetal force.',
  }],
};

function request(action: string, note = '') {
  return new Request('http://localhost/api/admin/questions/question-1/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, note }),
  });
}

const context = { params: Promise.resolve({ id: 'question-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  auth.getAdminSession.mockResolvedValue(admin);
  db.findUnique.mockResolvedValue(baseQuestion);
  db.update.mockResolvedValue(baseQuestion);
  db.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ question: { update: db.update } }));
});

describe('POST /api/admin/questions/[id]/review', () => {
  it('approves validated content and records immutable review history', async () => {
    const response = await POST(request('APPROVE'), context);

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'question-1' },
      data: expect.objectContaining({ reviewState: 'APPROVED', status: 'PUBLISHED', contentClass: 'PRODUCTION', isActive: true }),
    }));
    expect(versioning.writeQuestionVersion).toHaveBeenCalledWith(expect.anything(), 'question-1', 'review:APPROVED', admin);
    expect(audit.logAudit).toHaveBeenCalled();
  });

  it('keeps correction requests out of production and requires a note', async () => {
    const missingNote = await POST(request('NEEDS_CORRECTION'), context);
    expect(missingNote.status).toBe(400);

    const response = await POST(request('NEEDS_CORRECTION', 'Clarify the explanation.'), context);
    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ reviewState: 'NEEDS_CORRECTION', contentClass: 'SAMPLE', isActive: false }),
    }));
  });

  it('rejects official content whose source URL is not allowlisted', async () => {
    db.findUnique.mockResolvedValue({
      ...baseQuestion,
      externalId: 'official-nta:neet:2025:paper:1',
      examYear: 2025,
      sourceType: 'OFFICIAL_NTA',
      sourceName: 'NTA',
      sourceUrl: 'https://example.com/paper.pdf',
    });

    const response = await POST(request('APPROVE'), context);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.issues.join(' ')).toMatch(/allowlisted/);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('requires an authenticated admin', async () => {
    auth.getAdminSession.mockResolvedValue(null);
    const response = await POST(request('APPROVE'), context);
    expect(response.status).toBe(401);
    expect(db.findUnique).not.toHaveBeenCalled();
  });
});
