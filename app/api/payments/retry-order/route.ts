import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { createOrder, getKeys } from '@/lib/payments/razorpay';
import { inrToPaise, PAYMENT_CURRENCY } from '@/lib/payments/pricing';
import { logOrderCreated } from '@/lib/payments/service';
import { ok, fail, readJson } from '@/lib/http';
import { examPaidRetriesEnabled } from '@/lib/attempts/paid-retries';

export const runtime = 'nodejs';
export const PAID_RETRY_PRICE_INR = 30;
const schema = z.object({ testId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getSession(); if (!session || session.kind !== 'student') return fail('unauthorized', 401);
  // This endpoint remains available for the later commercial launch, but no
  // exam-payment order may be created during the free-access marketing phase.
  if (!examPaidRetriesEnabled()) return fail('paidRetriesDisabled', 403);
  const body = schema.safeParse(await readJson(req)); if (!body.success) return fail('validation', 400);
  const { testId } = body.data;
  const [test, active, attempts, credit] = await Promise.all([
    prisma.test.findUnique({ where: { id: testId }, select: { id: true, isPublished: true, contentClass: true } }),
    prisma.testAttempt.findFirst({ where: { studentId: session.sub, testId, status: 'IN_PROGRESS' }, select: { id: true } }),
    prisma.testAttempt.count({ where: { studentId: session.sub, testId } }),
    prisma.paidAttemptCredit.findFirst({ where: { studentId: session.sub, testId, consumedAt: null, attemptId: null }, select: { id: true } }),
  ]);
  if (!test || !test.isPublished || test.contentClass !== 'PRODUCTION') return fail('testNotFound', 404);
  if (active) return fail('attemptActive', 409, { attemptId: active.id });
  if (attempts < 3) return fail('freeAttemptsRemain', 409);
  if (credit) return fail('creditAvailable', 409);
  const payment = await prisma.payment.create({ data: { studentId: session.sub, testId, purpose: 'PAID_RETRY', amount: PAID_RETRY_PRICE_INR, currency: PAYMENT_CURRENCY, status: 'CREATED' } });
  try {
    const order = await createOrder({ amountPaise: inrToPaise(PAID_RETRY_PRICE_INR), currency: PAYMENT_CURRENCY, receipt: payment.id, notes: { paymentId: payment.id, testId, purpose: 'PAID_RETRY' } });
    await prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id } }); await logOrderCreated(payment.id, order.id);
    return ok({ paymentId: payment.id, orderId: order.id, amount: order.amount, currency: PAYMENT_CURRENCY, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? getKeys().keyId, mock: order.mock });
  } catch { await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: 'order_create_failed' } }); return fail('orderCreateFailed', 502); }
}
