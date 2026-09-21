'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/client/api';
import { Banner, Field, inputClass, SubmitButton } from '@/components/ui/Form';

export default function EmailVerificationForm({ email, mobile, callbackUrl }: { email: string; mobile: string; callbackUrl: string }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const qs = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  async function verify() {
    setBusy(true); setError(undefined);
    const res = await apiPost(`/api/auth/email-verification/verify${qs}`, { email, mobile, otp });
    setBusy(false);
    if (res.ok && typeof res.redirect === 'string') { window.location.href = res.redirect; return; }
    setError(res.error === 'otpExpired' ? 'This code has expired. Request a new one.' : res.error === 'otpInvalid' ? 'Enter the correct 6-digit code.' : res.error === 'tooManyAttempts' ? 'Too many attempts. Request a new code.' : 'We could not verify that code.');
  }
  async function resend() {
    setResending(true); setError(undefined);
    const res = await apiPost('/api/auth/email-verification/request', { email, mobile });
    setResending(false);
    if (!res.ok) { setError(res.error === 'rateLimited' ? 'Please wait before requesting another code.' : 'We could not send a code right now.'); return; }
    setCooldown(60);
    const timer = window.setInterval(() => setCooldown((value) => { if (value <= 1) { window.clearInterval(timer); return 0; } return value - 1; }), 1000);
  }
  return <form onSubmit={(event) => { event.preventDefault(); void verify(); }} className="space-y-5"><div><h1 className="text-xl font-bold text-textPrimary">Verify your email</h1><p className="mt-1 text-sm text-textSecondary">We sent a 6-digit verification code to {email.replace(/^(.{2}).*(@.*)$/, '$1••••$2')}.</p><p className="mt-2 text-xs leading-5 text-textSecondary">The code expires in 5 minutes. Verification is required before accessing tests and receiving important account or counselling updates.</p></div>{error ? <Banner kind="error">{error}</Banner> : null}<Field label="Verification code" htmlFor="emailOtp"><input id="emailOtp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className={inputClass} /></Field><SubmitButton busy={busy} busyLabel="Verifying…">Verify</SubmitButton><button type="button" onClick={() => void resend()} disabled={resending || cooldown > 0} className="text-sm font-semibold text-brand disabled:text-textSecondary">{resending ? 'Sending…' : cooldown ? `Resend available in ${cooldown}s` : 'Resend code'}</button></form>;
}
