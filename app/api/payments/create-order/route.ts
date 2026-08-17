import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { createOrderSchema } from '@/lib/validation/payment';
import { createOrder, getKeys } from '@/lib/payments/razorpay';
import { logOrderCreated } from '@/lib/payments/service';
import { log } from '@/lib/observability/logger';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/payments/create-order — create a Razorpay order + a CREATED Payment
// row for a test. The amount ALWAYS comes from the server-side test record.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = createOrderSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { testId } = parsed.data;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, price: true, isPublished: true, title: true },
  });
  if (!test || !test.isPublished) return fail('testNotFound', 404);

  // Already owned → nothing to buy.
  const owned = await prisma.testEntitlement.count({ where: { studentId: session.sub, testId } });
  if (owned > 0) return fail('alreadyOwned', 409);

  const amountInr = test.price; // trusted, server-side
  if (amountInr === 0) {
    await prisma.testEntitlement.upsert({
      where: { studentId_testId: { studentId: session.sub, testId } },
      create: { studentId: session.sub, testId, source: 'FREE' },
      update: {},
    });
    return fail('alreadyOwned', 409);
  }

  const currency = 'INR';

  // Create the Payment row first so we have a stable id for the order receipt.
  const payment = await prisma.payment.create({
    data: { studentId: session.sub, testId, amount: amountInr, currency, status: 'CREATED' },
  });

  let order;
  try {
    order = await createOrder({
      amountPaise: amountInr * 100,
      currency,
      receipt: payment.id,
      notes: { paymentId: payment.id, studentId: session.sub, testId },
    });
  } catch (err) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: 'order_create_failed' } });
    log.error('payment.createOrderFailed', err, { paymentId: payment.id, testId });
    return fail('orderCreateFailed', 502);
  }

  await prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id } });
  await logOrderCreated(payment.id, order.id);

  return ok({
    paymentId: payment.id,
    orderId: order.id,
    amount: order.amount, // paise
    currency,
    keyId: getKeys().keyId,
    mock: order.mock,
  });
}
