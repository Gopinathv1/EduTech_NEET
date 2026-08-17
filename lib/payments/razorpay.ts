import crypto from 'node:crypto';

/**
 * Razorpay integration helpers.
 *
 * Order creation uses the REST API (Basic auth) so we don't need the SDK.
 * Signature verification is plain HMAC-SHA256 (node:crypto) and the two verify
 * functions are PURE — they accept the secret as an argument so they're unit
 * testable with a known key.
 *
 * When real test keys aren't configured (the `.env` placeholders), `createOrder`
 * returns a mock order id so the DB/payment flow is still exercisable locally.
 */

export type RazorpayKeys = { keyId: string; keySecret: string };

const PLACEHOLDER_MARKERS = ['xxxx', 'change_me'];

export function getKeys(): RazorpayKeys {
  return { keyId: process.env.RAZORPAY_KEY_ID ?? '', keySecret: process.env.RAZORPAY_KEY_SECRET ?? '' };
}

export function getWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
}

/** True only when genuine Razorpay keys are set (not the `.env` placeholders). */
export function isRazorpayConfigured(): boolean {
  const { keyId, keySecret } = getKeys();
  if (!keyId || !keySecret || !keyId.startsWith('rzp_')) return false;
  const combined = `${keyId}${keySecret}`.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((m) => combined.includes(m));
}

export type CreatedOrder = { id: string; amount: number; currency: string; mock: boolean };

/** Create a Razorpay order. `amountPaise` = INR × 100. Mocks when unconfigured. */
export async function createOrder(input: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedOrder> {
  const currency = input.currency ?? 'INR';

  if (!isRazorpayConfigured()) {
    return { id: `order_mock_${crypto.randomBytes(8).toString('hex')}`, amount: input.amountPaise, currency, mock: true };
  }

  const { keyId, keySecret } = getKeys();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Razorpay order creation failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { id: string; amount: number; currency: string };
  return { id: data.id, amount: data.amount, currency: data.currency, mock: false };
}

/** Verify the Checkout handler signature: HMAC_SHA256("orderId|paymentId", keySecret). */
export function verifyCheckoutSignature(
  input: { orderId: string; paymentId: string; signature: string },
  keySecret: string = getKeys().keySecret,
): boolean {
  const expected = crypto.createHmac('sha256', keySecret).update(`${input.orderId}|${input.paymentId}`).digest('hex');
  return safeEqualHex(expected, input.signature);
}

/** Verify a webhook signature: HMAC_SHA256(rawBody, webhookSecret). */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = getWebhookSecret(),
): boolean {
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Constant-time hex comparison (returns false on any length/format mismatch). */
function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
