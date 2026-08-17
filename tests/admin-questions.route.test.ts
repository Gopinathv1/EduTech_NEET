import { describe, it, expect, vi, beforeEach } from 'vitest';

const auth = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
}));
const versioning = vi.hoisted(() => ({
  writeQuestionVersion: vi.fn(),
}));
const audit = vi.hoisted(() => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => auth);
vi.mock('@/lib/admin/question-version', () => versioning);
vi.mock('@/lib/audit', () => audit);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chapter: { findUnique: vi.fn() },
    question: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/admin/questions/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

const admin = { sub: 'a1', name: 'Admin', kind: 'admin', role: 'ADMIN' };

const validBody = {
  subjectId: 'sub-phy',
  chapterId: 'chap-motion',
  topic: 'Newton laws',
  difficulty: 'MEDIUM',
  questionType: 'SINGLE_CORRECT',
  status: 'PUBLISHED',
  year: 2024,
  tags: ['motion', 'force'],
  imageUrl: '',
  correctOption: 'B',
  en: {
    questionText: 'A force produces acceleration in which direction?',
    optionA: 'Opposite to force',
    optionB: 'Same as force',
    optionC: 'Perpendicular to force',
    optionD: 'No fixed direction',
    explanation: 'Acceleration follows the net force.',
  },
  ta: {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    explanation: '',
    reviewed: false,
  },
};

function req(body: unknown) {
  return new Request('http://localhost/api/admin/questions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.getAdminSession.mockResolvedValue(admin);
  p.chapter.findUnique.mockResolvedValue({ subjectId: 'sub-phy' });
  p.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      question: {
        create: vi.fn().mockResolvedValue({ id: 'q1' }),
      },
    }),
  );
});

describe('POST /api/admin/questions', () => {
  it('creates a published NEET question, writes version history, and audits it', async () => {
    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe('q1');
    expect(versioning.writeQuestionVersion).toHaveBeenCalledWith(
      expect.anything(),
      'q1',
      'created',
      admin,
    );
    expect(audit.logAudit).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        action: 'question.create',
        entityType: 'Question',
        entityId: 'q1',
      }),
    );
  });

  it('requires an admin session', async () => {
    auth.getAdminSession.mockResolvedValue(null);

    const res = await POST(req(validBody));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('unauthorized');
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a chapter from a different subject', async () => {
    p.chapter.findUnique.mockResolvedValue({ subjectId: 'sub-chem' });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('chapterSubjectMismatch');
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('validates image-based questions require an image URL', async () => {
    const res = await POST(req({ ...validBody, questionType: 'IMAGE_BASED', imageUrl: '' }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
    expect(p.$transaction).not.toHaveBeenCalled();
  });
});
