'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (r: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type State = 'idle' | 'creating' | 'opening' | 'verifying' | 'cancelled' | 'failed' | 'notConfigured';

export default function CheckoutClient({
  testId,
  price,
  title,
}: {
  testId: string;
  price: number;
  title: string;
}) {
  const t = useTranslations('payments.checkout');
  const [state, setState] = useState<State>('idle');

  const busy = state === 'creating' || state === 'opening' || state === 'verifying';

  async function pay() {
    setState('creating');
    const order = await apiPost('/api/payments/create-order', { testId });
    if (!order.ok) {
      if (order.error === 'alreadyOwned') {
        window.location.href = `/student/tests/${testId}/start`;
        return;
      }
      setState('failed');
      return;
    }
    if (order.mock) {
      // Real Razorpay keys aren't configured — the modal can't open.
      setState('notConfigured');
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      setState('failed');
      return;
    }

    setState('opening');
    const rzp = new window.Razorpay({
      key: String(order.keyId),
      order_id: String(order.orderId),
      amount: Number(order.amount),
      currency: String(order.currency),
      name: 'SIVORA UP↑RISING',
      description: title,
      theme: { color: '#dc2626' },
      handler: async (resp) => {
        setState('verifying');
        const v = await apiPost('/api/payments/verify', {
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        if (v.ok && typeof v.redirect === 'string') {
          window.location.href = v.redirect;
        } else {
          setState('failed');
        }
      },
      modal: { ondismiss: () => setState('cancelled') },
    });
    rzp.on('payment.failed', () => setState('failed'));
    rzp.open();
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-border bg-surfaceElevated p-6 sm:p-8">
        <h1 className="text-xl font-bold text-textPrimary">{t('title')}</h1>
        <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-surface p-4">
          <span className="font-medium text-textPrimary">{title}</span>
          <span className="text-2xl font-extrabold text-textPrimary">₹{price}</span>
        </div>

        {state === 'cancelled' ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            {t('cancelled')}
          </p>
        ) : null}
        {state === 'failed' ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {t('failed')}
          </p>
        ) : null}
        {state === 'verifying' ? (
          <p className="mt-4 rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-sm text-brand">
            {t('verifying')}
          </p>
        ) : null}
        {state === 'notConfigured' ? (
          <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textSecondary">
            {t('notConfigured')}
          </p>
        ) : null}

        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {busy
            ? t('processing')
            : state === 'cancelled' || state === 'failed'
              ? t('retry')
              : t('payButton', { price })}
        </button>

        <p className="mt-3 text-center text-xs text-textSecondary">{t('methods')}</p>
      </div>

      <p className="mt-4 text-center text-sm">
        <Link href={`/student/tests/${testId}`} className="font-medium text-brand hover:text-red-200">
          ← {t('back')}
        </Link>
      </p>
    </div>
  );
}
