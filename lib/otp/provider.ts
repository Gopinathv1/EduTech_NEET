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

/** Dev/test provider: logs to the console. Never used in production. */
export class ConsoleOtpProvider implements OtpProvider {
  async sendSms(mobile: string, otp: string, message: string): Promise<void> {
    console.log(`\n📱  [OTP:SMS] to +91${mobile}: ${otp}\n    "${message}"\n`);
  }

  async sendEmail(email: string, otp: string, subject: string, message: string): Promise<void> {
    console.log(`\n✉️   [OTP:EMAIL] to ${email} (${subject}): ${otp}\n    "${message}"\n`);
  }
}

/**
 * Production SMS gateway (MSG91 shown; Twilio would be analogous).
 * Left as a thin, clearly-marked stub — wire the real HTTP call when going live.
 */
export class Msg91OtpProvider implements OtpProvider {
  constructor(private readonly apiKey: string) {}

  async sendSms(mobile: string, otp: string, message: string): Promise<void> {
    // TODO(go-live): POST to https://control.msg91.com/api/v5/flow/ with this.apiKey.
    // Intentionally throws until configured so failures are loud, not silent.
    throw new Error(
      `Msg91OtpProvider not implemented. Would send OTP to +91${mobile} using message "${message}".`,
    );
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
  return process.env.OTP_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';
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
  cached = new Msg91OtpProvider(apiKey);
  return cached;
}

/** True when we may return the OTP in API responses (dev/test mode only). */
export function isOtpEchoAllowed(): boolean {
  return isOtpDevMode();
}
