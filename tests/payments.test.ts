import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

// ---- signature verification (pure) ---------------------------------------

import { verifyCheckoutSignature, verifyWebhookSignature } from '@/lib/payments/razorpay';

describe('verifyCheckoutSignature', () => {
  const secret = 'test_secret_key';
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';
  const valid = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  it('accepts a correct signature', () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: valid }, secret)).toBe(true);
  });
  it('rejects a tampered signature', () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: valid.replace(/.$/, '0') }, secret)).toBe(false);
  });
  it('rejects a signature made with a different secret', () => {
    const other = crypto.createHmac('sha256', 'wrong').update(`${orderId}|${paymentId}`).digest('hex');
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: other }, secret)).toBe(false);
  });
  it('rejects garbage / empty', () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: 'nope' }, secret)).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: '' }, secret)).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ event: 'payment.captured', payload: {} });
  const valid = crypto.createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a correct webhook signature over the raw body', () => {
    expect(verifyWebhookSignature(body, valid, secret)).toBe(true);
  });
  it('rejects when the body is altered', () => {
    expect(verifyWebhookSignature(body + ' ', valid, secret)).toBe(false);
  });
  it('rejects an empty secret', () => {
    expect(verifyWebhookSignature(body, valid, '')).toBe(false);
  });
});

// ---- finalize idempotency (mocked prisma) --------------------------------

// A stateful mock: the payment's status flips to SUCCESS on the first claim, so
// the conditional updateMany returns count 1 once and 0 thereafter — exactly how
// the real DB behaves under concurrent verify + webhook.
const state = { status: 'CREATED' as string, seq: 0 };
const calls = { entitlementUpsert: 0, notificationCreate: 0, paymentEventCreate: 0, paymentUpdate: 0 };

const tx = {
  payment: {
    findUnique: vi.fn(async () => ({
      id: 'p1',
      status: state.status,
      amount: 30,
      currency: 'INR',
      studentId: 's1',
      testId: 't1',
      student: { name: 'Ravi', mobile: '9876543210', email: null },
      test: { title: { en: 'Mini Test', ta: 'சிறு தேர்வு' } },
    })),
    updateMany: vi.fn(async (args: { where: { status?: { not?: string } } }) => {
      // where: { id, status: { not: 'SUCCESS' } }
      if (state.status !== 'SUCCESS') {
        state.status = 'SUCCESS';
        return { count: 1 };
      }
      return { count: 0 };
    }),
    update: vi.fn(async () => {
      calls.paymentUpdate += 1;
      return {};
    }),
  },
  $queryRaw: vi.fn(async () => [{ lastSeq: ++state.seq }]),
  testEntitlement: {
    upsert: vi.fn(async () => {
      calls.entitlementUpsert += 1;
      return {};
    }),
  },
  notification: {
    create: vi.fn(async () => {
      calls.notificationCreate += 1;
      return {};
    }),
  },
  paymentEvent: {
    create: vi.fn(async () => {
      calls.paymentEventCreate += 1;
      return {};
    }),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (cb: (t: typeof tx) => unknown) => cb(tx),
  },
}));

import { finalizeSuccess } from '@/lib/payments/service';

describe('finalizeSuccess idempotency', () => {
  beforeEach(() => {
    state.status = 'CREATED';
    state.seq = 0;
    calls.entitlementUpsert = 0;
    calls.notificationCreate = 0;
    calls.paymentEventCreate = 0;
    calls.paymentUpdate = 0;
  });

  it('processes exactly once across two calls (verify then webhook)', async () => {
    const first = await finalizeSuccess('p1', { razorpayPaymentId: 'pay_1', source: 'verify' });
    expect(first).toMatchObject({ ok: true, alreadyProcessed: false });
    expect(first.invoiceNumber).toMatch(/^INV-\d{4}-00001$/);

    const second = await finalizeSuccess('p1', { razorpayPaymentId: 'pay_1', source: 'webhook' });
    expect(second).toMatchObject({ ok: true, alreadyProcessed: true });

    // Side effects happened once only.
    expect(calls.entitlementUpsert).toBe(1);
    expect(calls.notificationCreate).toBe(1);
    expect(calls.paymentEventCreate).toBe(1);
  });

  it('is a no-op when the payment is already SUCCESS', async () => {
    state.status = 'SUCCESS';
    const res = await finalizeSuccess('p1', { razorpayPaymentId: 'pay_1', source: 'webhook' });
    expect(res).toMatchObject({ ok: true, alreadyProcessed: true });
    expect(calls.entitlementUpsert).toBe(0);
    expect(calls.notificationCreate).toBe(0);
  });
});
