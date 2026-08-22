import type { OtpPurpose } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { createOtp, OTP_TTL_MINUTES } from '@/lib/auth/otp';
import { getOtpProvider, isOtpEchoAllowed, OtpDeliveryError } from '@/lib/otp/provider';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

/**
 * Create an OTP and deliver it via the configured provider (SMS). Returns a
 * rate-limit signal or a success payload. `devOtp` is populated only outside
 * production, so the dev UI and tests can complete the flow without a gateway.
 */
export type RequestOtpResult =
  | { ok: true; expiresAt: Date; devOtp?: string }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number }
  | { ok: false; reason: 'delivery_failed' };

export async function requestOtp(
  mobile: string,
  purpose: OtpPurpose,
  opts: { email?: string; language?: string | null } = {},
): Promise<RequestOtpResult> {
  console.log('[otp] request received', {
    mobile: `xxxxxx${mobile.slice(-4)}`,
    purpose,
    channel: 'SMS',
    hasEmail: Boolean(opts.email),
    language: opts.language ?? null,
  });

  const created = await createOtp(mobile, purpose, { email: opts.email, channel: 'SMS' });
  if (!created.ok) {
    console.warn('[otp] request rate limited', {
      mobile: `xxxxxx${mobile.slice(-4)}`,
      purpose,
      retryAfterSeconds: created.retryAfterSeconds,
    });
    return created;
  }

  // Send the OTP SMS in the recipient's preferred language (falls back to the
  // default when unset/unsupported), independent of the browser cookie.
  const locale: Locale =
    opts.language && locales.includes(opts.language as Locale)
      ? (opts.language as Locale)
      : defaultLocale;
  const t = await getTranslations({ locale, namespace: 'sms' });
  const message = t('otp', { otp: created.otp, minutes: OTP_TTL_MINUTES });
  try {
    await getOtpProvider().sendSms(mobile, created.otp, message);
  } catch (err) {
    if (err instanceof OtpDeliveryError) {
      console.error('[otp] provider rejected request', {
        mobile: `xxxxxx${mobile.slice(-4)}`,
        purpose,
      });
      return { ok: false, reason: 'delivery_failed' };
    }
    throw err;
  }

  console.log('[otp] request completed', {
    mobile: `xxxxxx${mobile.slice(-4)}`,
    purpose,
    expiresAt: created.expiresAt.toISOString(),
  });

  return {
    ok: true,
    expiresAt: created.expiresAt,
    devOtp: isOtpEchoAllowed() ? created.otp : undefined,
  };
}
