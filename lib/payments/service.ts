import type { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';

/**
 * Core payment state machine — the single, idempotent place where a payment
 * becomes SUCCESS/FAILED. Both the client-verify path and the webhook call these,
 * and a conditional (`status != SUCCESS`) update guarantees a payment is
 * finalised exactly once even under concurrent calls.
 */

const GST_RATE = 0; // placeholder — GST is a 0% line for now

export type InvoiceData = {
  invoiceNumber: string;
  date: string; // ISO
  studentName: string;
  studentMobile: string;
  studentEmail: string | null;
  testTitle: string; // English (for the PDF)
  currency: string;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
};

export type FinalizeResult = { ok: boolean; alreadyProcessed: boolean; invoiceNumber?: string };

/** Pure formatter for an invoice number: "INV-YYYY-NNNNN" (5-digit, zero-padded). */
export function formatInvoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
}

/** Atomic per-year sequence → "INV-YYYY-00001". */
async function allocateInvoiceNumber(tx: Prisma.TransactionClient, year: number): Promise<string> {
  const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
    INSERT INTO "InvoiceCounter" ("year", "lastSeq") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "lastSeq" = "InvoiceCounter"."lastSeq" + 1
    RETURNING "lastSeq"`;
  const seq = rows[0]?.lastSeq ?? 1;
  return formatInvoiceNumber(year, seq);
}

/** Log an event for the "order created" transition (called from create-order). */
export async function logOrderCreated(paymentId: string, orderId: string): Promise<void> {
  await prisma.paymentEvent.create({
    data: { paymentId, fromStatus: null, toStatus: 'CREATED', source: 'order_create', detail: { orderId } },
  });
}

/**
 * Mark a payment SUCCESS (idempotent): allocate an invoice number, snapshot
 * invoice data, create the ownership entitlement + a PAYMENT_CONFIRMATION
 * notification, and log the transition. Safe to call multiple times.
 */
export async function finalizeSuccess(
  paymentId: string,
  opts: { razorpayPaymentId: string; source: 'verify' | 'webhook' },
): Promise<FinalizeResult> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { student: true, test: true },
    });
    if (!payment) return { ok: false, alreadyProcessed: false };
    if (payment.status === 'SUCCESS') return { ok: true, alreadyProcessed: true };

    // Claim the payment — only the first caller flips it to SUCCESS.
    const claim = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: 'SUCCESS' } },
      data: { status: 'SUCCESS', paidAt: new Date(), razorpayPaymentId: opts.razorpayPaymentId },
    });
    if (claim.count === 0) return { ok: true, alreadyProcessed: true };

    const now = new Date();
    const invoiceNumber = await allocateInvoiceNumber(tx, now.getFullYear());
    const testTitleEn = localizedName(payment.test.title, 'en') || 'NEET Mock Test';
    const testTitleTa = localizedName(payment.test.title, 'ta') || testTitleEn;
    const subtotal = payment.amount;
    const gstAmount = Math.round((subtotal * GST_RATE) / 100);

    const invoiceData: InvoiceData = {
      invoiceNumber,
      date: now.toISOString(),
      studentName: payment.student.name,
      studentMobile: payment.student.mobile,
      studentEmail: payment.student.email,
      testTitle: testTitleEn,
      currency: payment.currency,
      subtotal,
      gstRate: GST_RATE,
      gstAmount,
      total: subtotal + gstAmount,
    };

    await tx.payment.update({
      where: { id: paymentId },
      data: { invoiceNumber, invoiceData: invoiceData as unknown as Prisma.InputJsonValue },
    });

    // Ownership — the entitlement that unlocks "Start Test".
    await tx.testEntitlement.upsert({
      where: { studentId_testId: { studentId: payment.studentId, testId: payment.testId } },
      create: { studentId: payment.studentId, testId: payment.testId, paymentId: payment.id, source: 'PURCHASE' },
      update: {},
    });

    await tx.notification.create({
      data: {
        studentId: payment.studentId,
        type: 'PAYMENT_CONFIRMATION',
        targetAudience: 'STUDENTS',
        title: { en: 'Payment successful', ta: 'பணம் வெற்றிகரமாக செலுத்தப்பட்டது' },
        message: {
          en: `You've unlocked "${testTitleEn}". Invoice ${invoiceNumber}. You can start the test anytime.`,
          ta: `நீங்கள் "${testTitleTa}" தேர்வைத் திறந்துள்ளீர்கள். விலைப்பட்டியல் ${invoiceNumber}. எப்போது வேண்டுமானாலும் தேர்வைத் தொடங்கலாம்.`,
        },
        linkUrl: `/student/tests/${payment.testId}/start`,
        publishedAt: now,
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId,
        fromStatus: payment.status,
        toStatus: 'SUCCESS',
        source: opts.source,
        detail: { razorpayPaymentId: opts.razorpayPaymentId },
      },
    });

    return { ok: true, alreadyProcessed: false, invoiceNumber };
  });
}

/** Mark a payment FAILED (never overrides SUCCESS; idempotent). */
export async function markFailed(
  paymentId: string,
  opts: { source: 'verify' | 'webhook'; reason?: string },
): Promise<{ ok: boolean; changed: boolean }> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
  if (!payment) return { ok: false, changed: false };
  const terminal: PaymentStatus[] = ['SUCCESS', 'FAILED'];
  if (terminal.includes(payment.status)) return { ok: true, changed: false };

  const claim = await prisma.payment.updateMany({
    where: { id: paymentId, status: { notIn: terminal } },
    data: { status: 'FAILED', failureReason: opts.reason ?? null },
  });
  if (claim.count === 0) return { ok: true, changed: false };

  await prisma.paymentEvent.create({
    data: {
      paymentId,
      fromStatus: payment.status,
      toStatus: 'FAILED',
      source: opts.source,
      detail: opts.reason ? { reason: opts.reason } : undefined,
    },
  });
  return { ok: true, changed: true };
}
