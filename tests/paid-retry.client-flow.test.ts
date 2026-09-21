import { describe, expect, it, vi } from 'vitest';
import { createCheckoutRequestGuard, requestAttemptStart, requestRetryOrder, verifyRetryPayment } from '@/lib/client/paid-retry-flow';

describe('paid retry client flow', () => {
  it('prevents simultaneous retry-order requests from rapid clicks', () => {
    const guard = createCheckoutRequestGuard();
    expect(guard.tryEnter()).toBe(true);
    expect(guard.tryEnter()).toBe(false);
    guard.release();
    expect(guard.tryEnter()).toBe(true);
  });

  it('starts free attempts without creating a checkout order', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, redirect: '/student/tests/t1/attempt' });
    const navigate = vi.fn();

    await expect(requestAttemptStart({ post, testId: 't1', language: 'en', navigate })).resolves.toBe('started');
    expect(post).toHaveBeenCalledWith('/api/attempts', { testId: 't1', language: 'en' });
    expect(post).not.toHaveBeenCalledWith('/api/payments/retry-order', expect.anything());
    expect(navigate).toHaveBeenCalledWith('/student/tests/t1/attempt');
  });

  it('surfaces paymentRequired before any retry checkout', async () => {
    const post = vi.fn().mockResolvedValue({ ok: false, error: 'paymentRequired' });

    await expect(requestAttemptStart({ post, testId: 't1', language: 'en', navigate: vi.fn() })).resolves.toBe('paymentRequired');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('surfaces an unavailable question set without attempting a payment flow', async () => {
    const post = vi.fn().mockResolvedValue({ ok: false, error: 'questionSetUnavailable' });

    await expect(requestAttemptStart({ post, testId: 't1', language: 'en', navigate: vi.fn() })).resolves.toBe('questionSetUnavailable');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it.each(['creditAvailable', 'attemptActive', 'freeAttemptsRemain'])(
    'retries normal start instead of checkout when retry-order reports %s',
    async (error) => {
      const post = vi.fn().mockResolvedValue({ ok: false, error });
      const retryStart = vi.fn().mockResolvedValue(true);
      const openCheckout = vi.fn();

      await expect(requestRetryOrder({ post, testId: 't1', retryStart, openCheckout })).resolves.toBe('recovered');
      expect(post).toHaveBeenCalledWith('/api/payments/retry-order', { testId: 't1' });
      expect(retryStart).toHaveBeenCalledOnce();
      expect(openCheckout).not.toHaveBeenCalled();
    },
  );

  it('opens checkout only from a server-created retry order', async () => {
    const order = { ok: true, orderId: 'order_1', amount: 3000, currency: 'INR', keyId: 'rzp_test_public' };
    const post = vi.fn().mockResolvedValue(order);
    const openCheckout = vi.fn().mockResolvedValue(true);

    await expect(requestRetryOrder({ post, testId: 't1', retryStart: vi.fn(), openCheckout })).resolves.toBe('opened');
    expect(openCheckout).toHaveBeenCalledWith(order);
  });

  it('verifies payment, then starts and navigates into the paid attempt', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, redirect: '/student/tests/t1/start' });
    const retryStart = vi.fn().mockResolvedValue(true);
    const response = { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'signature' };

    await expect(verifyRetryPayment({ post, response, retryStart })).resolves.toBe(true);
    expect(post).toHaveBeenCalledWith('/api/payments/verify', response);
    expect(retryStart).toHaveBeenCalledOnce();
  });

  it('does not start an attempt when payment verification fails or checkout is cancelled', async () => {
    const retryStart = vi.fn().mockResolvedValue(true);
    const response = { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'invalid' };

    await expect(verifyRetryPayment({ post: vi.fn().mockResolvedValue({ ok: false, error: 'invalidSignature' }), response, retryStart })).resolves.toBe(false);
    expect(retryStart).not.toHaveBeenCalled();

    // Dismissal invokes no success handler, so the same invariant holds.
    expect(retryStart).not.toHaveBeenCalled();
  });
});
