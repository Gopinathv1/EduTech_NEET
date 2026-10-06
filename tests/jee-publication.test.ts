import { beforeEach, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
const mocks = vi.hoisted(() => ({ read: vi.fn(), update: vi.fn(), audit: vi.fn(), feasibility: vi.fn(), notify: vi.fn(), legacyAudit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { test: { findUnique: mocks.read, update: mocks.update } } }));
vi.mock('@/lib/generator/plan', () => ({ checkFeasibility: mocks.feasibility }));
vi.mock('@/lib/audit', () => ({ logAudit: mocks.legacyAudit }));
vi.mock('@/lib/notifications/create', () => ({ notifyNewTestPublished: mocks.notify }));
import { publishTest } from '@/lib/admin/test-publication';
const admin = { sub: 'admin', name: 'Reviewer' };
const client = { test: { findUnique: mocks.read }, $transaction: mocks.transaction } as unknown as PrismaClient;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.read.mockResolvedValue({ id: 'jee', isPublished: false, title: { en: 'JEE' }, price: 0 });
  mocks.feasibility.mockResolvedValue({ ok: true, warnings: [], errors: [] });
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation(callback => callback({ test: { updateMany: mocks.update }, auditLog: { create: mocks.audit } }));
});
it('publishes a guarded JEE plan with one atomic audit and no unrelated notifications', async () => {
  await publishTest('jee', admin, { client, atomicAudit: true, idempotent: true, skipNotifications: true });
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'jee', isPublished: false }, data: { isPublished: true } });
  expect(mocks.audit).toHaveBeenCalledTimes(1);
  expect(mocks.legacyAudit).not.toHaveBeenCalled();
  expect(mocks.notify).not.toHaveBeenCalled();
});
it('does not add records when resuming an already published guarded plan', async () => {
  mocks.read.mockResolvedValue({ id: 'jee', isPublished: true });
  await publishTest('jee', admin, { client, atomicAudit: true, idempotent: true, skipNotifications: true });
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
});
it('refuses infeasible plans before any publication writes', async () => {
  mocks.feasibility.mockResolvedValue({ ok: false, warnings: [], errors: ['Empty pool'] });
  await expect(publishTest('jee', admin, { client, atomicAudit: true })).rejects.toThrow('Empty pool');
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it('preserves the default publication workflow for existing tests', async () => {
  await publishTest('existing', admin);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'existing' }, data: { isPublished: true } });
  expect(mocks.legacyAudit).toHaveBeenCalledTimes(1);
  expect(mocks.notify).toHaveBeenCalledTimes(1);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
