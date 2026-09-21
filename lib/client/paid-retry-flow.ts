import type { ApiResult } from '@/lib/client/api';

export type Post = (url: string, body?: unknown) => Promise<ApiResult>;

export function createCheckoutRequestGuard() {
  let active = false;
  return {
    tryEnter: () => {
      if (active) return false;
      active = true;
      return true;
    },
    release: () => { active = false; },
  };
}

export async function requestAttemptStart(input: {
  post: Post;
  testId: string;
  language: string;
  navigate: (url: string) => void;
}): Promise<'started' | 'paymentRequired' | 'verificationRequired' | 'questionSetUnavailable' | 'failed'> {
  const result = await input.post('/api/attempts', { testId: input.testId, language: input.language });
  if (result.ok && typeof result.redirect === 'string') {
    input.navigate(result.redirect);
    return 'started';
  }
  if (result.error === 'verificationRequired' && typeof result.redirect === 'string') {
    input.navigate(result.redirect);
    return 'verificationRequired';
  }
  if (result.error === 'questionSetUnavailable') return 'questionSetUnavailable';
  return result.error === 'paymentRequired' ? 'paymentRequired' : 'failed';
}

export async function requestRetryOrder(input: {
  post: Post;
  testId: string;
  retryStart: () => Promise<boolean>;
  openCheckout: (order: ApiResult) => Promise<boolean>;
}): Promise<'opened' | 'recovered' | 'failed'> {
  const order = await input.post('/api/payments/retry-order', { testId: input.testId });
  if (order.ok) return (await input.openCheckout(order)) ? 'opened' : 'failed';
  if (order.error === 'freeAttemptsRemain' || order.error === 'attemptActive' || order.error === 'creditAvailable') {
    return (await input.retryStart()) ? 'recovered' : 'failed';
  }
  return 'failed';
}

export async function verifyRetryPayment(input: {
  post: Post;
  response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
  retryStart: () => Promise<boolean>;
}): Promise<boolean> {
  const verified = await input.post('/api/payments/verify', input.response);
  return Boolean(verified.ok && typeof verified.redirect === 'string' && await input.retryStart());
}
