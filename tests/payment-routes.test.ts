import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createOrder: vi.fn(),
  getKeys: vi.fn(),
  verifyCheckoutSignature: vi.fn(),
  verifyWebhookSignature: vi.fn(),
  logOrderCreated: vi.fn(),
  finalizeSuccess: vi.fn(),
  markFailed: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  paymentCreate: vi.fn(),
  paymentUpdate: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentEventCreate: vi.fn(),
  testFindUnique: vi.fn(),
  entitlementCount: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/payments/razorpay', () => ({
  createOrder: mocks.createOrder,
  getKeys: mocks.getKeys,
  verifyCheckoutSignature: mocks.verifyCheckoutSignature,
  verifyWebhookSignature: mocks.verifyWebhookSignature,
}));
vi.mock('@/lib/payments/service', () => ({
  logOrderCreated: mocks.logOrderCreated,
  finalizeSuccess: mocks.finalizeSuccess,
  markFailed: mocks.markFailed,
}));
vi.mock('@/lib/observability/logger', () => ({
  log: { info: mocks.logInfo, warn: mocks.logWarn, error: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    test: { findUnique: mocks.testFindUnique },
    testEntitlement: { count: mocks.entitlementCount },
    payment: {
      create: mocks.paymentCreate,
      update: mocks.paymentUpdate,
      findUnique: mocks.paymentFindUnique,
    },
    paymentEvent: { create: mocks.paymentEventCreate },
  },
}));

import { POST as createOrderPost } from '@/app/api/payments/create-order/route';
import { POST as verifyPost } from '@/app/api/payments/verify/route';
import { POST as webhookPost } from '@/app/api/payments/webhook/route';

function jsonReq(url: string, body: unknown, headers?: HeadersInit) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ sub: 'student_1', kind: 'student' });
  mocks.getKeys.mockReturnValue({ keyId: 'rzp_test_public', keySecret: 'secret' });
});

describe('POST /api/payments/create-order', () => {
  it('ignores manipulated client price and creates a ₹30 order in paise', async () => {
    mocks.testFindUnique.mockResolvedValue({ id: 'test_1', isPublished: true, title: { en: 'Mock Test' } });
    mocks.entitlementCount.mockResolvedValue(0);
    mocks.paymentCreate.mockResolvedValue({ id: 'payment_1' });
    mocks.createOrder.mockResolvedValue({ id: 'order_1', amount: 3000, currency: 'INR', mock: false });
    mocks.paymentUpdate.mockResolvedValue({});
    mocks.logOrderCreated.mockResolvedValue({});

    const res = await createOrderPost(jsonReq('http://localhost/api/payments/create-order', {
      testId: 'test_1',
      amount: 1,
      price: 1,
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, orderId: 'order_1', amount: 3000, currency: 'INR' });
    expect(mocks.paymentCreate).toHaveBeenCalledWith({
      data: { studentId: 'student_1', testId: 'test_1', amount: 30, currency: 'INR', status: 'CREATED' },
    });
    expect(mocks.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaise: 3000, currency: 'INR', receipt: 'payment_1' }),
    );
  });

  it('does not create another order when the test is already purchased', async () => {
    mocks.testFindUnique.mockResolvedValue({ id: 'test_1', isPublished: true, title: { en: 'Mock Test' } });
    mocks.entitlementCount.mockResolvedValue(1);

    const res = await createOrderPost(jsonReq('http://localhost/api/payments/create-order', { testId: 'test_1' }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('alreadyOwned');
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
});

describe('POST /api/payments/verify', () => {
  it('finalizes the payment after a valid Razorpay signature', async () => {
    mocks.paymentFindUnique.mockResolvedValue({ id: 'payment_1', studentId: 'student_1', testId: 'test_1' });
    mocks.verifyCheckoutSignature.mockReturnValue(true);
    mocks.finalizeSuccess.mockResolvedValue({ ok: true, alreadyProcessed: false });

    const res = await verifyPost(jsonReq('http://localhost/api/payments/verify', {
      razorpay_order_id: 'order_1',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: 'valid',
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.redirect).toBe('/student/tests/test_1/start');
    expect(mocks.finalizeSuccess).toHaveBeenCalledWith('payment_1', {
      razorpayPaymentId: 'pay_1',
      source: 'verify',
    });
  });

  it('does not finalize or unlock the test after an invalid signature', async () => {
    mocks.paymentFindUnique.mockResolvedValue({ id: 'payment_1', studentId: 'student_1', testId: 'test_1' });
    mocks.verifyCheckoutSignature.mockReturnValue(false);
    mocks.paymentEventCreate.mockResolvedValue({});

    const res = await verifyPost(jsonReq('http://localhost/api/payments/verify', {
      razorpay_order_id: 'order_1',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: 'invalid',
    }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('invalidSignature');
    expect(mocks.finalizeSuccess).not.toHaveBeenCalled();
  });
});

describe('POST /api/payments/webhook', () => {
  it('rejects unsigned or invalid webhooks without finalizing payment', async () => {
    mocks.verifyWebhookSignature.mockReturnValue(false);

    const res = await webhookPost(jsonReq('http://localhost/api/payments/webhook', { event: 'payment.captured' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('invalidSignature');
    expect(mocks.finalizeSuccess).not.toHaveBeenCalled();
  });

  it('processes captured payment webhooks through the idempotent finalizer', async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.paymentFindUnique.mockResolvedValue({ id: 'payment_1' });
    mocks.finalizeSuccess.mockResolvedValue({ ok: true, alreadyProcessed: false });

    const res = await webhookPost(jsonReq(
      'http://localhost/api/payments/webhook',
      {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
      },
      { 'x-razorpay-signature': 'valid' },
    ));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.processed).toBe('payment.captured');
    expect(mocks.finalizeSuccess).toHaveBeenCalledWith('payment_1', {
      razorpayPaymentId: 'pay_1',
      source: 'webhook',
    });
  });

  it('processes order.paid webhooks without inventing a payment id', async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.paymentFindUnique.mockResolvedValue({ id: 'payment_1' });
    mocks.finalizeSuccess.mockResolvedValue({ ok: true, alreadyProcessed: false });

    const res = await webhookPost(jsonReq(
      'http://localhost/api/payments/webhook',
      {
        event: 'order.paid',
        payload: { order: { entity: { id: 'order_1' } } },
      },
      { 'x-razorpay-signature': 'valid' },
    ));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.processed).toBe('order.paid');
    expect(mocks.finalizeSuccess).toHaveBeenCalledWith('payment_1', {
      razorpayPaymentId: undefined,
      source: 'webhook',
    });
  });
});
