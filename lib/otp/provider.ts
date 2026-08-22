/**
 * OTP delivery provider abstraction.
 *
 * The rest of the app depends only on the `OtpProvider` interface. Swapping SMS
 * gateways (MSG91, Twilio, ...) means adding one implementation and changing the
 * factory below — no call sites change.
 *
 * - Development: `ConsoleOtpProvider` logs the OTP to the server console so you
 *   can read and enter it. The real hashed OTP is still verified normally.
 * - Production: a gateway implementation using OTP_PROVIDER_API_KEY.
 */

export interface OtpProvider {
  /** Deliver an OTP by SMS. */
  sendSms(mobile: string, otp: string, message: string): Promise<void>;
  /** Optional: deliver an OTP by email (email OTP is behind the same interface). */
  sendEmail?(email: string, otp: string, subject: string, message: string): Promise<void>;
}

export class OtpDeliveryError extends Error {
  constructor(message = 'OTP delivery failed') {
    super(message);
    this.name = 'OtpDeliveryError';
  }
}

function maskMobile(mobile: string): string {
  return `xxxxxx${mobile.slice(-4)}`;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function toMsg91Mobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    throw new OtpDeliveryError('Invalid mobile number for OTP delivery');
  }
  return `91${normalized}`;
}

/** Dev/test provider: logs to the console. Never used in production. */
export class ConsoleOtpProvider implements OtpProvider {
  async sendSms(mobile: string, otp: string, message: string): Promise<void> {
    if (isProduction()) {
      console.log('[otp] console SMS provider invoked', { mobile: maskMobile(mobile) });
      return;
    }
    console.log(`\n📱  [OTP:SMS] to +91${mobile}: ${otp}\n    "${message}"\n`);
  }

  async sendEmail(email: string, otp: string, subject: string, message: string): Promise<void> {
    if (isProduction()) {
      console.log('[otp] console email provider invoked', { emailMasked: email.replace(/^(.).+(@.+)$/, '$1***$2') });
      return;
    }
    console.log(`\n✉️   [OTP:EMAIL] to ${email} (${subject}): ${otp}\n    "${message}"\n`);
  }
}

/**
 * Production SMS gateway (MSG91 shown; Twilio would be analogous).
 * Left as a thin, clearly-marked stub — wire the real HTTP call when going live.
 */
export class Msg91OtpProvider implements OtpProvider {
  constructor(
    private readonly apiKey: string,
    private readonly templateId: string,
    private readonly otpVariableName = 'OTP',
  ) {}

  private templateVariables(otp: string) {
    const body: Record<string, string> = {
      OTP: otp,
      otp,
    };
    body[this.otpVariableName] = otp;
    return body;
  }

  async sendSms(mobile: string, otp: string, message: string): Promise<void> {
    if (!/^\d{6}$/.test(otp)) {
      throw new OtpDeliveryError('Invalid OTP format for delivery');
    }

    const msg91Mobile = toMsg91Mobile(mobile);
    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', this.templateId);
    url.searchParams.set('mobile', msg91Mobile);
    url.searchParams.set('authkey', this.apiKey);
    // The app generates/stores/verifies the OTP; MSG91 is used for delivery.
    url.searchParams.set('otp', otp);
    url.searchParams.set('otp_expiry', '5');
    url.searchParams.set('response', 'json');

    console.log('[otp] MSG91 send requested', {
      mobile: maskMobile(mobile),
      templateIdConfigured: Boolean(this.templateId),
      variableNames: Object.keys(this.templateVariables('******')),
      messageLength: message.length,
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(this.templateVariables(otp)),
      });
      const payload = (await res.json().catch(() => null)) as { type?: string; message?: string } | null;

      if (!res.ok || payload?.type === 'error') {
        console.error('[otp] MSG91 send failed', {
          mobile: maskMobile(mobile),
          status: res.status,
          providerType: payload?.type ?? 'unknown',
          providerMessage: payload?.message ? String(payload.message).slice(0, 160) : undefined,
        });
        throw new OtpDeliveryError();
      }

      console.log('[otp] MSG91 send accepted', {
        mobile: maskMobile(mobile),
        status: res.status,
        providerType: payload?.type ?? 'unknown',
        requestIdPresent: Boolean(payload?.message),
      });
    } catch (err) {
      if (err instanceof OtpDeliveryError) throw err;
      console.error('[otp] MSG91 send errored', {
        mobile: maskMobile(mobile),
        message: err instanceof Error ? err.message : 'unknown',
      });
      throw new OtpDeliveryError();
    }
  }
}

let cached: OtpProvider | null = null;

/**
 * Dev/test OTP mode: use the console provider and echo the OTP in API responses
 * instead of sending a real SMS. On automatically outside production; can be
 * forced ON in a deployed environment with `OTP_DEV_MODE=true` so the site is
 * testable without a live SMS gateway.
 *
 * ⚠️ Testing only — it returns the OTP to the client, which is NOT safe for real
 * users. Turn it off (and configure a real provider + OTP_PROVIDER_API_KEY)
 * before onboarding actual students.
 */
export function isOtpDevMode(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.OTP_DEV_MODE !== 'false';
}

/** Returns the configured provider. Console in dev/test, gateway in production. */
export function getOtpProvider(): OtpProvider {
  if (cached) return cached;

  if (isOtpDevMode()) {
    cached = new ConsoleOtpProvider();
    return cached;
  }

  const apiKey = process.env.OTP_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('OTP_PROVIDER_API_KEY is required in production (or set OTP_DEV_MODE=true for testing)');
  }
  const templateId = process.env.OTP_PROVIDER_TEMPLATE_ID;
  if (!templateId) {
    throw new Error('OTP_PROVIDER_TEMPLATE_ID is required in production (or set OTP_DEV_MODE=true for testing)');
  }
  cached = new Msg91OtpProvider(apiKey, templateId, process.env.OTP_PROVIDER_OTP_VARIABLE ?? 'OTP');
  return cached;
}

/** True when we may return the OTP in API responses (dev/test mode only). */
export function isOtpEchoAllowed(): boolean {
  return isOtpDevMode();
}
