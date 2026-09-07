import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { finalizeSuccess, markFailed } from '@/lib/payments/service';
import { log } from '@/lib/observability/logger';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

/**
 * POST /api/payments/webhook — Razorpay webhook, the **source of truth** for
 * payment completion (so a payment finalises even if the user closes the browser
 * after paying). Verifies the signature against the RAW body, then finalises
 * idempotently. Always returns 200 for accepted events (so Razorpay doesn't
 * retry); only a bad signature returns 400.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  log.info('payment.webhookReceived');
  if (!verifyWebhookSignature(raw, signature)) {
    log.warn('payment.webhookSignatureInvalid');
    return fail('invalidSignature', 400);
  }
  log.info('payment.webhookSignatureValid');

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return ok({ ignored: 'unparseable' });
  }

  const b = body as {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; error_description?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  const event = b.event;
  const paymentEntity = b.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id ?? b.payload?.order?.entity?.id;
  const razorpayPaymentId = paymentEntity?.id;

  if (!orderId) return ok({ ignored: 'no_order_id' });

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    select: { id: true },
  });
  if (!payment) return ok({ ignored: 'unknown_order' });

  if (event === 'payment.captured' || event === 'order.paid') {
    await finalizeSuccess(payment.id, { razorpayPaymentId, source: 'webhook' });
    log.info('payment.webhookSuccessProcessed', { paymentId: payment.id, orderId, event });
  } else if (event === 'payment.failed') {
    await markFailed(payment.id, { source: 'webhook', reason: paymentEntity?.error_description ?? 'payment.failed' });
    log.warn('payment.webhookFailureProcessed', { paymentId: payment.id, orderId, event });
  }

  return ok({ processed: event ?? 'unknown' });
}
