import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { verifyPaymentSchema } from '@/lib/validation/payment';
import { verifyCheckoutSignature } from '@/lib/payments/razorpay';
import { finalizeSuccess } from '@/lib/payments/service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/payments/verify — verify the Checkout success signature server-side
// and unlock the test. NEVER unlocks on client success without a valid signature.
// The webhook is the source of truth; this is the fast path when the browser
// stays open.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = verifyPaymentSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
    select: { id: true, studentId: true, testId: true },
  });
  if (!payment || payment.studentId !== session.sub) return fail('paymentNotFound', 404);

  const valid = verifyCheckoutSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    // Log the attempt but do NOT unlock.
    await prisma.paymentEvent.create({
      data: { paymentId: payment.id, toStatus: 'CREATED', source: 'verify', detail: { invalidSignature: true } },
    });
    return fail('invalidSignature', 400);
  }

  const result = await finalizeSuccess(payment.id, { razorpayPaymentId: razorpay_payment_id, source: 'verify' });
  if (!result.ok) return fail('finalizeFailed', 500);

  return ok({ redirect: `/student/tests/${payment.testId}/start`, alreadyProcessed: result.alreadyProcessed });
}
